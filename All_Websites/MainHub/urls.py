from django.urls import path
from . import views

urlpatterns = [
    path('', views.DefaultHub, name='UserHub'),
    path('hub-admin/', views.AdminHub, name='AdminHub'),
    path('hub-admin/preview/', views.AdminHubAsUser, name='TestHub'),
]