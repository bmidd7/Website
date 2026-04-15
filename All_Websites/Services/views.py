from django.shortcuts import render

# Create your views here.
def Dashboard(request):
    return render(request, '.html')

def Settings(request):
    return render(request, '.html')