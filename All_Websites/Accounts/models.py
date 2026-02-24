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
    grade = models.CharField(max_length=1, choices=GRADES, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"