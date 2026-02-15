from django.core.management.base import BaseCommand
from ingest.services.spotify import SpotifyService
import json

class Command(BaseCommand):
    help = 'Test Spotify API integration'

    def add_arguments(self, parser):
        parser.add_argument('--type', type=str, default='track', help='Type of item to fetch (track or episode)')
        parser.add_argument('--id', type=str, required=True, help='Spotify ID of the item')
        parser.add_argument('--market', type=str, help='ISO 3166-1 alpha-2 country code')

    def handle(self, *args, **options):
        item_type = options['type']
        item_id = options['id']
        market = options.get('market')

        service = SpotifyService()
        
        try:
            if item_type == 'track':
                data = service.get_track(item_id, market=market)
            elif item_type == 'episode':
                data = service.get_episode(item_id, market=market)
            else:
                self.stderr.write(self.style.ERROR(f"Unsupported type: {item_type}"))
                return

            self.stdout.write(json.dumps(data, indent=2))
            self.stdout.write(self.style.SUCCESS(f"Successfully fetched {item_type} {item_id}"))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error: {str(e)}"))
