import os
import requests
from django.conf import settings

class AIService:
    @staticmethod
    def generate_summary(episode):
        """
        Generates a concise summary for an episode using OpenAI or fallback.
        """
        api_key = getattr(settings, 'OPENAI_API_KEY', None)
        
        if not api_key:
            print("[AIService] No OpenAI API Key found. Returning mock summary.")
            return f"AI Summary (Mock): {episode.description[:200]}..." if episode.description else "No description available for summary generation."

        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            prompt = f"Generate a concise 2-sentence summary highlighting key topics and main takeaways for this podcast episode:\n\nTitle: {episode.title}\nDescription: {episode.description}\n\nReturn ONLY the summary, no extra text."
            
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 150
            }
            
            response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data['choices'][0]['message']['content'].strip()
            
        except Exception as e:
            print(f"[AIService] Generation failed: {e}")
            return None
