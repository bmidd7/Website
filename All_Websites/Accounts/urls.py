from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path("login/", MyLoginView.as_view(), name="login"),
    path('logout/', MyLogoutView.as_view(), name='Logout'),
    path('signup/', MySignupView.as_view(), name='account_signup'),
    path('email/testing', views.TESTEMAIL, name="TEST_EMAIL")
]