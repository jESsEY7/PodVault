from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ListeningSession
from users.models import UserPreference
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=ListeningSession)
def update_interest_on_listen(sender, instance, created, **kwargs):
    """
    Signal to update the User's AI Interest Vector based on listening behavior.
    Triggered when a verified ListeningSession is created.
    """
    if not created:
        return

    episode = instance.episode
    if episode.duration <= 0:
        logger.warning(f"Episode {episode.id} has 0 duration, skipping interest update.")
        return 

    # Calculate Completion Rate
    completion_rate = instance.duration_seconds / episode.duration
    
    # Determine Weight Strategy
    weight = 0.0
    if completion_rate >= 0.9:      # > 90% Completion (Strong Interest)
        weight = 1.0
    elif completion_rate >= 0.5:    # > 50% Completion (Moderate Interest)
        weight = 0.5
    elif completion_rate < 0.1:     # < 10% Completion (Skip/Disinterest)
        weight = -0.1
    else:                           # 10-50% (Weak Interest)
        weight = 0.1
    
    if weight == 0.0:
        return

    try:
        # Get or Create UserPreference
        user_pref, _ = UserPreference.objects.get_or_create(user=instance.user)
        
        # Identify Category (via Podcast)
        if episode.podcast and episode.podcast.category:
            category_name = episode.podcast.category.name
            user_pref.update_interest_vector(category_name, weight)
            logger.info(f"AI UPDATE: {instance.user.username} | {category_name} | Rate: {completion_rate:.2f} | Weight: {weight}")
            
    except Exception as e:
        logger.error(f"Failed to update interest vector for {instance.user.username}: {e}")
