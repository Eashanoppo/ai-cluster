from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from .models import ApprovalRequest
from .serializers import ApprovalRequestSerializer
from core.permissions import IsClusterOperator
from scheduler.models import WorkloadPlacement
import time

class GatePagination(PageNumberPagination):
    page_size = 50

class ApprovalRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsClusterOperator]
    queryset = ApprovalRequest.objects.select_related('approved_by').order_by('-requested_at')
    serializer_class = ApprovalRequestSerializer
    pagination_class = GatePagination

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            return qs.filter(status='PENDING')
        return qs

    def perform_update(self, serializer):
        # Determine if it was pending *before* the save
        instance_before = self.get_object()
        was_pending = instance_before.status == "PENDING"
        
        with transaction.atomic():  # type: ignore
            instance = serializer.save()
        # If human just approved it, execute it!
        if instance.status == "APPROVED" and was_pending:
            if "KILL" in instance.action_type:
                target = "None (Process Terminated)"
            else:
                target = "Cloud-Burst-Node"
            
            WorkloadPlacement.objects.create(
                job_id=f"LLM-CTX-{int(time.time())}",
                source_node=instance.target_resource,
                target_node=target,
                reason=f"Human Approved: {instance.reason}",
                status="COMPLETED"
            )

