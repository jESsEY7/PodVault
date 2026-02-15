from django.core.management.base import BaseCommand
from creator.services import MpesaPayoutService

class Command(BaseCommand):
    help = 'Tests the Mock M-Pesa Payout Service'

    def add_arguments(self, parser):
        parser.add_argument('phone', type=str, help='Phone number (e.g., 2547...)')
        parser.add_argument('amount', type=float, help='Amount to send')

    def handle(self, *args, **options):
        phone = options['phone']
        amount = options['amount']
        
        self.stdout.write(f"Testing payout of KES {amount} to {phone}...")
        
        service = MpesaPayoutService()
        result = service.send_payout(phone, amount)
        
        if result['success']:
            self.stdout.write(self.style.SUCCESS(f"Success! {result['message']} (Ref: {result['transaction_id']})"))
        else:
            self.stdout.write(self.style.ERROR(f"Failed: {result['error']}"))
