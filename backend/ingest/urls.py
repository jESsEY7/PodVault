from django.urls import path
from .views import RSSIngestView, PodcastIndexSearchView, PodcastIndexTrendingView, PodcastSyncView, spotify_login, spotify_callback

urlpatterns = [
    path('ingest/', RSSIngestView.as_view(), name='rss-ingest'),
    path('spotify/login/', spotify_login, name='spotify-login'),
    path('spotify/callback/', spotify_callback, name='spotify-callback'),
    path('search/', PodcastIndexSearchView.as_view(), name='podcast-search'),
    path('trending/', PodcastIndexTrendingView.as_view(), name='podcast-trending'),
    path('sync/', PodcastSyncView.as_view(), name='podcast-sync'),
]
