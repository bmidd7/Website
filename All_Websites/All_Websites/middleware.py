from django.conf import settings


class SubdomainURLConfMiddleware:
    """Route selected subdomains to their own URLConf before Django resolves URLs."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(":", 1)[0].lower()
        api_host = getattr(settings, "API_SITE_HOST", "").lower()

        if api_host and host == api_host:
            request.urlconf = "All_Websites.api_urls"

        return self.get_response(request)
