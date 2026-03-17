from django.db import models

# Create your models here.
class Particle(models.Model):
    name = models.CharField(max_length=10000)
    common_name = models.CharField(max_length=100, null=True)
    common_name_1 = models.CharField(max_length=100, null=True)
    common_name_2 = models.CharField(max_length=100, null=True)
    formula = models.CharField(max_length=100)
    molar_mass = models.FloatField(max_length=10)
    state = models.CharField(max_length=10)
    

    def __str__(self):
        return f'{self.name} ({self.formula})'