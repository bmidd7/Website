from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

# Create your models here.
class API_results(models.Model):
    API = models.CharField(max_length=50)
    Date = models.DateField()
    Source = models.CharField(max_length=50)

# region Media
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
#endregion

class Coins(models.Model):
    Country = models.CharField()
    Country_Code = models.CharField(max_length=3)
    Issuing_Authority = models.CharField()
    Issuing_Mint = models.CharField()
    Mint_Mark = models.CharField()

    Year = models.CharField()
    Currency = models.CharField()
    Denomination = models.CharField()

    Coin_Name = models.CharField()
    Coin_Series = models.CharField()
    Type = models.CharField()

    Composition = models.TextField()
    Main_Metal = models.CharField()
    Weight = models.CharField()
    Diameter = models.CharField()
    Thickness = models.CharField()

    Shape = models.CharField()
    Edge = models.CharField()

    Obverse_Design = models.CharField()
    Reverse_Design = models.CharField()
      

    #Pics
    # Obverse_Pic = 
    # Reverse_Pic = 

class BookContact(models.Model):
    """A household member or other person connected to the book collection."""

    class Relationship(models.TextChoices):
        SELF = "self", "Me"
        FAMILY = "family", "Family member"
        FRIEND = "friend", "Friend"
        ORGANIZATION = "organization", "Organization"
        OTHER = "other", "Other"

    name = models.CharField(max_length=150)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="book_contact",
        help_text="Optionally link this person to a website account.",
    )
    relationship = models.CharField(
        max_length=20,
        choices=Relationship.choices,
        default=Relationship.FAMILY,
    )
    email = models.EmailField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Books(models.Model):
    """A catalog record for a particular book edition, rather than one copy."""

    class Binding(models.TextChoices):
        HARDCOVER = "hardcover", "Hardcover"
        PAPERBACK = "paperback", "Paperback"
        LEATHER_BOUND = "leather_bound", "Leather-bound"
        CLOTH_BOUND = "cloth_bound", "Cloth-bound"
        PERFECT_BOUND = "perfect_bound", "Perfect-bound"
        SADDLE_STITCHED = "saddle_stitched", "Saddle-stitched"
        SPIRAL_OR_WIRE_BOUND = "spiral_or_wire_bound", "Spiral or wire-bound"
        COMB_BOUND = "comb_bound", "Comb-bound"
        BOARD_BOOK = "board_book", "Board book"
        LOOSE_LEAF = "loose_leaf", "Loose-leaf"
        BOXED_SET = "boxed_set", "Boxed set"
        EBOOK = "ebook", "eBook"
        AUDIOBOOK = "audiobook", "Audiobook"
        OTHER = "other", "Other"

    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, default="")
    authors = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Use a semicolon between multiple authors.",
    )
    contributors = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Illustrators, editors, translators, narrators, and so on.",
    )
    description = models.TextField(blank=True, default="")
    series_name = models.CharField(max_length=255, blank=True, default="")
    series_number = models.CharField(max_length=30, blank=True, default="")
    volume_number = models.CharField(max_length=30, blank=True, default="")

    edition = models.CharField(max_length=100, blank=True, default="")
    printing = models.CharField(max_length=100, blank=True, default="")
    publisher = models.CharField(max_length=255, blank=True, default="")
    imprint = models.CharField(max_length=255, blank=True, default="")
    publication_date = models.DateField(null=True, blank=True)
    original_publication_date = models.DateField(null=True, blank=True)
    copyright_year = models.PositiveSmallIntegerField(null=True, blank=True)
    language = models.CharField(max_length=100, blank=True, default="")
    original_language = models.CharField(max_length=100, blank=True, default="")
    page_count = models.PositiveIntegerField(null=True, blank=True)

    isbn_10 = models.CharField(max_length=20, blank=True, default="")
    isbn_13 = models.CharField(max_length=20, blank=True, default="")
    oclc_number = models.CharField(max_length=30, blank=True, default="")
    library_of_congress_number = models.CharField(max_length=50, blank=True, default="")
    open_library_id = models.CharField(max_length=50, blank=True, default="")
    goodreads_id = models.CharField(max_length=50, blank=True, default="")

    binding = models.CharField(
        max_length=25,
        choices=Binding.choices,
        blank=True,
        default="",
    )
    cover_material = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="For example: paper, cloth, genuine leather, or faux leather.",
    )
    dimensions = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="For example: 8.5 x 11 in.",
    )
    weight_oz = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    genres = models.CharField(max_length=500, blank=True, default="")
    subjects = models.CharField(max_length=1000, blank=True, default="")
    is_illustrated = models.BooleanField(default=False)
    cover_image_url = models.URLField(blank=True, default="")
    cover_primary_color = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Most prominent cover color; use a CSS color name or hex value.",
    )
    cover_secondary_color = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Second-most prominent cover color.",
    )
    cover_tertiary_color = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Third-most prominent cover color.",
    )
    cover_quaternary_color = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Fourth-most prominent cover color.",
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title", "edition", "publication_date"]

    def __str__(self):
        return f"{self.title}{f' ({self.edition})' if self.edition else ''}"

    def clean(self):
        super().clean()
        colors = [
            self.cover_primary_color,
            self.cover_secondary_color,
            self.cover_tertiary_color,
            self.cover_quaternary_color,
        ]
        filled = [bool(color.strip()) for color in colors]
        if any(filled) and sum(filled) < 2:
            raise ValidationError("Provide at least two cover colors when adding a color scheme.")
        if any(filled[index] and not all(filled[:index]) for index in range(1, len(filled))):
            raise ValidationError("Cover colors must be entered from primary to quaternary without gaps.")


