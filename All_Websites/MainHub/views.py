from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required

# Create your views here.
def DefaultHub(request):
    return render(request, 'Hub/userHub/index.html')

# @login_required
# def AdminHub(request):
#     return render(request, 'Hub/adminHub/index.html')

# @login_required
# def AdminHubAsUser(request):
#     return render(request, 'Hub/previewHub/index.html')