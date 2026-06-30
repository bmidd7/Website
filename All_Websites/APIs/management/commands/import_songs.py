import csv
import re
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand

from APIs.models import Music

_SIZE_RE = re.compile(r"^\s*([0-9]+(?:\.[0-9]+)?)\s*(KB|MB|GB)\s*$", re.IGNORECASE)
_BITRATE_RE = re.compile(r"^\s*([0-9]+(?:\.[0-9]+)?)\s*kbps\s*$", re.IGNORECASE)


class Command(BaseCommand):
    help = "Import songs from List of Songs.csv (best-effort placeholders for missing metadata)."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", type=str)
        parser.add_argument("--limit", type=int, default=0, help="Stop after importing N rows (0 = all).")
        parser.add_argument("--dry-run", action="store_true", help="Parse and show what would be imported without writing.")

    def parse_size_mb(self, value: str) -> Decimal:
        raw = str(value).strip()
        m = _SIZE_RE.match(raw)
        if not m:
            return Decimal("0.000")
        num = Decimal(m.group(1))
        unit = m.group(2).upper()
        if unit == "KB":
            return (num / 1024).quantize(Decimal("0.001"))
        if unit == "GB":
            return (num * 1024).quantize(Decimal("0.001"))
        return num.quantize(Decimal("0.001"))

    def parse_bitrate_kbps(self, value: str) -> Decimal:
        raw = str(value).strip()
        m = _BITRATE_RE.match(raw)
        if not m:
            return Decimal("0.000")
        return Decimal(m.group(1)).quantize(Decimal("0.001"))

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
                name = row.get("Name", "")
                if not name:
                    continue

                bitrate_kbps = self.parse_bitrate_kbps(row.get("Bitrate", ""))
                size_mb = self.parse_size_mb(row.get("Size", ""))

                # best-effort parse: "artist - title.ext"
                base = name.rsplit(".", 1)[0]
                if " - " in base:
                    artist, title = base.split(" - ", 1)
                else:
                    artist, title = "Unknown", base

                if dry_run:
                    self.stdout.write(f"DRY RUN: {artist} - {title}")
                else:
                    obj, created = Music.objects.get_or_create(
                        file_path=name,
                        defaults={
                            "title": title[:200],
                            "version": "",
                            "artist": artist[:255],
                            "album": "",
                            "release_date": date(1900, 1, 1),
                            "musicbrainz_recording_id": "",
                            "musicbrainz_album_id": "",
                            "album_artist": artist[:255],
                            "tracknumber": 0,
                            "disknumber": 1,
                            "label": "",
                            "channels": 2,
                            "is_compilation": False,
                            "bpm": None,
                            "codec": "",
                            "is_lossless": False,
                            "duration": timedelta(minutes=0),
                            "bitrate": bitrate_kbps,
                            "sample_rate_hz": 0,
                            "bit_depth": 0,
                            "file_ext": name.rsplit(".", 1)[-1].lower() if "." in name else "",
                            "file_size_mb": size_mb,
                            "source": "",
                            "notes": "",
                        },
                    )
                    status = self.style.SUCCESS("Created") if created else self.style.WARNING("Exists")
                    self.stdout.write(f"{status}: {obj.artist} - {obj.title}")

                imported += 1
                if limit and imported >= limit:
                    break
