from django.contrib import admin
from .models import CreatorProfile, Wallet, Transaction, Analytics

@admin.register(CreatorProfile)
class CreatorProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)
    search_fields = ('user__username',)

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('creator', 'balance', 'pending_revenue')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('wallet', 'amount', 'transaction_type', 'status', 'created_at')
    list_filter = ('transaction_type', 'status')

@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    list_display = ('creator', 'date', 'total_listen_time_seconds')
    list_filter = ('date',)
