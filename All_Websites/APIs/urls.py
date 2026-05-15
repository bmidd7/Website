from django.urls import path, re_path
from . import views
from .views import *
from All_Websites.redirects import redirect_to_api_subdomain


urlpatterns = [
    re_path(r"^Control/?$", lambda request: redirect_to_api_subdomain(request, "control")),
    re_path(r"^WiFi/?$", lambda request: redirect_to_api_subdomain(request, "wi-fi")),
    re_path(r"^ESP32/RGB/?$", lambda request: redirect_to_api_subdomain(request, "esp32/rgb")),
    re_path(r"^Camera/?$", lambda request: redirect_to_api_subdomain(request, "camera")),
    re_path(r"^20MB/?$", lambda request: redirect_to_api_subdomain(request, "20mb")),
    path('', views.control_redirect, name="API_redirect"),
    path('control/', views.Control, name="API_Control_Panel"),
    path('wi-fi/', views.WiFi_check, name="WiFiCheck"),
    path('esp32/rgb/', views.rgb_endpoint, name="RGB_API"),
    path('camera/', views.camera, name="camera"),
    path('ping/', views.ping, name="HTTP_Ping_Pong"),
    path('20mb/', views.download_file, name="File_Download"),
]
