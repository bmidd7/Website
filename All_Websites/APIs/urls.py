from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path('Control/', views.Control, name="API_Control_Panel"),
    path('ESP32/RGB/', views.rgb_endpoint, name="RGB_API"),
    path('ping/', views.ping, name="HTTP_Ping_Pong")
]