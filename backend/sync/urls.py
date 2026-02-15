from django.urls import path
from .views import UserProgressView, BatchOfflineEventView

urlpatterns = [
    path('progress/', UserProgressView.as_view(), name='user-progress'),
    path('events/', BatchOfflineEventView.as_view(), name='batch-offline-events'),
]
