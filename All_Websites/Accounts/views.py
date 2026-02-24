from django.shortcuts import render # type:ignore
from django.contrib.auth.views import LoginView, LogoutView

# Create your views here.
class MyLoginView(LoginView):
    template_name = "accounts/login.html"

class MyLogoutView(LogoutView):
    template_name = "accounts/logout.html"
