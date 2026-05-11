from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

from .crypto import can_decrypt_secret, decrypt_secret, encrypt_secret

# Create your models here.
class UserProfile(models.Model):
    GRADES = [
        ('9', 'Freshman'),
        ('10', 'Sophmore'),
        ('11', 'Junior'),
        ('12', 'Senior'),
        ('NA', 'Other')
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=20, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    email_verified_at = models.DateTimeField(null=True)
    grade = models.CharField(max_length=2, choices=GRADES, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
    
class UserPreferences(models.Model):
    preset_themes = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('solarized', 'Solarized')
    ]
    THEMES = {
        'light': {
            'background_color': '#ffffff',
            'text_color': '#000000',
            'accent_color': '#007bff'
        },
        'dark': {
            'background_color': '#343a40',
            'text_color': '#ffffff',
            'accent_color': '#17a2b8'
        },
        'solarized': {
            'background_color': '#fdf6e3',
            'text_color': '#657b83',
            'accent_color': '#b58900'
        }
    }
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    notifications_on = models.BooleanField(default=False)
    
    
    text_font = models.CharField(max_length=20, default='Arial')
    theme_name = models.CharField(max_length=20, choices=preset_themes, default='light')
    theme_background = models.CharField(max_length=7)
    theme_text_color = models.CharField(max_length=7)
    theme_accent_color = models.CharField(max_length=7)

    def save(self, *args, **kwargs):
        theme = self.THEMES.get(self.theme_name, self.THEMES['light'])
        self.theme_background = theme['background_color']
        self.theme_text_color = theme['text_color']
        self.theme_accent_color = theme['accent_color']
        super().save(*args, **kwargs)

class MFA(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    tempOTP_secret = models.CharField(max_length=32, blank=True, null=True)
    is_tempOTP_enabled = models.BooleanField(default=False)
    
    def __str__(self):
        return self.user.username


class UserComputer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="computer")
    display_name = models.CharField(max_length=80, default="My PC")
    desktop_url = models.URLField(blank=True)
    bridge_status_host = models.CharField(max_length=255, blank=True)
    bridge_status_port = models.PositiveIntegerField(null=True, blank=True)
    is_enabled = models.BooleanField(default=False)
    guac_username = models.CharField(max_length=150, blank=True)
    guac_uses_account_password = models.BooleanField(default=True)
    guac_password_encrypted = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.bridge_status_port is not None and not 1 <= self.bridge_status_port <= 65535:
            raise ValidationError({"bridge_status_port": "Port must be between 1 and 65535."})

    def bridge_configured(self) -> bool:
        return bool(self.bridge_status_host and self.bridge_status_port)

    def resolved_guac_username(self) -> str:
        return self.guac_username or self.user.username

    def set_guac_password(self, raw_password: str) -> None:
        self.guac_password_encrypted = encrypt_secret(raw_password) if raw_password else ""

    def has_guac_password(self) -> bool:
        return bool(self.guac_password_encrypted and can_decrypt_secret(self.guac_password_encrypted))

    def get_guac_password(self) -> str:
        if not self.guac_password_encrypted:
            return ""
        return decrypt_secret(self.guac_password_encrypted)

    def __str__(self):
        return f"{self.user.username} - {self.display_name}"
