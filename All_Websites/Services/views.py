from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
# from .scripts.Gmail import

# Create your views here.
def Dashboard(request):
    return render(request, 'Services/Dashboard.html')

def Settings(request):
    return render(request, '.html')

@csrf_exempt
def gmailPush(request):
    if request.method != "POST":
        return JsonResponse({"ERROR":"POST Only"}, status=405)

    # try:

    return None