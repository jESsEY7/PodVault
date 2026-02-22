"""
podcasts.providers.taddy
~~~~~~~~~~~~~~~~~~~~~~~~
Taddy GraphQL API provider.

Taddy specialises in deep episode-level metadata and owns a rich podcast
index.  Authentication is via two custom HTTP headers.

API reference: https://taddy.org/developers/api-docs
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import requests
from django.conf import settings

from podcasts.exceptions import ProviderUnavailable, RateLimitExceeded

from .base import NormalizedPodcast, PodcastProvider

logger = logging.getLogger(__name__)

# GraphQL query for podcast search
_SEARCH_QUERY = """
query SearchPodcasts($term: String!, $limitPerPage: Int) {
  getPodcastSeries(
    name: $term,
    limitPerPage: $limitPerPage
  ) {
    podcastSeries {
      uuid
      name
      description
      imageUrl
      rssUrl
      itunesId
      episodeCount
      language
      rating
      categories {
        name
      }
      author {
        name
      }
    }
  }
}
"""

# GraphQL query for single lookup by Taddy UUID
_LOOKUP_QUERY = """
query GetPodcast($uuid: ID!) {
  getPodcastSeries(uuid: $uuid) {
    podcastSeries {
      uuid
      name
      description
      imageUrl
      rssUrl
      itunesId
      episodeCount
      language
      rating
      categories {
        name
      }
      author {
        name
      }
    }
  }
}
"""


class TaddyProvider(PodcastProvider):
    """
    Podcast metadata via the Taddy GraphQL API.

    Requires ``settings.TADDY_API_KEY`` and ``settings.TADDY_USER_ID``.

    Field mapping (Taddy → Vault Standard):

    +------------------------+-------------------+
    | Taddy field            | Vault field       |
    +========================+===================+
    | uuid                   | remote_id         |
    | name                   | title             |
    | author.name            | author            |
    | description            | description       |
    | imageUrl               | cover_url         |
    | rssUrl                 | rss_feed          |
    | categories[0].name     | genre             |
    | episodeCount           | total_episodes    |
    +------------------------+-------------------+
    """

    provider_name = "taddy"
    ENDPOINT = "https://api.taddy.org"

    def __init__(self) -> None:
        self._api_key: str = getattr(settings, "TADDY_API_KEY", "")
        self._user_id: str = getattr(settings, "TADDY_USER_ID", "")
        if not self._api_key or not self._user_id:
            logger.warning(
                "[Taddy] TADDY_API_KEY or TADDY_USER_ID not set — "
                "requests will be unauthenticated and may fail."
            )

    # ------------------------------------------------------------------
    # PodcastProvider interface
    # ------------------------------------------------------------------

    def search(self, query: str, limit: int = 20) -> List[NormalizedPodcast]:
        """Search Taddy for podcasts matching *query*."""
        payload = {
            "query": _SEARCH_QUERY,
            "variables": {"term": query, "limitPerPage": min(limit, 25)},
        }
        data = self._post(payload)
        series_list = (
            data.get("data", {})
            .get("getPodcastSeries", {})
            .get("podcastSeries", []) or []
        )
        logger.info("[Taddy] Search '%s' → %d result(s).", query, len(series_list))
        return [self._normalize(item) for item in series_list]

    def get_by_id(self, provider_id: str) -> Optional[NormalizedPodcast]:
        """Fetch a single podcast by its Taddy UUID."""
        payload = {
            "query": _LOOKUP_QUERY,
            "variables": {"uuid": provider_id},
        }
        data = self._post(payload)
        series_list = (
            data.get("data", {})
            .get("getPodcastSeries", {})
            .get("podcastSeries", []) or []
        )
        if not series_list:
            logger.warning("[Taddy] get_by_id(%s) → no results.", provider_id)
            return None
        return self._normalize(series_list[0])

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "X-USER-ID": self._user_id,
            "X-API-KEY": self._api_key,
        }

    def _post(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a GraphQL request against the Taddy endpoint.

        :raises RateLimitExceeded: On HTTP 429.
        :raises ProviderUnavailable: On network or server error.
        """
        try:
            response = requests.post(
                self.ENDPOINT,
                json=payload,
                headers=self._headers(),
                timeout=15,
            )

            if response.status_code == 429:
                raise RateLimitExceeded(
                    "Taddy returned 429 Too Many Requests.",
                    provider=self.provider_name,
                )

            response.raise_for_status()
            result = response.json()

            # Surface GraphQL-level errors
            if "errors" in result:
                errors = result["errors"]
                logger.error("[Taddy] GraphQL errors: %s", errors)
                raise ProviderUnavailable(
                    f"Taddy GraphQL error: {errors[0].get('message', 'unknown')}",
                    provider=self.provider_name,
                )

            return result

        except (RateLimitExceeded, ProviderUnavailable):
            raise
        except requests.RequestException as exc:
            raise ProviderUnavailable(
                f"Taddy request failed: {exc}", provider=self.provider_name
            ) from exc

    def _normalize(self, raw: Dict[str, Any]) -> NormalizedPodcast:
        """Map a raw Taddy series dict to a :class:`NormalizedPodcast`."""
        categories = raw.get("categories") or []
        genre = categories[0].get("name", "") if categories else ""

        author_obj = raw.get("author") or {}
        author = author_obj.get("name", "") if isinstance(author_obj, dict) else ""

        return NormalizedPodcast(
            provider=self.provider_name,
            remote_id=raw.get("uuid", ""),
            title=raw.get("name", ""),
            author=author,
            description=raw.get("description", ""),
            cover_url=raw.get("imageUrl", ""),
            rss_feed=raw.get("rssUrl", ""),
            genre=genre,
            total_episodes=raw.get("episodeCount", 0),
        )
