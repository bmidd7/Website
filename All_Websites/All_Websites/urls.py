"""
URL configuration for All_Websites project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path, re_path

from .redirects import (
    redirect_fly_api_to_subdomain,
    redirect_to_api_subdomain,
    redirect_to_local_kebab,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('MainHub.urls')),
    path('accounts/', include('Accounts.urls')),
    path('accounts/', include('allauth.urls')),
    re_path(r"^API/?(?P<remaining>.*)$", redirect_to_api_subdomain),
    re_path(r"^api/?(?P<remaining>.*)$", redirect_to_api_subdomain),
    re_path(r"^School/?(?P<remaining>.*)$", lambda request, remaining="": redirect_to_local_kebab(request, "school", remaining)),
    re_path(r"^AI/chat/?$", lambda request: redirect_to_api_subdomain(request, "ai/chat")),
    re_path(r"^AI/model/?$", lambda request: redirect_to_api_subdomain(request, "ai/model")),
    re_path(r"^AI/?(?P<remaining>.*)$", lambda request, remaining="": redirect_to_local_kebab(request, "ai", remaining)),
    re_path(r"^Services/?(?P<remaining>.*)$", lambda request, remaining="": redirect_to_local_kebab(request, "services", remaining)),
    re_path(r"^Fly/api/simulate/?$", redirect_fly_api_to_subdomain),
    re_path(r"^Fly/?(?P<remaining>.*)$", lambda request, remaining="": redirect_to_local_kebab(request, "fly", remaining)),
    path('school/', include('School.urls')),
    path('ai/', include('AI.urls')),
    path('services/', include('Services.urls')),
    path('fly/', include('Fly.urls')),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=str(settings.STATICFILES_DIRS[0]))
