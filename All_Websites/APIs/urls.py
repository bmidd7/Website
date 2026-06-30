from django.urls import path, re_path
from . import views
from .views import *
from All_Websites.redirects import redirect_to_api_subdomain


urlpatterns = [
    re_path("Control/", lambda request: redirect_to_api_subdomain(request, "control")),
    re_path("WiFi/", lambda request: redirect_to_api_subdomain(request, "wi-fi")),
    re_path("ESP32/RGB/", lambda request: redirect_to_api_subdomain(request, "esp32/rgb")),
    re_path("Camera/", lambda request: redirect_to_api_subdomain(request, "camera")),
    re_path("20MB/", lambda request: redirect_to_api_subdomain(request, "20mb")),

    path('', views.control_redirect, name="API_redirect"),
    path('control/', views.Control, name="API_Control_Panel"),
    path('wi-fi/', views.WiFi_check, name="WiFiCheck"),
    path('esp32/rgb/', views.rgb_endpoint, name="RGB_API"),
    path('camera/', views.camera, name="camera"),
    path('ping/', views.ping, name="HTTP_Ping_Pong"),
    path('20mb/', views.download_file, name="File_Download"),

    path('v1/media/', views.media_data_v1, {"media_type":"any", "safe":True}, name="Media_Data"),
    path('v1/movies/', views.media_data_v1, {"media_type":"movies", "safe":True}, name="Movie_Data"),
    path('v1/series/', views.media_data_v1, {"media_type":"series", "safe":True}, name="TV_Data"),
    path('v1/tv/', views.media_data_v1, {"media_type":"shows", "safe":True}, name="TV_Data"),
    path('v1/shows/', views.media_data_v1, {"media_type":"shows", "safe":True}, name="Show_Data"),
    path('v1/music/', views.media_data_v1, {"media_type":"music", "safe":True}, name="Music_Data"),

    re_path("v1/media/u/", views.media_data_v1, {"media_type":"any", "safe":False}, name="Media_Data_unsafe"),
    re_path("v1/movies/u/", views.media_data_v1, {"media_type":"movies", "safe":False}, name="Movie_Data_unsafe"),
    re_path("v1/series/u/", views.media_data_v1, {"media_type":"series", "safe":False}, name="TV_Data_unsafe"),
    re_path("v1/tv/u/", views.media_data_v1, {"media_type":"shows", "safe":False}, name="TV_Data_unsafe"),
    re_path("v1/shows/u/", views.media_data_v1, {"media_type":"shows", "safe":False}, name="Show_Data_unsafe"),
    re_path("v1/music/u/", views.media_data_v1, {"media_type":"music", "safe":False}, name="Music_Data_unsafe"),
]
