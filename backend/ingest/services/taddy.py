import requests
import os
from django.conf import settings

class TaddyClient:
    def __init__(self):
        # In a real scenario, use os.environ.get or settings.
        # For now, we'll try to load from environment or fall back to hardcoded for testing if env not loaded yet.
        self.api_key = os.environ.get('TADDY_API_KEY')
        self.api_host = os.environ.get('TADDY_API_HOST')
        self.base_url = "https://taddy-podcast-api.p.rapidapi.com/graphql"

    def _get_headers(self):
        return {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.api_host
        }

    def search_podcasts(self, term):
        """
        Search for podcasts using Taddy's getPodcastSeries.
        """
        query = """
        query getPodcastSeries($name: String!) {
            getPodcastSeries(name: $name) {
                uuid
                name
                itunesId
                description
                imageUrl
                mainLanguage
                genres
                authorName
                datePublished
                totalEpisodesCount
            }
        }
        """
        variables = {"name": term}
        payload = {"query": query, "variables": variables}

        try:
            response = requests.post(self.base_url, json=payload, headers=self._get_headers())
            response.raise_for_status()
            data = response.json()
            if 'data' in data and 'getPodcastSeries' in data['data']:
                return data['data']['getPodcastSeries']
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error querying Taddy API: {e}")
            return None
