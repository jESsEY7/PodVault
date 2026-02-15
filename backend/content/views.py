from rest_framework import viewsets, generics, filters, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Podcast, Episode, Category
from .serializers import PodcastSerializer, EpisodeSerializer, CategorySerializer

class PodcastViewSet(viewsets.ModelViewSet):
    queryset = Podcast.objects.all()
    serializer_class = PodcastSerializer

    @action(detail=True, methods=['get'], url_path='stream-token')
    def stream_token(self, request, pk=None):
        from django.core.signing import TimestampSigner
        signer = TimestampSigner()
        # Create a token valid for 2 hours (7200 seconds)
        token = signer.sign(pk) # Sign the podcast/episode ID
        # In a real scenario, you'd check this token in the stream view
        return Response({
            'token': token,
            'expires_in': 7200,
            'stream_url': f'/api/v1/content/stream/{pk}?token={token}' 
        })

class FeedView(generics.ListAPIView):
    serializer_class = PodcastSerializer

    def get_queryset(self):
        # Implementation for feed logic (recommendations etc)
        # For now just return all
        return Podcast.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'categories': CategorySerializer(Category.objects.all(), many=True).data,
            'trending': serializer.data, # Simplified
            'recommended': serializer.data # Simplified
        })

class SearchView(generics.ListAPIView):
    serializer_class = PodcastSerializer

    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        return Podcast.objects.filter(Q(title__icontains=query) | Q(description__icontains=query))

class EpisodeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Episode.objects.all()
    serializer_class = EpisodeSerializer
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['published_at', 'title', 'duration']
    ordering = ['-published_at']
    search_fields = ['title', 'description']

    def get_queryset(self):
        queryset = super().get_queryset()
        podcast_id = self.request.query_params.get('podcast_id')
        if podcast_id:
            queryset = queryset.filter(podcast_id=podcast_id)
        return queryset

    @action(detail=True, methods=['post'], url_path='record-play', permission_classes=[permissions.AllowAny])
    def record_play(self, request, pk=None):
        episode = self.get_object()
        episode.plays += 1
        episode.save()

        # Monetization Logic (Simple Mock: 0.50 KES per play)
        # Only credit if the podcast has a creator
        if episode.podcast and episode.podcast.creator:
             from payouts.models import Wallet, PayoutTransaction
             wallet, _ = Wallet.objects.get_or_create(user=episode.podcast.creator)
             
             # Credit Wallet
             earnings = 0.50
             wallet.balance = float(wallet.balance) + earnings
             wallet.save()
             
             # Log Transaction (Optional: concise log or aggregate later)
             # For now, we won't log every micro-transaction to DB to save space, 
             # or we can just log it. Let's log it for demo visibility.
             PayoutTransaction.objects.create(
                 user=episode.podcast.creator,
                 amount=earnings,
                 transaction_type='DEPOSIT',
                 status='COMPLETED',
                 description=f"Play Revenue: {episode.title}"
             )

        return Response({'status': 'played', 'plays': episode.plays})

    @action(detail=True, methods=['post'], url_path='generate-summary', permission_classes=[permissions.AllowAny])
    def generate_summary(self, request, pk=None):
        episode = self.get_object()
        
        # Return existing if available and not forced
        if episode.summary and not request.data.get('force', False):
            return Response({'summary': episode.summary})
            
        from .services import AIService
        summary = AIService.generate_summary(episode)
        
        if summary:
            episode.summary = summary
            episode.save()
            return Response({'summary': summary})
        
        return Response({'error': 'Failed to generate summary'}, status=500)

from django.contrib.auth import get_user_model
from .serializers import UserSerializer # Need to ensure this exists or use a simple one

class CreatorViewSet(viewsets.ReadOnlyModelViewSet):
    # Returns users who are creators (have podcasts)
    queryset = get_user_model().objects.filter(podcasts__isnull=False).distinct()
    serializer_class = UserSerializer
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['username']
