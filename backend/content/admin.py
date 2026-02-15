from django.contrib import admin
from .models import Podcast, Episode, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')

@admin.register(Podcast)
class PodcastAdmin(admin.ModelAdmin):
    list_display = ('title', 'remote_id', 'creator', 'last_ingested_at')
    search_fields = ('title', 'description', 'remote_id')
    readonly_fields = ('id', 'created_at')

@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ('title', 'podcast', 'remote_id', 'published_at', 'duration')
    search_fields = ('title', 'description', 'podcast__title')
    list_filter = ('published_at', 'is_downloadable')
