from rest_framework import serializers
from .models import WorkloadPlacement

class WorkloadPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkloadPlacement
        fields = '__all__'
