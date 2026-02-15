from django.core.management.base import BaseCommand
from ingest.services.taddy import TaddyClient
import os
from dotenv import load_dotenv

class Command(BaseCommand):
    help = 'Tests the Taddy Podcast API Integration'

    def add_arguments(self, parser):
        parser.add_argument('term', type=str, help='Search term (e.g., "Podcasting 2.0")')

    def handle(self, *args, **options):
        # Manually load .env for testing if not loaded by manage.py
        load_dotenv()
        
        term = options['term']
        self.stdout.write(f"Searching Taddy for: {term}...")
        
        client = TaddyClient()
        if not client.api_key or not client.api_host:
             self.stdout.write(self.style.ERROR("Error: TADDY_API_KEY or TADDY_API_HOST not found in environment."))
             return

        results = client.search_podcasts(term)
        
        if results:
            self.stdout.write(self.style.SUCCESS(f"Found {len(results)} podcasts:"))
            for podcast in results:
                self.stdout.write(f"- {podcast.get('name')} (UUID: {podcast.get('uuid')})")
        else:
            self.stdout.write(self.style.WARNING("No results found or error occurred."))
