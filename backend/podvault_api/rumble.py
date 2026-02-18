import boto3
import requests
from django.conf import settings
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

class RumbleService:
    """
    Dedicated service for interacting with Rumble's ecosystem.
    Handles Authentication (Bearer Tokens), S3-Compatible Cloud Storage,
    Live Streaming API, and Monetization/Analytics.
    """

    def __init__(self):
        # 1. Monetization & Analytics Auth
        self.api_key = getattr(settings, 'RUMBLE_API_KEY', None)
        self.ad_api_url = "https://ads.rumble.com/api/v1"

        # 2. Rumble Cloud (S3-Compatible) Auth
        self.s3_endpoint = getattr(settings, 'RUMBLE_S3_ENDPOINT', None)
        self.s3_access_key = getattr(settings, 'RUMBLE_ACCESS_KEY_ID', None)
        self.s3_secret_key = getattr(settings, 'RUMBLE_SECRET_ACCESS_KEY', None)
        self.master_bucket = getattr(settings, 'RUMBLE_MASTER_BUCKET', 'podvault-masters')
        

        # Initialize S3 Client if credentials exist
        if self.s3_endpoint and self.s3_access_key and self.s3_secret_key:
            from botocore.config import Config
            self.s3_client = boto3.client(
                's3',
                endpoint_url=self.s3_endpoint,
                aws_access_key_id=self.s3_access_key,
                aws_secret_access_key=self.s3_secret_key,
                config=Config(signature_version='s3v4', s3={'addressing_style': 'path'})
            )
        else:
            self.s3_client = None
            logger.warning("Rumble S3 credentials not configured. Storage features disabled.")


    def upload_master_file(self, file_path, object_name=None):
        """
        Uploads a raw 'Master' file to Rumble Cloud Storage (S3).
        """
        if not self.s3_client:
            logger.error("S3 Client not initialized.")
            return None

        if object_name is None:
            object_name = file_path.split('/')[-1]

        try:
            self.s3_client.upload_file(file_path, self.master_bucket, object_name)
            url = f"{self.s3_endpoint}/{self.master_bucket}/{object_name}"
            logger.info(f"Successfully uploaded {object_name} to Rumble Cloud.")
            return url
        except ClientError as e:
            logger.error(f"Failed to upload file to Rumble: {e}")
            return None

    def get_live_stream_status(self, channel_id):
        """
        Checks if a specific Rumble channel is currently live.
        """
        if not self.api_key:
            return False
            
        try:
            # Hypothetical endpoint based on typical platform APIs
            url = f"https://rumble.com/api/v1/channel/{channel_id}/live"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data.get('is_live', False)
        except requests.RequestException as e:
            logger.error(f"Error checking live status: {e}")
            return False

    def fetch_revenue_analytics(self, start_date, end_date):
        """
        Fetches daily revenue, eCPM, and ad impressions from Rumble Advertising Center.
        """
        if not self.api_key:
            logger.error("Rumble API Key missing.")
            return {}

        try:
            payload = {
                "start": start_date,
                "end": end_date
            }
            headers = {"Authorization": f"Bearer {self.api_key}"}
            response = requests.get(f"{self.ad_api_url}/stats", params=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Failed to fetch analytics: {e}")
            return {}
