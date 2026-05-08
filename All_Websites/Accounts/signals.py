from django.dispatch import receiver
from allauth.account.signals import user_logged_in


@receiver(user_logged_in)
def force_mfa(sender, request, user, **kwargs):
    return None
