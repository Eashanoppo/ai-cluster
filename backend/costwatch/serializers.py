from rest_framework import serializers
from .models import CostReport

class CostReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostReport
        fields = '__all__'
