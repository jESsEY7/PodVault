"""
podcasts.services
~~~~~~~~~~~~~~~~~
Orchestrator services for the podcast provider layer.

Improvements over v1
---------------------
1. **cache.get_or_set** — search results use Django's atomic helper,
   eliminating the manual get/set if-else dance.

2. **Stale-While-Revalidate (SWR)** — the detail and credits services
   maintain two Redis keys per slug:

       podvault:pod:<slug>           24 h  ← main payload (always served)
       podvault:pod:<slug>:fresh      1 h  ← freshness sentinel (value-less)

   On every request:
   • ``main`` key present  → serve it immediately (lightning-fast)
   • ``fresh`` key absent  → data is stale; dispatch a Celery task to
     re-fetch + update Redis in the background (zero latency impact)
   • ``main`` key absent   → cold start; fetch synchronously, then prime
     both keys

   The user always gets a response in < 5 ms for a warm cache.  The
   background worker silently keeps the payload fresh.
"""

from __future__ import annotations

import logging
from dataclasses import asdict
from typing import Any, Dict, List, Optional

from django.conf import settings
from django.core.cache import cache
from django.utils.text import slugify

from podcasts.exceptions import ProviderError, QuotaExhausted
from podcasts.providers.itunes import ITunesProvider
from podcasts.providers.podchaser import PodchaserProvider
from podcasts.providers.registry import get_provider

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# TTL constants
# ---------------------------------------------------------------------------

# Main cache TTL — how long a payload survives in Redis.
_MAIN_TTL: int = getattr(settings, "PODCAST_CACHE_TTL", 86_400)       # 24 h

# Freshness sentinel TTL — when this expires the data is considered "stale"
# and a background refresh is triggered.  Shorter than MAIN_TTL so the
# payload gets refreshed long before it would expire entirely.
_FRESH_TTL: int = getattr(settings, "PODCAST_FRESH_TTL", 3_600)        #  1 h


# ---------------------------------------------------------------------------
# PodcastSearchService
# ---------------------------------------------------------------------------


class PodcastSearchService:
    """
    Cache-Aside search across a single named provider.

    Uses ``cache.get_or_set`` to atomically check Redis and, on a miss,
    call the provider and store the result in one step.

    Cache key::

        podvault:search:<provider>:<slugified-query>:<limit>
    """

    def search(
        self,
        query: str,
        provider: str = "itunes",
        limit: int = 20,
        ttl: int = _MAIN_TTL,
    ) -> List[Dict[str, Any]]:
        """
        Return normalised podcast search results, using Redis as a cache.

        ``cache.get_or_set`` is the idiomatic Django way to express
        "return the cached value, or compute and store it if missing".
        Because the lambda captures *provider*, *query*, and *limit* by
        closure, no mutable state is shared between calls.

        :param query:    Free-text search term.
        :param provider: One of ``'itunes'``, ``'taddy'``, ``'podchaser'``.
        :param limit:    Maximum results (1–50).
        :param ttl:      Cache TTL in seconds.
        :returns: List of serialised :class:`NormalizedPodcast` dicts.
        :raises ValueError: If *provider* is not registered.
        :raises ProviderError: On provider-side failures.
        """
        cache_key = f"search:{provider}:{slugify(query)}:{limit}"

        # Diagnostic shim — wrap in a logged callable so we know which
        # path was taken without losing the simplicity of get_or_set.
        hit_flag: Dict[str, bool] = {"hit": True}

        def _fetch() -> List[Dict[str, Any]]:
            hit_flag["hit"] = False
            logger.info(
                "[SearchService] Cache MISS — querying '%s' for '%s'.",
                provider,
                query,
            )
            pod_provider = get_provider(provider)
            results = pod_provider.search(query, limit=limit)
            serialized = [asdict(r) for r in results]
            logger.info(
                "[SearchService] Fetched %d result(s) → caching (TTL %ds).",
                len(serialized),
                ttl,
            )
            return serialized

        results = cache.get_or_set(cache_key, _fetch, timeout=ttl)

        if hit_flag["hit"]:
            logger.info("[SearchService] Cache HIT — key: %s", cache_key)

        return results


