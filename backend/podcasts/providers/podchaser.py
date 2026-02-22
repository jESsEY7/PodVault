"""
podcasts.providers.podchaser
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Podchaser GraphQL API provider — social data, guest credits, and ratings.

Authentication
--------------
Podchaser uses OAuth 2.0 **Client Credentials** via a GraphQL mutation
(NOT a REST /token endpoint).  The flow is:

1. POST ``requestAccessToken`` mutation with ``client_id`` (your API Key)
   and ``client_secret`` (your API Secret).
2. Receive a Bearer ``access_token`` valid for **1 year** (31 536 000 s).
3. Cache the token in Redis under ``podvault:pc_token:<key_index>`` so we
   never call the auth mutation more than once per year per credential pair.
4. Use ``Authorization: Bearer <access_token>`` on all subsequent GraphQL
   calls.

Credential pairs and rotation
------------------------------
Multiple Key:Secret pairs can be configured in the environment variable
``PODCHASER_CREDENTIALS`` (comma-separated ``key:secret`` pairs)::

    PODCHASER_CREDENTIALS=key1:secret1,key2:secret2

When a key's monthly query-point quota is exhausted (HTTP 402/403 or a
quota-related GraphQL error) the provider rotates to the next pair.
If all pairs are exhausted, :class:`~podcasts.exceptions.QuotaExhausted`
is raised.

API reference: https://api-docs.podchaser.com/docs/authorization
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

import requests
from django.conf import settings
from django.core.cache import cache

from podcasts.exceptions import (
    ProviderUnavailable,
    QuotaExhausted,
    RateLimitExceeded,
)

from .base import NormalizedPodcast, PodcastProvider

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# GraphQL query / mutation strings
# ---------------------------------------------------------------------------

_AUTH_MUTATION = """
mutation RequestToken($clientId: String!, $clientSecret: String!) {
  requestAccessToken(
    input: {
      grant_type: CLIENT_CREDENTIALS
      client_id: $clientId
      client_secret: $clientSecret
    }
  ) {
    access_token
    token_type
    expires_in
  }
}
"""

_SEARCH_QUERY = """
query SearchPodcasts($term: String!, $maxResults: Int) {
  podcasts(
    searchTerm: $term
    first: $maxResults
  ) {
    data {
      id
      title
      description
      imageUrl
      rssUrl
      htmlUrl
      author
      rating { averageRating reviewsCount }
      categories(first: 1) { data { title } }
      podcastEpisodes { paginatorInfo { total } }
    }
  }
}
"""

_LOOKUP_QUERY = """
query GetPodcast($id: ID!) {
  podcast(identifier: { id: $id, type: PODCHASER_ID }) {
    id
    title
    description
    imageUrl
    rssUrl
    htmlUrl
    author
    rating { averageRating reviewsCount }
    categories(first: 1) { data { title } }
    podcastEpisodes { paginatorInfo { total } }
    credits {
      data {
        person { id name imageUrl }
        role { title }
        episode { id title }
      }
    }
  }
}
"""

_CREDITS_QUERY = """
query GetCredits($id: ID!) {
  podcast(identifier: { id: $id, type: PODCHASER_ID }) {
    credits {
      data {
        person { id name imageUrl biography }
        role { title }
        episode { id title airDate }
      }
    }
  }
}
"""

_ENDPOINT = "https://api.podchaser.com/graphql"

# Podchaser access tokens last 1 year (31_536_000 s).
# Cache them for 364 days so they're refreshed just before expiry.
_TOKEN_CACHE_TTL = 60 * 60 * 24 * 364  # 364 days


# ---------------------------------------------------------------------------
# Credential helpers
# ---------------------------------------------------------------------------

def _load_credentials() -> List[Tuple[str, str]]:
    """
    Parse ``PODCHASER_CREDENTIALS`` setting into a list of (key, secret) tuples.

    Setting format (comma-separated ``key:secret`` pairs)::

        PODCHASER_CREDENTIALS=key1:secret1,key2:secret2

    Falls back gracefully to an empty list if not configured, so the
    provider logs a warning and all calls raise :class:`QuotaExhausted`.
    """
    raw: str = getattr(settings, "PODCHASER_CREDENTIALS", "")
    pairs: List[Tuple[str, str]] = []
    for entry in raw.split(","):
        entry = entry.strip()
        if not entry:
            continue
        if ":" not in entry:
            logger.warning(
                "[Podchaser] Malformed credential entry (expected 'key:secret'): %s",
                entry,
            )
            continue
        key, _, secret = entry.partition(":")
        if key and secret:
            pairs.append((key.strip(), secret.strip()))
    return pairs


# ---------------------------------------------------------------------------
# Provider
# ---------------------------------------------------------------------------


class PodchaserProvider(PodcastProvider):
    """
    Social metadata and guest credits via the Podchaser GraphQL API.

    Field mapping (Podchaser → Vault Standard):

    +-------------------------------+-------------------+
    | Podchaser field               | Vault field       |
    +===============================+===================+
    | id                            | remote_id         |
    | title                         | title             |
    | author                        | author            |
    | description                   | description       |
    | imageUrl                      | cover_url         |
    | rssUrl                        | rss_feed          |
    | categories.data[0].title      | genre             |
    | podcastEpisodes.total         | total_episodes    |
    | rating.averageRating          | rating            |
    | credits.data[]                | credits           |
    | htmlUrl                       | website           |
    +-------------------------------+-------------------+
    """

    provider_name = "podchaser"

    def __init__(self) -> None:
        self._credentials: List[Tuple[str, str]] = _load_credentials()
        if not self._credentials:
            logger.warning(
                "[Podchaser] PODCHASER_CREDENTIALS not configured — "
                "all requests will fail. "
                "Set it as: PODCHASER_CREDENTIALS=key1:secret1,key2:secret2"
            )
        self._current_index: int = 0

    # ------------------------------------------------------------------
    # PodcastProvider interface
    # ------------------------------------------------------------------

    def search(self, query: str, limit: int = 20) -> List[NormalizedPodcast]:
        """Search Podchaser for podcasts matching *query*."""
        payload = {
            "query": _SEARCH_QUERY,
            "variables": {"term": query, "maxResults": min(limit, 50)},
        }
        data = self._post_with_rotation(payload)
        items = data.get("data", {}).get("podcasts", {}).get("data", []) or []
        logger.info("[Podchaser] Search '%s' → %d result(s).", query, len(items))
        return [self._normalize(item) for item in items]

    def get_by_id(self, provider_id: str) -> Optional[NormalizedPodcast]:
        """Fetch a single podcast by its Podchaser ID."""
        payload = {
            "query": _LOOKUP_QUERY,
            "variables": {"id": provider_id},
        }
        data = self._post_with_rotation(payload)
        item = data.get("data", {}).get("podcast")
        if not item:
            logger.warning("[Podchaser] get_by_id(%s) → no results.", provider_id)
            return None
        return self._normalize(item)

    def get_credits(self, provider_id: str) -> List[Dict[str, Any]]:
        """
        Fetch guest/host credits for a podcast.

        Returns a list of credit dicts with ``person``, ``role``, and
        ``episode`` sub-objects.
        """
        payload = {
            "query": _CREDITS_QUERY,
            "variables": {"id": provider_id},
        }
        data = self._post_with_rotation(payload)
        return (
            data.get("data", {})
            .get("podcast", {})
            .get("credits", {})
            .get("data", []) or []
        )

    # ------------------------------------------------------------------
    # OAuth token management
    # ------------------------------------------------------------------

    def _token_cache_key(self, index: int) -> str:
        """Redis key under which the access token for credential *index* is stored."""
        return f"pc_token:{index}"

    def _fetch_access_token(self, key: str, secret: str) -> str:
        """
        Exchange a Key+Secret pair for a Podchaser Bearer access token.

        Calls the ``requestAccessToken`` GraphQL mutation directly.
        The returned token is valid for 1 year.

        :raises ProviderUnavailable: On HTTP or GraphQL errors.
        """
        mutation_payload = {
            "query": _AUTH_MUTATION,
            "variables": {"clientId": key, "clientSecret": secret},
        }
        try:
            resp = requests.post(
                _ENDPOINT,
                json=mutation_payload,
                headers={"Content-Type": "application/json"},
                timeout=15,
            )
            resp.raise_for_status()
            result = resp.json()
        except requests.RequestException as exc:
            raise ProviderUnavailable(
                f"Podchaser token exchange failed: {exc}",
                provider=self.provider_name,
            ) from exc

        if "errors" in result:
            msg = result["errors"][0].get("message", "Token exchange error")
            raise ProviderUnavailable(
                f"Podchaser auth mutation error: {msg}",
                provider=self.provider_name,
            )

        token: str = (
            result.get("data", {})
            .get("requestAccessToken", {})
            .get("access_token", "")
        )
        if not token:
            raise ProviderUnavailable(
                "Podchaser returned empty access_token.",
                provider=self.provider_name,
            )

        logger.info("[Podchaser] Exchanged credentials (key=…%s) → new token.", key[-6:])
        return token

    def _get_token(self, index: int) -> str:
        """
        Return a valid access token for credential pair *index*.

        Checks Redis first (Cache-Aside). On a miss, calls the auth
        mutation and caches the result for 364 days.
        """
        cache_key = self._token_cache_key(index)

        # cache.get_or_set is atomic — no thundering-herd on cold start.
        key, secret = self._credentials[index]

        def _exchange() -> str:
            return self._fetch_access_token(key, secret)

        token: str = cache.get_or_set(cache_key, _exchange, timeout=_TOKEN_CACHE_TTL)
        return token

    # ------------------------------------------------------------------
    # Credential rotation
    # ------------------------------------------------------------------

    def _rotate_credential(self) -> bool:
        """
        Advance to the next credential pair.

        :returns: ``True`` if a new pair is available, ``False`` if all
                  pairs are exhausted.
        """
        self._current_index += 1
        if self._current_index < len(self._credentials):
            logger.warning(
                "[Podchaser] Credential rotated — now using pair %d of %d.",
                self._current_index + 1,
                len(self._credentials),
            )
            return True
        logger.error("[Podchaser] All credential pairs exhausted — QuotaExhausted raised.")
        return False

    # ------------------------------------------------------------------
    # HTTP helpers
    # ------------------------------------------------------------------

    def _headers(self) -> Dict[str, str]:
        token = self._get_token(self._current_index)
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }

    def _post_with_rotation(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST a GraphQL payload, rotating credential pairs on quota errors (402/403).

        :raises QuotaExhausted: When all credential pairs are spent.
        :raises RateLimitExceeded: On HTTP 429.
        :raises ProviderUnavailable: On network/server errors.
        """
        if not self._credentials:
            raise QuotaExhausted(
                "No Podchaser credentials configured.", provider=self.provider_name
            )

        start_index = self._current_index

        while True:
            try:
                return self._post(payload)
            except QuotaExhausted:
                if not self._rotate_credential():
                    # Restore so the next service-level call starts fresh
                    self._current_index = start_index
                    raise QuotaExhausted(
                        "All Podchaser credential pairs have reached their monthly quota.",
                        provider=self.provider_name,
                    )

    def _post(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Single-attempt GraphQL POST using the current Bearer token.

        Raises the appropriate domain exception for each HTTP error class.
        """
        try:
            response = requests.post(
                _ENDPOINT,
                json=payload,
                headers=self._headers(),
                timeout=15,
            )

            # 402/403 → quota exhaustion for this credential pair
            if response.status_code in (402, 403):
                raise QuotaExhausted(
                    f"Podchaser quota exceeded for current credential pair (HTTP {response.status_code}).",
                    provider=self.provider_name,
                )

            if response.status_code == 429:
                raise RateLimitExceeded(
                    "Podchaser returned 429 Too Many Requests.",
                    provider=self.provider_name,
                )

            response.raise_for_status()
            result = response.json()

            if "errors" in result:
                errors = result["errors"]
                logger.error("[Podchaser] GraphQL errors: %s", errors)
                msg = errors[0].get("message", "")
                if "quota" in msg.lower() or "limit" in msg.lower():
                    raise QuotaExhausted(msg, provider=self.provider_name)
                raise ProviderUnavailable(msg, provider=self.provider_name)

            return result

        except (QuotaExhausted, RateLimitExceeded, ProviderUnavailable):
            raise
        except requests.RequestException as exc:
            raise ProviderUnavailable(
                f"Podchaser request failed: {exc}", provider=self.provider_name
            ) from exc

    # ------------------------------------------------------------------
    # Normaliser
    # ------------------------------------------------------------------

    def _normalize(self, raw: Dict[str, Any]) -> NormalizedPodcast:
        """Map a raw Podchaser item dict to a :class:`NormalizedPodcast`."""
        categories = raw.get("categories", {}).get("data", []) or []
        genre = categories[0].get("title", "") if categories else ""

        rating_obj = raw.get("rating") or {}
        rating: Optional[float] = rating_obj.get("averageRating")

        episodes_info = raw.get("podcastEpisodes", {}) or {}
        total = episodes_info.get("paginatorInfo", {}).get("total", 0)

        credits_data = (
            raw.get("credits", {}).get("data", []) if "credits" in raw else None
        )

        return NormalizedPodcast(
            provider=self.provider_name,
            remote_id=str(raw.get("id", "")),
            title=raw.get("title", ""),
            author=raw.get("author", ""),
            description=raw.get("description", ""),
            cover_url=raw.get("imageUrl", ""),
            rss_feed=raw.get("rssUrl", ""),
            genre=genre,
            total_episodes=total,
            rating=rating,
            credits=credits_data,
            website=raw.get("htmlUrl"),
        )
