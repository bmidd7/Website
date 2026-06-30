import re
import json
import subprocess
from pathlib import Path
from decimal import Decimal
from django.db import models
from datetime import datetime
from typing import Any, Mapping
from django.db.models import QuerySet
from APIs.models import Movie, TVSeries, TVEpisode, Music

_TORRENT_WORD_RE = re.compile(r"\bTorrent\b", re.IGNORECASE)
_INVALID_WIN_CHARS_RE = re.compile(r'[\\/:*?"<>|]')
_MEDIA_KIND_BY_MODEL = {
    Movie: "movies",
    TVSeries: "series",
    TVEpisode: "shows",
    Music: "music",
}

_HUMAN_ALIASES: dict[str, dict[str, str]] = {
    "movies": {
        "name": "title",
        "year": "release_date__year",
        "genre": "genres__name__icontains",
    },
    "series": {
        "name": "title",
        "year": "initial_release_date__year",
        "genre": "genres__name__icontains",
    },
    "shows": {
        "name": "ep_title",
        "year": "release_date__year",
    },
    "music": {
        "name": "title",
        "year": "release_date__year",
        "genre": "genres__name__icontains",
    },
}

_HUMAN_DEFAULT_LOOKUPS: dict[str, str] = {
    "title": "title__icontains",
    "ep_title": "ep_title__icontains",
    "artist": "artist__icontains",
    "album": "album__icontains",
}

def media(filters: dict[str,str], media_type: str = "any"):
    db = dbs = None

    if media_type == "movies":
        db = Movie.objects
    elif media_type == "series":
        db = TVSeries.objects
    elif media_type == "shows":
        db = TVEpisode.objects
    elif media_type == "music":
        db = Music.objects
    else:
        dbs = [Movie.objects, TVSeries.objects, TVEpisode.objects, Music.objects]
    

    if db:
        return db.filter(**filters)
    elif dbs:
        results = []
        for db in dbs:
            try:
                results.extend(db.filter(**filters))
            except Exception:
                pass
        return results

def get_queries(request, media_type: str = "any"):
    q: Mapping[str, Any]
    if getattr(request, "method", "").upper() == "POST" and isinstance(getattr(request, "data", None), dict) and request.data:
        q = request.data
    else:
        q = request.query_params

    types_list = ["movies", "shows", "music", "series"]

    # normalize keys to be more human-friendly (case/whitespace)
    normalized_q: dict[str, Any] = {}
    for raw_key, value in q.items():
        if raw_key is None:
            continue
        key = str(raw_key).strip()
        if not key:
            continue
        key = key.lower()
        normalized_q[key] = value

    all_keys = set(normalized_q.keys())

    if media_type not in types_list:
        queries = {}
        valid_keys: set[str] = set()
        for med_type in types_list:
            temp_queries, temp_valid_keys = make_queries_helper(med_type, normalized_q)
            queries.update(temp_queries)
            valid_keys.update(temp_valid_keys)
        invalids = all_keys - valid_keys
    else:
        queries, valid_keys = make_queries_helper(media_type, normalized_q)
        invalids = all_keys - valid_keys
    return queries, invalids

def convert_value(model, field_name: str, value: Any):
    field = model._meta.get_field(field_name)

    if isinstance(field, models.IntegerField):
        return int(value)
    elif isinstance(field, models.FloatField):
        return float(value)
    elif isinstance(field, models.DecimalField):
        if isinstance(value, Decimal):
            return value
        return Decimal(str(value))
    elif isinstance(field, models.BooleanField):
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        return str(value).lower() in ["true", "1", "yes"]
    elif isinstance(field, models.DateField):
        # YYYY-MM-DD
        if hasattr(value, "year") and hasattr(value, "month") and hasattr(value, "day"):
            return value
        return datetime.strptime(value, "%Y-%m-%d").date()
    elif isinstance(field, models.DateTimeField):
        # YYYY-MM-DDTHH:MM:SS
        if hasattr(value, "year") and hasattr(value, "month") and hasattr(value, "day") and hasattr(value, "hour"):
            return value
        return datetime.fromisoformat(value)

    return value

