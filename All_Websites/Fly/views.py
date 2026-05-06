from django.shortcuts import render

# Create your views here.
def flyDashboard(request):
    return render(request, "Fly/index.html")