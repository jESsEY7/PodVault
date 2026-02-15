from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import feedparser
from .services.podcast_index import PodcastIndexClient

from django.shortcuts import redirect
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
import requests
import base64
import time
from urllib.parse import urlencode
from users.models import SpotifyAuth

# Spotify Config
SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
# Scopes for "For You" and other user data
SPOTIFY_SCOPES = 'user-read-private user-read-email user-top-read user-library-read user-read-recently-played'

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_login(request):
    """
    Initiates the Spotify OAuth flow for the logged-in user.
    """
    # Force the redirect URI to be what we expect in the plan
    redirect_uri = getattr(settings, 'SPOTIFY_REDIRECT_URI', 'http://localhost:8000/api/ingest/spotify/callback')
    
    params = {
        'client_id': settings.SPOTIFY_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': redirect_uri,
        'scope': SPOTIFY_SCOPES,
        'state': request.user.id, # Pass user ID as state to verify on callback (simple method)
    }
    url = f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"
    return Response({'url': url})

@api_view(['GET'])
@permission_classes([AllowAny]) # Callback comes from Spotify, user might not have session cookie in browser if API is separate? 
# Actually, if frontend handles the redirect, the callback usually goes to frontend or backend.
# If backend handles callback, we need to know who the user is. 
# We passed user.id in 'state'.
def spotify_callback(request):
    """
    Handles the callback from Spotify, exchanges code for token.
    """
    code = request.GET.get('code')
    state = request.GET.get('state') # This is the user ID
    error = request.GET.get('error')
    
    if error:
        return Response({'error': error}, status=400)
    
    if not code or not state:
        return Response({'error': 'Missing code or state'}, status=400)
        
    redirect_uri = getattr(settings, 'SPOTIFY_REDIRECT_URI', 'http://localhost:8000/api/ingest/spotify/callback')
    
    # Exchange code for token
    auth_str = f"{settings.SPOTIFY_CLIENT_ID}:{settings.SPOTIFY_CLIENT_SECRET}"
    auth_b64 = base64.b64encode(auth_str.encode()).decode()
    
    headers = {
        'Authorization': f'Basic {auth_b64}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri
    }
    
    try:
        response = requests.post(SPOTIFY_TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()
        token_data = response.json()
        
        # Save token for user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=state)
        except User.DoesNotExist:
             return Response({'error': 'Invalid user state'}, status=400)

        SpotifyAuth.objects.update_or_create(
            user=user,
            defaults={
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token', ''), # Might not be in response if not new?
                'expires_at': time.time() + token_data['expires_in'],
                'scope': token_data.get('scope', '')
            }
        )
        
        # Redirect back to frontend settings or success page
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/settings?spotify_connected=true")
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

class RSSIngestView(APIView):
    def post(self, request):
        feed_url = request.data.get('feed_url')
        if not feed_url:
            return Response({'error': 'feed_url is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            feed = feedparser.parse(feed_url)
            
            # Basic error checking for feedparser
            if feed.bozo:
                return Response({'error': 'Invalid RSS feed', 'details': str(feed.bozo_exception)}, status=status.HTTP_400_BAD_REQUEST)
                
            podcast_data = {
                'title': feed.feed.get('title', 'Unknown Podcast'),
                'description': feed.feed.get('description', ''),
                'link': feed.feed.get('link', ''),
                'image': feed.feed.get('image', {}).get('href', ''),
            }
            
            episodes = []
            for entry in feed.entries[:20]:  # Limit to 20 for now
                episodes.append({
                    'title': entry.get('title', 'Untitled Episode'),
                    'description': entry.get('description', ''),
                    'audio_url': next((link.href for link in entry.links if link.rel == 'enclosure'), None) if hasattr(entry, 'links') else None,
                    'published': entry.get('published', ''),
                    'duration': entry.get('itunes_duration', ''),
                })
                
            return Response({
                'podcast': podcast_data,
                'episodes': episodes
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PodcastIndexSearchView(APIView):
    def get(self, request):
        term = request.query_params.get('term')
        if not term:
            return Response({'error': 'term parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            client = PodcastIndexClient()
            results = client.search_by_term(term)
            if results:
                return Response(results)
            return Response({'error': 'Failed to fetch results'}, status=status.HTTP_502_BAD_GATEWAY)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PodcastIndexTrendingView(APIView):
    def get(self, request):
        try:
            client = PodcastIndexClient()
            results = client.get_trending()
            if results:
                return Response(results)
            return Response({'error': 'Failed to fetch trending podcasts'}, status=status.HTTP_502_BAD_GATEWAY)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PodcastSyncView(APIView):
    def post(self, request):
        remote_id = request.data.get('remote_id')
        if not remote_id:
            return Response({'error': 'remote_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .services.ingest import PodcastIngestionService
            service = PodcastIngestionService()
            podcast = service.sync_podcast_by_id(remote_id)
            
            if podcast:
                return Response({
                    'id': podcast.id,
                    'title': podcast.title,
                    'remote_id': podcast.remote_id,
                    'status': 'synced'
                })
            else:
                return Response({'error': 'Failed to sync podcast'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
