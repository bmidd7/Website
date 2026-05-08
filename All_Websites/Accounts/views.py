from .forms import UserComputerSettingsForm
from .models import UserComputer
from django.http import HttpResponse
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from allauth.account.views import SignupView
from django.contrib import messages
from .services import verify_guac_login
from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth.decorators import login_required





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


@login_required
def account_security_view(request):
    computer, _ = UserComputer.objects.get_or_create(user=request.user)
    computer_form = UserComputerSettingsForm(instance=computer, prefix="computer", user=request.user)
    guac_status = verify_guac_login(computer) if computer.desktop_url and computer.has_guac_password() else None

    if request.method == "POST":
        action = request.POST.get("action")
        if action == "save_computer":
            computer_form = UserComputerSettingsForm(
                request.POST,
                instance=computer,
                prefix="computer",
                user=request.user,
            )
            if computer_form.is_valid():
                computer_form.save()
                messages.success(request, "PC connection settings saved.")
                return redirect("account_settings")

    return render(
        request,
        "accounts/settings.html",
        {
            "computer_form": computer_form,
            "computer": computer,
            "guac_status": guac_status,
        },
    )
