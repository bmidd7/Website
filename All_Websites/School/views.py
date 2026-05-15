from django.shortcuts import render

# Create your views here.
def Chem_home(request):
    return render(request, 'school/chem/gases.html')
