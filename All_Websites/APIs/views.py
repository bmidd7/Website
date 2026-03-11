from rest_framework.response import Response
from django.shortcuts import render, redirect
from rest_framework.decorators import api_view
from django.contrib.staticfiles import finders
from django.http import HttpResponse, FileResponse
from django.contrib.auth.decorators import login_required


@login_required
def Control(request):
    return render(request, 'API/TEMP_index.html')


@login_required
def camera(request):
    return render(request, 'API/camera.html')


def control_redirect(request):
    return redirect('/API/Control')


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