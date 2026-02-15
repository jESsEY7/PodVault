from django.db import models
from django.conf import settings

class UserPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='preference')
    interest_vector = models.JSONField(default=list, help_text="AI-generated interest vector")
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.username}"

    def update_interest_vector(self, category, weight=0.1):
        """
        Updates the interest vector for a given category.
        Simple implementation: Adds weight to existing score or initializes it.
        """
        params = {item['category']: item['score'] for item in self.interest_vector}
        if category in params:
            params[category] += weight
        else:
            params[category] = weight
        
        # Convert back to list format
        self.interest_vector = [{'category': k, 'score': v} for k, v in params.items()]
        self.save()

class UserActivity(models.Model):
    ACTIVITY_TYPES = [
        ('like', 'Like'),
        ('play', 'Play'),
        ('follow', 'Follow'),
        ('comment', 'Comment'),
        ('share', 'Share'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    # Flexible relation to content (could be generic, but for now just Episode is fine for this task)
    # To avoid circular imports if possible, use string reference or keep it simple.
    # We'll use a GenericForeignKey or just simple fields if we only care about Episodes for now.
    # Given the import issues before, let's just store episode_id reference or similar if easier.
    # But for "Interest Vector" logic we ideally want the object.
    # Let's try importing Episode inside the method or file if not already. 
    # content.models imports users.models usually (User), so we have a cycle risk.
    # Using 'content.Episode' string is safer.
    episode = models.ForeignKey('content.Episode', on_delete=models.SET_NULL, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} {self.activity_type} {self.episode or 'content'}"

class SpotifyAuth(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='spotify_auth')
    access_token = models.CharField(max_length=500)
    refresh_token = models.CharField(max_length=500)
    expires_at = models.FloatField() # Unix timestamp
    scope = models.CharField(max_length=500, blank=True)
    last_refreshed = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Spotify Auth for {self.user.username}"


