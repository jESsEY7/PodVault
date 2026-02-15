from django.db import models
from django.conf import settings

class CreatorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='creator_profile')
    bio = models.TextField(blank=True)
    
    def __str__(self):
        return self.user.username

class Wallet(models.Model):
    creator = models.OneToOneField(CreatorProfile, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    pending_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    def __str__(self):
        return f"{self.creator.user.username}'s Wallet"

class Transaction(models.Model):
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=[('withdrawal', 'Withdrawal'), ('deposit', 'Deposit')])
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount}"

class Analytics(models.Model):
    creator = models.ForeignKey(CreatorProfile, on_delete=models.CASCADE, related_name='analytics')
    date = models.DateField()
    total_listen_time_seconds = models.IntegerField(default=0)
    # Storing heatmaps/retention as JSON for flexibility
    geo_data = models.JSONField(default=dict, help_text="Mapping of region to listener count")
    retention_graph = models.JSONField(default=dict, help_text="Drop-off points")

    class Meta:
        unique_together = ('creator', 'date')
