from rest_framework import serializers
from .models import ApprovalRequest

class ApprovalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalRequest
        fields = ['id', 'action_type', 'target_resource', 'reason', 'requested_at', 'approved_by', 'approved_at', 'status']
        read_only_fields = ['approved_by']

