import requests
from django.core.files.base import ContentFile
from content.models import Episode
from ingest.services.podcast_index import PodcastIndexClient
import os

class AssetAcquisitionService:
    def acquire_enclosure(self, episode_id):
        try:
            episode = Episode.objects.get(id=episode_id)
        except Episode.DoesNotExist:
            print(f"[AssetAcquisition] Episode {episode_id} not found.")
            return False

        print(f"[AssetAcquisition] Processing: {episode.title}")
        
        # 0. Check if already has file
        if episode.audio_file:
            print("[AssetAcquisition] Audio file already exists.")
            return True

        if not self._check_keys():
            print("[AssetAcquisition] Podcast Index keys missing. Skipping search.")
            return False

        # 1. Lookup open-source enclosure URL
        client = PodcastIndexClient()
        
        # We search by Podcast Title + Episode Title
        enclosure_url = client.find_episode_audio_url(episode.podcast.title, episode.title)
        
        if not enclosure_url:
            print(f"[AssetAcquisition] Enclosure URL not found for '{episode.title}'.")
            return False
            
        print(f"[AssetAcquisition] Found Enclosure: {enclosure_url}")
        
        # 2. Stream download to avoid memory spikes
        try:
            # Fake user agent to avoid blocking
            headers = {'User-Agent': 'Mozilla/5.0 (compatible; PodVault/1.0; +http://localhost)'}
            response = requests.get(enclosure_url, stream=True, timeout=30, headers=headers)
            
            if response.status_code == 200:
                # 3. Save to PodVault Storage
                # Sanitize filename
                safe_title = "".join([c for c in episode.title if c.isalpha() or c.isdigit() or c==' ']).rstrip()
                file_name = f"{episode.remote_id}_{safe_title}.mp3"
                
                print(f"[AssetAcquisition] Downloading to {file_name}...")
                
                episode.audio_file.save(file_name, ContentFile(response.content))
                
                if not episode.audio_url:
                    episode.audio_url = enclosure_url
                
                episode.save()
                print("[AssetAcquisition] Download complete. Vaulted.")
                return True
            else:
                 print(f"[AssetAcquisition] Failed to download. Status: {response.status_code}")
        except Exception as e:
            print(f"[AssetAcquisition] Download Error: {e}")
            
        return False

    def _check_keys(self):
        from django.conf import settings
        return bool(getattr(settings, 'PODCAST_INDEX_KEY', None) and getattr(settings, 'PODCAST_INDEX_SECRET', None))
