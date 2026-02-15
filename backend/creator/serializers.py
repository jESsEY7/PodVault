from rest_framework import serializers
from .models import CreatorProfile, Wallet, Transaction, Analytics

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['amount', 'transaction_type', 'status', 'created_at']

class WalletSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Wallet
        fields = ['balance', 'pending_revenue', 'transactions']

class AnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analytics
        fields = ['date', 'total_listen_time_seconds', 'geo_data', 'retention_graph']
