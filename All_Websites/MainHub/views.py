from django.shortcuts import render
# Create your views here.
def DefaultHub(request):
    username = None
    if request.user.is_authenticated:
        username = request.user.username

    context = {
        'username': username,
    }

    return render(request, 'hub/user-hub/index.html', context)

# @login_required
# def AdminHub(request):
#     return render(request, 'Hub/adminHub/index.html')

# @login_required
# def AdminHubAsUser(request):
#     return render(request, 'Hub/previewHub/index.html')
