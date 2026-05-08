from django.urls import include, path
from .views import *

urlpatterns = [
    path("login/", MyLoginView.as_view(), name="login"),
    path('logout/', MyLogoutView.as_view(), name='Logout'),
    path('signup/', MySignupView.as_view(), name='account_signup'),
    path('settings/', account_security_view, name='account_settings'),
    path('security/', account_security_view, name='account_security'),
    path('2fa/', include('allauth.mfa.urls')),
    path('email/testing', TESTEMAIL, name="TEST_EMAIL"),
]