class BookCopy(models.Model):
    """One physical or digital copy of a catalogued book."""

    class CollectionStatus(models.TextChoices):
        IN_COLLECTION = "in_collection", "In our collection"
        LENT_OUT = "lent_out", "Lent out"
        GIFTED = "gifted", "Given as a gift"
        SOLD = "sold", "Sold"
        DONATED = "donated", "Donated"
        LOST = "lost", "Lost"
        DISCARDED = "discarded", "Discarded"

    class Condition(models.TextChoices):
        NEW = "new", "New"
        LIKE_NEW = "like_new", "Like new"
        VERY_GOOD = "very_good", "Very good"
        GOOD = "good", "Good"
        FAIR = "fair", "Fair"
        POOR = "poor", "Poor"
        DAMAGED = "damaged", "Damaged"

    class AcquisitionMethod(models.TextChoices):
        PURCHASED = "purchased", "Purchased"
        GIFT_RECEIVED = "gift_received", "Gift received"
        INHERITED = "inherited", "Inherited"
        BORROWED = "borrowed", "Borrowed"
        DONATED_TO_US = "donated_to_us", "Donated to us"
        FOUND = "found", "Found"
        OTHER = "other", "Other"

    book = models.ForeignKey(Books, on_delete=models.CASCADE, related_name="copies")
    inventory_number = models.CharField(max_length=100, null=True, blank=True, unique=True)
    barcode = models.CharField(max_length=100, blank=True, default="")
    current_holder = models.ForeignKey(
        BookContact,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="books_currently_holding",
        help_text="The person who currently has this copy.",
    )
    collection_status = models.CharField(
        max_length=20,
        choices=CollectionStatus.choices,
        default=CollectionStatus.IN_COLLECTION,
    )
    current_location = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="For example: home office, attic, or Jane's house.",
    )
    shelf_location = models.CharField(max_length=100, blank=True, default="")
    condition = models.CharField(
        max_length=20,
        choices=Condition.choices,
        blank=True,
        default="",
    )
    has_dust_jacket = models.BooleanField(default=False)
    dust_jacket_condition = models.CharField(
        max_length=20,
        choices=Condition.choices,
        blank=True,
        default="",
    )
    is_signed = models.BooleanField(default=False)
    signed_by = models.CharField(max_length=255, blank=True, default="")
    inscription = models.TextField(blank=True, default="")
    personalized_to = models.CharField(max_length=255, blank=True, default="")
    acquisition_method = models.CharField(
        max_length=20,
        choices=AcquisitionMethod.choices,
        blank=True,
        default="",
    )
    acquired_from = models.ForeignKey(
        BookContact,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="books_acquired_from_them",
    )
    acquired_on = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estimated_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="USD")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["book__title", "inventory_number"]

    @property
    def is_in_collection(self):
        return self.collection_status == self.CollectionStatus.IN_COLLECTION

    def __str__(self):
        identifier = self.inventory_number or (f"copy {self.pk}" if self.pk else "new copy")
        return f"{self.book} — {identifier}"


