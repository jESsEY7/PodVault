import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
STORAGE_ZONE_NAME = os.getenv('BUNNY_STORAGE_ZONE_NAME')
STORAGE_PASSWORD = os.getenv('BUNNY_STORAGE_PASSWORD')
PULL_ZONE_URL = os.getenv('BUNNY_PULL_ZONE_URL')
REGION = os.getenv('BUNNY_STORAGE_REGION', 'de')

print(f"Checking Bunny.net connection for zone: {STORAGE_ZONE_NAME}")
print(f"Region: {REGION}")

if not STORAGE_ZONE_NAME or not STORAGE_PASSWORD:
    print("Error: BUNNY_STORAGE_ZONE_NAME or BUNNY_STORAGE_PASSWORD not found in environment variables.")
    exit(1)

# Construct Base URL
if REGION and REGION != 'de':
    BASE_URL = f"https://{REGION}.storage.bunnycdn.com/{STORAGE_ZONE_NAME}/"
else:
    BASE_URL = f"https://storage.bunnycdn.com/{STORAGE_ZONE_NAME}/"

HEADERS = {
    "AccessKey": STORAGE_PASSWORD,
    "Content-Type": "text/plain",
}

TEST_FILENAME = "bunny_test_verification.txt"
TEST_CONTENT = "This is a test file to verify Bunny.net integration."

def verify_upload():
    print(f"Attempting to upload {TEST_FILENAME}...")
    url = BASE_URL + TEST_FILENAME
    try:
        response = requests.put(url, data=TEST_CONTENT, headers=HEADERS)
        if response.status_code == 201:
            print("Upload SUCCESS")
            return True
        else:
            print(f"Upload FAILED: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Upload ERROR: {e}")
        return False

def verify_download():
    print(f"Attempting to download {TEST_FILENAME} via Storage API...")
    url = BASE_URL + TEST_FILENAME
    try:
        response = requests.get(url, headers=HEADERS)
        if response.status_code == 200:
            if response.text == TEST_CONTENT:
                print("Download SUCCESS (Content verified)")
                return True
            else:
                print("Download SUCCESS but content mismatch")
                return False
        else:
            print(f"Download FAILED: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Download ERROR: {e}")
        return False

def verify_delete():
    print(f"Attempting to delete {TEST_FILENAME}...")
    url = BASE_URL + TEST_FILENAME
    try:
        response = requests.delete(url, headers=HEADERS)
        if response.status_code == 200:
            print("Delete SUCCESS")
            return True
        else:
            print(f"Delete FAILED: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Delete ERROR: {e}")
        return False

if __name__ == "__main__":
    if verify_upload():
        verify_download()
        verify_delete()
    else:
        print("Skipping download/delete due to upload failure.")
