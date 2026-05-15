from django.urls import path
from . import views

urlpatterns = [
    path('chemistry/', views.Chem_home, name="ChemHome"),
]
