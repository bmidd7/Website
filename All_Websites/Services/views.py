import os
import socket
import time
from urllib.parse import urlencode

from allauth.account.authentication import get_authentication_records
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse

from Accounts.models import UserComputer
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
    return os.environ.get(PC_DESKTOP_URL_ENV) or os.environ.get(PC_REMOTE_URL_ENV, "")


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


def _recent_mfa_record(request) -> dict | None:
    max_age = getattr(settings, "PC_MFA_MAX_AGE_SECONDS", 60 * 90)
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
    return _recent_mfa_record(request) is None


def _pc_mfa_reauth_url(request) -> str:
    return f"{reverse('mfa_reauthenticate')}?{urlencode({'next': request.get_full_path()})}"


def Dashboard(request):
    return render(request, "Services/Dashboard.html")


@login_required
def PC(request):
    desktop_url = _pc_desktop_url_for_request(request)
    return render(
        request,
        "Services/PC.html",
        {
            "pc_remote_name": _pc_remote_name_for_request(request),
            "pc_desktop_url": desktop_url,
            "pc_desktop_configured": bool(desktop_url),
            "pc_mfa_required": _pc_requires_recent_mfa(request),
            "pc_mfa_url": _pc_mfa_reauth_url(request),
            "pc_mfa_max_age_minutes": int(getattr(settings, "PC_MFA_MAX_AGE_SECONDS", 5400) / 60),
            "pc_recent_mfa_record": _recent_mfa_record(request),
            "pc_guacamole_status": _pc_guacamole_status(request),
            "pc_bridge_status": _pc_bridge_status(request),
        },
    )


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
