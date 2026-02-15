from django.db import models
from django.conf import settings
from content.models import Episode

class UserProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='progress')
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    timestamp_seconds = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'episode')

class OfflineEvent(models.Model):
    EVENT_TYPES = [
        ('played', 'Played'),
        ('downloaded', 'Downloaded'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='offline_events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    episode_id = models.CharField(max_length=255) # Storing ID string as offline logic might send ID
    timestamp = models.DateTimeField()
    duration = models.IntegerField(default=0, help_text="Duration listened in seconds")
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.event_type} - {self.timestamp}"

class ListeningSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listening_sessions')
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    duration_seconds = models.IntegerField(help_text="Total verified seconds listened in this session")
    verified_at = models.DateTimeField(auto_now_add=True)
    processed_for_earnings = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user} - {self.episode.title} ({self.duration_seconds}s)"
