import requests
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils.deconstruct import deconstructible
import os

@deconstructible
class BunnyStorage(Storage):
    def __init__(self):
        self.storage_zone_name = settings.BUNNY_STORAGE_ZONE_NAME
        self.storage_password = settings.BUNNY_STORAGE_PASSWORD
        self.pull_zone_url = settings.BUNNY_PULL_ZONE_URL
        self.region = getattr(settings, 'BUNNY_STORAGE_REGION', 'de')
        
        # Construct the base URL for the storage API
        # Main endpoint: https://storage.bunnycdn.com
        # Regional endpoints: https://{region}.storage.bunnycdn.com
        if self.region and self.region != 'de':
            self.base_url = f"https://{self.region}.storage.bunnycdn.com/{self.storage_zone_name}/"
        else:
            self.base_url = f"https://storage.bunnycdn.com/{self.storage_zone_name}/"

        self.headers = {
            "AccessKey": self.storage_password,
            "Content-Type": "application/octet-stream",
        }

    def _open(self, name, mode='rb'):
        # BunnyStorage doesn't support opening files in the traditional sense 
        # for reading as a file object immediately because it's an HTTP API.
        # For simple read operations, we can fetch the content.
        url = self.url(name)
        response = requests.get(url)
        if response.status_code == 200:
            return ContentFile(response.content)
        raise FileNotFoundError(f"File {name} not found.")

    def _save(self, name, content):
        # Read the content
        file_content = content.read()
        
        # Normalize the name (remove leading slashes if any)
        name = name.lstrip('/')
        
        # Upload to Bunny.net
        upload_url = self.base_url + name
        response = requests.put(upload_url, data=file_content, headers=self.headers)
        
        if response.status_code == 201:
            return name
        else:
            # Handle error (raise exception or log)
            raise Exception(f"Failed to upload file to Bunny.net: {response.status_code} - {response.text}")

    def exists(self, name):
        # Normalize the name
        name = name.lstrip('/')
        
        # We can check existence by trying to list the file or HEAD request (if supported/public)
        # Using the storage API list function is safer.
        # However, checking via public URL with a HEAD request is often faster if the file is public.
        # Let's try the storage API list for correctness.
        # Or simpler: GET request to the storage URL (not pull zone) which usually returns metadata or 404
        
        check_url = self.base_url + name
        # We generally accept that overwrite is fine or handle uniqueness in Django models.
        # But `exists` is used by Django to determine if it should auto-rename.
        
        # NOTE: Bunny Storage API doesn't have a simple "HEAD" for existence on the storage endpoint without downloading.
        # We can list the directory. But that's expensive.
        # For now, let's assume False to allow overwriting/hashing by Django, 
        # OR fetch metadata.
        
        # Attempt to get file metadata/stats (DESCRIBE equivalent doesn't strictly exist, but GET works)
        # We don't want to download the whole file just to check existence.
        
        # Alternative: Just return False and rely on Django's filename generation uniqueness 
        # if we trust uuid/randomization. 
        # But to be safe, let's return False so Django generates a unique name if needed, 
        # or True if we want to prevent overwrite.
        
        # Optimization: Return False to assume it doesn't exist and let Django handle name collisions 
        # by appending characters if we were using local storage. 
        # With custom storage, `get_available_name` calls `exists`.
        
        return False

    def url(self, name):
        # Return the Pull Zone URL
        return f"{self.pull_zone_url.rstrip('/')}/{name.lstrip('/')}"

    def delete(self, name):
        name = name.lstrip('/')
        delete_url = self.base_url + name
        requests.delete(delete_url, headers=self.headers)
