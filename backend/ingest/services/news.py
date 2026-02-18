import requests
from django.conf import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class NewsIngestionService:
    """
    Service for fetching and normalizing news content from various APIs
    into a standardized 'VaultEntry' format for the Ingestion Hub.
    """

    def __init__(self):
        self.mediastack_key = getattr(settings, 'MEDIASTACK_API_KEY', None)
        self.npr_key = getattr(settings, 'NPR_API_KEY', None)

    def fetch_all(self):
        """Aggregate news from all sources."""
        results = []

        results.extend(self.fetch_space_news())
        results.extend(self.fetch_mediastack_news())
        results.extend(self.fetch_npr_news())
        # results.extend(self.fetch_loc_history()) # Temporarily disabled due to redirects
        return results


    def fetch_space_news(self, limit=10):
        """Fetches from Spaceflight News API (Public)."""
        try:
            url = "https://api.spaceflightnewsapi.net/v4/articles/"
            response = requests.get(url, params={"limit": limit, "ordering": "-published_at"})
            response.raise_for_status()
            data = response.json()
            
            normalized = []
            for item in data.get('results', []):
                normalized.append({
                    'source': 'Spaceflight News',
                    'title': item.get('title'),
                    'description': item.get('summary'),
                    'url': item.get('url'),
                    'image_url': item.get('image_url'),
                    'published_at': item.get('published_at'),
                    'external_id': str(item.get('id')),
                    'tags': ['space', 'tech']
                })
            return normalized
        except Exception as e:
            logger.error(f"Spaceflight News Fetch Error: {e}")
            return []



    def fetch_mediastack_news(self, limit=10):
        """Fetches from Mediastack (Requires Key)."""
        if not self.mediastack_key:
            logger.warning("Mediastack API Key missing. Skipping.")
            return []
            
        try:
            url = "http://api.mediastack.com/v1/news"
            params = {
                'access_key': self.mediastack_key,
                'languages': 'en',
                'limit': limit
            }
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if 'error' in data:
                logger.error(f"Mediastack API Error: {data['error']}")
                return []



            normalized = []
            for item in data.get('data', []):
                normalized.append({
                    'source': 'Mediastack',
                    'title': item.get('title'),
                    'description': item.get('description'),
                    'url': item.get('url'),
                    'image_url': item.get('image'),
                    'published_at': item.get('published_at'),
                    'external_id': item.get('url'), # No distinct ID, using URL
                    'tags': [item.get('category'), 'global']
                })
            return normalized
        except Exception as e:
            logger.error(f"Mediastack Fetch Error: {e}")
            return []

    def fetch_npr_news(self):
        """Fetches from NPR One (Requires Key)."""
        # Placeholder: NPR implementation varies by specific endpoint (Stories vs Audio)
        # Using a generic structure for now.
        if not self.npr_key:
             return []
        
        # Example logic for NPR Story API
        # url = "https://api.npr.org/query"
        # ...
        return []



    def fetch_loc_history(self):
        """Fetches from Chronicling America (Library of Congress - Public)."""
        try:
            # Using the main atomic search endpoint which is more stable
            url = "https://chroniclingamerica.loc.gov/search/titles/results/"
            params = {
                "format": "json",
                "terms": "podcast", 
                "rows": 5
            }
            response = requests.get(url, params=params)
            # if 404/error, just return empty list gracefully
            if response.status_code != 200:
                logger.warning(f"LOC extraction failed with status {response.status_code}")
                return []
                
            data = response.json()
            normalized = []
            for item in data.get('items', []):
                normalized.append({
                    'source': 'Chronicling America',
                    'title': item.get('title', 'Historical Newspaper'),
                    'description': f"From {item.get('start_year')} - {item.get('end_year')}",
                    'url': f"https://chroniclingamerica.loc.gov{item.get('id')}",
                    'image_url': None,
                    'published_at': None, 
                    'external_id': item.get('id'),
                    'tags': ['history', 'archive']
                })
            return normalized
        except Exception as e:
            logger.error(f"LOC Fetch Error: {e}")
            return []


