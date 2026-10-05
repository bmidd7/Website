from pathlib import Path
from django.conf import settings
from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def robots_txt(request):
    path = settings.BASE_DIR / "static" / "txt" / "robots.txt"

    return HttpResponse(
        path.read_text(),
        content_type="text/plain"
    )


def humans_txt(request):
    path = settings.BASE_DIR / "static" / "txt" / "humans.txt"

    return HttpResponse(
        path.read_text(),
        content_type="text/plain"
    )

def security_txt(request):
    path = settings.BASE_DIR / "static" / "txt" / "security.txt"

    return HttpResponse(
        path.read_text(),
        content_type="text/plain"
    )

def llms_txt(request):
    path = settings.BASE_DIR / "static" / "txt" / "llms.txt"

    return HttpResponse(
        path.read_text(),
        content_type="text/plain"
    )

def ads_txt(request):
    path = settings.BASE_DIR / "static" / "txt" / "ads.txt"

    return HttpResponse(
        path.read_text(),
        content_type="text/plain"
    )

def acknowledgments_txt(request):
    path = settings.BASE_DIR / "static" / "txt" / "acknowledgments.txt"

    return HttpResponse(
        path.read_text(),
        content_type="text/plain"
    )

def security_policy_txt(request):
    path = settings.BASE_DIR / "static" / "txt" / "security-policy.txt"

    return HttpResponse(
        path.read_text(),
        content_type="text/plain"
    )