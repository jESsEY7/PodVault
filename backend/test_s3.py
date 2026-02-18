import boto3
import os
from botocore.config import Config
from dotenv import load_dotenv

# Load env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def test_s3():
    endpoint = os.getenv('RUMBLE_S3_ENDPOINT', 'https://s3.rumble.com')
    access_key = os.getenv('RUMBLE_ACCESS_KEY_ID')
    secret_key = os.getenv('RUMBLE_SECRET_ACCESS_KEY')
    bucket_name = os.getenv('RUMBLE_MASTER_BUCKET', 'podvault-masters')

    print(f"Testing Connection to: {endpoint}")
    print(f"Access Key: {access_key[:4]}... (Length: {len(access_key) if access_key else 0})")
    print(f"Bucket: {bucket_name}")

    s3 = boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4', s3={'addressing_style': 'path'})
    )

    try:
        print("Attempting to list buckets...")
        response = s3.list_buckets()
        print("Buckets found:")
        for bucket in response['Buckets']:
            print(f"- {bucket['Name']}")
        
        # Test Upload
        print(f"\nAttempting small test upload to {bucket_name}...")
        s3.put_object(Bucket=bucket_name, Key='test_connection.txt', Body=b'Hello Rumble!')
        print("Upload successful!")
        
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_s3()
