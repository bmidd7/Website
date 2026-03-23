from django.urls import path
from . import views

urlpatterns = [
    path('', views.DefaultHub, name='UserHub'), # type:ignore
]