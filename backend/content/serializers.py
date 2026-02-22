from rest_framework import serializers
from .models import Podcast, Episode, Category, Person, Like, Follow, Playlist, Tip, Merchandise, CreatorSubscription

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

class LikeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    episode_title = serializers.CharField(source='episode.title', read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'username', 'episode', 'episode_title', 'created_at']
        read_only_fields = ['user', 'created_at']

class FollowSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    podcast_title = serializers.CharField(source='podcast.title', read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'user', 'username', 'podcast', 'podcast_title', 'created_at']
        read_only_fields = ['user', 'created_at']

class PlaylistSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    episode_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = ['id', 'user', 'username', 'name', 'description', 'episodes', 'is_public', 'episode_count', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_episode_count(self, obj):
        return obj.episodes.count()

class TipSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    episode_title = serializers.CharField(source='episode.title', read_only=True)
    
    class Meta:
        model = Tip
        fields = ['id', 'sender', 'sender_username', 'recipient', 'recipient_username', 'amount', 'currency', 'message', 'episode', 'episode_title', 'created_at']
        read_only_fields = ['sender', 'created_at']

class MerchandiseSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    
    class Meta:
        model = Merchandise
        fields = ['id', 'creator', 'creator_username', 'name', 'description', 'price', 'currency', 'image_url', 'external_url', 'created_at', 'updated_at']
        read_only_fields = ['creator', 'created_at', 'updated_at']

class CreatorSubscriptionSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    subscriber_username = serializers.CharField(source='subscriber.username', read_only=True)
    
    class Meta:
        model = CreatorSubscription
        fields = ['id', 'creator', 'creator_username', 'subscriber', 'subscriber_username', 'tier', 'amount', 'currency', 'active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
