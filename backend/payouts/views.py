from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .mpesa_service import MpesaPayoutService
from .models import Wallet, PayoutTransaction
from .serializers import WalletSerializer, PayoutTransactionSerializer

class WalletView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

    def post(self, request):
        """Initiate Withdrawal"""
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        amount = request.data.get('amount')
        phone = request.data.get('phone')

        if not amount or not phone:
            return Response({"error": "Amount and Phone required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = float(amount)
        except ValueError:
            return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        if wallet.balance < amount:
            return Response({"error": "Insufficient balance"}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct balance immediately (lock funds)
        wallet.balance = float(wallet.balance) - amount
        wallet.save()

        # Create Transaction Record
        transaction = PayoutTransaction.objects.create(
            user=request.user,
            amount=amount,
            transaction_type='WITHDRAWAL',
            status='PENDING',
            description=f"Withdrawal to {phone}"
        )

        # Trigger M-Pesa
        service = MpesaPayoutService()
        result = service.trigger_payout(phone, amount, request.user.username)

        # If immediate failure, refund (simplified logic)
        if 'error' in result:
             wallet.balance = float(wallet.balance) + amount
             wallet.save()
             transaction.status = 'FAILED'
             transaction.description = f"Failed: {result['error']}"
             transaction.save()
             return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({"status": "Withdrawal initiated", "transaction_id": transaction.id})

class TransactionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PayoutTransactionSerializer

    def get_queryset(self):
        return PayoutTransaction.objects.filter(user=self.request.user).order_by('-created_at')

@method_decorator(csrf_exempt, name='dispatch')
class MpesaResultView(APIView):
    permission_classes = [permissions.AllowAny] # Callbacks come from Safaricom

    def post(self, request, *args, **kwargs):
        print(f"[MpesaResult] Payload: {request.data}")
        # Process result (update transaction status, notify user, etc.)
        # Real logic would verify signature/IP here.
        return Response({"status": "received"})

@method_decorator(csrf_exempt, name='dispatch')
class MpesaTimeoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        print(f"[MpesaTimeout] Payload: {request.data}")
        # Handle timeout (mark transaction as failed/pending retry)
        return Response({"status": "received"})

class TriggerPayoutView(APIView):
    permission_classes = [permissions.IsAdminUser] # Only admins for now

    def post(self, request, *args, **kwargs):
        phone = request.data.get('phone')
        amount = request.data.get('amount')
        creator_name = request.data.get('creator_name', 'Unknown Creator')

        if not phone or not amount:
            return Response({"error": "Phone and Amount required"}, status=status.HTTP_400_BAD_REQUEST)

        service = MpesaPayoutService()
        result = service.trigger_payout(phone, amount, creator_name)
        
        return Response(result)