def get_set_and_model(media_type: str):
    movies_fields: list[str] = [f.name for f in Movie._meta.fields] + [f.name for f in Movie._meta.many_to_many]
    series_fields: list[str] = [f.name for f in TVSeries._meta.fields] + [f.name for f in TVSeries._meta.many_to_many]
    shows_fields: list[str] = [f.name for f in TVEpisode._meta.fields] + [f.name for f in TVEpisode._meta.many_to_many]
    music_fields: list[str] = [f.name for f in Music._meta.fields] + [f.name for f in Music._meta.many_to_many]

    if media_type == "movies":
        allowed_fields: set[str] = set(movies_fields)
        model = Movie
    elif media_type == "series":
        allowed_fields: set[str] = set(series_fields)
        model = TVSeries
    elif media_type == "shows":
        allowed_fields: set[str] = set(shows_fields)
        model = TVEpisode
    else:
        allowed_fields: set[str] = set(music_fields)
        model = Music

    return allowed_fields, model

def make_queries_helper(media_type: str, query_params: Mapping[str, Any]):
    queries: dict[str, Any] = {}
    valid_keys: set[str] = set()

    fields, model = get_set_and_model(media_type)
    aliases = _HUMAN_ALIASES.get(media_type, {})
    for raw_key, value in query_params.items():
        key = raw_key
        if raw_key in aliases:
            key = aliases[key]

        # apply human default lookups (e.g. title= -> title__icontains=)
        if key in _HUMAN_DEFAULT_LOOKUPS:
            key = _HUMAN_DEFAULT_LOOKUPS[key]

        base_field = key.split("__", 1)[0]
        if base_field not in fields:
            continue

        try:
            if key.endswith("__year"):
                queries[key] = int(value)
            elif key.endswith("__icontains") or key.endswith("__contains"):
                queries[key] = str(value)
            else:
                queries[key] = convert_value(model, base_field, value)
            valid_keys.add(raw_key)
        except Exception:
            pass
    return queries, valid_keys

def apply_safe_mode_to_source(source: Any) -> Any:
    if source is None:
        return source
    as_str = str(source)
    if not as_str:
        return source
    return _TORRENT_WORD_RE.sub("Us", as_str)

def serialize_media_results(results: Any, *, safe: bool, kind: str | None = None) -> list[dict[str, Any]]:
    if isinstance(results, QuerySet):
        serialized = list(results.values())
        if kind:
            for item in serialized:
                item["kind"] = kind
    else:
        serialized = []
        for obj in results:
            item: dict[str, Any] = {field.name: getattr(obj, field.name) for field in obj._meta.fields}
            item["kind"] = _MEDIA_KIND_BY_MODEL.get(obj.__class__, obj.__class__.__name__.lower())
            serialized.append(item)

    if safe:
        for item in serialized:
            if "source" in item and item["source"]:
                item["source"] = apply_safe_mode_to_source(item["source"])

    serialized = [item for item in serialized if item.get("still_have_it", True)]

    return serialized


