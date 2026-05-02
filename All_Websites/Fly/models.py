from django.db import models

# Create your models here.
class RawData(models.Model):
    time = models.DateTimeField()
    #input Params:
    duration_s = models.FloatField(default=5.0)
    FPS = models.FloatField(default=30)
    quality = models.CharField(default="preview")
    world = models.CharField(default="arena")
    behavior=models.CharField(default="wander")
    seed=models.IntegerField(default=1, max_value=4294967295) #32-bit, usigned int limit
    arena_size=models.FloatField(default=10.0)
    data_path=models.CharField(default=r"m:/C VSCode/.vscode/Fly/proofread_connections_783.feather")
    max_saved_frames=models.IntegerField(default=500)