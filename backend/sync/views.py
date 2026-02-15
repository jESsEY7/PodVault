from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProgress, OfflineEvent
from .serializers import UserProgressSerializer
from django.utils import timezone

class UserProgressView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        episode_id = self.request.query_params.get('episode_id')
        user = self.request.user
        if not episode_id:
            return None # Or handle error appropriately
        
        # This logic might need adjustment based on how we want to retrieve/create
        obj, created = UserProgress.objects.get_or_create(user=user, episode_id=episode_id)
        return obj

class BatchOfflineEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        events = request.data.get('events', [])
        if not isinstance(events, list):
            return Response({'error': 'events must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        created_events = []
        for event_data in events:
            try:
                # Basic validation
                event_type = event_data.get('event_type')
                episode_id = event_data.get('episode_id')
                timestamp_str = event_data.get('timestamp')
                duration = event_data.get('duration', 0)
                payload = event_data.get('payload', {})

                if not all([event_type, episode_id, timestamp_str]):
                    continue # Skip invalid events

                timestamp = timezone.datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))

                event = OfflineEvent.objects.create(
                    user=request.user,
                    event_type=event_type,
                    episode_id=episode_id,
                    timestamp=timestamp,
                    duration=duration,
                    payload=payload
                )
                created_events.append(event.id)
                
                # Logic to update UserProgress and Activity if it's a 'played' event
                if event_type == 'played':
                    from content.models import Episode
                    from users.models import UserActivity
                    
                    # Try to find episode by ID or Remote ID
                    episode = Episode.objects.filter(id=episode_id).first()
                    if not episode:
                        episode = Episode.objects.filter(remote_id=episode_id).first()
                    
                    if episode:
                        # Update Progress
                        UserProgress.objects.update_or_create(
                            user=request.user,
                            episode=episode,
                            defaults={'timestamp_seconds': duration}
                        )
                        
                        # Log Activity
                        UserActivity.objects.create(
                            user=request.user,
                            activity_type='play',
                            episode=episode,
                            metadata={'offline_event_id': event.id, 'duration': duration}
                        )
                        # Here we could trigger signals for Earnings 

            except Exception as e:
                # Log error but continue processing other events
                print(f"Error processing event: {e}")

        return Response({'message': f'Successfully processed {len(created_events)} events'}, status=status.HTTP_201_CREATED)

from .models import ListeningSession
from .serializers import ListeningSessionSerializer
from rest_framework import viewsets, filters

class ListeningSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking verified listening sessions.
    """
    queryset = ListeningSession.objects.all()
    serializer_class = ListeningSessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['verified_at']
    ordering = ['-verified_at']

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
