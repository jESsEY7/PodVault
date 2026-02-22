"""
podcasts.tasks
~~~~~~~~~~~~~~
Celery background tasks for the Stale-While-Revalidate (SWR) cache strategy.

These tasks are dispatched by :class:`~podcasts.services.PodcastDetailService`
when it detects that a cached entry is stale (main key present, freshness
sentinel expired).  They run in the background worker process so the HTTP
response is never delayed waiting for a provider call.

Task overview
-------------
``refresh_podcast_detail``
    Re-fetches iTunes base data + Podchaser hydration for a given slug,
    then writes the result back to Redis (main key + fresh sentinel).

``refresh_podcast_credits``
    Re-fetches Podchaser credits for a given slug and refreshes both
    cache keys.

Usage (internal — called automatically by the service layer)::

    from podcasts.tasks import refresh_podcast_detail
    refresh_podcast_detail.delay("the-daily", 86400, 3600)
"""

from __future__ import annotations

import logging
from dataclasses import asdict
from typing import Any, Dict, List

from celery import shared_task
from django.core.cache import cache

from podcasts.exceptions import ProviderError, QuotaExhausted
from podcasts.providers.itunes import ITunesProvider
from podcasts.providers.podchaser import PodchaserProvider
from podcasts.services import _hydrate_with_podchaser

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Detail refresh
# ---------------------------------------------------------------------------


@shared_task(
    name="podcasts.tasks.refresh_podcast_detail",
    bind=True,
    max_retries=3,
    default_retry_delay=30,       # seconds between auto-retries
    acks_late=True,               # task is re-queued if the worker dies mid-task
    ignore_result=True,           # we don't need the return value
)
def refresh_podcast_detail(
    self,                         # bound task instance (for self.retry)
    slug: str,
    main_ttl: int = 86_400,
    fresh_ttl: int = 3_600,
) -> None:
    """
    Background task: re-fetch and cache hydrated podcast detail for *slug*.

    Flow:
      1. Fetch base data from iTunes (free, rate-limited by our RateLimiter).
      2. Hydrate with Podchaser ratings + credits.
      3. Write payload to main key (``pod:<slug>``) and reset freshness
         sentinel (``pod:<slug>:fresh``) so the next HTTP request sees fresh data.

    Auto-retries up to 3 times with a 30 s delay on any provider exception.

    :param slug:      URL-friendly podcast identifier.
    :param main_ttl:  Seconds until the full payload expires.
    :param fresh_ttl: Seconds until the freshness sentinel expires.
    """
    logger.info("[refresh_podcast_detail] Starting background refresh for slug='%s'.", slug)

    try:
        itunes = ITunesProvider()
        query = slug.replace("-", " ")
        results = itunes.search(query, limit=1)

        if not results:
            logger.warning(
                "[refresh_podcast_detail] iTunes returned nothing for '%s'. "
                "Keeping stale data.", slug
            )
            return

        payload: Dict[str, Any] = asdict(results[0])
        payload = _hydrate_with_podchaser(payload, query)

        cache.set(f"pod:{slug}",        payload, timeout=main_ttl)
        cache.set(f"pod:{slug}:fresh",  True,    timeout=fresh_ttl)

        logger.info(
            "[refresh_podcast_detail] ✓ Refreshed '%s' — "
            "main_ttl=%ds, fresh_ttl=%ds.",
            slug, main_ttl, fresh_ttl,
        )

    except ProviderError as exc:
        logger.warning(
            "[refresh_podcast_detail] Provider error for '%s': %s. "
            "Retrying...", slug, exc
        )
        raise self.retry(exc=exc)

    except Exception as exc:                                        # noqa: BLE001
        logger.error(
            "[refresh_podcast_detail] Unexpected error for '%s': %s. "
            "Will not retry.", slug, exc
        )


# ---------------------------------------------------------------------------
# Credits refresh
# ---------------------------------------------------------------------------


@shared_task(
    name="podcasts.tasks.refresh_podcast_credits",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
    ignore_result=True,
)
def refresh_podcast_credits(
    self,
    slug: str,
    main_ttl: int = 86_400,
    fresh_ttl: int = 3_600,
) -> None:
    """
    Background task: re-fetch and cache Podchaser credits for *slug*.

    Flow:
      1. Search Podchaser to obtain its opaque podcast ID.
      2. Fetch full credits list (guest + host appearances).
      3. Write result to ``credits:<slug>`` and reset ``credits:<slug>:fresh``.

    If Podchaser quota is exhausted the stale credits are left intact
    (we don't delete them — stale is better than nothing).

    :param slug:      URL-friendly podcast identifier.
    :param main_ttl:  Seconds until credits payload expires.
    :param fresh_ttl: Seconds until freshness sentinel expires.
    """
    logger.info("[refresh_podcast_credits] Starting refresh for slug='%s'.", slug)

    try:
        podchaser = PodchaserProvider()
        query = slug.replace("-", " ")
        credits_list: List[Dict[str, Any]] = []

        results = podchaser.search(query, limit=1)
        if results:
            pc_id = results[0].remote_id
            credits_list = podchaser.get_credits(pc_id)
        else:
            logger.warning(
                "[refresh_podcast_credits] Podchaser found nothing for '%s'. "
                "Keeping stale credits.", slug
            )
            return

        payload = {"slug": slug, "provider": "podchaser", "credits": credits_list}
        cache.set(f"credits:{slug}",        payload, timeout=main_ttl)
        cache.set(f"credits:{slug}:fresh",  True,    timeout=fresh_ttl)

        logger.info(
            "[refresh_podcast_credits] ✓ Refreshed credits for '%s' (%d credit(s)).",
            slug, len(credits_list),
        )

    except QuotaExhausted as exc:
        # Don't retry — all keys are spent.  Stale data stays in cache.
        logger.error(
            "[refresh_podcast_credits] All Podchaser keys exhausted for '%s': %s. "
            "Stale credits preserved.", slug, exc
        )

    except ProviderError as exc:
        logger.warning(
            "[refresh_podcast_credits] Provider error for '%s': %s. "
            "Retrying...", slug, exc
        )
        raise self.retry(exc=exc)

    except Exception as exc:                                        # noqa: BLE001
        logger.error(
            "[refresh_podcast_credits] Unexpected error for '%s': %s.", slug, exc
        )
