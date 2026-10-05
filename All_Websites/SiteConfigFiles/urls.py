from django.urls import path
from . import views

urlpatterns = [
    path('robots.txt', views.robots_txt, name="Robots.txt"),
    path('humans.txt', views.humans_txt, name="Humans.txt"),
    path('.well-known/security.txt', views.security_txt, name="Security.txt"),
    path('llms.txt', views.llms_txt, name="LLMs.txt"),
    path('ads', views.ads_txt, name="Ads.txt"),
    path('acknowledgments', views.acknowledgments_txt, name="Acknowledgments.txt"),
    path('security-policy', views.security_policy_txt, name="Security-Policy.txt"),
]