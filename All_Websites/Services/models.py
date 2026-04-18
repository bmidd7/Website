from django.db import models
from django.conf import settings
from django.contrib.auth.models import User

# Create your models here.
class GmailSettings(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='gmail_settings')
    email_address = models.EmailField()
    refresh_token = models.TextField(blank=True)

    last_history_ID = models.BigIntegerField(blank=True, null=True)
    token_JSON = models.TextField(blank=True, null=True)
    last_use = models.DateTimeField(blank=True, null=True)

    use_advanced_settings = models.BinaryField()

    track_emails = models.BinaryField()
    random_sorting = models.BinaryField()


    class UniqueEntry:
        unique_together = ('user', 'email_address')


class Sorting(models.Model):
    FIELDS = [
        ('from', 'Sender'),
        ('subject', 'Subject'),
        ('body', 'Content'),
    ]

