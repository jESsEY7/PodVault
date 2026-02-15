from django.core.management.base import BaseCommand
from ingest.services.ingest import PodcastIngestionService
import json

class Command(BaseCommand):
    help = 'Tests the Podcast Ingestion Service'

    def add_arguments(self, parser):
        parser.add_argument('remote_id', type=int, help='Podcast Index ID to sync')

    def handle(self, *args, **options):
        remote_id = options['remote_id']
        self.stdout.write(f"Syncing podcast with ID: {remote_id}...")

        try:
            service = PodcastIngestionService()
            podcast = service.sync_podcast_by_id(remote_id)
            
            if podcast:
                self.stdout.write(self.style.SUCCESS(f"Successfully synced podcast: {podcast.title}"))
                self.stdout.write(f"Local ID: {podcast.id}")
                self.stdout.write(f"Episodes count: {podcast.episodes.count()}")
                
                # Check for Value tag
                if podcast.value:
                    self.stdout.write(self.style.SUCCESS(f"Value tag found: {json.dumps(podcast.value, indent=2)}"))
                else:
                    self.stdout.write(self.style.WARNING("No Value tag found on podcast."))

            else:
                self.stdout.write(self.style.ERROR("Failed to sync podcast (returned None)."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))
