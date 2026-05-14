from django.urls import path

from . import views

urlpatterns = [
    path('', views.flyDashboard, name="flyDashboard"),
    path('api/simulate/', views.run_simulation_api, name="flySimulateApi"),
]