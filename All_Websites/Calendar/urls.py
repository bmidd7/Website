from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name='calendar_home'),
]
