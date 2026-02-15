from django.db import models
from django.conf import settings

class ListeningSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listening_sessions')
    episode = models.ForeignKey('content.Episode', on_delete=models.CASCADE, related_name='listening_sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_listened = models.IntegerField(default=0, help_text="Duration in seconds")
    completed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user} listened to {self.episode}"
