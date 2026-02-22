from rest_framework import viewsets, generics, filters, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.http import StreamingHttpResponse, HttpResponse, FileResponse
from .models import Podcast, Episode, Category, Like, Follow, Playlist, Tip, Merchandise, CreatorSubscription
from .serializers import PodcastSerializer, EpisodeSerializer, CategorySerializer, LikeSerializer, FollowSerializer, PlaylistSerializer, TipSerializer, MerchandiseSerializer, CreatorSubscriptionSerializer
import requests

class PodcastViewSet(viewsets.ModelViewSet):
    queryset = Podcast.objects.all()
    serializer_class = PodcastSerializer
    filter_backends = [filters.OrderingFilter, filters.SearchFilter] 
    # Add DjangoFilterBackend if installed, or manual filtering in get_queryset.
    # Given the environment, I'll use manual filtering in get_queryset for simplicity and reliability without extra deps.
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            # Try matching by slug first (e.g. "news", "technology"),
            # then fall back to partial name match (e.g. "News & Archives").
            slug_match = queryset.filter(category__slug__iexact=category)
            if slug_match.exists():
                queryset = slug_match
            else:
                queryset = queryset.filter(category__name__icontains=category)

        
        search = self.request.query_params.get('search')
        if search:
             print(f"DEBUG: Searching Podcast by: '{search}'")
             queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
             
        return queryset



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

    @action(detail=True, methods=['get'], url_path='audio', permission_classes=[permissions.AllowAny])
    def audio_stream(self, request, pk=None):
        """
        Proxies the audio file to avoid CORS issues on the frontend.
        Supports Range requests for seeking.
        """
        episode = self.get_object()
        
        # 1. Serve local file if available
        if episode.audio_file:
            response = FileResponse(episode.audio_file.open('rb'))
            response['Content-Type'] = 'audio/mpeg' # Adjust based on file type if needed
            response['Access-Control-Allow-Origin'] = '*'
            return response

        # 2. Proxy external URL
        audio_url = episode.audio_url
        if not audio_url:
            # Fallback for demo purposes if no URL exists
            audio_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
        
        
        try:
            # Forward Range header for seeking
            headers = {}
            range_header = request.META.get('HTTP_RANGE')
            if range_header:
                headers['Range'] = range_header

            # Buffer the content to avoid streaming issues with ASGI/Daphne
            # Note: For large files this consumes memory, but improves stability for short clips/proxies
            external_response = requests.get(audio_url, headers=headers, stream=False, timeout=20)
            
            response = HttpResponse(
                external_response.content,
                content_type=external_response.headers.get('Content-Type', 'audio/mpeg'),
                status=external_response.status_code
            )
            
            # Forward relevant headers
            for header in ['Content-Length', 'Accept-Ranges', 'Content-Range']:
                if header in external_response.headers:
                    response[header] = external_response.headers[header]
            
            # Forward relevant headers
            for header in ['Content-Length', 'Accept-Ranges', 'Content-Range']:
                if header in external_response.headers:
                    response[header] = external_response.headers[header]
            
            response['Access-Control-Allow-Origin'] = '*'
            return response

        except Exception as e:
            print(f"Proxy error: {e}")
            return HttpResponse("Error fetching audio", status=502)

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
class LikeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user likes on episodes"""
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by episode if provided
        episode_id = self.request.query_params.get('episode_id')
        if episode_id:
            queryset = queryset.filter(episode_id=episode_id)

        # Filter by user if provided (handling both user_id and created_by from frontend)
        user_id = self.request.query_params.get('user_id')
        if not user_id:
            user_id = self.request.query_params.get('created_by')
            
        if user_id and user_id.strip():
            try:
                queryset = queryset.filter(user_id=user_id)
            except ValueError:
                # Handle cases where created_by might be an empty string or invalid ID
                pass
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class FollowViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user follows on podcasts"""
    queryset = Follow.objects.all()
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by podcast if provided
        podcast_id = self.request.query_params.get('podcast_id')
        if podcast_id:
            queryset = queryset.filter(podcast_id=podcast_id)

        # Filter by user if provided (handling both user_id and created_by from frontend)
        user_id = self.request.query_params.get('user_id')
        if not user_id:
            user_id = self.request.query_params.get('created_by')

        if user_id and user_id.strip():
            try:
                queryset = queryset.filter(user_id=user_id)
            except ValueError:
                pass
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PlaylistViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user playlists"""
    queryset = Playlist.objects.all()
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # If user wants only their own playlists
        if self.request.query_params.get('mine'):
            queryset = queryset.filter(user=self.request.user)
        # Public playlists by default
        elif not self.request.user.is_authenticated:
            queryset = queryset.filter(is_public=True)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TipViewSet(viewsets.ModelViewSet):
    """ViewSet for managing supporter tips"""
    queryset = Tip.objects.all()
    serializer_class = TipSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by recipient (creator)
        recipient_id = self.request.query_params.get('recipient_id')
        if recipient_id:
            queryset = queryset.filter(recipient_id=recipient_id)
        # Filter by sender
        sender_id = self.request.query_params.get('sender_id')
        if sender_id:
            queryset = queryset.filter(sender_id=sender_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class MerchandiseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing creator merchandise"""
    queryset = Merchandise.objects.all()
    serializer_class = MerchandiseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'price']
    ordering = ['-created_at']
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by creator
        creator_id = self.request.query_params.get('creator_id')
        if creator_id:
            queryset = queryset.filter(creator_id=creator_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class CreatorSubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing creator subscriptions"""
    queryset = CreatorSubscription.objects.all()
    serializer_class = CreatorSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by creator
        creator_id = self.request.query_params.get('creator_id')
        if creator_id:
            queryset = queryset.filter(creator_id=creator_id)
        # Filter by subscriber
        subscriber_id = self.request.query_params.get('subscriber_id')
        if subscriber_id:
            queryset = queryset.filter(subscriber_id=subscriber_id)
        return queryset
    
    def perform_create(self, serializer):
        # Default to current user as subscriber
        if 'subscriber' not in self.request.data:
            serializer.save(subscriber=self.request.user)
        else:
            serializer.save()