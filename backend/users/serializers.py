from rest_framework import serializers
from .models import UserActivity
from django.contrib.auth import get_user_model

User = get_user_model()

class UserActivitySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    text = serializers.CharField(write_only=True, required=False) # Frontend sends 'text'
    
    class Meta:
        model = UserActivity
        fields = ['id', 'user', 'username', 'activity_type', 'episode', 'metadata', 'created_at', 'text']
        read_only_fields = ['user', 'activity_type', 'created_at', 'metadata']

    def create(self, validated_data):
        text = validated_data.pop('text', '')
        metadata = validated_data.get('metadata', {})
        if text:
            metadata['text'] = text
        
        validated_data['metadata'] = metadata
        validated_data['user'] = self.context['request'].user
        validated_data['activity_type'] = 'comment' # Force activity type
        
        return super().create(validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Flatten metadata content if useful, but frontend handles metadata.text fine I think?
        # Actually, let's expose text directly in read too if poss
        if instance.metadata:
            ret['text'] = instance.metadata.get('text', '')
        return ret
        return ret


