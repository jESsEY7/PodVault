"""
podcasts.providers.registry
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Provider factory — maps provider names to concrete implementations.

Usage::

    from podcasts.providers.registry import get_provider

    provider = get_provider("itunes")   # → ITunesProvider()
    results  = provider.search("The Daily")
"""

from __future__ import annotations

import logging
from typing import Dict, Type

from .base import PodcastProvider
from .itunes import ITunesProvider
from .podchaser import PodchaserProvider
from .taddy import TaddyProvider

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

PROVIDER_MAP: Dict[str, Type[PodcastProvider]] = {
    "itunes":    ITunesProvider,
    "taddy":     TaddyProvider,
    "podchaser": PodchaserProvider,
}

AVAILABLE_PROVIDERS = list(PROVIDER_MAP.keys())


def get_provider(name: str) -> PodcastProvider:
    """
    Instantiate and return the requested provider.

    :param name: Provider key — one of ``'itunes'``, ``'taddy'``,
                 ``'podchaser'``.
    :returns: A fresh :class:`~podcasts.providers.base.PodcastProvider`
              instance.
    :raises ValueError: If *name* is not in :data:`PROVIDER_MAP`.
    """
    cls = PROVIDER_MAP.get(name)
    if cls is None:
        raise ValueError(
            f"Unknown provider: '{name}'. "
            f"Available providers: {AVAILABLE_PROVIDERS}"
        )
    logger.debug("[Registry] Instantiating provider: %s", name)
    return cls()
