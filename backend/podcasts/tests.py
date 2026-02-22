"""
podcasts.tests
~~~~~~~~~~~~~~
Unit tests for the podcast provider layer.

All tests mock external HTTP requests — no real API calls are made.
Run with::

    python manage.py test podcasts --verbosity=2
"""

from __future__ import annotations

import json
import unittest
from dataclasses import asdict
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings


# ---------------------------------------------------------------------------
# NormalizedPodcast shape tests
# ---------------------------------------------------------------------------

class TestNormalizedPodcast(SimpleTestCase):
    """Verify the dataclass can be constructed and serialised correctly."""

    def _make(self, **kwargs):
        from podcasts.providers.base import NormalizedPodcast
        defaults = dict(
            provider="itunes", remote_id="123", title="Test Pod",
            author="Author", description="Desc", cover_url="http://img",
            rss_feed="http://rss", genre="Technology", total_episodes=10,
        )
        defaults.update(kwargs)
        return NormalizedPodcast(**defaults)

    def test_to_dict_contains_all_vault_fields(self):
        pod = self._make()
        d = pod.to_dict()
        for field in ("provider", "remote_id", "title", "author",
                      "description", "cover_url", "rss_feed", "genre",
                      "total_episodes"):
            self.assertIn(field, d)

    def test_optional_fields_default_to_none(self):
        pod = self._make()
        self.assertIsNone(pod.rating)
        self.assertIsNone(pod.credits)
        self.assertIsNone(pod.website)

    def test_optional_fields_can_be_set(self):
        pod = self._make(rating=4.5, credits=[{"person": {"name": "Alice"}}], website="http://pod.com")
        self.assertEqual(pod.rating, 4.5)
        self.assertEqual(len(pod.credits), 1)
        self.assertEqual(pod.website, "http://pod.com")


# ---------------------------------------------------------------------------
# ITunesProvider tests
# ---------------------------------------------------------------------------

_ITUNES_ITEM = {
    "collectionId": 123456,
    "trackName": "Vault Cast",
    "artistName": "Jane Doe",
    "description": "A great show",
    "artworkUrl600": "https://img/600.jpg",
    "feedUrl": "https://rss.example.com/feed",
    "primaryGenreName": "Technology",
    "trackCount": 55,
    "collectionViewUrl": "https://itunes.apple.com/podcast/vault-cast/id123456",
}

