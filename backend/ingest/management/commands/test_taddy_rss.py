from django.core.management.base import BaseCommand
import requests
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Tests Taddy RSS retrieval'

    def handle(self, *args, **options):
        api_key = os.environ.get('TADDY_API_KEY') or getattr(settings, 'TADDY_API_KEY', None)
        api_host = os.environ.get('TADDY_API_HOST') or getattr(settings, 'TADDY_API_HOST', None)

        if not api_key:
            self.stdout.write(self.style.ERROR("No TADDY_API_KEY found."))
            return

        url = "https://taddy-podcast-api.p.rapidapi.com/graphql"
        headers = {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": api_host
        }

        query = """
        query getPodcastSeries($name: String!) {
            getPodcastSeries(name: $name) {
                uuid
                name
                rssUrl
                itunesId
            }
        }
        """
        
        variables = {"name": "The Daily"}
        payload = {"query": query, "variables": variables}

        self.stdout.write("Querying Taddy for 'The Daily'...")
        try:
            response = requests.post(url, json=payload, headers=headers)
            self.stdout.write(f"Status: {response.status_code}")
            self.stdout.write(str(response.json()))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))
