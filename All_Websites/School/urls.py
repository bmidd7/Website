from django.urls import path
from . import views

urlpatterns = [
    path('Chemistry/', views.Chem_home, name="ChemHome"),
]