from django.urls import path, re_path
from . import views
from All_Websites.redirects import redirect_to_local_kebab

urlpatterns = [
    re_path(r"^PC/?(?P<remaining>.*)$", lambda request, remaining="": redirect_to_local_kebab(request, "services/pc", remaining)),
    path("", views.Dashboard, name='Dashboard'),
    path("pc/", views.PC, name='Services_PC'),
    path("pc/open/", views.pcOpen, name='Services_PC_open'),
    path("pc/auth-forward/", views.pcAuthForward, name='Services_PC_auth_forward'),
    path("pc/bridge-status/", views.pcBridgeStatus, name='Services_PC_bridge_status'),
    # path("Settings/", views.Settings, name='serviceSettings')
]
