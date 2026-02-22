"""
podcasts.providers.itunes
~~~~~~~~~~~~~~~~~~~~~~~~~
iTunes Search API provider.

iTunes is a public, no-auth API that supports broad podcast searches.
It is used as the primary source for base podcast metadata.

Rate limit: 20 requests per minute (enforced by a shared RateLimiter).
Retry strategy: exponential back-off (sleep 2^attempt s) for up to 3
retries on HTTP 429.

Reference:
    https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

import requests

from podcasts.exceptions import ProviderUnavailable, RateLimitExceeded
from podcasts.rate_limiter import RateLimiter

from .base import NormalizedPodcast, PodcastProvider

logger = logging.getLogger(__name__)

# Module-level singleton — shared across all ITunesProvider instances so
# the 20 req/min budget is respected regardless of how many views are
# served concurrently.
_rate_limiter = RateLimiter(max_calls=20, period=60.0)

_MAX_RETRIES = 3
_BASE_BACKOFF = 2  # seconds (doubles each retry: 2 → 4 → 8)


class ITunesProvider(PodcastProvider):
    """
    Podcast metadata via the iTunes Search API.

    Field mapping (iTunes JSON → Vault Standard):

    +-----------------------+------------------+
    | iTunes field          | Vault field      |
    +=======================+==================+
    | collectionId          | remote_id        |
    | trackName             | title            |
    | artistName            | author           |
    | description / …       | description      |
    | artworkUrl600         | cover_url        |
    | feedUrl               | rss_feed         |
    | primaryGenreName      | genre            |
    | trackCount            | total_episodes   |
    | collectionViewUrl     | website          |
    +-----------------------+------------------+
    """

    provider_name = "itunes"
    BASE_URL = "https://itunes.apple.com/search"
    LOOKUP_URL = "https://itunes.apple.com/lookup"

    # ------------------------------------------------------------------
    # PodcastProvider interface
    # ------------------------------------------------------------------

    def search(self, query: str, limit: int = 20) -> List[NormalizedPodcast]:
        """Search iTunes for podcasts matching *query*."""
        params: Dict[str, Any] = {
            "term": query,
            "media": "podcast",
            "entity": "podcast",
            "limit": min(limit, 200),  # iTunes hard cap
        }
        data = self._get(self.BASE_URL, params=params)
        results = data.get("results", [])
        logger.info("[iTunes] Search '%s' → %d result(s).", query, len(results))
        return [self._normalize(item) for item in results if item.get("feedUrl")]

    def get_by_id(self, provider_id: str) -> Optional[NormalizedPodcast]:
        """Fetch a single podcast by its iTunes collection ID."""
        params = {"id": provider_id, "entity": "podcast"}
        data = self._get(self.LOOKUP_URL, params=params)
        results = data.get("results", [])
        if not results:
            logger.warning("[iTunes] get_by_id(%s) → no results.", provider_id)
            return None
        return self._normalize(results[0])

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform a rate-limited GET with exponential back-off on 429.

        :raises RateLimitExceeded: If all retries are exhausted.
        :raises ProviderUnavailable: On network error or 5xx response.
        """
        for attempt in range(_MAX_RETRIES + 1):
            _rate_limiter.acquire()
            try:
                response = requests.get(url, params=params, timeout=10)

                if response.status_code == 429:
                    if attempt < _MAX_RETRIES:
                        wait = _BASE_BACKOFF ** (attempt + 1)
                        logger.warning(
                            "[iTunes] 429 received (attempt %d/%d). "
                            "Back-off %.0fs.",
                            attempt + 1,
                            _MAX_RETRIES,
                            wait,
                        )
                        time.sleep(wait)
                        continue
                    raise RateLimitExceeded(
                        f"iTunes returned 429 after {_MAX_RETRIES} retries.",
                        provider=self.provider_name,
                    )

                response.raise_for_status()
                return response.json()

            except RateLimitExceeded:
                raise
            except requests.RequestException as exc:
                raise ProviderUnavailable(
                    f"iTunes request failed: {exc}", provider=self.provider_name
                ) from exc

        # Should never reach here; satisfy type checker
        raise ProviderUnavailable("Unexpected retry loop exit.", provider=self.provider_name)

    def _normalize(self, raw: Dict[str, Any]) -> NormalizedPodcast:
        """Map a raw iTunes item dict to a :class:`NormalizedPodcast`."""
        return NormalizedPodcast(
            provider=self.provider_name,
            remote_id=str(raw.get("collectionId", "")),
            title=raw.get("trackName") or raw.get("collectionName", ""),
            author=raw.get("artistName", ""),
            description=raw.get("description") or raw.get("shortDescription", ""),
            cover_url=raw.get("artworkUrl600") or raw.get("artworkUrl100", ""),
            rss_feed=raw.get("feedUrl", ""),
            genre=raw.get("primaryGenreName", ""),
            total_episodes=raw.get("trackCount", 0),
            website=raw.get("collectionViewUrl"),
        )
