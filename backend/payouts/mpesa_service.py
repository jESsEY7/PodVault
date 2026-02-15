import requests
from django.conf import settings
import base64
from datetime import datetime

class MpesaPayoutService:
    """Handles disbursements from PodVault to Creators via M-Pesa B2C."""
    
    def __init__(self):
        # Default to Sandbox if not specified
        env = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')
        if env == 'production':
            self.base_url = "https://api.safaricom.co.ke"
        else:
            self.base_url = "https://sandbox.safaricom.co.ke"
            
        self.consumer_key = getattr(settings, 'MPESA_KEY', '')
        self.consumer_secret = getattr(settings, 'MPESA_SECRET', '')
        self.initiator_name = getattr(settings, 'MPESA_INITIATOR', '')
        self.security_credential = getattr(settings, 'MPESA_ENCRYPTED_CREDENTIAL', '')
        self.shortcode = getattr(settings, 'MPESA_SHORTCODE', '')
        
    def get_auth_token(self):
        if not self.consumer_key or not self.consumer_secret:
            print("[MpesaPayoutService] Missing keys.")
            return None
            
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        try:
            r = requests.get(url, auth=(self.consumer_key, self.consumer_secret))
            r.raise_for_status()
            return r.json().get('access_token')
        except Exception as e:
            print(f"[MpesaPayoutService] Auth Failed: {e}")
            return None

    def trigger_payout(self, phone, amount, creator_name):
        token = self.get_auth_token()
        if not token:
            return {"error": "Failed to authenticate with M-Pesa"}
            
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Ensure phone is in format 254...
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        elif phone.startswith('+'):
            phone = phone[1:]
            
        payload = {
            "InitiatorName": self.initiator_name,
            "SecurityCredential": self.security_credential,
            "CommandID": "BusinessPayment", # or SalaryPayment / PromotionPayment
            "Amount": amount,
            "PartyA": self.shortcode,
            "PartyB": phone,
            "Remarks": f"Earnings for {creator_name}",
            "QueueTimeOutURL": "https://podvault.dev/api/v1/payouts/timeout/", # Needs to be reachable (ngrok for dev)
            "ResultURL": "https://podvault.dev/api/v1/payouts/result/",       # Needs to be reachable (ngrok for dev)
            "Occasion": "PodVault Payout"
        }

        try:
            print(f"[MpesaPayoutService] Triggering B2C payout of {amount} to {phone}")
            response = requests.post(f"{self.base_url}/mpesa/b2c/v1/paymentrequest", json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[MpesaPayoutService] Payout Request Failed: {e}")
            if hasattr(e, 'response') and e.response:
                return e.response.json()
            return {"error": str(e)}
