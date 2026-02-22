from django.shortcuts import render
from django.http import HttpResponse # type: ignore
from django.contrib.auth.decorators import login_required

# Create your views here.
def DefaultHub(request): # type: ignore
    return render(request, 'userHub/index.html') # type: ignore

@login_required
def AdminHub(request): # type: ignore
    return render(request, 'adminHub/index.html') # type: ignore

@login_required
def AdminHubAsUser(request): # type: ignore
    return render(request, 'previewHub/index.html') # type: ignore