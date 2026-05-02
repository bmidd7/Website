import json
import os
import socket

from django.conf import settings
from django.core import signing
from django.core.signing import BadSignature, SignatureExpired
from django.http import JsonResponse
from django.shortcuts import render
from django.utils.crypto import constant_time_compare
from django.views.decorators.csrf import csrf_exempt
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
    return os.environ.get(f"PC_ACCESS_PASSWORD_{layer}", "")


def _pc_desktop_url() -> str:
    return os.environ.get(PC_DESKTOP_URL_ENV) or os.environ.get(PC_REMOTE_URL_ENV, "")


def _pc_bridge_status() -> dict[str, object]:
    host = os.environ.get(PC_BRIDGE_HOST_ENV, "").strip()
    raw_port = os.environ.get(PC_BRIDGE_PORT_ENV, "").strip()

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
            "message": f"{PC_BRIDGE_PORT_ENV} must be a number.",
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

def PC(request):
    return render(
        request,
        'Services/PC.html',
        {
            "pc_layer_1_remembered": _pc_layer_is_remembered(request, 1),
            "pc_layer_2_remembered": _pc_layer_is_remembered(request, 2),
            "pc_remote_name": os.environ.get("PC_REMOTE_NAME", "Home PC"),
            "pc_desktop_configured": bool(_pc_desktop_url()),
        },
    )

@csrf_exempt
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

    expected_password = _pc_password_for_layer(layer)
    provided_password = str(body.get("password", ""))

    if not expected_password:
        return JsonResponse(
            {"error": f"PC_ACCESS_PASSWORD_{layer} is not configured."},
            status=503,
        )

    if not constant_time_compare(provided_password, expected_password):
        return JsonResponse({"error": "That password did not match."}, status=403)

    response_data = {
        "ok": True,
        "layer": layer,
        "remembered": layer in {1, 2},
        "accessGranted": layer == 3,
    }

    if layer == 3:
        desktop_url = _pc_desktop_url()
        response_data["remoteUrl"] = desktop_url
        response_data["desktopUrl"] = desktop_url
        response_data["bridgeStatus"] = _pc_bridge_status()
        response_data["desktopConfigured"] = bool(desktop_url)

    response = JsonResponse(response_data)
    response["Cache-Control"] = "no-store"

    if layer in {1, 2}:
        _pc_set_layer_cookie(response, layer)

    return response

@csrf_exempt
def pcForget(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    response = JsonResponse({"ok": True})
    response.delete_cookie(_pc_layer_cookie_name(1), path="/Services/PC/")
    response.delete_cookie(_pc_layer_cookie_name(2), path="/Services/PC/")
    response["Cache-Control"] = "no-store"
    return response

def pcBridgeStatus(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    return JsonResponse(_pc_bridge_status())

def Settings(request):
    return render(request, '.html')

@csrf_exempt
def gmailPush(request):
    if request.method != "POST":
        return JsonResponse({"ERROR":"POST Only"}, status=405)

    # try:

    return None
