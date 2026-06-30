import csv
import re
import time
import requests
from decimal import Decimal
from pathlib import Path
from datetime import timedelta, date
from django.conf import settings
from django.core.management.base import BaseCommand
from APIs.models import Genre, Movie, MovieSource, Person, Quality
from APIs.services import get_video_metadata

TMDB_BASE = 'https://api.themoviedb.org/3'
_INVALID_WIN_CHARS_RE = re.compile(r'[\\/:*?"<>|]')
_NAME_RE = re.compile(
    r"^(.+?) \((\d{4})\) \{imdb-(tt\d+)\}(?: \{edition-([^}]+)\})?\.(\w+)$"
)
_PX_RE = re.compile(r"(\d+)")
_P_RES_RE = re.compile(r"\((\d{3,4})p\)", re.IGNORECASE)


class Command(BaseCommand):
    help = 'Import movies from CSV enriched with TMDB data'

    def add_arguments(self, parser):
        parser.add_argument('csv_path', type=str)
        parser.add_argument('--library-root', type=str, default=r'M:\F Films')
        parser.add_argument('--no-tmdb', action='store_true')
        parser.add_argument('--limit', type=int, default=0)
        parser.add_argument('--dry-run', action='store_true')

    def tmdb_get(self, endpoint, params=None):
        params = params or {}
        params['api_key'] = settings.TMDB_API_KEY
        r = requests.get(f'{TMDB_BASE}{endpoint}', params=params)
        r.raise_for_status()
        return r.json()

    def get_us_rating(self, release_dates):
        for country in release_dates.get('results', []):
            if country['iso_3166_1'] == 'US':
                for release in country['release_dates']:
                    if release.get('certification'):
                        return release['certification']
        return ''

    def parse_px(self, value: str) -> int:
        m = _PX_RE.search(str(value))
        if not m:
            raise ValueError(f"Unparseable px value: {value!r}")
        return int(m.group(1))

    def parse_size_gb(self, value: str) -> Decimal:
        raw = str(value).strip()
        size_val, size_unit = raw.rsplit(' ', 1)
        size = Decimal(size_val)
        if size_unit.upper() == 'MB':
            return (size / 1024).quantize(Decimal('0.001'))
        return size.quantize(Decimal('0.001'))

    def normalize_quality(self, raw_quality: str, *, height_px: int | None = None) -> str:
        raw = str(raw_quality).strip()
        px: int | None = height_px

        if px is None:
            m = _P_RES_RE.search(raw)
            if m:
                px = int(m.group(1))
            else:
                m2 = re.search(r"(\d{3,4})\s*p\b", raw, re.IGNORECASE)
                if m2:
                    px = int(m2.group(1))

        if px is not None:
            if px >= 1800:
                return Quality.UHD
            if px >= 900:
                return Quality.FHD
            if px >= 600:
                return Quality.HD
            return Quality.SD

        if raw in {q.value for q in Quality}:
            return raw
        return Quality.SD

    def infer_disk_type(self, *, height_px: int, width_px: int, aspect_ratio: str) -> str:
        if height_px >= 1800 and width_px >= 3200:
            return "UHD Blu-ray"
        if height_px >= 900 and width_px >= 1500:
            return "Blu-ray"
        if height_px >= 600 and width_px >= 1100:
            return "Blu-ray"
        if height_px in {480, 576} or width_px in {720, 704}:
            return "DVD"
        if aspect_ratio.strip() in {"4:3", "3:2"} and height_px <= 600:
            return "DVD"
        return ""

    def handle(self, *args, **kwargs):
        csv_path = kwargs['csv_path']
        library_root = kwargs['library_root']
        no_tmdb: bool = kwargs['no_tmdb']
        limit: int = kwargs['limit'] or 0
        dry_run: bool = kwargs['dry_run']

        if not no_tmdb and not getattr(settings, "TMDB_API_KEY", None):
            self.stdout.write(self.style.WARNING("TMDB_API_KEY is not set; falling back to --no-tmdb behavior."))
            no_tmdb = True

        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            reader.fieldnames = [h.strip() for h in reader.fieldnames]

            imported = 0
            for row in reader:
                row = {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}

                match = _NAME_RE.match(row['Name'])
                if not match:
                    self.stdout.write(self.style.WARNING(f"Skipping unparseable: {row['Name']}"))
                    continue

                title    = match.group(1)
                year     = int(match.group(2))
                imdb_id  = match.group(3)
                edition  = (match.group(4) or "").strip() or None
                file_ext = match.group(5)

                height_px = self.parse_px(row['Height'])
                width_px  = self.parse_px(row['Width'])
                size_gb   = self.parse_size_gb(row['Size'])

                notes: list[str] = []

                source = row.get('Source', '')
                if source and source not in {choice.value for choice in MovieSource}:
                    notes.append(f"Unknown source value '{source}'; stored blank.")
                    self.stdout.write(self.style.WARNING(f"Unknown Source '{source}' for {row['Name']}; storing blank."))
                    source = ""

                disk_type = self.infer_disk_type(height_px=height_px, width_px=width_px, aspect_ratio=row.get('Aspect Ratio', ''))
                if not disk_type:
                    notes.append(f"Could not infer disk type from resolution {width_px}x{height_px}.")

                encoded = str(row.get('Encoded?', '')).lower() in {'yes', 'true', '1'}
                quality = f"{height_px}p"
                safe_title = re.sub(r'[\\/:*?"<>|]\s*', ' ', title).strip()
                folder_name = f"{safe_title} ({year}) {{imdb-{imdb_id}}}"
                full_file_path = str(Path(library_root) / folder_name / row['Name'])
                video_metadata = get_video_metadata(full_file_path)

                if not video_metadata:
                    notes.append(f"Video metadata unavailable; ffprobe could not read '{full_file_path}'.")

                base_defaults = {
                    'title':                   title,
                    'release_date':            date(year, 1, 1),
                    'edition':                 edition,
                    'tmdb_id':                 None,
                    'overview':                '',
                    'tagline':                 '',
                    'original_language':       '',
                    'director':                None,
                    'height_px':               height_px,
                    'width_px':                width_px,
                    'aspect_ratio':            row.get('Aspect Ratio', ''),
                    'quality':                 quality,
                    'file_ext':                file_ext,
                    'file_path':               full_file_path,
                    'file_size_gb':            size_gb,
                    'has_been_encoded':        encoded,
                    'source':                  source,
                    'disk_type':               disk_type,
                    'best_video_codec':        video_metadata.get('video_codec', ''),
                    'best_eng_audio_codec':    video_metadata.get('best_eng_audio_codec', ''),
                    'best_eng_audio_channels': video_metadata.get('best_eng_audio_channels', 0),
                    'audio_track_count':       video_metadata.get('audio_track_count', 0),
                    'has_subtitles':           video_metadata.get('has_subtitles', False),
                    'hdr_format':              video_metadata.get('hdr_format', ''),
                    'frame_rate':              video_metadata.get('frame_rate', Decimal('0')),
                    'color_space':             video_metadata.get('color_space', ''),
                    'duration':                timedelta(minutes=0),
                    'bitrate_mbps':            video_metadata.get('bitrate_mbps', Decimal('0')),
                    'notes':                   '',
                }

                try:
                    if no_tmdb:
                        base_defaults['notes'] = '\n'.join(notes)
                        if dry_run:
                            self.stdout.write(f"DRY RUN: {title} ({year}) [{imdb_id}]")
                            if notes:
                                self.stdout.write(self.style.WARNING(f"  Notes: {base_defaults['notes']}"))
                        else:
                            obj, created = Movie.objects.update_or_create(imdb_id=imdb_id, defaults=base_defaults)
                            status = self.style.SUCCESS('Created') if created else self.style.SUCCESS('Updated')
                            self.stdout.write(f"{status}: {obj.title} ({year})")
                        imported += 1
                        if limit and imported >= limit:
                            break
                        continue

                    find = self.tmdb_get(f'/find/{imdb_id}', {'external_source': 'imdb_id'})
                    results = find.get('movie_results', [])

                    if not results:
                        notes.append(f"No TMDB match found for IMDB ID {imdb_id}.")
                        self.stdout.write(self.style.WARNING(f"No TMDB match: {title}"))
                        base_defaults['notes'] = '\n'.join(notes)
                        obj, created = Movie.objects.update_or_create(imdb_id=imdb_id, defaults=base_defaults)
                        status = self.style.SUCCESS('Created') if created else self.style.SUCCESS('Updated')
                        self.stdout.write(f"{status}: {title} ({year}) [no TMDB data]")
                        imported += 1
                        if limit and imported >= limit:
                            break
                        continue

                    tmdb_id = results[0]['id']

                    details = self.tmdb_get(
                        f'/movie/{tmdb_id}',
                        {'append_to_response': 'credits,release_dates'}
                    )

                    release_date_str = details.get('release_date', '')
                    release_date = date.fromisoformat(release_date_str) if release_date_str else date(year, 1, 1)
                    if not release_date_str:
                        notes.append("TMDB did not return a release date; used January 1 of the year from filename.")

                    runtime_min = details.get('runtime') or 0
                    duration = timedelta(minutes=runtime_min)
                    if not runtime_min:
                        notes.append("TMDB did not return a runtime.")

                    director_obj = None
                    for crew in details.get('credits', {}).get('crew', []):
                        if crew['job'] == 'Director':
                            director_obj, _ = Person.objects.get_or_create(
                                tmdb_id=crew['id'],
                                defaults={'name': crew['name'], 'imdb_id': ''}
                            )
                            break
                    if not director_obj:
                        notes.append("No director found in TMDB credits.")

                    cast_objs = []
                    for actor in details.get('credits', {}).get('cast', [])[:10]:
                        person, _ = Person.objects.get_or_create(
                            tmdb_id=actor['id'],
                            defaults={'name': actor['name'], 'imdb_id': ''}
                        )
                        cast_objs.append(person)
                    if not cast_objs:
                        notes.append("No cast found in TMDB credits.")

                    content_rating = self.get_us_rating(details.get('release_dates', {}))
                    if not content_rating:
                        notes.append("No US content rating found on TMDB.")

                    genre_objs = []
                    for g in details.get('genres', []):
                        genre = Genre.objects.filter(tmdb_id=g['id'], media_type='movie').first()
                        if genre:
                            genre_objs.append(genre)
                    if not genre_objs and details.get('genres'):
                        notes.append("TMDB returned genres but none matched existing Genre records.")

                    obj, created = Movie.objects.update_or_create(
                        imdb_id=imdb_id,
                        defaults={
                            **base_defaults,
                            'title':             details.get('title', title),
                            'release_date':      release_date,
                            'tmdb_id':           tmdb_id,
                            'overview':          details.get('overview', ''),
                            'tagline':           details.get('tagline', ''),
                            'original_language': details.get('original_language', ''),
                            'content_rating':    content_rating,
                            'director':          director_obj,
                            'duration':          duration,
                            'notes':             '\n'.join(notes),
                        }
                    )

                    if genre_objs:
                        obj.genres.set(genre_objs)
                    if cast_objs:
                        obj.cast.set(cast_objs)

                    status = self.style.SUCCESS('Created') if created else self.style.SUCCESS('Updated')
                    self.stdout.write(f"{status}: {details.get('title', title)} ({year})")

                    time.sleep(0.26)
                    imported += 1
                    if limit and imported >= limit:
                        break

                except requests.HTTPError as e:
                    notes.append(f"HTTP error from TMDB: {e}")
                    self.stdout.write(self.style.ERROR(f"HTTP error on {title}: {e}"))
                    base_defaults['notes'] = '\n'.join(notes)
                    Movie.objects.update_or_create(imdb_id=imdb_id, defaults=base_defaults)
                except Exception as e:
                    notes.append(f"Unexpected error during import: {e}")
                    self.stdout.write(self.style.ERROR(f"Error on {title}: {e}"))
                    base_defaults['notes'] = '\n'.join(notes)
                    Movie.objects.update_or_create(imdb_id=imdb_id, defaults=base_defaults)