class BookAutograph(models.Model):
    """One autograph or inscription contained in a particular book copy."""

    class SignerRole(models.TextChoices):
        AUTHOR = "author", "Author"
        ILLUSTRATOR = "illustrator", "Illustrator"
        EDITOR = "editor", "Editor"
        TRANSLATOR = "translator", "Translator"
        NARRATOR = "narrator", "Narrator"
        SUBJECT = "subject", "Book subject"
        OTHER = "other", "Other"

    copy = models.ForeignKey(BookCopy, on_delete=models.CASCADE, related_name="autographs")
    signer = models.CharField(max_length=255)
    signer_role = models.CharField(
        max_length=20,
        choices=SignerRole.choices,
        blank=True,
        default="",
    )
    signed_on = models.DateField(null=True, blank=True)
    location = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="For example: title page, front endpaper, or dust jacket.",
    )
    is_inscribed = models.BooleanField(default=False)
    inscription = models.TextField(blank=True, default="")
    personalized_to = models.CharField(max_length=255, blank=True, default="")
    is_authenticated = models.BooleanField(default=False)
    provenance = models.TextField(
        blank=True,
        default="",
        help_text="How the autograph was obtained or authenticated.",
    )
    image_url = models.URLField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["signer", "location", "id"]

    def __str__(self):
        return f"{self.copy}: {self.signer} autograph"


class BookTransfer(models.Model):
    """A dated record of a loan, gift, sale, donation, or return for a copy."""

    class TransferType(models.TextChoices):
        LOAN = "loan", "Loaned"
        RETURN = "return", "Returned"
        GIFT = "gift", "Given as a gift"
        SALE = "sale", "Sold"
        DONATION = "donation", "Donated"
        TRANSFER = "transfer", "Transferred"

    copy = models.ForeignKey(BookCopy, on_delete=models.CASCADE, related_name="transfers")
    transfer_type = models.CharField(max_length=20, choices=TransferType.choices)
    transferred_on = models.DateField()
    from_person = models.ForeignKey(
        BookContact,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="book_transfers_sent",
    )
    to_person = models.ForeignKey(
        BookContact,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="book_transfers_received",
    )
    due_back_on = models.DateField(null=True, blank=True)
    returned_on = models.DateField(null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="USD")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-transferred_on", "-id"]

    def __str__(self):
        recipient = f" to {self.to_person}" if self.to_person else ""
        return f"{self.copy}: {self.get_transfer_type_display()}{recipient}"


class BookReading(models.Model):
    """Optional reading progress, rating, and notes for each family member."""

    class ReadingStatus(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        READING = "reading", "Reading"
        READ = "read", "Read"
        DID_NOT_FINISH = "did_not_finish", "Did not finish"
        REFERENCE = "reference", "Reference only"

    book = models.ForeignKey(Books, on_delete=models.CASCADE, related_name="reading_records")
    reader = models.ForeignKey(BookContact, on_delete=models.CASCADE, related_name="reading_records")
    status = models.CharField(
        max_length=20,
        choices=ReadingStatus.choices,
        default=ReadingStatus.NOT_STARTED,
    )
    started_on = models.DateField(null=True, blank=True)
    finished_on = models.DateField(null=True, blank=True)
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    review = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["reader__name", "book__title"]
        constraints = [
            models.UniqueConstraint(fields=["book", "reader"], name="unique_book_reading_per_reader"),
            models.CheckConstraint(
                condition=models.Q(rating__isnull=True) | models.Q(rating__lte=5),
                name="book_reading_rating_at_most_five",
            ),
        ]

    def __str__(self):
        return f"{self.reader}: {self.book}"
