from django.urls import path
from .views import AnalyticsView, WalletView, WithdrawView

urlpatterns = [
    path('analytics', AnalyticsView.as_view(), name='creator_analytics'),
    path('wallet', WalletView.as_view(), name='creator_wallet'),
    path('withdraw', WithdrawView.as_view(), name='creator_withdraw'),
]
