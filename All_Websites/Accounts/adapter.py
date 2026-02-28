from allauth.socialaccount.adapter import DefaultSocialAccountAdapter # type:ignore
from django.contrib.auth import get_user_model

User = get_user_model()

class MySocialAccountAdapter(DefaultSocialAccountAdapter):

    def pre_social_login(self, request, sociallogin):
        """
        Automatically connect Google account to existing user
        if email matches.
        """

        # If already linked, do nothing
        if sociallogin.is_existing:
            return

        email = sociallogin.account.extra_data.get('email')
        if not email:
            return

        try:
            user = User.objects.get(email=email)
            sociallogin.connect(request, user)
        except User.DoesNotExist:
            pass