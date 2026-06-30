from django.urls import path
from . import views
from All_Websites.redirects import redirect_to_api_subdomain

urlpatterns = [
    path('', views.DefaultAI, name='AI_Hub'),
    path('chat/', lambda request: redirect_to_api_subdomain(request, "ai/chat"), name='AI_chat'),
    path('model/', lambda request: redirect_to_api_subdomain(request, "ai/model"), name='AI_model'),
]
