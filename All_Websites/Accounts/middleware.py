from django.shortcuts import redirect


class MFARequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            if not request.session.get("mfa_passed"):
                if request.path not in ["/accounts/totp/", "/accounts/login/"]:
                    return redirect("TOTP_verify")

        return self.get_response(request)
