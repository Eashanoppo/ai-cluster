from django.db import models

class GpuTelemetry(models.Model):
    objects = models.Manager()
    node_id = models.CharField(max_length=100, db_index=True)
    gpu_id = models.IntegerField(default=0)
    temperature_celsius = models.FloatField()
    vram_usage_mb = models.FloatField()
    vram_total_mb = models.FloatField(default=80000)
    gpu_utilization_percent = models.FloatField()
    power_draw_watts = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['node_id', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.node_id} GPU-{self.gpu_id} | {self.temperature_celsius}C | {self.gpu_utilization_percent}%"
