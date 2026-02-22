"""
podcasts.providers.base
~~~~~~~~~~~~~~~~~~~~~~~
Abstract contract that every podcast provider must satisfy.

``NormalizedPodcast`` is the "Vault Standard" dataclass — a single,
provider-agnostic schema shared by iTunes, Taddy, and Podchaser so the
rest of the codebase never needs to know which provider supplied the data.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class NormalizedPodcast:
    """
    Vault Standard podcast schema.

    All three providers map their raw responses into this shape before
    returning data to the service layer.

    Provider mapping reference:

    +-----------------+---------------+----------------+------------------+
    | Vault field     | iTunes        | Taddy          | Podchaser        |
    +=================+===============+================+==================+
    | title           | trackName     | name           | title            |
    | cover_url       | artworkUrl600 | image          | imageUrl         |
    | rss_feed        | feedUrl       | rssUrl         | rssUrl           |
    | author          | artistName    | author.name    | author           |
    | genre           | primaryGenre… | categories[0]  | categories[0]    |
    | total_episodes  | trackCount    | episodeCount   | episodeCount     |
    +-----------------+---------------+----------------+------------------+

    Hydration fields (``rating``, ``credits``) are populated by
    :class:`podcasts.providers.podchaser.PodchaserProvider`.
    """

    provider: str                                # 'itunes' | 'taddy' | 'podchaser'
    remote_id: str                               # provider-scoped unique ID
    title: str
    author: str
    description: str
    cover_url: str
    rss_feed: str
    genre: str
    total_episodes: int

    # Optional — only populated after Podchaser hydration
    rating: Optional[float] = None
    credits: Optional[List[Dict[str, Any]]] = field(default=None)
    website: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Return a JSON-serialisable dict representation."""
        return asdict(self)


class PodcastProvider(ABC):
    """
    Abstract base class for podcast data providers.

    Concrete subclasses must implement :meth:`search` and
    :meth:`get_by_id`.  All public methods must return
    :class:`NormalizedPodcast` instances so the service layer stays
    provider-agnostic.
    """

    # Subclasses should set this to their short name, e.g. "itunes"
    provider_name: str = "unknown"

    @abstractmethod
    def search(
        self, query: str, limit: int = 20
    ) -> List[NormalizedPodcast]:
        """
        Search for podcasts matching *query*.

        :param query: Free-text search term.
        :param limit: Maximum number of results to return.
        :returns: List of normalised podcast objects.
        :raises ProviderError: On any provider-side failure.
        """

    @abstractmethod
    def get_by_id(self, provider_id: str) -> Optional[NormalizedPodcast]:
        """
        Retrieve a single podcast by its provider-specific ID.

        :param provider_id: Opaque ID used by this provider.
        :returns: Normalised podcast or ``None`` if not found.
        :raises ProviderError: On any provider-side failure.
        """
