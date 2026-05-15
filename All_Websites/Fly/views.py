import json

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from All_Websites.redirects import redirect_fly_api_to_subdomain

from .main import run_simulation


def flyDashboard(request):
    return render(request, "fly/index.html")


def redirect_simulation_api(request):
    return redirect_fly_api_to_subdomain(request)


@csrf_exempt
def run_simulation_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    try:
        response = run_simulation(payload)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    return JsonResponse(response)
