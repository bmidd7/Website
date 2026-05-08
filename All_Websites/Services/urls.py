from django.urls import path
from . import views

urlpatterns = [
    path("", views.Dashboard, name='Dashboard'),
    path("PC/", views.PC, name='Services_PC'),
    path("PC/auth/", views.pcAuth, name='Services_PC_auth'),
    path("PC/forget/", views.pcForget, name='Services_PC_forget'),
    path("PC/bridge-status/", views.pcBridgeStatus, name='Services_PC_bridge_status'),
    # path("Settings/", views.Settings, name='serviceSettings')
]
