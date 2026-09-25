import os
import socket
import time
from urllib.parse import urlencode

from allauth.account.authentication import get_authentication_records
from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse

from Accounts.forms import PCSecurityPreferenceForm
from Accounts.models import UserComputer, MFA, UserPreferences
from Accounts.services import verify_guac_login

PC_REMOTE_URL_ENV = "PC_REMOTE_URL"
PC_DESKTOP_URL_ENV = "PC_DESKTOP_URL"
PC_BRIDGE_HOST_ENV = "PC_BRIDGE_STATUS_HOST"
PC_BRIDGE_PORT_ENV = "PC_BRIDGE_STATUS_PORT"
PC_BRIDGE_TIMEOUT_SECONDS = 1.5


def _pc_for_request(request) -> UserComputer | None:
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return None

    computer = getattr(user, "computer", None)
    if computer and computer.is_enabled:
        return computer
    return None


def _pc_desktop_url() -> str:
    # Try environment variables first, then default to Guacamole on the remote subdomain.
    default_url = f"{getattr(settings, 'SITE_SCHEME', 'https')}://{getattr(settings, 'REMOTE_SITE_HOST', 'remote.bmiddleton.dev')}/guacamole/"
    return os.environ.get(PC_DESKTOP_URL_ENV) or os.environ.get(PC_REMOTE_URL_ENV, default_url)


def _pc_desktop_url_for_request(request) -> str:
    computer = _pc_for_request(request)
    if computer and computer.desktop_url:
        return computer.desktop_url
    return _pc_desktop_url()


def _pc_remote_name_for_request(request) -> str:
    computer = _pc_for_request(request)
    if computer:
        return computer.display_name
    return os.environ.get("PC_REMOTE_NAME", "Home PC")


def _pc_bridge_status(request) -> dict[str, object]:
    computer = _pc_for_request(request)
    if computer:
        host = computer.bridge_status_host.strip()
        raw_port = str(computer.bridge_status_port or "")
        port_label = "Configured PC status port"
    else:
        host = os.environ.get(PC_BRIDGE_HOST_ENV, "").strip()
        raw_port = os.environ.get(PC_BRIDGE_PORT_ENV, "").strip()
        port_label = PC_BRIDGE_PORT_ENV

    if not host or not raw_port:
        return {
            "configured": False,
            "online": False,
            "message": "No desktop bridge status target is configured.",
        }

    try:
        port = int(raw_port)
    except ValueError:
        return {
            "configured": True,
            "online": False,
            "message": f"{port_label} must be a number.",
        }

    try:
        with socket.create_connection((host, port), timeout=PC_BRIDGE_TIMEOUT_SECONDS):
            return {
                "configured": True,
                "online": True,
                "host": host,
                "port": port,
                "message": "Desktop bridge is online.",
            }
    except OSError:
        return {
            "configured": True,
            "online": False,
            "host": host,
            "port": port,
            "message": "Desktop bridge is not reachable from Django.",
        }


def _pc_guacamole_status(request) -> dict[str, object] | None:
    computer = _pc_for_request(request)
    if not computer:
        return None
    return verify_guac_login(computer)


def _get_mfa_max_age_seconds(request) -> int:
    """Get MFA max age in seconds from user preferences or settings."""
    user = getattr(request, "user", None)
    if user and user.is_authenticated:
        try:
            mfa_settings = MFA.objects.get(user=user)
            return mfa_settings.mfa_frequency_minutes * 60
        except MFA.DoesNotExist:
            pass
    return getattr(settings, "PC_MFA_MAX_AGE_SECONDS", 60 * 90)


def _pc_totp_required(request) -> bool:
    """Return the signed-in user's remote-PC MFA preference, safely defaulting on."""
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return True

    preferences, _ = UserPreferences.objects.get_or_create(user=user)
    return preferences.pc_totp_required


def _recent_mfa_record(request) -> dict | None:
    max_age = _get_mfa_max_age_seconds(request)
    now = time.time()
    for record in reversed(get_authentication_records(request)):
        if record.get("method") != "mfa":
            continue
        authenticated_at = record.get("at")
        if authenticated_at and now - authenticated_at <= max_age:
            return record
        return None
    return None


