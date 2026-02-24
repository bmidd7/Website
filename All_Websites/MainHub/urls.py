from django.urls import path
from . import views

urlpatterns = [
    path('', views.DefaultHub, name='UserHub'), # type:ignore
    path('hub-admin/', views.AdminHub, name='AdminHub'), # type:ignore
    path('hub-admin/preview/', views.AdminHubAsUser, name='TestHub'), # type:ignore
]