from django.db import models
from django.conf import settings
from content.models import Episode

class Club(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='clubs')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ClubRecommendation(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='recommendations')
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    relevance_score = models.FloatField(help_text="AI-generated relevance score")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-relevance_score']

    def __str__(self):
        return f"{self.club.name} - {self.episode.title}"