class TestITunesProvider(SimpleTestCase):

    def _make_response(self, items):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"results": items}
        mock_resp.raise_for_status = MagicMock()
        return mock_resp

    @patch("podcasts.providers.itunes.requests.get")
    @patch("podcasts.providers.itunes._rate_limiter.acquire", return_value=None)
    def test_search_returns_normalized_list(self, _mock_limiter, mock_get):
        mock_get.return_value = self._make_response([_ITUNES_ITEM])
        from podcasts.providers.itunes import ITunesProvider
        provider = ITunesProvider()
        results = provider.search("vault cast", limit=1)
        self.assertEqual(len(results), 1)
        pod = results[0]
        self.assertEqual(pod.title, "Vault Cast")
        self.assertEqual(pod.author, "Jane Doe")
        self.assertEqual(pod.cover_url, "https://img/600.jpg")
        self.assertEqual(pod.rss_feed, "https://rss.example.com/feed")
        self.assertEqual(pod.genre, "Technology")
        self.assertEqual(pod.total_episodes, 55)
        self.assertEqual(pod.provider, "itunes")

    @patch("podcasts.providers.itunes.requests.get")
    @patch("podcasts.providers.itunes._rate_limiter.acquire", return_value=None)
    def test_search_skips_items_without_feed_url(self, _mock_limiter, mock_get):
        item_no_feed = {**_ITUNES_ITEM, "feedUrl": None}
        mock_get.return_value = self._make_response([item_no_feed])
        from podcasts.providers.itunes import ITunesProvider
        provider = ITunesProvider()
        results = provider.search("test")
        self.assertEqual(results, [])

    @patch("podcasts.providers.itunes.requests.get")
    @patch("podcasts.providers.itunes._rate_limiter.acquire", return_value=None)
    @patch("podcasts.providers.itunes.time.sleep", return_value=None)
    def test_search_raises_rate_limit_after_retries(self, _sleep, _limiter, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_get.return_value = mock_resp
        from podcasts.providers.itunes import ITunesProvider
        from podcasts.exceptions import RateLimitExceeded
        provider = ITunesProvider()
        with self.assertRaises(RateLimitExceeded):
            provider.search("test")


# ---------------------------------------------------------------------------
# TaddyProvider tests
# ---------------------------------------------------------------------------

_TADDY_ITEM = {
    "uuid": "taddy-uuid-001",
    "name": "Vault Talks",
    "author": {"name": "Bob Smith"},
    "description": "Tech conversations",
    "imageUrl": "https://img/taddy.jpg",
    "rssUrl": "https://rss.taddy.com/feed",
    "categories": [{"name": "Education"}],
    "episodeCount": 30,
}

class TestTaddyProvider(SimpleTestCase):

    def _make_response(self, items):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "data": {"getPodcastSeries": {"podcastSeries": items}}
        }
        mock_resp.raise_for_status = MagicMock()
        return mock_resp

    @override_settings(TADDY_API_KEY="testkey", TADDY_USER_ID="testuser")
    @patch("podcasts.providers.taddy.requests.post")
    def test_search_returns_normalized_list(self, mock_post):
        mock_post.return_value = self._make_response([_TADDY_ITEM])
        from podcasts.providers.taddy import TaddyProvider
        provider = TaddyProvider()
        results = provider.search("vault talks", limit=1)
        self.assertEqual(len(results), 1)
        pod = results[0]
        self.assertEqual(pod.title, "Vault Talks")
        self.assertEqual(pod.remote_id, "taddy-uuid-001")
        self.assertEqual(pod.author, "Bob Smith")
        self.assertEqual(pod.genre, "Education")
        self.assertEqual(pod.provider, "taddy")

    @override_settings(TADDY_API_KEY="testkey", TADDY_USER_ID="testuser")
    @patch("podcasts.providers.taddy.requests.post")
    def test_429_raises_rate_limit_exceeded(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_post.return_value = mock_resp
        from podcasts.providers.taddy import TaddyProvider
        from podcasts.exceptions import RateLimitExceeded
        provider = TaddyProvider()
        with self.assertRaises(RateLimitExceeded):
            provider.search("test")


# ---------------------------------------------------------------------------
# PodchaserProvider tests (key rotation)
# ---------------------------------------------------------------------------

_PODCHASER_ITEM = {
    "id": "pc-001",
    "title": "Social Cast",
    "author": "Alice B",
    "description": "Social podcast",
    "imageUrl": "https://img/pc.jpg",
    "rssUrl": "https://rss.pc.com/feed",
    "htmlUrl": "https://podchaser.com/social-cast",
    "rating": {"averageRating": 4.7, "reviewsCount": 200},
    "categories": {"data": [{"title": "Society"}]},
    "podcastEpisodes": {"paginatorInfo": {"total": 120}},
}

class TestPodchaserProvider(SimpleTestCase):

    # All tests mock cache.get_or_set so the OAuth token exchange is bypassed.
    # The token "MOCK_TOKEN" is returned directly from the Redis mock.
    _CREDENTIALS = "key1:secret1,key2:secret2"

    def _mock_cache(self):
        """Return a cache mock that delivers a fake token on get_or_set."""
        m = MagicMock()
        m.get_or_set.return_value = "MOCK_TOKEN"
        return m

    @override_settings(PODCHASER_CREDENTIALS="key1:secret1,key2:secret2")
    @patch("podcasts.providers.podchaser.cache")
    @patch("podcasts.providers.podchaser.requests.post")
    def test_search_normalizes_correctly(self, mock_post, mock_cache):
        mock_cache.get_or_set.return_value = "MOCK_TOKEN"
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "data": {"podcasts": {"data": [_PODCHASER_ITEM]}}
        }
        mock_resp.raise_for_status = MagicMock()
        mock_post.return_value = mock_resp

        from podcasts.providers.podchaser import PodchaserProvider
        provider = PodchaserProvider()
        results = provider.search("social cast")
        self.assertEqual(len(results), 1)
        pod = results[0]
        self.assertEqual(pod.title, "Social Cast")
        self.assertAlmostEqual(pod.rating, 4.7)
        self.assertEqual(pod.genre, "Society")
        # Verify Bearer token was injected from mock cache (not real OAuth call)
        call_headers = mock_post.call_args[1]["headers"]
        self.assertEqual(call_headers["Authorization"], "Bearer MOCK_TOKEN")

    @override_settings(PODCHASER_CREDENTIALS="key1:secret1,key2:secret2")
    @patch("podcasts.providers.podchaser.cache")
    @patch("podcasts.providers.podchaser.requests.post")
    def test_key_rotation_on_quota_exhausted(self, mock_post, mock_cache):
        """First credential returns 402; provider rotates to key2 which succeeds."""
        mock_cache.get_or_set.return_value = "MOCK_TOKEN"

        failed_resp = MagicMock()
        failed_resp.status_code = 402
        failed_resp.raise_for_status = MagicMock()

        success_resp = MagicMock()
        success_resp.status_code = 200
        success_resp.json.return_value = {
            "data": {"podcasts": {"data": [_PODCHASER_ITEM]}}
        }
        success_resp.raise_for_status = MagicMock()

        mock_post.side_effect = [failed_resp, success_resp]

        from podcasts.providers.podchaser import PodchaserProvider
        provider = PodchaserProvider()
        results = provider.search("social cast")
        self.assertEqual(len(results), 1)        # key2 succeeded
        self.assertEqual(mock_post.call_count, 2)  # two GraphQL attempts

    @override_settings(PODCHASER_CREDENTIALS="key1:secret1")
    @patch("podcasts.providers.podchaser.cache")
    @patch("podcasts.providers.podchaser.requests.post")
    def test_all_credentials_exhausted_raises_quota_exhausted(self, mock_post, mock_cache):
        mock_cache.get_or_set.return_value = "MOCK_TOKEN"
        failed_resp = MagicMock()
        failed_resp.status_code = 402
        mock_post.return_value = failed_resp

        from podcasts.providers.podchaser import PodchaserProvider
        from podcasts.exceptions import QuotaExhausted
        provider = PodchaserProvider()
        with self.assertRaises(QuotaExhausted):
            provider.search("test")

    def test_load_credentials_parses_pairs(self):
        """_load_credentials converts 'key:secret,key2:secret2' → [(key,secret),...]"""
        with override_settings(PODCHASER_CREDENTIALS="key1:secret1,key2:secret2"):
            from podcasts.providers.podchaser import _load_credentials
            pairs = _load_credentials()
        self.assertEqual(len(pairs), 2)
        self.assertEqual(pairs[0], ("key1", "secret1"))
        self.assertEqual(pairs[1], ("key2", "secret2"))

    def test_load_credentials_ignores_malformed_entries(self):
        with override_settings(PODCHASER_CREDENTIALS="key1:secret1,badentry,key2:secret2"):
            from podcasts.providers.podchaser import _load_credentials
            pairs = _load_credentials()
        self.assertEqual(len(pairs), 2)   # 'badentry' silently skipped


