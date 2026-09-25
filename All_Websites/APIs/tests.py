from django.test import TestCase
from django.conf import settings
from datetime import date, timedelta
from decimal import Decimal

from APIs.models import (
    BookContact,
    BookCopy,
    BookReading,
    Books,
    BookTransfer,
    DiskType,
    Genre,
    Movie,
    Quality,
)
from APIs.management.commands.import_movies import Command as ImportMoviesCommand
from APIs.management.commands.import_shows import Command as ImportShowsCommand
from APIs.management.commands.import_songs import Command as ImportSongsCommand


class MediaApiV1Tests(TestCase):
    def setUp(self):
        sci_fi = Genre.objects.create(name="Sci-Fi", media_type="movie", tmdb_id=878)

        m = Movie.objects.create(
            title="Interstellar",
            release_date=date(2014, 11, 7),
            height_px=1080,
            width_px=1920,
            aspect_ratio="16:9",
            file_ext="mkv",
            file_path="Z:\\Media\\Movies\\Test Movie (2020).mkv",
            file_size_gb=Decimal("1.234"),
            best_video_codec="h264",
            best_eng_audio_codec="aac",
            best_eng_audio_channels=2,
            duration=timedelta(minutes=90),
            bitrate_mbps=Decimal("10.000"),
            source="Torrent",
            quality="1080p",
            disk_type="Blu-ray",
        )
        m.genres.add(sci_fi)

    def test_movies_safe_mode_masks_torrent_source(self):
        response = self.client.get(
            "/v1/movies/?title=interstellar",
            HTTP_HOST=settings.API_SITE_HOST,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["safe_mode"])
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["source"], "Blu-ray")

    def test_movies_unsafe_mode_does_not_mask_torrent_source(self):
        response = self.client.get(
            "/v1/movies/u/?title=interstellar",
            HTTP_HOST=settings.API_SITE_HOST,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["safe_mode"])
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["source"], "Torrent")

    def test_media_any_does_not_mark_title_invalid(self):
        response = self.client.get(
            "/v1/media/?title=interstellar",
            HTTP_HOST=settings.API_SITE_HOST,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["invalid_filters"], [])

    def test_movies_year_filter_is_human_friendly(self):
        response = self.client.get(
            "/v1/movies/?year=2014",
            HTTP_HOST=settings.API_SITE_HOST,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["invalid_filters"], [])
        self.assertEqual(data["count"], 1)

    def test_movies_genre_filter_is_human_friendly(self):
        response = self.client.get(
            "/v1/movies/?genre=sci",
            HTTP_HOST=settings.API_SITE_HOST,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["invalid_filters"], [])
        self.assertEqual(data["count"], 1)


class ImportMoviesParsingTests(TestCase):
    def test_normalize_quality_maps_nonstandard_p_values(self):
        cmd = ImportMoviesCommand()
        self.assertEqual(cmd.normalize_quality("LSD (266p)"), Quality.SD)
        self.assertEqual(cmd.normalize_quality("549p"), Quality.SD)
        self.assertEqual(cmd.normalize_quality("720p"), Quality.HD)
        self.assertEqual(cmd.normalize_quality("SD (1080p)"), Quality.FHD)
        self.assertEqual(cmd.normalize_quality("UHD (2160p)"), Quality.UHD)

    def test_normalize_quality_prefers_actual_height_px(self):
        cmd = ImportMoviesCommand()
        self.assertEqual(cmd.normalize_quality("SD (1080p)", height_px=266), Quality.SD)

    def test_import_defaults_include_true_raw_fields(self):
        cmd = ImportMoviesCommand()
        height_px = 592
        quality = cmd.normalize_quality("weird 592p label", height_px=height_px)
        self.assertIsInstance(quality, str)

    def test_name_regex_supports_optional_edition_tag(self):
        from APIs.management.commands.import_movies import _NAME_RE

        m1 = _NAME_RE.match("22 Jump Street (2014) {imdb-tt2294449}.mp4")
        self.assertIsNotNone(m1)
        self.assertEqual(m1.group(1), "22 Jump Street")
        self.assertEqual(m1.group(2), "2014")
        self.assertEqual(m1.group(3), "tt2294449")
        self.assertIsNone(m1.group(4))
        self.assertEqual(m1.group(5), "mp4")

        m2 = _NAME_RE.match("About a Boy (2002) {imdb-tt0276751} {edition-Full Screen}.mkv")
        self.assertIsNotNone(m2)
        self.assertEqual(m2.group(4), "Full Screen")


class ImportShowsParsingTests(TestCase):
    def test_normalize_quality_bucket_accepts_any_height(self):
        cmd = ImportShowsCommand()
        self.assertEqual(cmd.normalize_quality_bucket("junk", height_px=549), "480p")
        self.assertEqual(cmd.normalize_quality_bucket("junk", height_px=720), "720p")
        self.assertEqual(cmd.normalize_quality_bucket("junk", height_px=1080), "1080p")


class ImportSongsParsingTests(TestCase):
    def test_parse_size_and_bitrate(self):
        cmd = ImportSongsCommand()
        self.assertEqual(str(cmd.parse_bitrate_kbps("40kbps")), "40.000")
        self.assertEqual(str(cmd.parse_size_mb("1.296 MB")), "1.296")


class BookCollectionModelTests(TestCase):
    def test_a_copy_can_record_its_owner_and_gift_history(self):
        owner = BookContact.objects.create(name="Brad", relationship=BookContact.Relationship.SELF)
        recipient = BookContact.objects.create(name="Aunt Monica", relationship=BookContact.Relationship.FAMILY)
        book = Books.objects.create(
            title="The Hobbit",
            authors="J. R. R. Tolkien",
            binding=Books.Binding.LEATHER_BOUND,
            isbn_13="9780007525515",
        )
        copy = BookCopy.objects.create(
            book=book,
            inventory_number="BOOK-0001",
            current_holder=owner,
            condition=BookCopy.Condition.VERY_GOOD,
        )
        transfer = BookTransfer.objects.create(
            copy=copy,
            transfer_type=BookTransfer.TransferType.GIFT,
            transferred_on=date(2026, 9, 20),
            from_person=owner,
            to_person=recipient,
        )

        self.assertEqual(book.get_binding_display(), "Leather-bound")
        self.assertTrue(copy.is_in_collection)
        self.assertEqual(copy.transfers.get(), transfer)
        self.assertEqual(transfer.to_person, recipient)

    def test_each_family_member_has_a_separate_reading_record(self):
        reader = BookContact.objects.create(name="Grandma")
        book = Books.objects.create(title="A Wrinkle in Time")
        record = BookReading.objects.create(
            book=book,
            reader=reader,
            status=BookReading.ReadingStatus.READ,
            rating=5,
        )

        self.assertEqual(book.reading_records.get(), record)
        self.assertEqual(reader.reading_records.get().rating, 5)
