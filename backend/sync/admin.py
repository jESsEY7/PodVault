from django.contrib import admin
from .models import OfflineEvent, ListeningSession, UserProgress

@admin.register(OfflineEvent)
class OfflineEventAdmin(admin.ModelAdmin):
    list_display = ('user', 'event_type', 'episode_id', 'timestamp', 'duration')
    list_filter = ('event_type', 'timestamp')
    search_fields = ('user__username', 'episode_id')

@admin.register(ListeningSession)
class ListeningSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'episode', 'duration_seconds', 'verified_at', 'processed_for_earnings')
    list_filter = ('processed_for_earnings', 'verified_at')
    search_fields = ('user__username', 'episode__title')

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'episode', 'timestamp_seconds', 'updated_at')
