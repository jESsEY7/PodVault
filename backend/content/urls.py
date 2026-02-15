from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PodcastViewSet, FeedView, SearchView, EpisodeViewSet, CreatorViewSet
from users.views import CommentViewSet
from sync.views import ListeningSessionViewSet

router = DefaultRouter()
router.register(r'podcasts', PodcastViewSet)
router.register(r'episodes', EpisodeViewSet)
router.register(r'creators', CreatorViewSet)
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r'listening-sessions', ListeningSessionViewSet)

urlpatterns = [
    path('feed', FeedView.as_view(), name='feed'),
    path('search', SearchView.as_view(), name='search'),
    path('', include(router.urls)),
]
