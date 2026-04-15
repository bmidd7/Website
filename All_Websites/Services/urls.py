from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path("/", views.Dashboard, name='Dashboard'),
    # path("Settings/", views.Settings, name='serviceSettings')
]