from django.core.management.base import BaseCommand
from ingest.services.podcast_index import PodcastIndexClient
import json

class Command(BaseCommand):
    help = 'Tests the Podcast Index integration'

    def add_arguments(self, parser):
        parser.add_argument('--term', type=str, help='Search term for testing', default='news')

    def handle(self, *args, **options):
        term = options['term']
        self.stdout.write(f"Testing Podcast Index integration with search term: {term}...")

        try:
            client = PodcastIndexClient()
            self.stdout.write("Client initialized successfully.")
            
            # Test Search
            self.stdout.write(f"Searching for '{term}'...")
            results = client.search_by_term(term)
            
            if results:
                count = results.get('count', 0)
                self.stdout.write(self.style.SUCCESS(f"Search successful! Found {count} results."))
                # self.stdout.write(json.dumps(results, indent=2)) # Uncomment to see full JSON
            else:
                self.stdout.write(self.style.WARNING("Search returned no results (or None)."))

            # Test Trending
            self.stdout.write("Fetching trending podcasts...")
            trending = client.get_trending()
            
            if trending:
                count = len(trending.get('feeds', []))
                self.stdout.write(self.style.SUCCESS(f"Trending fetch successful! Found {count} feeds."))
            else:
                 self.stdout.write(self.style.WARNING("Trending fetch returned no results."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))
