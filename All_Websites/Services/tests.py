from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from Accounts.models import UserPreferences


class PCSecurityPreferenceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="pc-user", password="safe-password")
        self.client.force_login(self.user)

    def test_pc_access_requires_an_authenticator_code_by_default(self):
        response = self.client.get(reverse("Services_PC"))

        preferences = UserPreferences.objects.get(user=self.user)
        self.assertTrue(preferences.pc_totp_required)
        self.assertTrue(response.context["pc_mfa_required"])
        self.assertContains(response, "Require a code to open my PC")

    def test_user_can_turn_off_pc_authenticator_code_requirement(self):
        response = self.client.post(
            reverse("Services_PC"),
            {"action": "save_pc_security"},
        )

        self.assertRedirects(response, reverse("Services_PC"))
        preferences = UserPreferences.objects.get(user=self.user)
        self.assertFalse(preferences.pc_totp_required)

        response = self.client.get(reverse("Services_PC"))
        self.assertFalse(response.context["pc_mfa_required"])
        self.assertContains(response, "opening this PC only requires that you are signed in")

    def test_auth_forward_honors_a_disabled_authenticator_code_requirement(self):
        UserPreferences.objects.create(user=self.user, pc_totp_required=False)

        response = self.client.get(reverse("Services_PC_auth_forward"))

        self.assertEqual(response.status_code, 204)

    def test_open_remote_honors_a_disabled_authenticator_code_requirement(self):
        UserPreferences.objects.create(user=self.user, pc_totp_required=False)

        response = self.client.get(reverse("Services_PC_open"))

        self.assertEqual(response.status_code, 302)
        self.assertNotIn("accounts/2fa/reauthenticate", response.url)
