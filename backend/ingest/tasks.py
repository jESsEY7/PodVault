from celery import shared_task
from content.models import Episode
import time

@shared_task
def download_episode_audio_task(episode_id):
    """
    Background task to find and download the audio file for an episode.
    """
    from ingest.services.acquisition import AssetAcquisitionService
    print(f"[Celery] download_episode_audio_task called for episode {episode_id}")
    
    service = AssetAcquisitionService()
    success = service.acquire_enclosure(episode_id)
    
    if success:
        # Trigger Transcription after successful download
        print(f"[Celery] Download successful. Triggering transcription for {episode_id}")
        # Small delay to ensure DB commit if needed, though Celery usually handles this.
        transcribe_episode_task.delay(episode_id)
        return f"Downloaded and queued for transcription: {episode_id}"
    else:
        # Could mark as failed in a future 'TaskStatus' model
        print(f"[Celery] Failed to acquire audio for {episode_id}")
        return f"Failed to acquire audio for {episode_id}"

@shared_task
def transcribe_episode_task(episode_id):
    """
    Background task to transcribe an episode using AI (Whisper).
    """
    from ingest.services.ai_service import AIService
    import requests
    import tempfile
    import os
    
    print(f"[Celery] transcribe_episode_task called for episode {episode_id}")
    try:
        episode = Episode.objects.get(id=episode_id)
        if episode.transcript_content:
            return f"Episode {episode.title} already transcribed."

        service = AIService()
        
        if not episode.audio_file:
             print(f"Skipping transcription for {episode.title}: No audio file.")
             return "No audio file available."

        # Handle remote vs local files
        file_path = None
        temp_file = None
        
        try:
            # Check if storage is local filesystem
            if hasattr(episode.audio_file.storage, 'path'):
                try:
                    file_path = episode.audio_file.path
                except NotImplementedError:
                    # Fallback for custom storage that looks local but isn't
                    pass
            
            # If not local, download to temp file
            if not file_path:
                print(f"[Transcription] Downloading remote file for processing: {episode.title}")
                url = episode.audio_file.url
                
                # Create temp file
                # Suffix .mp3 helps potential format detection
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
                file_path = temp_file.name
                
                # Stream download
                with requests.get(url, stream=True) as r:
                    r.raise_for_status()
                    for chunk in r.iter_content(chunk_size=8192):
                        temp_file.write(chunk)
                temp_file.close()
                print(f"[Transcription] Downloaded to temp file: {file_path}")

            print(f"Starting transcription for: {episode.title} (File: {file_path})")
            transcript = service.transcribe_audio(file_path)

            episode.transcript_content = transcript
            episode.save()
            
            return f"Successfully transcribed: {episode.title}"

        finally:
            # Cleanup temp file if created
            if temp_file and file_path and os.path.exists(file_path):
                os.unlink(file_path)
                print(f"[Transcription] Cleaned up temp file: {file_path}")

    except Episode.DoesNotExist:
        return f"Episode {episode_id} not found."
    except Exception as e:
        return f"Error transcribing {episode_id}: {str(e)}"


@shared_task
def ingest_news_task():
    """
    Periodic task to fetch news from Spaceflight, Mediastack, NPR, and LOC
    and ingest them as Podcast Episodes in the Vault.
    Archives significant media to Rumble Cloud.
    """
    from ingest.services.news import NewsIngestionService
    from podvault_api.rumble import RumbleService
    from content.models import Podcast, Episode, Category
    from django.utils.text import slugify
    from django.utils.dateparse import parse_datetime
    import requests
    import tempfile
    import os
    
    print("[Celery] Starting News Ingestion Task...")
    news_service = NewsIngestionService()
    rumble_service = RumbleService()
    items = news_service.fetch_all()
    
    ingested_count = 0
    
    # Ensure a category exists
    news_category, _ = Category.objects.get_or_create(
        slug='news-archives', 
        defaults={'name': 'News & Archives', 'icon': 'newspaper'}
    )

    for item in items:
        source_name = item.get('source')
        external_id = item.get('external_id')
        
        # 1. Get or Create the "Podcast" container for this source
        podcast, _ = Podcast.objects.get_or_create(
            title=f"{source_name} Feed",
            defaults={
                'description': f"Automated archives from {source_name}",
                'category': news_category,
                'remote_id': slugify(source_name)
            }
        )
        
        # 2. Check if Episode exists
        if Episode.objects.filter(remote_id=external_id).exists():
            continue
            

        # 3. Handle Media Archiving (Rumble)
        rumble_url = None
        # Check if Rumble keys are present before attempting
        if hasattr(rumble_service, 's3_client') and rumble_service.s3_client:
            media_url = item.get('image_url') or item.get('url') # Fallback to article URL if no image
            
            # Only archive if it looks like a file we can grab (simple heuristic)
            if media_url and any(media_url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.mp3', '.mp4']):
                try:
                    print(f"[Rumble Archive] Downloading media for {item.get('title')}...")
                    with tempfile.NamedTemporaryFile(delete=False) as tmp:
                        with requests.get(media_url, stream=True, timeout=10) as r:
                             r.raise_for_status()
                             for chunk in r.iter_content(chunk_size=8192):
                                 tmp.write(chunk)
                        tmp_path = tmp.name
                    
                    # Upload to Rumble
                    object_name = f"news/{slugify(source_name)}/{external_id.split('/')[-1]}"
                    rumble_url = rumble_service.upload_master_file(tmp_path, object_name)
                    
                    # Cleanup
                    os.unlink(tmp_path)
                except Exception as e:
                    print(f"[Rumble Archive] Passed/Failed: {e}")
        else:
             print("[Rumble Archive] Skipping (No valid S3 Connection configured)")


        # 4. Create Episode
        published_at = item.get('published_at')
        if published_at:
             try:
                 published_at = parse_datetime(published_at)
             except:
                 published_at = None

        Episode.objects.create(
            id=item.get('id'), 
            podcast=podcast,
            title=item.get('title'),
            description=item.get('description') or "",
            audio_url=item.get('url'), 
            remote_id=external_id, # Using external_id as the remote_id
            published_at=published_at,
            value={
                'tags': item.get('tags'), 
                'original_image': item.get('image_url'),
                'rumble_archive_url': rumble_url
            }
        )
        ingested_count += 1
        
    print(f"[Celery] Ingested {ingested_count} new items from {len(items)} fetched.")
    return f"Ingested {ingested_count} items."
