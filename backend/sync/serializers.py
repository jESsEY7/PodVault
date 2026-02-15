from rest_framework import serializers
from .models import UserProgress, OfflineEvent, ListeningSession

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = ['episode', 'timestamp_seconds', 'updated_at']

class OfflineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfflineEvent
        fields = ['event_type', 'episode_id', 'timestamp', 'duration']

class ListeningSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListeningSession
        fields = ['id', 'user', 'episode', 'duration_seconds', 'verified_at', 'processed_for_earnings']
        read_only_fields = ['user', 'verified_at', 'processed_for_earnings']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
