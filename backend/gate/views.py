from rest_framework import viewsets
from rest_framework.permissions import AllowAny
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
    permission_classes = [AllowAny]
    queryset = ApprovalRequest.objects.select_related('approved_by').order_by('-requested_at')
    serializer_class = ApprovalRequestSerializer
    pagination_class = GatePagination

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            history = self.request.query_params.get('history')
            if history == 'true':
                return qs.exclude(status='PENDING')
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
            if instance.action_type == "MIGRATE":
                # Find the latest pending simulation run
                from simulator.models import SimulationRun
                from simulator.agy_service import generate_simulation_report
                from simulator.workload_engine import TIERS
                import asyncio
                
                run = SimulationRun.objects.filter(status="pending").order_by("-created_at").first()
                if run:
                    # Upgrade selected tier
                    original_tier = run.selected_tier
                    next_tier = min(4, original_tier + 1)
                    run.selected_tier = next_tier
                    run.verdict = "optimal"
                    run.status = "completed"
                    
                    # Generate report for the higher tier
                    try:
                        report = asyncio.run(generate_simulation_report(
                            prompt_text=run.prompt,
                            chat_session_id=run.chat_session_id,
                            task_type=run.task_type,
                            task_label=run.task_type.replace("_", " ").title(),
                            selected_tier=next_tier,
                            tier_name=TIERS[next_tier]["name"],
                            required_nodes=run.required_nodes,
                            allocated_nodes=run.allocated_nodes,
                            efficiency_pct=100.0,
                            verdict="optimal",
                            file_input_size_gb=run.file_input_size_gb,
                            image_count=run.image_count,
                            thinking_depth=run.thinking_depth,
                            complexity_factor=run.complexity_factor,
                        ))
                        run.response_text = report.get("response_text", "Workload successfully migrated and completed.")
                        run.ai_raw_report = report
                    except Exception as e:
                        run.response_text = f"Workload successfully migrated to Tier {next_tier} but report generation failed: {str(e)}"
                    
                    # Generate fallback task illustration
                    from simulator.views import _generate_task_image
                    import os
                    from django.conf import settings
                    public_gen_dir = os.path.join(settings.MEDIA_ROOT, "generated")
                    os.makedirs(public_gen_dir, exist_ok=True)
                    target_img_name = f"run-{run.id}.png"
                    try:
                        _generate_task_image(run, public_gen_dir, target_img_name)
                    except Exception:
                        pass

                    run.save()

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