# ---------------------------------------------------------------------------
# PodcastSearchService — cache.get_or_set behaviour
# ---------------------------------------------------------------------------

class TestPodcastSearchService(SimpleTestCase):
    """
    cache.get_or_set calls the default callable on a miss and returns the
    cached value on a hit — we test both paths by controlling the mock's
    side_effect.
    """

    def _make_pod(self):
        from podcasts.providers.base import NormalizedPodcast
        return NormalizedPodcast(
            provider="itunes", remote_id="1", title="T", author="A",
            description="D", cover_url="url", rss_feed="rss", genre="G",
            total_episodes=1,
        )

    @patch("podcasts.services.get_provider")
    @patch("podcasts.services.cache")
    def test_cache_miss_calls_provider_and_stores(self, mock_cache, mock_get_provider):
        """On a miss, get_or_set calls the lambda which calls the provider."""
        mock_pod = self._make_pod()
        mock_provider = MagicMock()
        mock_provider.search.return_value = [mock_pod]
        mock_get_provider.return_value = mock_provider

        # Simulate cache.get_or_set calling the default callable (cache miss)
        def call_default(key, default, timeout=None):
            return default()

        mock_cache.get_or_set.side_effect = call_default

        from podcasts.services import PodcastSearchService
        results = PodcastSearchService().search("tech", provider="itunes")

        mock_provider.search.assert_called_once_with("tech", limit=20)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "T")

    @patch("podcasts.services.get_provider")
    @patch("podcasts.services.cache")
    def test_cache_hit_skips_provider(self, mock_cache, mock_get_provider):
        """On a hit, get_or_set returns the cached value without calling the lambda."""
        cached_data = [{"title": "Cached Result"}]
        mock_cache.get_or_set.return_value = cached_data  # hit — lambda never called

        from podcasts.services import PodcastSearchService
        results = PodcastSearchService().search("tech", provider="itunes")

        mock_get_provider.assert_not_called()
        self.assertEqual(results[0]["title"], "Cached Result")


# ---------------------------------------------------------------------------
# PodcastDetailService — Stale-While-Revalidate (SWR)
# ---------------------------------------------------------------------------

