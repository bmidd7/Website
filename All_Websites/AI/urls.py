from django.urls import path
from . import views

urlpatterns = [
    path('', views.DefaultAI, name='AI_Hub'), # type:ignore
    path('chat/', views.chat_api, name='AI_chat'), # type:ignore
    path('model/', views.model_info, name='AI_model'), # type:ignore
]
