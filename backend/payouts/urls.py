from django.urls import path
from .views import MpesaResultView, MpesaTimeoutView, TriggerPayoutView, WalletView, TransactionListView

urlpatterns = [
    path('wallet/', WalletView.as_view(), name='wallet'),
    path('transactions/', TransactionListView.as_view(), name='transactions'),
    path('result/', MpesaResultView.as_view(), name='mpesa_result'),
    path('timeout/', MpesaTimeoutView.as_view(), name='mpesa_timeout'),
    path('trigger/', TriggerPayoutView.as_view(), name='mpesa_trigger'),
]
