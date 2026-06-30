import json
from datetime import datetime

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from All_Websites.redirects import redirect_fly_api_to_subdomain

from .main import run_simulation
from .models import RawData


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

    # Store simulation metrics in database
    try:
        config = response["config"]
        resources = response.get("resources", {})
        
        RawData.objects.create(
            time=datetime.now(),
            duration_s=config.get("duration_s", 5.0),
            FPS=config.get("fps", 30),
            quality=config.get("quality", "preview"),
            world=config.get("world", "arena"),
            behavior=config.get("behavior", "wander"),
            seed=config.get("seed", 1),
            arena_size=config.get("arena_size", 10.0),
            data_path=config.get("data_path", ""),
            max_saved_frames=config.get("max_saved_frames", 500),
            # CPU metrics
            cpu_max_percent=resources.get("cpu_percent", {}).get("max"),
            cpu_avg_percent=resources.get("cpu_percent", {}).get("avg"),
            cpu_min_percent=resources.get("cpu_percent", {}).get("min"),
            # GPU metrics
            gpu_max_percent=resources.get("gpu_percent", {}).get("max"),
            gpu_avg_percent=resources.get("gpu_percent", {}).get("avg"),
            gpu_min_percent=resources.get("gpu_percent", {}).get("min"),
            # RAM metrics
            ram_max_gb=resources.get("ram_gb", {}).get("max"),
            ram_avg_gb=resources.get("ram_gb", {}).get("avg"),
            ram_min_gb=resources.get("ram_gb", {}).get("min"),
            # VRAM metrics
            vram_max_gb=resources.get("vram_gb", {}).get("max"),
            vram_avg_gb=resources.get("vram_gb", {}).get("avg"),
            vram_min_gb=resources.get("vram_gb", {}).get("min"),
        )
    except Exception as e:
        # Log the error but don't fail the API response
        print(f"Failed to store simulation metrics: {e}")

    return JsonResponse(response)
