import csv
import re
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand

from APIs.models import DiskType, TVEpisode, TVSeries

_PX_RE = re.compile(r"(\d+)")
_EXT_RE = re.compile(r"\.([a-z0-9]{2,5})$", re.IGNORECASE)
_P_RES_RE = re.compile(r"(\d{3,4})\s*p\b", re.IGNORECASE)


class Command(BaseCommand):
    help = "Import TV series + episodes from List of Shows.csv"

    def add_arguments(self, parser):
        parser.add_argument("csv_path", type=str)
        parser.add_argument("--limit", type=int, default=0, help="Stop after importing N rows (0 = all).")
        parser.add_argument("--dry-run", action="store_true", help="Parse and show what would be imported without writing.")

    def parse_px(self, value: str) -> int:
        m = _PX_RE.search(str(value))
        if not m:
            raise ValueError(f"Unparseable px value: {value!r}")
        return int(m.group(1))

    def parse_size_gb(self, value: str) -> Decimal:
        raw = str(value).strip()
        size_val, size_unit = raw.rsplit(" ", 1)
        size = Decimal(size_val)
        unit = size_unit.upper()
        if unit == "MB":
            return (size / 1024).quantize(Decimal("0.001"))
        return size.quantize(Decimal("0.001"))

    def normalize_quality_bucket(self, raw_quality: str, *, height_px: int | None = None) -> str:
        px: int | None = height_px
        if px is None:
            m = _P_RES_RE.search(str(raw_quality))
            if m:
                px = int(m.group(1))
        if px is None:
            return "480p"
        if px >= 1800:
            return "2160p"
        if px >= 900:
            return "1080p"
        if px >= 600:
            return "720p"
        return "480p"

    def guess_disk_type(self, raw_source: str) -> str:
        s = str(raw_source).strip().lower()
        if "uhd" in s:
            return DiskType.UHD_Blu_Ray
        if "blu" in s:
            return DiskType.Blu_Ray
        if "dvd" in s:
            return DiskType.DVD
        return DiskType.Blu_Ray

    def handle(self, *args, **kwargs):
        csv_path = kwargs["csv_path"]
        limit: int = kwargs["limit"] or 0
        dry_run: bool = kwargs["dry_run"]

        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            reader.fieldnames = [h.strip() for h in reader.fieldnames]

            imported = 0
            for row in reader:
                row = {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}

                series_title = row.get("Show Name", "")
                episode_file = row.get("Episode Name", "")
                season_str = row.get("Season", "0")
                episode_str = row.get("Episode", "0")

                if not series_title or not episode_file:
                    continue

                season_number = int(season_str)
                ep_number = int(episode_str)

                height_px = self.parse_px(row.get("Height", ""))
                width_px = self.parse_px(row.get("Width", ""))
                aspect_ratio = row.get("Aspect Ratio", "")

                size_gb = self.parse_size_gb(row.get("Size", "0 GB"))
                encoded = str(row.get("Encoded?", "")).lower() in {"yes", "true", "1"}

                source = row.get("Source", "")
                disk_type = self.guess_disk_type(source)

                # derive title/ext
                ext = "mkv"
                mext = _EXT_RE.search(episode_file)
                if mext:
                    ext = mext.group(1).lower()
                ep_title = episode_file.rsplit(".", 1)[0]

                quality_bucket = self.normalize_quality_bucket(row.get("Quality", ""), height_px=height_px)

                if dry_run:
                    self.stdout.write(f"DRY RUN: {series_title} S{season_number:02d}E{ep_number:02d} {ep_title}")
                else:
                    series_obj, _ = TVSeries.objects.get_or_create(
                        title=series_title,
                        defaults={
                            "imdb_id": "",
                            "tmdb_id": None,
                            "initial_release_date": date(1900, 1, 1),
                        },
                    )

                    ep_obj, created = TVEpisode.objects.get_or_create(
                        series=series_obj,
                        season_number=season_number,
                        ep_number=ep_number,
                        defaults={
                            "ep_title": ep_title,
                            "release_date": date(1900, 1, 1),
                            "edition": "",
                            "ep_imdb_id": "",
                            "ep_tmdb_id": None,
                            "director": None,
                            "hdr_format": "",
                            "frame_rate": None,
                            "color_space": "",
                            "audio_track_count": 1,
                            "has_subtitles": False,
                            "height_px": height_px,
                            "width_px": width_px,
                            "aspect_ratio": aspect_ratio,
                            "quality": quality_bucket,
                            "file_ext": ext,
                            "file_path": episode_file,
                            "file_size_gb": size_gb,
                            "best_video_codec": "",
                            "best_eng_audio_codec": "",
                            "best_eng_audio_channels": 0,
                            "duration": timedelta(minutes=0),
                            "bitrate_mbps": Decimal("0"),
                            "has_been_encoded": encoded,
                            "disk_type": disk_type,
                            "source": source,
                            "notes": "",
                        },
                    )

                    status = self.style.SUCCESS("Created") if created else self.style.WARNING("Exists")
                    self.stdout.write(f"{status}: {series_title} S{season_number:02d}E{ep_number:02d}")

                imported += 1
                if limit and imported >= limit:
                    break
