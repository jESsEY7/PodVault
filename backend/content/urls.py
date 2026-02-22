from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PodcastViewSet, FeedView, SearchView, EpisodeViewSet, CreatorViewSet, 
    LikeViewSet, FollowViewSet, PlaylistViewSet, TipViewSet, 
    MerchandiseViewSet, CreatorSubscriptionViewSet
)
from users.views import CommentViewSet, UserActivityViewSet, UserPreferenceViewSet
from sync.views import ListeningSessionViewSet

router = DefaultRouter()
router.register(r'podcasts', PodcastViewSet)
router.register(r'episodes', EpisodeViewSet)
router.register(r'creators', CreatorViewSet)
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r'user-activities', UserActivityViewSet, basename='user-activities')
router.register(r'user-preferences', UserPreferenceViewSet, basename='user-preferences')
router.register(r'likes', LikeViewSet, basename='likes')
router.register(r'follows', FollowViewSet, basename='follows')
router.register(r'playlists', PlaylistViewSet, basename='playlists')
router.register(r'tips', TipViewSet, basename='tips')
router.register(r'merchandise', MerchandiseViewSet, basename='merchandise')
router.register(r'creator-subscriptions', CreatorSubscriptionViewSet, basename='creator-subscriptions')
router.register(r'listening-sessions', ListeningSessionViewSet)

urlpatterns = [
    path('feed', FeedView.as_view(), name='feed'),
    path('search', SearchView.as_view(), name='search'),
    path('', include(router.urls)),
]
