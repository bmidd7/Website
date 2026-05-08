from django import forms
from .models import UserComputer

class CustomSignupForm(forms.Form):
    first_name = forms.CharField(max_length=20, widget=forms.TextInput(attrs={'placeholder':'First Name'}))
    last_name = forms.CharField(max_length=50, widget=forms.TextInput(attrs={'placeholder':'Last Name'}))

    def signup(self, request, user):
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']

        user.save()


class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)


class UserComputerSettingsForm(forms.ModelForm):
    access_password_1 = forms.CharField(
        label="Outer gate password",
        required=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )
    access_password_2 = forms.CharField(
        label="Device gate password",
        required=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )
    access_password_3 = forms.CharField(
        label="Session gate password",
        required=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )
    current_account_password = forms.CharField(
        label="Current site password",
        required=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "current-password"}),
    )
    guac_password = forms.CharField(
        label="Separate Guacamole password",
        required=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )

    class Meta:
        model = UserComputer
        fields = [
            "is_enabled",
            "display_name",
            "desktop_url",
            "bridge_status_host",
            "bridge_status_port",
            "guac_username",
            "guac_uses_account_password",
        ]

    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)
        self.fields["guac_username"].label = "Guacamole username"
        self.fields["guac_uses_account_password"].label = "Use my site password for Guacamole"
        if user:
            self.fields["guac_username"].help_text = f"Leave blank to use your account username: {user.username}"

    def clean(self):
        cleaned_data = super().clean()

        if not self.user:
            raise forms.ValidationError("A signed-in user is required to save PC settings.")

        use_account_password = cleaned_data.get("guac_uses_account_password")
        current_account_password = cleaned_data.get("current_account_password", "")
        guac_password = cleaned_data.get("guac_password", "")

        if use_account_password:
            if current_account_password:
                if not self.user.check_password(current_account_password):
                    self.add_error("current_account_password", "That does not match your account password.")
            elif not self.instance.has_guac_password() or not self.instance.guac_uses_account_password:
                self.add_error(
                    "current_account_password",
                    "Enter your current site password once so Guacamole can use the same password.",
                )
        elif not guac_password and not self.instance.has_guac_password():
            self.add_error("guac_password", "Enter a Guacamole password, or keep using your site password.")

        return cleaned_data

    def save(self, commit=True):
        computer = super().save(commit=False)
        for layer in (1, 2, 3):
            raw_password = self.cleaned_data.get(f"access_password_{layer}")
            if raw_password:
                computer.set_access_password(layer, raw_password)
        if self.cleaned_data.get("guac_uses_account_password"):
            current_account_password = self.cleaned_data.get("current_account_password")
            if current_account_password:
                computer.set_guac_password(current_account_password)
        else:
            guac_password = self.cleaned_data.get("guac_password")
            if guac_password:
                computer.set_guac_password(guac_password)
        if commit:
            computer.save()
        return computer
