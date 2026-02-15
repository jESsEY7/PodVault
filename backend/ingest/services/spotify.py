import requests
import base64
import time
from django.conf import settings

class SpotifyService:
    """
    Service to interact with Spotify Web API.
    """
    TOKEN_URL = 'https://accounts.spotify.com/api/token'
    API_BASE_URL = 'https://api.spotify.com/v1'

    def __init__(self, user=None):
        self.client_id = getattr(settings, 'SPOTIFY_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'SPOTIFY_CLIENT_SECRET', '')
        self.user = user
        self._access_token = None
        self._token_expires_at = 0
        print(f"[SpotifyService] Initialized with Client ID: {self.client_id} for User: {self.user}")

    def _get_token(self):
        """
        Retrieves a valid access token. 
        If self.user is set, tries to get User Access Token.
        Otherwise, falls back to Client Credentials.
        """
        if self._access_token and time.time() < self._token_expires_at:
            return self._access_token
            
        # 1. Try User Token if user is present
        if self.user:
            from users.models import SpotifyAuth
            try:
                auth = SpotifyAuth.objects.get(user=self.user)
                # Check expiry (naive check, real app should refresh if close)
                if auth.expires_at > time.time() + 60:
                     self._access_token = auth.access_token
                     self._token_expires_at = auth.expires_at
                     return self._access_token
                else:
                    # Refresh Token Flow
                    print(f"[SpotifyService] Refreshing token for user {self.user.username}")
                    return self._refresh_user_token(auth)
            except SpotifyAuth.DoesNotExist:
                print(f"[SpotifyService] No SpotifyAuth found for {self.user.username}, falling back to Client Credentials.")
                pass

        # 2. Client Credentials Flow (Fallback)
        if not self.client_id or not self.client_secret or 'your_' in self.client_id:
             print("[SpotifyService] Token requested but credentials invalid. Returning mock token.")
             return "mock-token"

        if not self.client_id or not self.client_secret:
            raise ValueError("Spotify Client ID and Secret must be configured in settings.")

        auth_str = f"{self.client_id}:{self.client_secret}"
        auth_b64 = base64.b64encode(auth_str.encode()).decode()

        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        data = {'grant_type': 'client_credentials'}

        response = requests.post(self.TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self._access_token = token_data['access_token']
        self._token_expires_at = time.time() + token_data['expires_in'] - 60
        
        return self._access_token

    def _refresh_user_token(self, auth_instance):
        auth_str = f"{self.client_id}:{self.client_secret}"
        auth_b64 = base64.b64encode(auth_str.encode()).decode()
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': auth_instance.refresh_token
        }
        
        try:
            response = requests.post(self.TOKEN_URL, headers=headers, data=data)
            response.raise_for_status()
            token_data = response.json()
            
            auth_instance.access_token = token_data['access_token']
            auth_instance.expires_at = time.time() + token_data['expires_in']
            if 'refresh_token' in token_data:
                auth_instance.refresh_token = token_data['refresh_token']
            auth_instance.save()
            
            self._access_token = token_data['access_token']
            self._token_expires_at = auth_instance.expires_at
            return self._access_token
        except Exception as e:
            print(f"[SpotifyService] Failed to refresh user token: {e}")
            # Fallback to client credentials? Or raise?
            return None

    def _request(self, endpoint, method='GET', params=None):
        """
        Internal method to make authenticated requests.
        """
        # Fallback for missing credentials
        if not self.client_id or not self.client_secret or 'your_' in self.client_id:
            print(f"[SpotifyService] Missing credentials, mocking response for: {endpoint}")
            import datetime
            if endpoint.startswith('shows/') and not endpoint.endswith('/episodes'):
                return {
                    'id': endpoint.split('/')[-1],
                    'name': 'The Daily Mock Show',
                    'description': 'This is a mocked show because Spotify credentials are not set.',
                    'images': [{'url': 'https://placehold.co/600x600'}],
                    'publisher': 'Mock Publisher'
                }
            if endpoint.endswith('/episodes'):
                return {
                    'items': [
                        {
                            'id': f'mock-ep-{i}',
                            'name': f'Mock Episode {i}: The Future of AI',
                            'description': 'A fascinating discussion about artificial intelligence.',
                            'duration_ms': 1200000 + (i * 60000),
                            'release_date': (datetime.date.today() - datetime.timedelta(days=i)).isoformat(),
                            'explicit': False,
                            'audio_preview_url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                            'images': [{'url': 'https://placehold.co/600x600'}]
                        } for i in range(5)
                    ],
                    'next': None
                }
            return {}

        token = self._get_token()
        headers = {'Authorization': f'Bearer {token}'}
        url = f"{self.API_BASE_URL}/{endpoint}"

        response = requests.request(method, url, headers=headers, params=params)
        
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 5))
            print(f"Rate limited. Retrying after {retry_after} seconds.")
            time.sleep(retry_after)
            return self._request(endpoint, method, params)
            
        response.raise_for_status()
        return response.json()

    def get_track(self, track_id, market=None):
        """
        Get Spotify catalog information for a single track.
        """
        params = {}
        if market:
            params['market'] = market
        return self._request(f'tracks/{track_id}', params=params)

    def get_episode(self, episode_id, market='KE'):
        """
        Get Spotify catalog information for a single episode.
        """
        params = {}
        if market:
            params['market'] = market
        return self._request(f'episodes/{episode_id}', params=params)

    def search(self, query, type='episode,track', limit=10, market=None):
        """
        Search for an item.
        """
        params = {
            'q': query,
            'type': type,
            'limit': limit
        }
        if market:
            params['market'] = market
    def get_show(self, show_id, market=None):
        """
        Get Spotify catalog information for a single show.
        """
        params = {}
        if market:
            params['market'] = market
        return self._request(f'shows/{show_id}', params=params)

    def get_show_episodes(self, show_id, limit=50, offset=0, market='KE'):
        """
        Get Spotify catalog information for a show's episodes.
        """
        params = {'limit': limit, 'offset': offset}
        if market:
            params['market'] = market
        return self._request(f'shows/{show_id}/episodes', params=params)

    def mirror_show(self, show_id):
        """
        Mirrors a Spotify show and its episodes to the local database.
        """
        from content.models import Podcast, Category
        from ingest.tasks import transcribe_episode_task
        
        print(f"Mirroring Show ID: {show_id}")
        show_data = self.get_show(show_id)
        
        # Determine Category (Simple mapping or create new)
        # Spotify returns generic 'episodes' or 'show', doesn't give specific genre always in simple object?
        # Actually show object has 'episodes', 'description', 'name', 'images', 'publisher'.
        # Assuming 'publisher' or manual category handling. For now, default to 'Uncategorized' if not found.
        # We can map generic category later.
        
        # Create/Update Podcast
        podcast, created = Podcast.objects.update_or_create(
            remote_id=show_id,
            defaults={
                'title': show_data.get('name'),
                'description': show_data.get('description'),
                'cover_image': show_data['images'][0]['url'] if show_data.get('images') else '',
                # Store extra metadata in value JSON
                'value': {
                    'publisher': show_data.get('publisher'),
                    'spotify_url': show_data.get('external_urls', {}).get('spotify'),
                    'total_episodes': show_data.get('total_episodes')
                }
            }
        )
        print(f"Podcast {'created' if created else 'updated'}: {podcast.title}")

        # Fetch Episodes
        offset = 0
        limit = 50
        while True:
            response = self.get_show_episodes(show_id, limit=limit, offset=offset)
            items = response.get('items', [])
            
            if not items:
                break
                
            for item in items:
                self.process_episode(item, podcast)
            
            if not response.get('next'):
                break
                
            offset += limit
            
    def process_episode(self, episode_data, podcast):
        from content.models import Episode
        from ingest.tasks import transcribe_episode_task, download_episode_audio_task
        from django.utils.dateparse import parse_datetime
        
        print(f"Processing Episode: {episode_data.get('name')}")
        
        # Audio URL logic: Spotify Web API doesn't give download URL usually.
        # But sometimes 'audio_preview_url' or explicit access.
        # Assuming we store the Spotify URI/URL for referencing or 'audio_url' if available.
        # Spotify episodes object has 'audio_preview_url'.
        
        defaults = {
            'title': episode_data.get('name'),
            'description': episode_data.get('description'),
            'duration': int(episode_data.get('duration_ms', 0) / 1000),
            'audio_url': episode_data.get('audio_preview_url') or '', # Fallback, might be null
            'published_at': parse_datetime(episode_data.get('release_date')) if episode_data.get('release_date') else None,
            'is_explicit': episode_data.get('explicit', False),
            'value': episode_data, # Store raw data just in case
        }
        
        episode, created = Episode.objects.update_or_create(
            remote_id=episode_data.get('id'),
            podcast=podcast,
            defaults=defaults
        )
        
        # 6. Populate Cast
        self.mirror_cast_data(episode_data, episode)
        
        episode.save()

        if created:
            print(f"  -> Created new episode: {episode.title}")
            # Trigger Async Acquisition (Download -> Transcribe)
            try:
                download_episode_audio_task.delay(episode.id)
            except Exception as e:
                print(f"  -> [Warning] Failed to schedule acquisition task: {e}")
        else:
            print(f"  -> Updated episode: {episode.title}")

    def mirror_cast_data(self, spotify_data, episode_instance):
        """
        Extracts artist/cast data from Spotify and links to PodVault Episode.
        """
        from content.models import Person
        
        # Spotify 'tracks' have 'artists'; 'shows' have 'publisher'
        # Episodes might not have 'artists' directly, but let's check.
        artists = spotify_data.get('artists', [])
        
        # If no artists found on the episode, try to use the podcast's publisher/author
        if not artists and episode_instance.podcast and episode_instance.podcast.value.get('publisher'):
             publisher_name = episode_instance.podcast.value.get('publisher')
             
             # Create a Person for the publisher (Host)
             person, created = Person.objects.get_or_create(
                 name=publisher_name,
                 defaults={
                     'role': 'Host',
                     # 'image_url': ... (Hard to get publisher image from simple string)
                 }
             )
             episode_instance.cast.add(person)
             return

        for artist in artists:
            # Resolve the person (Entity Resolution)
            person, created = Person.objects.get_or_create(
                remote_id=artist.get('id'),
                defaults={
                    'name': artist.get('name'),
                    'image_url': artist.get('images', [{}])[0].get('url'), # If available
                    'role': 'Host/Artist'
                }
            )
            # Link to the mirrored episode
            episode_instance.cast.add(person)
