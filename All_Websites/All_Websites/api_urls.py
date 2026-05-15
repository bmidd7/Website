from django.urls import include, path

from AI import views as ai_views
from Fly import views as fly_views

urlpatterns = [
    path("", include("APIs.urls")),
    path("ai/chat/", ai_views.chat_api, name="api_ai_chat"),
    path("ai/model/", ai_views.model_info, name="api_ai_model"),
    path("fly/simulate/", fly_views.run_simulation_api, name="api_fly_simulate"),
]
