import re
from urllib.parse import urlencode

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect


def _site_scheme() -> str:
    return getattr(settings, "SITE_SCHEME", "https")


def _kebab_segment(segment: str) -> str:
    segment = segment.strip().replace("_", "-").replace(" ", "-")
    segment = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "-", segment)
    segment = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", "-", segment)
    segment = re.sub(r"-+", "-", segment)
    return segment.lower()


def kebab_path(path: str) -> str:
    return "/".join(_kebab_segment(part) for part in path.split("/") if part)


def _append_query(url: str, query_string: str) -> str:
    if not query_string:
        return url
    return f"{url}?{query_string}"


def redirect_to_local_kebab(request, prefix: str, remaining: str = ""):
    suffix = kebab_path(remaining)
    path = f"/{prefix.strip('/')}/"
    if suffix:
        path = f"{path}{suffix}/"
    return HttpResponseRedirect(_append_query(path, request.META.get("QUERY_STRING", "")))


def redirect_to_api_subdomain(request, remaining: str = ""):
    host = getattr(settings, "API_SITE_HOST", "api.bmiddleton.dev")
    suffix = kebab_path(remaining)
    path = f"/{suffix}/" if suffix else "/"
    url = f"{_site_scheme()}://{host}{path}"
    return HttpResponse(
        status=307,
        headers={"Location": _append_query(url, request.META.get("QUERY_STRING", ""))},
    )


def redirect_fly_api_to_subdomain(request):
    host = getattr(settings, "API_SITE_HOST", "api.bmiddleton.dev")
    query = request.META.get("QUERY_STRING", "")
    url = f"{_site_scheme()}://{host}/fly/simulate/"
    return HttpResponse(status=307, headers={"Location": _append_query(url, query)})


def redirect_with_next(request, target: str):
    next_url = request.get_full_path()
    query = urlencode({"next": next_url})
    return HttpResponseRedirect(f"{target}?{query}")
