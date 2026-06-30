from django.db import models

# Create your models here.
class API_results(models.Model):
    API = models.CharField(max_length=50)
    Date = models.DateField()
    Source = models.CharField(max_length=50)


class Rating(models.TextChoices):
    General = 'G', 'G'
    Suggested_Guidance = 'PG', 'PG'
    Guidance = 'PG-13', 'PG-13'
    Restricted = 'R', 'R'
    Adults = 'NC-17', 'NC-17'

class Quality(models.TextChoices):
    UHD   = '2160p', '2160p'
    FHD   = '1080p', '1080p'
    HD    = '720p',  '720p'
    SD    = '480p',  '480p'

class DiskType(models.TextChoices):
        UHD_Blu_Ray = 'UHD_Blu_Ray',  'UHD Blu-ray'
        Blu_Ray     = 'Blu_Ray',      'Blu-ray'
        DVD         = 'DVD',          'DVD'

class MovieSource(models.TextChoices):
    Grandparents = "Grandparents", "Grandparents"
    Grandpa = "Grandpa", "Grandpa"
    Grandma = "Grandma", "Grandma"
    Uncle_Monica = "Uncle/Monica", "Uncle/Monica"
    Uncle = "Uncle", "Uncle"
    Monica = "Monica", "Monica"
    Us = "Us", "Us"
    Auntie = "Auntie", "Auntie"
    Frank = "Frank", "Frank"
    Torrent = "Torrent", "Torrent"
    Unknown = "N/A", "N/A"



class Person(models.Model):
    name = models.CharField(max_length=100)
    imdb_id = models.CharField(max_length=15, blank=True, default='')
    tmdb_id = models.IntegerField(null=True, blank=True)
    
    birth_date = models.DateField(null=True, blank=True)
    death_date = models.DateField(null=True, blank=True)
    biography = models.TextField(blank=True, default='')

    def __str__(self):
        return self.name

class Genre(models.Model):
    class MediaType(models.TextChoices):
        MOVIE = 'movie', 'Movie'
        TV    = 'tv',    'TV'
        MUSIC = 'music', 'Music'

    name       = models.CharField(max_length=50)
    media_type = models.CharField(max_length=10, choices=MediaType.choices)
    tmdb_id    = models.IntegerField(null=True, blank=True)  # null for music

    class Meta:
        unique_together = ('name', 'media_type')
    

class Movie(models.Model):
    title = models.CharField(max_length=255)
    release_date = models.DateField()
    edition = models.CharField(max_length=50, blank=True, null=True)

    still_have_it = models.BooleanField(default=True)

    director = models.ForeignKey(
        'Person', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='directed_movies'
    )
    cast = models.ManyToManyField('Person', blank=True, related_name='appeared_in_movies')
    genres = models.ManyToManyField(
        'Genre',
        blank=True,
        limit_choices_to={'media_type': 'movie'}
    )

    imdb_id = models.CharField(max_length=15, blank=True, default='')
    tmdb_id = models.IntegerField(null=True, blank=True)

    height_px = models.IntegerField()
    width_px = models.IntegerField()
    aspect_ratio = models.CharField(max_length=10, null=True)

    file_ext = models.CharField(max_length=5, default="mkv")
    file_path = models.CharField(max_length=150)
    file_size_gb = models.DecimalField(max_digits=8, decimal_places=3)
    added_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    best_video_codec = models.CharField(max_length=25)
    best_eng_audio_codec = models.CharField(max_length=25)
    best_eng_audio_channels = models.IntegerField()

    hdr_format = models.CharField(max_length=20, blank=True, default='')
    frame_rate = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    color_space = models.CharField(max_length=20, blank=True, default='')
    audio_track_count = models.IntegerField(default=1)
    has_subtitles = models.BooleanField(default=False)

    duration = models.DurationField()
    bitrate_mbps = models.DecimalField(max_digits=8, decimal_places=3)
    has_been_encoded = models.BooleanField(default=False)
    source = models.CharField(max_length=50, choices=MovieSource.choices, default="", blank=True)

    quality   = models.CharField(max_length=20, blank=True, default="", null=True)
    disk_type = models.CharField(max_length=30, blank=True, default="")


    content_rating = models.CharField(max_length=20, blank=True, default="")
    overview = models.TextField(blank=True, default='')
    tagline = models.CharField(max_length=255, blank=True, default='')
    original_language = models.CharField(max_length=10, blank=True, default='')

    notes = models.TextField(blank=True, default='')

    def save(self, *args, **kwargs):
        # Convert "Nonepx" to 0 for height and width
        if str(self.height_px) == "Nonepx" or str(self.height_px) == "None":
            self.height_px = 0
        if str(self.width_px) == "Nonepx" or str(self.width_px) == "None":
            self.width_px = 0
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('title', 'edition')


