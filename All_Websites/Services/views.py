import json
import os
import socket

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core import signing
from django.core.signing import BadSignature, SignatureExpired
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from Accounts.models import UserComputer
from Accounts.services import verify_guac_login
# from .scripts.Gmail import

PC_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
PC_COOKIE_PREFIX = "pc_access_layer_"
PC_SIGNER_SALT = "services.pc.access"
PC_REMOTE_URL_ENV = "PC_REMOTE_URL"
PC_DESKTOP_URL_ENV = "PC_DESKTOP_URL"
PC_BRIDGE_HOST_ENV = "PC_BRIDGE_STATUS_HOST"
PC_BRIDGE_PORT_ENV = "PC_BRIDGE_STATUS_PORT"
PC_BRIDGE_TIMEOUT_SECONDS = 1.5


def _pc_layer_cookie_name(layer: int) -> str:
    return f"{PC_COOKIE_PREFIX}{layer}"


def _pc_expected_cookie_value(layer: int) -> str:
    return f"pc-layer-{layer}-passed"


def _pc_password_for_layer(layer: int) -> str:
    return ""


def _pc_desktop_url() -> str:
    return os.environ.get(PC_DESKTOP_URL_ENV) or os.environ.get(PC_REMOTE_URL_ENV, "")


def _pc_for_request(request) -> UserComputer | None:
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return None

    computer = getattr(user, "computer", None)
    if computer and computer.is_enabled:
        return computer
    return None


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


def _pc_password_matches(request, layer: int, provided_password: str) -> bool:
    computer = _pc_for_request(request)
    return bool(computer and computer.has_access_password(layer) and computer.check_access_password(layer, provided_password))


def _pc_password_configured(request, layer: int) -> bool:
    computer = _pc_for_request(request)
    return bool(computer and computer.has_access_password(layer))


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


def _pc_signer() -> signing.TimestampSigner:
    return signing.TimestampSigner(salt=PC_SIGNER_SALT)


def _pc_layer_is_remembered(request, layer: int) -> bool:
    cookie_value = request.COOKIES.get(_pc_layer_cookie_name(layer))
    if not cookie_value:
        return False

    try:
        unsigned_value = _pc_signer().unsign(
            cookie_value,
            max_age=PC_COOKIE_MAX_AGE_SECONDS,
        )
    except (BadSignature, SignatureExpired):
        return False

    return unsigned_value == _pc_expected_cookie_value(layer)


def _pc_layer_prerequisites_met(request, layer: int) -> bool:
    if layer == 1:
        return True

    if layer == 2:
        return _pc_layer_is_remembered(request, 1)

    if layer == 3:
        return _pc_layer_is_remembered(request, 1) and _pc_layer_is_remembered(request, 2)

    return False


def _pc_set_layer_cookie(response: JsonResponse, layer: int) -> None:
    signed_value = _pc_signer().sign(_pc_expected_cookie_value(layer))
    response.set_cookie(
        _pc_layer_cookie_name(layer),
        signed_value,
        max_age=PC_COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        samesite="Strict",
        secure=not settings.DEBUG,
        path="/Services/PC/",
    )


# Create your views here.
def Dashboard(request):
    return render(request, 'Services/Dashboard.html')

@login_required
def PC(request):
    desktop_url = _pc_desktop_url_for_request(request)
    return render(
        request,
        'Services/PC.html',
        {
            "pc_layer_1_remembered": _pc_layer_is_remembered(request, 1),
            "pc_layer_2_remembered": _pc_layer_is_remembered(request, 2),
            "pc_remote_name": _pc_remote_name_for_request(request),
            "pc_desktop_configured": bool(desktop_url),
        },
    )

@csrf_exempt
@login_required
def pcAuth(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    try:
        layer = int(body.get("layer", 0))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid access layer."}, status=400)

    if layer not in {1, 2, 3}:
        return JsonResponse({"error": "Invalid access layer."}, status=400)

    if not _pc_layer_prerequisites_met(request, layer):
        return JsonResponse({"error": "Complete the earlier access layer first."}, status=403)

    provided_password = str(body.get("password", ""))

    if not _pc_password_configured(request, layer):
        return JsonResponse(
            {"error": f"Layer {layer} password is not configured in your account settings."},
            status=503,
        )

    if not _pc_password_matches(request, layer, provided_password):
        return JsonResponse({"error": "That password did not match."}, status=403)

    response_data = {
        "ok": True,
        "layer": layer,
        "remembered": layer in {1, 2},
        "accessGranted": layer == 3,
    }

    if layer == 3:
        desktop_url = _pc_desktop_url_for_request(request)
        response_data["remoteUrl"] = desktop_url
        response_data["desktopUrl"] = desktop_url
        response_data["bridgeStatus"] = _pc_bridge_status(request)
        response_data["guacamoleStatus"] = _pc_guacamole_status(request)
        response_data["desktopConfigured"] = bool(desktop_url)

    response = JsonResponse(response_data)
    response["Cache-Control"] = "no-store"

    if layer in {1, 2}:
        _pc_set_layer_cookie(response, layer)

    return response

@csrf_exempt
@login_required
def pcForget(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    response = JsonResponse({"ok": True})
    response.delete_cookie(_pc_layer_cookie_name(1), path="/Services/PC/")
    response.delete_cookie(_pc_layer_cookie_name(2), path="/Services/PC/")
    response["Cache-Control"] = "no-store"
    return response

@login_required
def pcBridgeStatus(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    return JsonResponse(_pc_bridge_status(request))

def Settings(request):
    return render(request, '.html')

@csrf_exempt
def gmailPush(request):
    if request.method != "POST":
        return JsonResponse({"ERROR":"POST Only"}, status=405)

    # try:

    return None
