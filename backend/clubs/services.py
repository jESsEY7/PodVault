from .models import Club, ClubRecommendation
from sync.models import OfflineEvent
from django.db.models import Count
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class ClubFeedService:
    THRESHOLD_LIKES = 3 # Number of likes in a club to trigger recommendation

    def generate_recommendations(self, club_id):
        """
        Scans recent activity in a club and generates recommendations.
        """
        club = Club.objects.get(id=club_id)
        members = club.members.all()

        # Find episodes liked by multiple club members recently
        # Assuming 'downloaded' or 'played' counts as interest for now, 
        # ideally we'd have a 'Like' event type.
        recent_events = OfflineEvent.objects.filter(
            user__in=members,
            timestamp__gte=timezone.now() - timezone.timedelta(days=7)
        ).values('episode_id').annotate(count=Count('user', distinct=True)).filter(count__gte=self.THRESHOLD_LIKES)

        for event in recent_events:
            # Map episode_id (string) to Episode model
            # This requires 'episode_id' in OfflineEvent to match Episode.remote_id or similar
            # For simplicity, assuming episode_id is the remote_id as string
            from content.models import Episode
            try:
                episode = Episode.objects.get(remote_id=int(event['episode_id']))
                
                # Check if recommendation exists
                if not ClubRecommendation.objects.filter(club=club, episode=episode).exists():
                    ClubRecommendation.objects.create(
                        club=club,
                        episode=episode,
                        relevance_score=0.8 + (event['count'] * 0.05) # Simple score
                    )
                    logger.info(f"Recommended {episode.title} to {club.name}")

            except (Episode.DoesNotExist, ValueError):
                continue
