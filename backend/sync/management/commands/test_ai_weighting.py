from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from content.models import Podcast, Episode, Category
from sync.models import ListeningSession
from users.models import UserPreference
import uuid

class Command(BaseCommand):
    help = 'Tests the AI Weighted Logic via Signals'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # 1. Setup Data
        username = f"ai_test_user_{uuid.uuid4().hex[:8]}"
        user = User.objects.create_user(username=username, password="password123")
        self.stdout.write(f"Created User: {user.username}")

        cat_tech = Category.objects.create(name="Tech", slug=f"tech-{uuid.uuid4().hex[:8]}")
        podcast = Podcast.objects.create(title="Tech Talk", category=cat_tech)
        episode = Episode.objects.create(
            podcast=podcast, 
            title="The Future of AI", 
            duration=1000 # 1000 seconds
        )

        # 2. Test 100% Completion (+1.0)
        self.stdout.write("--- Test Case 1: 100% Completion ---")
        ListeningSession.objects.create(
            user=user,
            episode=episode,
            duration_seconds=1000 # Full listen
        )
        
        pref = UserPreference.objects.get(user=user)
        self.stdout.write(f"Interest Vector: {pref.interest_vector}")
        
        # Verify
        tech_score = next((item['score'] for item in pref.interest_vector if item['category'] == 'Tech'), 0)
        if tech_score == 1.0:
             self.stdout.write(self.style.SUCCESS("PASS: 100% listen added +1.0"))
        else:
             self.stdout.write(self.style.ERROR(f"FAIL: Expected 1.0, got {tech_score}"))

        # 3. Test Skip (<10%) (-0.1)
        self.stdout.write("--- Test Case 2: Skip (50s / 1000s = 5%) ---")
        ListeningSession.objects.create(
            user=user,
            episode=episode,
            duration_seconds=50 # 5% listen
        )
        
        pref.refresh_from_db()
        self.stdout.write(f"Interest Vector: {pref.interest_vector}")
        
        tech_score_2 = next((item['score'] for item in pref.interest_vector if item['category'] == 'Tech'), 0)
        # Should be 1.0 - 0.1 = 0.9
        if abs(tech_score_2 - 0.9) < 0.01:
             self.stdout.write(self.style.SUCCESS("PASS: Skip deducted 0.1"))
        else:
             self.stdout.write(self.style.ERROR(f"FAIL: Expected 0.9, got {tech_score_2}"))

        # Cleanup
        user.delete()
        cat_tech.delete()
