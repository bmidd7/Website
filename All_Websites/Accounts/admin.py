from django.contrib import admin
from django import forms

from .models import MFA, UserComputer, UserPreferences, UserProfile


class UserComputerAdminForm(forms.ModelForm):
    access_password_1 = forms.CharField(required=False, widget=forms.PasswordInput)
    access_password_2 = forms.CharField(required=False, widget=forms.PasswordInput)
    access_password_3 = forms.CharField(required=False, widget=forms.PasswordInput)
    guac_password = forms.CharField(required=False, widget=forms.PasswordInput)

    class Meta:
        model = UserComputer
        fields = "__all__"

    def save(self, commit=True):
        computer = super().save(commit=False)
        for layer in (1, 2, 3):
            raw_password = self.cleaned_data.get(f"access_password_{layer}")
            if raw_password:
                computer.set_access_password(layer, raw_password)
        guac_password = self.cleaned_data.get("guac_password")
        if guac_password:
            computer.set_guac_password(guac_password)
        if commit:
            computer.save()
        return computer


@admin.register(UserComputer)
class UserComputerAdmin(admin.ModelAdmin):
    form = UserComputerAdminForm
    list_display = ("user", "display_name", "is_enabled", "desktop_url", "updated_at")
    readonly_fields = ("created_at", "updated_at")


admin.site.register(MFA)
admin.site.register(UserPreferences)
admin.site.register(UserProfile)
