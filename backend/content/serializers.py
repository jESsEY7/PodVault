from rest_framework import serializers
from .models import Podcast, Episode, Category, Person

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']

from django.contrib.auth import get_user_model

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'email'] # Enhance with profile fields later

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'name', 'image_url', 'role']

class EpisodeSerializer(serializers.ModelSerializer):
    cast = PersonSerializer(many=True, read_only=True)

    class Meta:
        model = Episode
        fields = [
            'id', 'title', 'description', 'audio_url', 'duration', 
            'episode_number', 'published_at', 'is_downloadable',
            'remote_id', 'guid', 'transcript_url', 'chapters_url', 'transcript_content', 'summary', 'value',
            'cast'
        ]

class PodcastSerializer(serializers.ModelSerializer):
    creator_name = serializers.ReadOnlyField(source='creator.username')
    category = serializers.StringRelatedField() # Or nested serializer if needed
    episodes = EpisodeSerializer(many=True, read_only=True)

    class Meta:
        model = Podcast
        fields = ['id', 'title', 'creator_name', 'description', 'cover_image', 'category', 'tier', 'subscriber_count', 'episodes', 'tags'] 
        # Note: tags field is not in model yet, user requested it. I'll add a dummy field or implement Taggit later. 
        # For now, I'll exclude tags or make it a method field.

    tags = serializers.SerializerMethodField()

    def get_tags(self, obj):
        return ["Trending", "New"] # Dummy implementation for now
