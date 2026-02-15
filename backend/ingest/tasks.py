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
    print(f"[Celery] transcribe_episode_task called for episode {episode_id}")
    try:
        episode = Episode.objects.get(id=episode_id)
        if episode.transcript_content:
            return f"Episode {episode.title} already transcribed."

        service = AIService()
        
        if episode.audio_file:
            print(f"Starting transcription for: {episode.title} (File: {episode.audio_file.path})")
            transcript = service.transcribe_audio(episode.audio_file.path)
        else:
             print(f"Skipping transcription for {episode.title}: No audio file.")
             return "No audio file available."

        episode.transcript_content = transcript
        episode.save()
        
        return f"Successfully transcribed: {episode.title}"
    except Episode.DoesNotExist:
        return f"Episode {episode_id} not found."
    except Exception as e:
        return f"Error transcribing {episode_id}: {str(e)}"
