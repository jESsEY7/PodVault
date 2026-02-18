import os
import logging
import uuid
from typing import List, Dict, Any

import requests
from django.conf import settings
from django.db import transaction
from django.utils.text import slugify
from django.utils.dateparse import parse_datetime

from .models import Podcast, Episode, Category

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# AI Service (existing)
# ---------------------------------------------------------------------------

class AIService:
    @staticmethod
    def generate_summary(episode):
        """
        Generates a concise summary for an episode using OpenAI or fallback.
        """
        api_key = getattr(settings, 'OPENAI_API_KEY', None)

        if not api_key:
            print("[AIService] No OpenAI API Key found. Returning mock summary.")
            return (
                f"AI Summary (Mock): {episode.description[:200]}..."
                if episode.description
                else "No description available for summary generation."
            )

        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            prompt = (
                f"Generate a concise 2-sentence summary highlighting key topics "
                f"and main takeaways for this podcast episode:\n\n"
                f"Title: {episode.title}\nDescription: {episode.description}\n\n"
                f"Return ONLY the summary, no extra text."
            )
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 150,
            }

            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

        except Exception as e:
            print(f"[AIService] Generation failed: {e}")
            return None


# ---------------------------------------------------------------------------
# News Fetching & Deduplication Service
# ---------------------------------------------------------------------------

