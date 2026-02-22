"""
podcasts.urls
~~~~~~~~~~~~~
URL patterns for the versioned /api/v1/podcasts/ endpoint group.

Mount in the root urlconf with::

    path('api/v1/podcasts/', include('podcasts.urls')),
"""

from django.urls import path

from .views import PodcastCreditsView, PodcastDetailView, PodcastSearchView

app_name = "podcasts"

urlpatterns = [
    # GET /api/v1/podcasts/search/?q=...&provider=itunes&limit=20
    path("search/", PodcastSearchView.as_view(), name="podcast-search"),

    # GET /api/v1/podcasts/<slug>/
    path("<str:slug>/", PodcastDetailView.as_view(), name="podcast-detail"),

    # GET /api/v1/podcasts/<slug>/credits/
    path("<str:slug>/credits/", PodcastCreditsView.as_view(), name="podcast-credits"),
]
