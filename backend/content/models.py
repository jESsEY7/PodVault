from django.db import models
from django.conf import settings
import uuid

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)  # simple string for icon name

    def __str__(self):
        return self.name

class Podcast(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='podcasts')
    description = models.TextField(blank=True)
    cover_image = models.URLField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='podcasts')
    tier = models.CharField(max_length=20, choices=[('free', 'Free'), ('premium', 'Premium')], default='free')
    subscriber_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    remote_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    custom_rss_url = models.URLField(blank=True) # Renamed from generic or just kept as is? Added for explicit RSS track
    funding_url = models.URLField(blank=True)
    value = models.JSONField(default=dict, blank=True)
    last_ingested_at = models.DateTimeField(null=True, blank=True)

    @property
    def creator_name(self):
        return self.creator.username

    def __str__(self):
        return self.title

class Person(models.Model):
    name = models.CharField(max_length=255)
    image_url = models.URLField(null=True, blank=True)
    role = models.CharField(max_length=100, default='Host') # e.g., Host, Guest, Editor

    def __str__(self):
        return self.name

class Episode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    podcast = models.ForeignKey(Podcast, on_delete=models.CASCADE, related_name='episodes')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    cast = models.ManyToManyField(Person, related_name='episodes', blank=True)
    audio_file = models.FileField(upload_to='episodes/', blank=True, null=True)
    audio_url = models.URLField(blank=True, help_text="External URL if not uploaded")
    duration = models.IntegerField(help_text="Duration in seconds", default=0)
    episode_number = models.IntegerField(default=0)
    published_at = models.DateTimeField(auto_now_add=True)
    is_downloadable = models.BooleanField(default=True)
    is_explicit = models.BooleanField(default=False)
    remote_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    guid = models.CharField(max_length=500, blank=True)
    transcript_url = models.URLField(blank=True)
    transcript_type = models.CharField(max_length=50, blank=True) # e.g. 'application/json' or 'text/vtt'
    chapters_url = models.URLField(blank=True)
    transcript_content = models.TextField(blank=True, help_text="AI-generated transcript content")
    summary = models.TextField(blank=True, help_text="AI-generated concise summary")
    plays = models.IntegerField(default=0, help_text="Total number of plays")
    value = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.title
