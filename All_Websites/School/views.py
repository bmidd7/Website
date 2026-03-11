from django.shortcuts import render

# Create your views here.
def Chem_home(request):
    return render(request, 'School/Chem/Gases.html')