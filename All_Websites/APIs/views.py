from django.conf import settings
from rest_framework import status
from django.http import JsonResponse
from rest_framework.response import Response
from django.shortcuts import render, redirect
from rest_framework.decorators import api_view
from django.contrib.staticfiles import finders
from django.http import HttpResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .services import get_queries, media, serialize_media_results, get_set_and_model


@login_required
def Control(request):
    return render(request, 'api/temp-index.html')


@login_required
def camera(request):
    return render(request, 'api/camera.html')


def control_redirect(request):
    return redirect('/control/')


def ping(request):
    return HttpResponse("pong")


@api_view(['GET'])
def WiFi_check(request):
    return Response(True)

@api_view(['POST'])
def rgb_endpoint(request):
    data = request.data  # This is the JSON from the ESP32
    print("Received from ESP32:", data)

    # Optional: integrate with your models
    # Example: save to a model
    # from .models import LedColor
    # LedColor.objects.create(r=data['r'], g=data['g'], b=data['b'])

    return Response({"status": "ok", "received": data})

def download_file(request):
    file_path = finders.find("img/speedtest.bin")
    return FileResponse(open(file_path, "rb"), as_attachment=True) # type:ignore

@api_view(["GET", "POST"])
def media_data_v1(request, media_type: str = "any", safe: bool = True):
    media_type = media_type.lower().strip()
    if media_type not in ["movies", "shows", "music", "series"]:
        media_type = "any"

    if request.method == "POST":
        token = request.headers.get("X-API-Key")
        _, model = get_set_and_model(media_type)
        if token != settings.MEDIA_API_KEY:
            return Response({"ok": False, "error": "Not Authorized"}, status=status.HTTP_401_UNAUTHORIZED)
        data = request.data
        obj = model.objects.create(**data)
        return Response({"ok": True, "id": obj.id}, status=status.HTTP_201_CREATED) # type:ignore
    
    #
    # # GET
    #
    queries, invalid_filters = get_queries(request, media_type)
    results = media(queries, media_type)
    serialized = serialize_media_results(
        results,
        safe=safe,
        kind=None if media_type == "any" else media_type,
    )

    return Response(
        {
            "ok": True,
            "media_type": media_type,
            "safe_mode": bool(safe),
            "filters": queries,
            "invalid_filters": sorted(invalid_filters),
            "count": len(serialized),
            "results": serialized,
        },
        status=status.HTTP_200_OK,
    )
