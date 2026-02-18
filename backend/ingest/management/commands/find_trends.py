from django.core.management.base import BaseCommand
from ingest.services.news import NewsIngestionService
from ingest.services.podcast_index import PodcastIndexClient
import re


class Command(BaseCommand):
    help = 'Finds trending news topics and searches for related podcasts.'

    def extract_keywords(self, headline):
        """Extract broad, searchable keywords from a headline."""
        # Remove common stop words and keep meaningful terms
        stop_words = {
            'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
            'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'may', 'might', 'can', 'shall', 'with', 'from', 'by', 'as',
            'its', 'it', 'this', 'that', 'these', 'those', 'not', 'but',
            'or', 'if', 'so', 'than', 'too', 'very', 'just', 'about',
            'up', 'out', 'new', 'two', 'five', 'next', 'gen', 'ahead',
        }
        words = re.findall(r"[a-zA-Z']+", headline.lower())
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        # Use the top 2-3 keywords for a broader search
        return ' '.join(keywords[:3])

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("=== PodVault Trend Finder ===\n"))

        news_service = NewsIngestionService()
        podcast_client = PodcastIndexClient()

        # 1. Fetch News
        self.stdout.write("Fetching news from all sources...")
        news_items = news_service.fetch_all()

        if not news_items:
            self.stdout.write(self.style.WARNING("No news items found. Check API keys in .env"))
            return

        self.stdout.write(self.style.SUCCESS(f"Found {len(news_items)} news items.\n"))

        # 2. Group by source for display
        sources = {}
        for item in news_items:
            src = item.get('source', 'Unknown')
            sources.setdefault(src, []).append(item)

        for src, items in sources.items():
            self.stdout.write(self.style.MIGRATE_HEADING(f"\n--- {src} ({len(items)} items) ---"))
            for item in items[:3]:  # Show top 3 per source
                self.stdout.write(f"  * {item.get('title')}")

        # 3. Search for related podcasts
        self.stdout.write(self.style.MIGRATE_HEADING("\n\n=== Searching for Related Podcasts ===\n"))

        seen_queries = set()
        for item in news_items[:8]:  # Top 8 news items
            headline = item.get('title', '')
            source = item.get('source', '')
            query = self.extract_keywords(headline)

            if query in seen_queries or not query:
                continue
            seen_queries.add(query)

            self.stdout.write(f"\n[{source}] {headline}")
            self.stdout.write(f"  Search query: \"{query}\"")

            try:
                results = podcast_client.search_episodes(query)

                if results and results.get('feeds'):
                    feeds = results.get('feeds')[:3]
                    for feed in feeds:
                        title = feed.get('title', 'Unknown')
                        author = feed.get('author', 'Unknown')
                        feed_id = feed.get('id')
                        self.stdout.write(
                            self.style.SUCCESS(f"  --> Podcast: {title} by {author} (ID: {feed_id})")
                        )
                elif results and results.get('status') == 'true' and results.get('count', 0) == 0:
                    self.stdout.write(self.style.WARNING("  (No matching podcasts)"))
                else:
                    self.stdout.write(self.style.WARNING(f"  (No results - API response: {results})"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  Error: {e}"))

        self.stdout.write(self.style.SUCCESS("\n\n=== Done ==="))
