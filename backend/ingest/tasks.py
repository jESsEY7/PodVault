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