class TVSeries(models.Model):
    title = models.CharField(max_length=255)
    imdb_id = models.CharField(max_length=15, blank=True, default='')
    tmdb_id = models.IntegerField(null=True, blank=True)

    still_have_it = models.BooleanField(default=True)

    class Status(models.TextChoices):
        ONGOING   = 'ongoing',   'Ongoing'
        ENDED     = 'ended',     'Ended'
        CANCELLED = 'cancelled', 'Cancelled'
        HIATUS    = 'hiatus',    'On Hiatus'

    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ONGOING)
    
    initial_release_date = models.DateField()
    added_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    notes = models.TextField(blank=True, default='')
    overview = models.TextField(blank=True, default='')
    total_seasons = models.IntegerField(null=True, blank=True)

    genres = models.ManyToManyField(
        'Genre',
        blank=True,
        limit_choices_to={'media_type': 'tv'}
    )

class TVEpisode(models.Model):
    series = models.ForeignKey(TVSeries, on_delete=models.CASCADE, related_name="episodes")
    ep_title = models.CharField(max_length=255)
    season_number = models.IntegerField()
    ep_number = models.IntegerField()
    release_date = models.DateField()
    edition = models.CharField(max_length=50, blank=True, null=True)
    
    still_have_it = models.BooleanField(default=True)

    ep_imdb_id = models.CharField(max_length=15, blank=True, default='')
    ep_tmdb_id = models.IntegerField(null=True, blank=True)

    director = models.ForeignKey(
        'Person', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='directed_episodes'
    )
    hdr_format = models.CharField(max_length=20, blank=True, default='')
    frame_rate = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    color_space = models.CharField(max_length=20, blank=True, default='')
    audio_track_count = models.IntegerField(default=1)
    has_subtitles = models.BooleanField(default=False)

    height_px = models.IntegerField()
    width_px = models.IntegerField()
    aspect_ratio = models.CharField(max_length=10)
    quality = models.CharField(max_length=10)

    file_ext = models.CharField(max_length=5, default="mkv")
    file_path = models.CharField(max_length=150)
    file_size_gb = models.DecimalField(max_digits=8, decimal_places=3)
    added_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    best_video_codec = models.CharField(max_length=25)
    best_eng_audio_codec = models.CharField(max_length=25)
    best_eng_audio_channels = models.IntegerField()
    duration = models.DurationField()
    bitrate_mbps = models.DecimalField(max_digits=8, decimal_places=3)
    has_been_encoded = models.BooleanField(default=False)
    disk_type = models.CharField(max_length=15)
    source = models.CharField(max_length=90, default="", blank=True)

    notes = models.TextField(blank=True, default='')

    def save(self, *args, **kwargs):
        # Convert "Nonepx" to 0 for height and width
        if self.height_px == "Nonepx" or str(self.height_px) == "Nonepx":
            self.height_px = 0
        if self.width_px == "Nonepx" or str(self.width_px) == "Nonepx":
            self.width_px = 0
        super().save(*args, **kwargs)


class Music(models.Model):
    title = models.CharField(max_length=200)
    version = models.CharField(max_length=50, blank=True, default='')
    artist = models.CharField(max_length=255)
    album = models.CharField(max_length=150)
    release_date = models.DateField()
    musicbrainz_recording_id = models.CharField(max_length=36, blank=True, default='')
    musicbrainz_album_id = models.CharField(max_length=36, blank=True, default='')
    
    still_have_it = models.BooleanField(default=True)

    album_artist = models.CharField(max_length=255)
    tracknumber = models.IntegerField()
    disknumber = models.IntegerField(default=1)
    label = models.CharField(max_length=50, blank=True)

    channels = models.IntegerField(default=2)
    is_compilation = models.BooleanField(default=False)
    bpm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    genres = models.ManyToManyField(
        'Genre',
        blank=True,
        limit_choices_to={'media_type': 'music'}
    )

    codec = models.CharField(max_length=10)
    is_lossless = models.BooleanField(default=False)
    duration = models.DurationField()
    bitrate = models.DecimalField(max_digits=8, decimal_places=3)
    sample_rate_hz = models.IntegerField()
    bit_depth = models.IntegerField()

    file_ext = models.CharField(max_length=10)
    file_path = models.CharField(max_length=150)
    file_size_mb = models.DecimalField(max_digits=8, decimal_places=3)
    added_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    source = models.CharField(max_length=50, default="", blank=True)

    notes = models.TextField(blank=True, default='')