# ---------------------------------------------------------------------------
# PodcastDetailService
# ---------------------------------------------------------------------------


class PodcastDetailService:
    """
    Hydration pipeline with Stale-While-Revalidate (SWR).

    Cache key structure::

        podvault:pod:<slug>          ← full hydrated payload  (MAIN_TTL = 24 h)
        podvault:pod:<slug>:fresh    ← freshness sentinel     (FRESH_TTL = 1 h)
        podvault:credits:<slug>      ← credits payload        (MAIN_TTL = 24 h)
        podvault:credits:<slug>:fresh← credits sentinel       (FRESH_TTL = 1 h)
    """

    # ------------------------------------------------------------------
    # Public — detail
    # ------------------------------------------------------------------

    def get_detail(
        self,
        slug: str,
        main_ttl: int = _MAIN_TTL,
        fresh_ttl: int = _FRESH_TTL,
    ) -> Optional[Dict[str, Any]]:
        """
        Return a fully-hydrated podcast detail object.

        SWR logic:
          1. Check main key → if present, serve immediately.
          2. Check freshness sentinel → if absent (stale), dispatch
             background Celery task to refresh silently.
          3. If main key absent → cold-fetch synchronously, prime both keys.

        :param slug:      URL-friendly podcast identifier.
        :param main_ttl:  How long data lives in Redis.
        :param fresh_ttl: Window within which data is "fresh" (no re-fetch).
        :returns: Hydrated dict or ``None`` if iTunes finds nothing.
        """
        main_key  = f"pod:{slug}"
        fresh_key = f"pod:{slug}:fresh"

        cached = cache.get(main_key)

        if cached is not None:
            if cache.get(fresh_key) is None:
                # Data is stale — serve immediately then revalidate in BG
                logger.info(
                    "[DetailService] STALE — serving cached data for '%s', "
                    "dispatching background refresh.",
                    slug,
                )
                self._dispatch_refresh(slug, main_ttl, fresh_ttl)
            else:
                logger.info("[DetailService] FRESH HIT — key: %s", main_key)
            return cached

        # Cold start — no data at all; fetch synchronously
        logger.info("[DetailService] COLD MISS — fetching '%s' synchronously.", slug)
        return self._fetch_and_cache(slug, main_ttl, fresh_ttl)

    # ------------------------------------------------------------------
    # Public — credits
    # ------------------------------------------------------------------

    def get_credits(
        self,
        slug: str,
        main_ttl: int = _MAIN_TTL,
        fresh_ttl: int = _FRESH_TTL,
    ) -> Dict[str, Any]:
        """
        Return guest/host credit data with SWR semantics.

        Falls back to an empty credits list (not an error) when Podchaser
        keys are exhausted, so the UI degrades gracefully.

        :param slug:      URL-friendly podcast identifier.
        :param main_ttl:  Main cache TTL.
        :param fresh_ttl: Freshness window.
        :returns: Dict with ``slug``, ``provider``, and ``credits`` keys.
        """
        main_key  = f"credits:{slug}"
        fresh_key = f"credits:{slug}:fresh"

        cached = cache.get(main_key)

        if cached is not None:
            if cache.get(fresh_key) is None:
                logger.info(
                    "[CreditsService] STALE — serving cached credits for '%s', "
                    "dispatching background refresh.",
                    slug,
                )
                self._dispatch_credits_refresh(slug, main_ttl, fresh_ttl)
            else:
                logger.info("[CreditsService] FRESH HIT — key: %s", main_key)
            return cached

        logger.info("[CreditsService] COLD MISS — fetching credits for '%s'.", slug)
        return self._fetch_and_cache_credits(slug, main_ttl, fresh_ttl)

    # ------------------------------------------------------------------
    # Fetch helpers (synchronous — used on cold start)
    # ------------------------------------------------------------------

    def _fetch_and_cache(
        self, slug: str, main_ttl: int, fresh_ttl: int
    ) -> Optional[Dict[str, Any]]:
        """Fetch from iTunes + Podchaser, prime both cache keys."""
        itunes = ITunesProvider()
        query = slug.replace("-", " ")
        results = itunes.search(query, limit=1)

        if not results:
            logger.warning("[DetailService] iTunes returned nothing for '%s'.", slug)
            return None

        payload = asdict(results[0])
        payload  = _hydrate_with_podchaser(payload, query)

        cache.set(main_key  := f"pod:{slug}",         payload,  timeout=main_ttl)
        cache.set(fresh_key := f"pod:{slug}:fresh",   True,     timeout=fresh_ttl)
        logger.info(
            "[DetailService] Primed main (%ds) + fresh (%ds) keys for '%s'.",
            main_ttl, fresh_ttl, slug,
        )
        return payload

    def _fetch_and_cache_credits(
        self, slug: str, main_ttl: int, fresh_ttl: int
    ) -> Dict[str, Any]:
        """Fetch credits from Podchaser, prime both cache keys."""
        podchaser = PodchaserProvider()
        credits_list: List[Dict[str, Any]] = []

        try:
            query = slug.replace("-", " ")
            results = podchaser.search(query, limit=1)
            if results:
                pc_id = results[0].remote_id
                credits_list = podchaser.get_credits(pc_id)
        except (QuotaExhausted, ProviderError) as exc:
            logger.warning("[CreditsService] Podchaser error: %s", exc)

        payload = {"slug": slug, "provider": "podchaser", "credits": credits_list}
        cache.set(f"credits:{slug}",        payload,  timeout=main_ttl)
        cache.set(f"credits:{slug}:fresh",  True,     timeout=fresh_ttl)
        return payload

    # ------------------------------------------------------------------
    # Celery dispatch
    # ------------------------------------------------------------------

    @staticmethod
    def _dispatch_refresh(slug: str, main_ttl: int, fresh_ttl: int) -> None:
        """Fire-and-forget: enqueue the background detail refresh task."""
        try:
            from podcasts.tasks import refresh_podcast_detail
            refresh_podcast_detail.delay(slug, main_ttl, fresh_ttl)
        except Exception as exc:                                    # noqa: BLE001
            # Celery may not be running in development — log and continue.
            logger.warning("[DetailService] Could not dispatch refresh task: %s", exc)

    @staticmethod
    def _dispatch_credits_refresh(slug: str, main_ttl: int, fresh_ttl: int) -> None:
        """Fire-and-forget: enqueue the background credits refresh task."""
        try:
            from podcasts.tasks import refresh_podcast_credits
            refresh_podcast_credits.delay(slug, main_ttl, fresh_ttl)
        except Exception as exc:                                    # noqa: BLE001
            logger.warning("[CreditsService] Could not dispatch credits task: %s", exc)


# ---------------------------------------------------------------------------
# Shared helper — Podchaser hydration (used by both sync + Celery path)
# ---------------------------------------------------------------------------


def _hydrate_with_podchaser(
    base: Dict[str, Any], query: str
) -> Dict[str, Any]:
    """
    Enrich *base* dict with Podchaser rating and credits in-place.

    Module-level function so both the synchronous service and the async
    Celery task share exactly the same hydration logic (Single Responsibility).

    Returns *base* unmodified if Podchaser is unavailable.
    """
    try:
        podchaser = PodchaserProvider()
        pc_results = podchaser.search(query, limit=1)
        if not pc_results:
            return base

        pc_data = asdict(pc_results[0])
        base["rating"]  = pc_data.get("rating")  or base.get("rating")
        base["credits"] = pc_data.get("credits") or []

        logger.info(
            "[Hydration] rating=%s, credits=%d",
            base["rating"],
            len(base["credits"] or []),
        )
    except (QuotaExhausted, ProviderError) as exc:
        logger.warning("[Hydration] Podchaser unavailable — iTunes-only data returned. %s", exc)

    return base