def _pc_requires_recent_mfa(request) -> bool:
    return _pc_totp_required(request) and _recent_mfa_record(request) is None


def _pc_mfa_reauth_url(request) -> str:
    return f"{reverse('mfa_reauthenticate')}?{urlencode({'next': request.get_full_path()})}"


def Dashboard(request):
    return render(request, "services/dashboard.html")


@login_required
def PC(request):
    preferences, _ = UserPreferences.objects.get_or_create(user=request.user)
    pc_security_form = PCSecurityPreferenceForm(instance=preferences, prefix="pc_security")
    if request.method == "POST" and request.POST.get("action") == "save_pc_security":
        pc_security_form = PCSecurityPreferenceForm(
            request.POST,
            instance=preferences,
            prefix="pc_security",
        )
        if pc_security_form.is_valid():
            pc_security_form.save()
            messages.success(request, "Remote PC authenticator-code preference saved.")
            return redirect("Services_PC")

    desktop_url = _pc_desktop_url_for_request(request)
    mfa_max_age_minutes = int(_get_mfa_max_age_seconds(request) / 60)
    pc_totp_required = preferences.pc_totp_required
    return render(
        request,
        "services/pc.html",
        {
            "pc_remote_name": _pc_remote_name_for_request(request),
            "pc_desktop_url": desktop_url,
            "pc_launch_url": reverse("Services_PC_open"),
            "pc_desktop_configured": bool(desktop_url),
            "pc_mfa_required": _pc_requires_recent_mfa(request),
            "pc_mfa_url": _pc_mfa_reauth_url(request),
            "pc_mfa_max_age_minutes": mfa_max_age_minutes,
            "pc_totp_required": pc_totp_required,
            "pc_security_form": pc_security_form,
            "pc_recent_mfa_record": _recent_mfa_record(request),
            "pc_guacamole_status": _pc_guacamole_status(request),
            "pc_bridge_status": _pc_bridge_status(request),
        },
    )


@login_required
def pcOpen(request):
    if _pc_requires_recent_mfa(request):
        return redirect(_pc_mfa_reauth_url(request))

    guac_status = _pc_guacamole_status(request)
    if guac_status and guac_status.get("configured") and not guac_status.get("valid"):
        # Force MFA re-authentication if guacamole credentials failed
        response = redirect(_pc_mfa_reauth_url(request))
        # Clear session to remove any cached authentication state
        response.delete_cookie("sessionid", path="/", domain=getattr(settings, "SESSION_COOKIE_DOMAIN"))
        response.delete_cookie("csrftoken", path="/", domain=getattr(settings, "CSRF_COOKIE_DOMAIN"))
        return response

    desktop_url = _pc_desktop_url_for_request(request)
    if not desktop_url:
        return redirect("Services_PC")

    response = redirect(desktop_url)
    # Add cache control headers to prevent stale authentication
    response["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response["Pragma"] = "no-cache"
    response["Expires"] = "0"
    return response


def pcAuthForward(request):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    if _pc_requires_recent_mfa(request):
        return redirect(rf'{settings.SITE_SCHEME}://{settings.PRIMARY_SITE_HOST}/accounts/2fa/reauthenticate/?next=%2Fservices%2Fpc%2F')

    guac_status = _pc_guacamole_status(request)
    if guac_status and guac_status.get("configured") and not guac_status.get("valid"):
        # Clear session cookies on failed guacamole authentication
        response = JsonResponse(
            {"error": guac_status.get("message", "Guacamole credentials are invalid.")},
            status=403,
        )
        response.delete_cookie("sessionid", path="/", domain=getattr(settings, "SESSION_COOKIE_DOMAIN"))
        response.delete_cookie("csrftoken", path="/", domain=getattr(settings, "CSRF_COOKIE_DOMAIN"))
        return response

    return HttpResponse(status=204)


@login_required
def pcBridgeStatus(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    if _pc_requires_recent_mfa(request):
        return JsonResponse({"error": "Recent MFA is required."}, status=403)

    return JsonResponse(_pc_bridge_status(request))


def Settings(request):
    return render(request, ".html")


def gmailPush(request):
    if request.method != "POST":
        return JsonResponse({"ERROR": "POST Only"}, status=405)

    return None
