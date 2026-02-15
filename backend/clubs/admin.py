from django.contrib import admin
from .models import Club, ClubRecommendation

@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(ClubRecommendation)
class ClubRecommendationAdmin(admin.ModelAdmin):
    list_display = ('club', 'episode', 'relevance_score', 'created_at')
    list_filter = ('club', 'created_at')
    ordering = ('-relevance_score',)
