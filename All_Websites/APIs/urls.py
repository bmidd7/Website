from django.urls import path
from . import views
from .views import *


urlpatterns = [
    path('', views.control_redirect, name="API_redirect"),
    path('Control/', views.Control, name="API_Control_Panel"),
    path('WiFi/', views.WiFi_check, name="WiFiCheck"),
    path('ESP32/RGB/', views.rgb_endpoint, name="RGB_API"),
    path('Camera/', views.camera, name="camera"),
    path('ping/', views.ping, name="HTTP_Ping_Pong")
]