"""
podcasts.views
~~~~~~~~~~~~~~
DRF proxy views for the versioned /api/v1/podcasts/ endpoint group.

All three endpoints are public (AllowAny) because the API keys live on
the server — the client never interacts with Taddy, Podchaser or iTunes
directly.

Endpoint map
------------
GET /api/v1/podcasts/search/              → PodcastSearchView
GET /api/v1/podcasts/<slug>/              → PodcastDetailView
GET /api/v1/podcasts/<slug>/credits/      → PodcastCreditsView
"""

from __future__ import annotations

import logging

from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from podcasts.exceptions import (
    ProviderError,
    ProviderUnavailable,
    QuotaExhausted,
    RateLimitExceeded,
)
from podcasts.providers.registry import AVAILABLE_PROVIDERS
from podcasts.services import PodcastDetailService, PodcastSearchService

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _error_response(
    exc: ProviderError, status_code: int = 502
) -> Response:
    """Build a consistent error payload from a :class:`ProviderError`."""
    return Response(
        {
            "error": type(exc).__name__,
            "detail": str(exc),
            "provider": exc.provider,
        },
        status=status_code,
    )


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------


class PodcastSearchView(APIView):
    """
    Global podcast search — delegates to the named provider via Redis Cache-Aside.

    Query params
    ------------
    q        : str   — Search term (required).
    provider : str   — One of 'itunes', 'taddy', 'podchaser' (default: 'itunes').
    limit    : int   — Max results to return, 1–50 (default: 20).
    """

    permission_classes = [AllowAny]
    _service = PodcastSearchService()

    def get(self, request: Request) -> Response:
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response(
                {"error": "ValidationError", "detail": "Query parameter 'q' is required."},
                status=400,
            )

        provider = request.query_params.get("provider", "itunes").lower()
        if provider not in AVAILABLE_PROVIDERS:
            return Response(
                {
                    "error": "ValidationError",
                    "detail": f"Unknown provider '{provider}'.",
                    "available": AVAILABLE_PROVIDERS,
                },
                status=400,
            )

        try:
            limit = max(1, min(int(request.query_params.get("limit", 20)), 50))
        except (TypeError, ValueError):
            limit = 20

        logger.info(
            "[PodcastSearchView] q='%s' provider='%s' limit=%d", query, provider, limit
        )

        try:
            results = self._service.search(query, provider=provider, limit=limit)
            return Response({"count": len(results), "provider": provider, "results": results})
        except RateLimitExceeded as exc:
            logger.warning("[PodcastSearchView] Rate limit: %s", exc)
            return _error_response(exc, status_code=429)
        except QuotaExhausted as exc:
            logger.error("[PodcastSearchView] Quota exhausted: %s", exc)
            return _error_response(exc, status_code=503)
        except ProviderUnavailable as exc:
            logger.error("[PodcastSearchView] Provider unavailable: %s", exc)
            return _error_response(exc, status_code=502)
        except (ValueError, ProviderError) as exc:
            logger.error("[PodcastSearchView] Provider error: %s", exc)
            return _error_response(
                exc if isinstance(exc, ProviderError)
                else ProviderError(str(exc)),
                status_code=400,
            )


class PodcastDetailView(APIView):
    """
    Hydrated podcast detail — iTunes base data enriched with Podchaser social fields.

    Path params
    -----------
    slug : str — URL-friendly podcast identifier (e.g. 'the-daily').
    """

    permission_classes = [AllowAny]
    _service = PodcastDetailService()

    def get(self, request: Request, slug: str) -> Response:
        logger.info("[PodcastDetailView] Fetching detail for slug '%s'.", slug)

        try:
            detail = self._service.get_detail(slug)
        except RateLimitExceeded as exc:
            return _error_response(exc, status_code=429)
        except QuotaExhausted as exc:
            return _error_response(exc, status_code=503)
        except ProviderError as exc:
            return _error_response(exc, status_code=502)

        if detail is None:
            return Response(
                {"error": "NotFound", "detail": f"No podcast found for slug '{slug}'."},
                status=404,
            )

        return Response(detail)


class PodcastCreditsView(APIView):
    """
    Guest and host credits sourced exclusively from Podchaser.

    Path params
    -----------
    slug : str — URL-friendly podcast identifier.

    Returns an empty ``credits`` list (not an error) when Podchaser keys
    are exhausted or unconfigured, so the UI degrades gracefully.
    """

    permission_classes = [AllowAny]
    _service = PodcastDetailService()

    def get(self, request: Request, slug: str) -> Response:
        logger.info("[PodcastCreditsView] Fetching credits for slug '%s'.", slug)

        try:
            payload = self._service.get_credits(slug)
        except ProviderError as exc:
            return _error_response(exc, status_code=502)

        return Response(payload)