class TestSWRDetailService(SimpleTestCase):
    """
    Tests the three SWR cache states for PodcastDetailService.get_detail:
      FRESH HIT  → main + fresh keys present   → return immediately, no task
      STALE HIT  → main present, fresh absent  → return immediately + dispatch task
      COLD MISS  → main absent                 → fetch synchronously, prime keys
    """

    def _main_payload(self):
        return {
            "provider": "itunes", "title": "The Daily", "remote_id": "1",
            "author": "NYT", "description": "...", "cover_url": "url",
            "rss_feed": "rss", "genre": "News", "total_episodes": 100,
        }

    @patch("podcasts.services.cache")
    def test_fresh_hit_returns_cached_and_no_task_dispatched(self, mock_cache):
        """Both keys present → fresh data; no background task fired."""
        payload = self._main_payload()
        # cache.get("pod:the-daily") → payload, cache.get("pod:the-daily:fresh") → True
        mock_cache.get.side_effect = lambda key: (
            payload if key == "pod:the-daily" else True
        )

        from podcasts.services import PodcastDetailService
        with patch.object(PodcastDetailService, "_dispatch_refresh") as mock_dispatch:
            result = PodcastDetailService().get_detail("the-daily")

        self.assertEqual(result["title"], "The Daily")
        mock_dispatch.assert_not_called()

    @patch("podcasts.services.cache")
    def test_stale_hit_serves_cached_and_dispatches_task(self, mock_cache):
        """Main key present, fresh sentinel absent → serve stale + fire refresh task."""
        payload = self._main_payload()
        mock_cache.get.side_effect = lambda key: (
            payload if key == "pod:the-daily" else None   # fresh key → None (expired)
        )

        from podcasts.services import PodcastDetailService
        with patch.object(PodcastDetailService, "_dispatch_refresh") as mock_dispatch:
            result = PodcastDetailService().get_detail("the-daily")

        self.assertEqual(result["title"], "The Daily")
        mock_dispatch.assert_called_once()   # background refresh must be dispatched

    @patch("podcasts.services.cache")
    @patch("podcasts.services.ITunesProvider")
    @patch("podcasts.services._hydrate_with_podchaser", side_effect=lambda base, q: base)
    def test_cold_miss_fetches_synchronously(self, _mock_hydrate, mock_itunes_cls, mock_cache):
        """No cached data → synchronous fetch, both keys primed."""
        from podcasts.providers.base import NormalizedPodcast
        from dataclasses import asdict

        mock_cache.get.return_value = None   # both keys absent

        mock_pod = NormalizedPodcast(
            provider="itunes", remote_id="99", title="The Daily",
            author="NYT", description="...", cover_url="img",
            rss_feed="rss", genre="News", total_episodes=50,
        )
        mock_itunes = MagicMock()
        mock_itunes.search.return_value = [mock_pod]
        mock_itunes_cls.return_value = mock_itunes

        from podcasts.services import PodcastDetailService
        result = PodcastDetailService().get_detail("the-daily")

        self.assertEqual(result["title"], "The Daily")
        # Both main key and fresh sentinel must be written
        set_calls = [call.args[0] for call in mock_cache.set.call_args_list]
        self.assertIn("pod:the-daily",        set_calls)
        self.assertIn("pod:the-daily:fresh",  set_calls)

    @patch("podcasts.services.cache")
    def test_stale_credits_dispatches_credits_refresh_task(self, mock_cache):
        """Credits: stale hit dispatches credits refresh task, not detail task."""
        payload = {"slug": "the-daily", "provider": "podchaser", "credits": []}
        mock_cache.get.side_effect = lambda key: (
            payload if key == "credits:the-daily" else None
        )

        from podcasts.services import PodcastDetailService
        with patch.object(PodcastDetailService, "_dispatch_credits_refresh") as mock_dispatch:
            result = PodcastDetailService().get_credits("the-daily")

        self.assertEqual(result["slug"], "the-daily")
        mock_dispatch.assert_called_once()


# ---------------------------------------------------------------------------
# RateLimiter
# ---------------------------------------------------------------------------

class TestRateLimiter(SimpleTestCase):

    def test_allows_calls_within_budget(self):
        from podcasts.rate_limiter import RateLimiter
        limiter = RateLimiter(max_calls=5, period=60.0)
        for _ in range(5):
            limiter.acquire()

    def test_limiter_decrements_tokens(self):
        from podcasts.rate_limiter import RateLimiter
        limiter = RateLimiter(max_calls=3, period=60.0)
        for _ in range(3):
            limiter.acquire()
        self.assertAlmostEqual(limiter._tokens, 0.0, delta=0.1)
