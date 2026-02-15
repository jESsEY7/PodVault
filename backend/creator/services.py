import logging

logger = logging.getLogger(__name__)

class MpesaPayoutService:
    def __init__(self):
        self.provider = "M-Pesa B2C"

    def send_payout(self, phone_number, amount, transaction_desc="Creator Payout"):
        """
        Simulate an M-Pesa B2C payout.
        """
        logger.info(f"Initiating M-Pesa Payout of KES {amount} to {phone_number}...")
        
        # In a real app, this would make an HTTP request to Safaricom's API
        # Response simulation:
        success = True 
        
        if success:
            logger.info(f"Payout successful. Transaction ID: MOCK_TX_12345")
            return {
                "success": True,
                "transaction_id": "MOCK_TX_12345",
                "message": "Payout accepted for processing"
            }
        else:
            logger.error("Payout failed.")
            return {
                "success": False,
                "error": "Simulated failure"
            }

class EarningsService:
    EARNING_RATE_PER_MINUTE = 0.50 # KES

    def process_earnings(self, listening_session):
        """
        Calculates and credits earnings for a verified listening session.
        """
        if listening_session.processed_for_earnings:
            return 

        # Calculate Earnings
        minutes = listening_session.duration_seconds / 60
        amount = minutes * self.EARNING_RATE_PER_MINUTE
        
        if amount <= 0:
            return

        # Credit Creator Wallet
        podcast = listening_session.episode.podcast
        if podcast.creator and hasattr(podcast.creator, 'creator_profile'):
            wallet = podcast.creator.creator_profile.wallet
            wallet.balance += amount
            wallet.pending_revenue += amount # In a real app, this moves to available after some time
            wallet.save()
            
            logger.info(f"Credited {amount} KES to {podcast.creator.username} for {listening_session.duration_seconds}s listening.")
            
            # Mark session as processed
            listening_session.processed_for_earnings = True
            listening_session.save()
