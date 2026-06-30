from django.core.management.base import BaseCommand
from APIs.models import Genre

GENRES = {
    'movie': [
        ('Action', 28), ('Adventure', 12), ('Animation', 16), ('Comedy', 35),
        ('Crime', 80), ('Documentary', 99), ('Drama', 18), ('Family', 10751),
        ('Fantasy', 14), ('History', 36), ('Horror', 27), ('Music', 10402),
        ('Mystery', 9648), ('Romance', 10749), ('Science Fiction', 878),
        ('Thriller', 53), ('War', 10752), ('Western', 37),
    ],
    'tv': [
        ('Action & Adventure', 10759), ('Animation', 16), ('Comedy', 35),
        ('Crime', 80), ('Documentary', 99), ('Drama', 18), ('Family', 10751),
        ('Kids', 10762), ('Mystery', 9648), ('News', 10763), ('Reality', 10764),
        ('Sci-Fi & Fantasy', 10765), ('Soap', 10766), ('Talk', 10767),
        ('War & Politics', 10768), ('Western', 37),
    ],
    'music': [
        ('Alternative', None), ('Ambient', None), ('Blues', None),
        ('Classical', None), ('Country', None), ('Dance', None),
        ('Electronic', None), ('Folk', None), ('Gospel', None),
        ('Hip-Hop', None), ('Indie', None), ('Jazz', None),
        ('K-Pop', None), ('Latin', None), ('Metal', None),
        ('New Age', None), ('Opera', None), ('Pop', None),
        ('Punk', None), ('R&B', None), ('Reggae', None),
        ('Rock', None), ('Soul', None), ('Soundtrack', None),
        ('World', None),
    ],
}

class Command(BaseCommand):
    help = 'Seed genre data'

    def handle(self, *args, **kwargs):
        for media_type, genres in GENRES.items():
            for name, tmdb_id in genres:
                obj, created = Genre.objects.get_or_create(
                    name=name,
                    media_type=media_type,
                    defaults={'tmdb_id': tmdb_id}
                )
                if created:
                    self.stdout.write(f"Created: {obj}")
                else:
                    self.stdout.write(f"Already exists: {obj}")