class NewsService:
    """
    Service-layer class that fetches news from external APIs,
    normalizes them into the internal Episode schema, deduplicates
    against already-ingested items, and persists new entries.

    Each article is mapped to a UI-tab Category (News, Technology,
    Business, etc.) so it shows up under the correct pill.

    Usage::

        svc = NewsService()
        stats = svc.run()   # {'fetched': 30, 'new': 15, 'ingested': 15}
    """

    SPACEFLIGHT_URL = "https://api.spaceflightnewsapi.net/v4/articles/"
    MEDIASTACK_URL = "http://api.mediastack.com/v1/news"
    DEFAULT_TIMEOUT = 10

    # Maps external category strings → the UI-tab slugs that already exist
    # (or will be seeded by ``ensure_categories``).
    CATEGORY_MAP = {
        "business": "business",
        "technology": "technology",
        "science": "technology",
        "health": "wellness",
        "entertainment": "entertainment",
        "sports": "culture",
        "general": "news",
    }

    # The canonical set of categories that match the frontend CategoryPills.
    UI_CATEGORIES = [
        {"name": "News", "slug": "news", "icon": "newspaper"},
        {"name": "Culture", "slug": "culture", "icon": "headphones"},
        {"name": "Technology", "slug": "technology", "icon": "sparkles"},
        {"name": "Business", "slug": "business", "icon": "briefcase"},
        {"name": "Wellness", "slug": "wellness", "icon": "heart"},
        {"name": "Entertainment", "slug": "entertainment", "icon": "film"},
        {"name": "Education", "slug": "education", "icon": "graduation-cap"},
        {"name": "Storytelling", "slug": "storytelling", "icon": "book-open"},
        {"name": "Sports", "slug": "sports", "icon": "trophy"},
    ]

    def __init__(self):
        self.mediastack_key = getattr(settings, "MEDIASTACK_API_KEY", None)

    # ------------------------------------------------------------------
    # Public orchestrator
    # ------------------------------------------------------------------

    def run(self) -> Dict[str, int]:
        """Full pipeline: ensure categories → fetch → deduplicate → ingest."""
        self.ensure_categories()

        fetched_items = self.fetch_all_sources()
        deduped_items = self.deduplicate(fetched_items)
        ingested_count = self.ingest(deduped_items)

        stats = {
            "fetched": len(fetched_items),
            "new": len(deduped_items),
            "ingested": ingested_count,
        }
        logger.info("[NewsService] Run complete: %s", stats)
        return stats

    # ------------------------------------------------------------------
    # Category seeding
    # ------------------------------------------------------------------

    def ensure_categories(self):
        """Create any UI-tab categories that don't exist yet."""
        for cat in self.UI_CATEGORIES:
            Category.objects.get_or_create(
                slug=cat["slug"],
                defaults={"name": cat["name"], "icon": cat["icon"]},
            )

    # ------------------------------------------------------------------
    # Fetching
    # ------------------------------------------------------------------

    def fetch_all_sources(self) -> List[Dict[str, Any]]:
        """Aggregate results from every configured source."""
        items: List[Dict[str, Any]] = []
        items.extend(self.fetch_from_spaceflight())
        items.extend(self.fetch_from_mediastack())
        return items

    def fetch_from_spaceflight(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Spaceflight News API v4 — public, no key required."""
        try:
            resp = requests.get(
                self.SPACEFLIGHT_URL,
                params={"limit": limit, "ordering": "-published_at"},
                timeout=self.DEFAULT_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json().get("results", [])

            mapping = {
                "remote_id": "id",
                "title": "title",
                "description": "summary",
                "url": "url",
                "image_url": "image_url",
                "published_at": "published_at",
            }

            return [
                self.normalize(item, "spaceflight", mapping, default_category="technology")
                for item in data
            ]
        except Exception as exc:
            logger.exception("[NewsService] Spaceflight fetch failed: %s", exc)
            return []

    def fetch_from_mediastack(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Mediastack API — requires MEDIASTACK_API_KEY in settings."""
        if not self.mediastack_key:
            logger.warning("[NewsService] Mediastack key missing — skipping.")
            return []

        try:
            resp = requests.get(
                self.MEDIASTACK_URL,
                params={
                    "access_key": self.mediastack_key,
                    "languages": "en",
                    "limit": limit,
                },
                timeout=self.DEFAULT_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()

            if "error" in data:
                logger.error("[NewsService] Mediastack API error: %s", data["error"])
                return []

            mapping = {
                "remote_id": "url",
                "title": "title",
                "description": "description",
                "url": "url",
                "image_url": "image",
                "published_at": "published_at",
            }

            return [
                self.normalize(
                    item,
                    "mediastack",
                    mapping,
                    default_category=self._map_category(item.get("category", "general")),
                )
                for item in data.get("data", [])
            ]
        except Exception as exc:
            logger.exception("[NewsService] Mediastack fetch failed: %s", exc)
            return []

    # ------------------------------------------------------------------
    # Normalisation
    # ------------------------------------------------------------------

    def normalize(
        self,
        raw: Dict[str, Any],
        source_name: str,
        mapping: Dict[str, str],
        default_category: str = "news",
    ) -> Dict[str, Any]:
        """
        Convert a single external API item into an internal dict.

        ``mapping`` maps internal keys → keys in the *raw* dict.
        ``remote_id`` is namespaced by source to prevent cross-API collisions.
        """
        normalized = {"source": source_name, "category_slug": default_category}

        for internal_key, external_key in mapping.items():
            normalized[internal_key] = raw.get(external_key)

        # Namespace remote_id to prevent collisions across sources
        normalized["remote_id"] = f"{source_name}:{normalized['remote_id']}"

        return normalized

    def _map_category(self, external_cat: str) -> str:
        """Map an external category label to a UI-tab slug."""
        return self.CATEGORY_MAP.get((external_cat or "").lower(), "news")

    # ------------------------------------------------------------------
    # Deduplication (batch)
    # ------------------------------------------------------------------

    def deduplicate(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filter out items whose ``remote_id`` already exists in the
        Episode table.  Uses a single ``__in`` query instead of N
        individual lookups.
        """
        if not items:
            return []

        candidate_ids = [it["remote_id"] for it in items]
        existing_ids = set(
            Episode.objects.filter(remote_id__in=candidate_ids)
            .values_list("remote_id", flat=True)
        )

        filtered = [it for it in items if it["remote_id"] not in existing_ids]

        logger.info(
            "[NewsService] Dedup: %d existing, %d new out of %d fetched.",
            len(existing_ids),
            len(filtered),
            len(items),
        )
        return filtered

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    @transaction.atomic
    def ingest(self, items: List[Dict[str, Any]]) -> int:
        """
        Persist a list of normalized items as Episode objects.

        * Creates a "Podcast" container per source (get_or_create).
        * Links each Podcast to the correct Category.
        * Uses ``bulk_create`` with ``ignore_conflicts=True``.

        Returns the count of rows created.
        """
        if not items:
            return 0

        # Cache all categories for fast lookup
        category_map = {c.slug: c for c in Category.objects.all()}

        # Group items by source so we can attach the right Podcast container
        by_source: Dict[str, List[Dict[str, Any]]] = {}
        for item in items:
            by_source.setdefault(item["source"], []).append(item)

        episodes_to_create = []

        for source_name, source_items in by_source.items():
            # Determine which category to assign to this source's Podcast.
            # Use the most common category among its items, or fall back to "news".
            cat_slug = self._dominant_category(source_items)
            category = category_map.get(cat_slug) or category_map.get("news")

            podcast, _ = Podcast.objects.get_or_create(
                title=f"{source_name.title()} Feed",
                defaults={
                    "description": f"Automated archives from {source_name.title()}",
                    "category": category,
                    "remote_id": slugify(source_name),
                },
            )

            for item in source_items:
                pub_date = None
                if item.get("published_at"):
                    try:
                        pub_date = parse_datetime(item["published_at"])
                    except (ValueError, TypeError):
                        pub_date = None

                episodes_to_create.append(
                    Episode(
                        id=uuid.uuid4(),
                        podcast=podcast,
                        title=(item.get("title") or "")[:255],
                        description=item.get("description") or "",
                        audio_url=item.get("url") or "",
                        remote_id=item["remote_id"],
                        published_at=pub_date,
                        value={
                            "tags": [item.get("category_slug", "news")],
                            "original_image": item.get("image_url"),
                        },
                    )
                )

        created = Episode.objects.bulk_create(
            episodes_to_create, ignore_conflicts=True
        )
        count = len(created)
        logger.info("[NewsService] Ingested %d new episode(s).", count)
        return count

    @staticmethod
    def _dominant_category(items: List[Dict[str, Any]]) -> str:
        """Return the most frequent category_slug among *items*."""
        from collections import Counter

        slugs = [it.get("category_slug", "news") for it in items]
        if not slugs:
            return "news"
        return Counter(slugs).most_common(1)[0][0]
