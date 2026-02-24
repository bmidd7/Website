from django.shortcuts import render # type:ignore
from django.contrib.auth.views import LoginView, LogoutView
from allauth.account.views import SignupView # type: ignore

# Create your views here.
class MyLoginView(LoginView):
    template_name = "accounts/login.html"

class MyLogoutView(LogoutView):
    template_name = "accounts/logout.html"

class MySignupView(SignupView):
    template_name = "accounts/signup.html"
