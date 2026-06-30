from django.db import models
from django.core.validators import MaxValueValidator

# Create your models here.
class RawData(models.Model):
    time = models.DateTimeField()
    #input Params:
    duration_s = models.FloatField(default=5.0)
    FPS = models.FloatField(default=30)
    quality = models.CharField(default="preview")
    world = models.CharField(default="arena")
    behavior=models.CharField(default="wander")
    seed=models.IntegerField(default=1, validators=[MaxValueValidator(4294967295)]) #32-bit, unsigned int limit
    arena_size=models.FloatField(default=10.0)
    data_path=models.CharField(default=r"m:/C VSCode/.vscode/Fly/proofread_connections_783.feather")
    max_saved_frames=models.IntegerField(default=500)
    #resource usage
    #CPU
    cpu_max_percent=models.FloatField(null=True, blank=True)
    cpu_avg_percent=models.FloatField(null=True, blank=True)
    cpu_min_percent=models.FloatField(null=True, blank=True)
    #GPU
    gpu_max_percent=models.FloatField(null=True, blank=True)
    gpu_avg_percent=models.FloatField(null=True, blank=True)
    gpu_min_percent=models.FloatField(null=True, blank=True)
    #VRAM
    vram_max_gb=models.FloatField(null=True, blank=True)
    vram_avg_gb=models.FloatField(null=True, blank=True)
    vram_min_gb=models.FloatField(null=True, blank=True)
    #RAM
    ram_max_gb=models.FloatField(null=True, blank=True)
    ram_avg_gb=models.FloatField(null=True, blank=True)
    ram_min_gb=models.FloatField(null=True, blank=True)