def get_video_metadata(file_path: str) -> dict[str, Any]:
    """
    Extract video metadata using ffprobe.
    Returns default empty dict if ffprobe is not installed or file not found.
    
    Returns:
        dict with keys:
            - video_codec: Video codec name
            - best_eng_audio_codec: Best English audio codec
            - best_eng_audio_channels: Number of channels in best English audio
            - audio_track_count: Total number of audio tracks
            - has_subtitles: Boolean indicating if subtitles are present
            - hdr_format: HDR format (HDR10, Dolby Vision, HLG, etc.) or empty string
            - frame_rate: Frames per second as a Decimal
            - color_space: Color space (bt709, bt2020, etc.) or empty string
            - bitrate_mbps: Overall bitrate in Mbps
    """
    try:
        # Find ffprobe in common locations
        ffprobe_paths = [
            "ffprobe",  # In PATH
            "C:\\Users\\bradm\\Downloads\\Apps\\ffmpeg-full_build\\bin\\ffprobe.exe",
            "C:\\Program Files (x86)\\Digiarty\\VideoProc Converter AI\\ffprobe.exe",
        ]
        
        ffprobe_cmd = None
        for path in ffprobe_paths:
            try:
                result = subprocess.run([path, "-version"], capture_output=True, timeout=2)
                if result.returncode == 0:
                    ffprobe_cmd = path
                    break
            except:
                pass
        
        if not ffprobe_cmd:
            return {}
        
        result = subprocess.run(
            [
                ffprobe_cmd, "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                file_path
            ],
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=30
        )
        
        if result.returncode != 0:
            return {}
        
        data = json.loads(result.stdout)
        metadata = {}
        
        # Extract video codec and properties
        video_codec = None
        audio_tracks = []
        subtitle_count = 0
        hdr_format = ""
        frame_rate = Decimal('0')
        color_space = ""
        
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video" and not video_codec:
                video_codec = stream.get("codec_name", "")
                
                # Extract HDR format
                hdr_info = stream.get("tags", {}).get("hdr_format", "")
                if hdr_info:
                    hdr_format = hdr_info
                else:
                    # Check for HDR10 via color transfer
                    color_transfer = stream.get("color_transfer", "").lower()
                    if "smpte2084" in color_transfer:  # HDR10
                        hdr_format = "HDR10"
                    elif "arib-std-b67" in color_transfer:  # HLG
                        hdr_format = "HLG"
                    elif stream.get("codec_name", "").lower() == "hevc":
                        # Check for Dolby Vision via side data
                        side_data = stream.get("side_data_list", [])
                        for sd in side_data:
                            if "Dolby Vision" in sd.get("side_data_type", ""):
                                hdr_format = "Dolby Vision"
                                break
                
                # Extract frame rate
                fps_str = stream.get("r_frame_rate", "")
                if fps_str and "/" in fps_str:
                    try:
                        num, den = fps_str.split("/")
                        frame_rate = Decimal(num) / Decimal(den)
                    except:
                        pass
                else:
                    try:
                        frame_rate = Decimal(str(stream.get("avg_frame_rate", "0")))
                    except:
                        pass
                
                # Extract color space
                color_space = stream.get("color_space", "").lower()
                
            elif stream.get("codec_type") == "audio":
                audio_tracks.append(stream)
            elif stream.get("codec_type") == "subtitle":
                subtitle_count += 1
        
        metadata["video_codec"] = video_codec or ""
        metadata["audio_track_count"] = len(audio_tracks)
        metadata["has_subtitles"] = subtitle_count > 0
        metadata["hdr_format"] = hdr_format
        metadata["frame_rate"] = frame_rate
        metadata["color_space"] = color_space
        
        # Find best English audio track
        best_audio = find_best_english_audio(audio_tracks)
        if best_audio:
            metadata["best_eng_audio_codec"] = best_audio.get("codec_name", "")
            metadata["best_eng_audio_channels"] = best_audio.get("channels", 0)
        else:
            metadata["best_eng_audio_codec"] = ""
            metadata["best_eng_audio_channels"] = 0
        
        # Extract bitrate
        format_info = data.get("format", {})
        bitrate_bps = format_info.get("bit_rate")
        if bitrate_bps:
            metadata["bitrate_mbps"] = round(int(bitrate_bps) / 1_000_000, 3)
        else:
            metadata["bitrate_mbps"] = 0
        
        return metadata
        
    # except FileNotFoundError:
    #     return {}
    except Exception as e:
        print(f"[get_video_metadata] Error: {e}")
        return {}


def find_best_english_audio(audio_tracks: list[dict]) -> dict | None:
    if not audio_tracks:
        return None
    
    english_tracks = []
    for track in audio_tracks:
        lang = track.get("tags", {}).get("language", "").lower()
        if lang in ["eng", "en", ""]:
            english_tracks.append(track)
    
    if not english_tracks:
        return None
    
    english_tracks.sort(
        key=lambda x: x.get("channels", 0),
        reverse=True
    )
    
    return english_tracks[0]
