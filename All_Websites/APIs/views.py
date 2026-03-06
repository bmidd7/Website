from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.decorators import login_required


@login_required
def Control(request):
    return render(request, 'API/TEMP_index.html')



def ping(request):
    return HttpResponse("pong")


@api_view(['POST'])
def rgb_endpoint(request):
    data = request.data  # This is the JSON from the ESP32
    print("Received from ESP32:", data)

    # Optional: integrate with your models
    # Example: save to a model
    # from .models import LedColor
    # LedColor.objects.create(r=data['r'], g=data['g'], b=data['b'])

    return Response({"status": "ok", "received": data})