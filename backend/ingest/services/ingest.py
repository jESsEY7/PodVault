from content.models import Podcast, Episode, Category
from .podcast_index import PodcastIndexClient
from django.utils import timezone
from datetime import datetime
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

class PodcastIngestionService:
    def __init__(self):
        self.client = PodcastIndexClient()

    def sync_podcast_by_id(self, remote_id):
        """
        Syncs a podcast and its episodes from Podcast Index by ID.
        Uses transaction.atomic() to ensure data integrity.
        """
        # 1. Fetch Podcast Details
        podcast_data_response = self.client.get_podcast_by_feed_id(remote_id)
        if not podcast_data_response or not podcast_data_response.get('feed'):
            logger.error(f"Failed to fetch podcast with ID {remote_id}")
            return None

        feed_data = podcast_data_response['feed']
        
        # Check for V4V premium eligibility (M-Pesa, Lightning, etc.)
        # This is a basic check. Real implementation would parse the 'value' block deeply.
        value_block = feed_data.get('value', {})
        is_premium_eligible = False
        if value_block and 'destinations' in value_block:
            is_premium_eligible = True # Assume any V4V setup makes it eligible for now

        with transaction.atomic():
            # 2. Update/Create Podcast
            podcast, created = Podcast.objects.update_or_create(
                remote_id=remote_id,
                defaults={
                    'title': feed_data.get('title', 'Unknown Podcast'),
                    'description': feed_data.get('description', ''),
                    'cover_image': feed_data.get('image', ''),
                    'custom_rss_url': feed_data.get('url', ''), 
                    'funding_url': feed_data.get('funding', {}).get('url', '') if isinstance(feed_data.get('funding'), dict) else '',
                    'value': value_block,
                    'last_ingested_at': timezone.now(),
                    # 'tier': 'premium' if is_premium_eligible else 'free' # Logic to auto-set tier? Maybe just flag it.
                }
            )

            # 3. Fetch Episodes
            episodes_response = self.client.get_episodes_by_feed_id(remote_id)
            if episodes_response and episodes_response.get('items'):
                self._sync_episodes_bulk(podcast, episodes_response['items'])

        return podcast

    def _sync_episodes_bulk(self, podcast, episodes_data):
        """
        Syncs a list of episodes for a podcast using bulk_create/update logic.
        """
        episodes_to_create = []
        episodes_to_update = []
        existing_episodes = {e.remote_id: e for e in Episode.objects.filter(podcast=podcast)}

        for episode_data in episodes_data:
            remote_id = episode_data.get('id')
            
            # Parse duration
            duration = 0
            if 'duration' in episode_data:
                try:
                    duration = int(episode_data['duration'])
                except (ValueError, TypeError):
                    pass
            
            # Parse published date
            published_at = timezone.now()
            if 'datePublished' in episode_data:
                try:
                    published_at = datetime.fromtimestamp(episode_data['datePublished'])
                except (ValueError, TypeError):
                    pass

            episode_defaults = {
                'title': episode_data.get('title', 'Untitled Episode'),
                'description': episode_data.get('description', ''),
                'audio_url': episode_data.get('enclosureUrl', ''),
                'duration': duration,
                'published_at': published_at,
                'guid': episode_data.get('guid', '')[:500],
                'transcript_url': episode_data.get('transcriptUrl', ''),
                'chapters_url': episode_data.get('chaptersUrl', ''),
                'value': episode_data.get('value', {}),
                'season_number': episode_data.get('season') if episode_data.get('season') else None,
                'episode_number': episode_data.get('episode') if episode_data.get('episode') else 0,
            }

            if remote_id in existing_episodes:
                # Update existing
                episode = existing_episodes[remote_id]
                has_changes = False
                for key, value in episode_defaults.items():
                    if getattr(episode, key) != value:
                        setattr(episode, key, value)
                        has_changes = True
                if has_changes:
                    episodes_to_update.append(episode)
            else:
                # Create new
                episodes_to_create.append(Episode(
                    podcast=podcast,
                    remote_id=remote_id,
                    **episode_defaults
                ))

        # Bulk operations
        if episodes_to_create:
            Episode.objects.bulk_create(episodes_to_create, ignore_conflicts=True)
            logger.info(f"Created {len(episodes_to_create)} episodes for {podcast.title}")

        if episodes_to_update:
            Episode.objects.bulk_update(episodes_to_update, fields=[
                'title', 'description', 'audio_url', 'duration', 'published_at', 
                'guid', 'transcript_url', 'chapters_url', 'value', 'season_number', 'episode_number'
            ])
            logger.info(f"Updated {len(episodes_to_update)} episodes for {podcast.title}")
