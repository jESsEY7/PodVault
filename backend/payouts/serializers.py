from rest_framework import serializers
from .models import Wallet, PayoutTransaction

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['balance', 'pending_balance', 'currency', 'updated_at']

class PayoutTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutTransaction
        fields = ['id', 'amount', 'transaction_type', 'status', 'description', 'created_at']
