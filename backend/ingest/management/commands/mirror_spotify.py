from django.core.management.base import BaseCommand
from ingest.services.spotify import SpotifyService

class Command(BaseCommand):
    help = 'Mirrors a Spotify show to local DB'

    def add_arguments(self, parser):
        parser.add_argument('show_id', type=str, help='Spotify Show ID')
        parser.add_argument('--username', type=str, help='Username to use for Spotify Token', required=False)

    def handle(self, *args, **options):
        show_id = options['show_id']
        username = options.get('username')
        self.stdout.write(f"Starting mirror for show: {show_id}")
        
        user = None
        if username:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(username=username)
                self.stdout.write(f"Using Spotify token for user: {user.username}")
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"User {username} not found. Falling back to client credentials."))

        try:
            service = SpotifyService(user=user)
            service.mirror_show(show_id)
            self.stdout.write(self.style.SUCCESS(f'Successfully mirrored show {show_id}'))
        except Exception as e:
            import traceback
            self.stdout.write(self.style.ERROR(f'Error mirroring show: {str(e)}'))
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
