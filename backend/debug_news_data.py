
import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'podvault_api.settings')
django.setup()

from content.models import Category, Podcast, Episode

print("--- Data Debug ---")
cats = Category.objects.all()
print(f"Categories ({len(cats)}): {[c.name for c in cats]}")

news_cats = Category.objects.filter(slug='news-archives')
if news_cats.exists():
    nc = news_cats.first()
    print(f"News Category Found: {nc.name} (slug: {nc.slug})")
    
    pods = Podcast.objects.filter(category=nc)
    print(f"Podcasts in News ({len(pods)}): {[p.title for p in pods]}")
    
    for p in pods:
        eps = Episode.objects.filter(podcast=p).count()
        print(f"  - Podcast '{p.title}' has {eps} episodes.")
else:
    print("News Category NOT FOUND!")

print("--- End Debug ---")
