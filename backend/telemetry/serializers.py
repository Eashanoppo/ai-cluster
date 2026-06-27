from rest_framework import serializers
from .models import GpuTelemetry

class GpuTelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = GpuTelemetry
        fields = [
            'id',
            'node_id',
            'gpu_id',
            'temperature_celsius',
            'vram_usage_mb',
            'vram_total_mb',
            'gpu_utilization_percent',
            'power_draw_watts',
            'timestamp'
        ]
