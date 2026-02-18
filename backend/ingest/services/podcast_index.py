import hashlib
import time
import os
import requests
import json
from django.conf import settings

class PodcastIndexClient:
    def __init__(self):
        self.api_key = settings.PODCAST_INDEX_KEY
        self.api_secret = settings.PODCAST_INDEX_SECRET
        self.base_url = "https://api.podcastindex.org/api/1.0"

        if not self.api_key or not self.api_secret:
            print("Podcast Index API credentials not found in settings.")
            # raise ValueError("Podcast Index API credentials not found in settings.") # Don't raise, just warn so app doesn't crash on init if used elsewhere?
            # Actually, better to just let it be empty and fail on request if needed, or raise.
            # User might not have keys yet.
            pass

    def _get_auth_headers(self):
        """
        Generates the required headers for Podcast Index API authentication.
        Requires API Key, API Secret, and current Unix timestamp.
        SHA-1 Hash = (ApiKey + ApiSecret + UnixTimestamp)
        """
        epoch_time = int(time.time())
        data_to_hash = self.api_key + self.api_secret + str(epoch_time)
        sha_1_signature = hashlib.sha1(data_to_hash.encode()).hexdigest()

        headers = {
            'X-Auth-Date': str(epoch_time),
            'X-Auth-Key': self.api_key,
            'Authorization': sha_1_signature,
            'User-Agent': 'PodVault/1.0'
        }
        return headers



    def search_by_term(self, term):
        """
        Searches for podcasts by term.
        """
        url = f"{self.base_url}/search/byterm"
        params = {'q': term}
        try:
            response = requests.get(url, headers=self._get_auth_headers(), params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error querying Podcast Index: {e}")
            return None

    def search_episodes(self, query):
        """
        Searches for episodes matching the query.
        For now, this searches for Feeds matching the term, as the 'search/byterm' endpoint returns feeds.
        To find specific episodes, we would need to iterate feeds or use a paid/higher tier endpoint if available.
        This provides a 'related podcasts' discovery feature.
        """
        return self.search_by_term(query)



    def get_trending(self):
        """
        Returns trending podcasts.
        """
        url = f"{self.base_url}/podcasts/trending"
        try:
            response = requests.get(url, headers=self._get_auth_headers())
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error querying Podcast Index: {e}")
            return None

    def get_podcast_by_feed_id(self, feed_id):
        """
        Returns podcast metadata by feed ID.
        """
        url = f"{self.base_url}/podcasts/byfeedid"
        params = {'id': feed_id}
        try:
            response = requests.get(url, headers=self._get_auth_headers(), params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error querying Podcast Index: {e}")
            return None

    def get_episodes_by_feed_id(self, feed_id, max_results=1000):
        """
        Returns episodes by feed ID.
        """
        url = f"{self.base_url}/episodes/byfeedid"
        params = {'id': feed_id, 'max': max_results}
        try:
            response = requests.get(url, headers=self._get_auth_headers(), params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error querying Podcast Index: {e}")
            return None

    def find_episode_audio_url(self, show_title, episode_title):
        """
        Attempts to find the open-source audio URL for a given show and episode title.
        1. Search for the Show to get Feed ID.
        2. Fetch Episodes for that Feed.
        3. Match Episode Title.
        """
        if not self.api_key:
             print("[PodcastIndex] No API Key, skipping search.")
             return None

        try:
            # 1. Search for Show
            print(f"[PodcastIndex] Searching for show: {show_title}")
            search_results = self.search_by_term(show_title)
            if not search_results or not search_results.get('feeds'):
                print("[PodcastIndex] Show not found.")
                # Try finding by looking for exact match in 'feeds' list if multiple returned?
                return None
            
            # Simple heuristic: Take the first result. 
            feed = search_results['feeds'][0]
            feed_id = feed['id']
            print(f"[PodcastIndex] Found feed: {feed['title']} (ID: {feed_id})")

            # 2. Get Episodes
            episodes_data = self.get_episodes_by_feed_id(feed_id)
            if not episodes_data or not episodes_data.get('items'):
                print("[PodcastIndex] No episodes found for feed.")
                return None
            
            # 3. Match Episode
            target_title = episode_title.lower().strip()
            
            # Exact match scan
            for ep in episodes_data['items']:
                ep_title = ep['title'].lower().strip()
                if target_title == ep_title:
                    print(f"[PodcastIndex] Found exact match: {ep['title']}")
                    return ep.get('enclosureUrl')
            
            # Fuzzy match scan
            for ep in episodes_data['items']:
                ep_title = ep['title'].lower().strip()
                if target_title in ep_title or ep_title in target_title:
                     print(f"[PodcastIndex] Found fuzzy match: {ep['title']}")
                     return ep.get('enclosureUrl')

            print("[PodcastIndex] Episode not found in feed.")
            return None

        except Exception as e:
            print(f"[PodcastIndex] Error in find_episode_audio_url: {e}")
            return None
