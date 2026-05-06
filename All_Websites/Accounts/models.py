from django.db import models
from django.contrib.auth.models import User

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