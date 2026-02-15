import os
import openai
from django.conf import settings

class AIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            openai.api_key = self.api_key
        else:
            print("[AIService] Warning: No OpenAI API Key found.")

    def transcribe_audio(self, file_path):
        """
        Transcribes audio file using OpenAI Whisper.
        """
        if not self.api_key:
            print("[AIService] Skipping real transcription (No API Key). Returning mock.")
            return self._mock_transcription(file_path)
            
        if not os.path.exists(file_path):
            return "Error: Audio file not found."

        try:
            print(f"[AIService] Transcribing file: {file_path}")
            # Note: This is a synchronous call and might take time.
            # Ideally run in a separate thread or process if not using Celery.
            # Since we are called from Celery, it's fine.
            
            with open(file_path, "rb") as audio_file:
                transcript = openai.Audio.transcribe("whisper-1", audio_file)
            
            return transcript["text"]
        except Exception as e:
            print(f"[AIService] Transcription Error: {e}")
            return f"Error during transcription: {str(e)}"

    def _mock_transcription(self, file_path):
        return f"[MOCK TRANSCRIPT] This is a simulated transcript for file {os.path.basename(file_path)}. Imagine brilliant insights here."

    def generate_embedding(self, text):
        """
        Generates embedding for text using OpenAI (or local fallback).
        """
        # Placeholder for future implementation
        return []
