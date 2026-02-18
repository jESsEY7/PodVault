from django.core.management.base import BaseCommand
from ingest.tasks import ingest_news_task

class Command(BaseCommand):
    help = 'Manually triggers the news ingestion task'

    def handle(self, *args, **options):
        self.stdout.write("Triggering news ingestion...")
        result = ingest_news_task()
        self.stdout.write(self.style.SUCCESS(f"Task completed: {result}"))
