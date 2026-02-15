from rest_framework import viewsets, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CreatorProfile, Wallet, Transaction, Analytics
from .serializers import WalletSerializer, AnalyticsSerializer

class CreatorBaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get_creator_profile(self):
        return CreatorProfile.objects.get(user=self.request.user)

class AnalyticsView(CreatorBaseView):
    def get(self, request):
        try:
            profile = self.get_creator_profile()
            analytics = Analytics.objects.filter(creator=profile).order_by('-date')[:30] # Last 30 days
            serializer = AnalyticsSerializer(analytics, many=True)
            return Response(serializer.data)
        except CreatorProfile.DoesNotExist:
            return Response({'error': 'Creator profile not found'}, status=404)

class WalletView(CreatorBaseView):
    def get(self, request):
        try:
            profile = self.get_creator_profile()
            wallet, created = Wallet.objects.get_or_create(creator=profile)
            serializer = WalletSerializer(wallet)
            return Response(serializer.data)
        except CreatorProfile.DoesNotExist:
            return Response({'error': 'Creator profile not found'}, status=404)

class WithdrawView(CreatorBaseView):
    def post(self, request):
        amount = request.data.get('amount')
        # Logic to trigger M-Pesa B2C
        # For now, just create a pending transaction
        try:
            profile = self.get_creator_profile()
            wallet = profile.wallet
            if wallet.balance >= amount:
                 Transaction.objects.create(
                     wallet=wallet,
                     amount=amount,
                     transaction_type='withdrawal',
                     status='pending'
                 )
                 # Deduct balance logic here or after confirmation
                 return Response({'status': 'Withdrawal initiated'})
            else:
                 return Response({'error': 'Insufficient funds'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
