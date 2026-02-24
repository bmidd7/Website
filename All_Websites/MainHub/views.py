from django.shortcuts import render
from django.http import HttpResponse # type: ignore
from django.contrib.auth.decorators import login_required

# Create your views here.
def DefaultHub(request): # type: ignore
    return render(request, 'Hub/userHub/index.html') # type: ignore

@login_required
def AdminHub(request): # type: ignore
    return render(request, 'Hub/adminHub/index.html') # type: ignore

@login_required
def AdminHubAsUser(request): # type: ignore
    return render(request, 'Hub/previewHub/index.html') # type: ignore