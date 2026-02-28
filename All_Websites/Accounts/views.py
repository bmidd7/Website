from django.shortcuts import render
from django.http import HttpResponse
from django.core.mail import send_mail
from allauth.account.views import SignupView
from django.contrib.auth.views import LoginView, LogoutView

# Create your views here.
class MyLoginView(LoginView):
    template_name = "accounts/login.html"

class MyLogoutView(LogoutView):
    template_name = "accounts/logout.html"

class MySignupView(SignupView):
    template_name = "accounts/signup.html"



def TESTEMAIL(request):
    send_mail(
        "Test Email",
        "If you received this, email works.",
        None,
        ["b.rad.m.website@gmail.com"],
        fail_silently=False,
    )
    return HttpResponse("Email sent")