from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import GpuTelemetry
from .serializers import GpuTelemetrySerializer

class GpuTelemetryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = GpuTelemetry.objects.all()
    serializer_class = GpuTelemetrySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        node_id = self.request.GET.get('node_id')
        if node_id:
            qs = qs.filter(node_id=node_id)
        
        limit = self.request.GET.get('limit')
        if limit:
            try:
                # If a limit is specified, we return the sliced list directly
                return qs.order_by('-timestamp')[:int(limit)]
            except ValueError:
                pass
        return qs.order_by('-timestamp')

    @action(detail=False, methods=['get'])
    def latest(self, request):
        from django.db.models import Subquery, OuterRef
        latest_telemetry_qs = GpuTelemetry.objects.filter(
            node_id=OuterRef('node_id')
        ).order_by('-timestamp').values('id')[:1]
        
        latest_telemetries = GpuTelemetry.objects.filter(
            id__in=Subquery(latest_telemetry_qs)
        ).order_by('node_id')
        
        serializer = self.get_serializer(latest_telemetries, many=True)
        return Response(serializer.data)

    @method_decorator(cache_page(2))
    @action(detail=False, methods=['get'])
    def topology(self, request):
        from simulator.models import SimulationRun
        from scheduler.models import WorkloadPlacement
        from django.db.models import Subquery, OuterRef
        
        # 1. Get physical mock nodes from telemetry
        latest_telemetry_qs = GpuTelemetry.objects.filter(
            node_id=OuterRef('node_id')
        ).order_by('-timestamp').values('id')[:1]
        
        latest_telemetries = GpuTelemetry.objects.filter(
            id__in=Subquery(latest_telemetry_qs)
        )
        
        nodes = []
        for t in latest_telemetries:
            nodes.append({
                "id": t.node_id,
                "status": "Ready" if t.temperature_celsius < 85 else "Cordoned",
                "temperature": t.temperature_celsius,
                "utilization": t.gpu_utilization_percent,
            })
            
        # 2. Get active mock Pods (Workloads)
        active_runs = SimulationRun.objects.filter(status__in=["processing", "analyzing"])
        pods = []
        for run in active_runs:
            pods.append({
                "id": f"pod-{run.id}",
                "workload_type": run.task_type,
                "priority": run.priority,
                "nodes_requested": run.allocated_nodes
            })
            
        # 3. Get recent migrations
        recent_migrations = WorkloadPlacement.objects.order_by('-migrated_at')[:5]
        migrations = []
        for m in recent_migrations:
            migrations.append({
                "job": m.job_id,
                "from": m.source_node,
                "to": m.target_node,
                "reason": m.reason
            })
            
        return Response({
            "nodes": nodes,
            "pods": pods,
            "migrations": migrations
        })

    @method_decorator(cache_page(2))
    @action(detail=False, methods=['get'])
    def dashboard_metrics(self, request):
        from sentinel.models import Prediction
        from costwatch.models import CostReport
        from gate.models import ApprovalRequest
        from django.db.models import Sum
        
        # Get latest ML predictions for anomaly chart
        recent_preds = Prediction.objects.order_by('-predicted_at')[:20]
        ml_data = [{"time": p.predicted_at.strftime("%H:%M:%S"), "probability": round(p.failure_probability * 100, 2)} for p in recent_preds]
        ml_data.reverse()
        
        # Cost savings (Total wasted cost saved)
        total_saved = CostReport.objects.aggregate(Sum('wasted_cost_usd'))['wasted_cost_usd__sum'] or 0.0
        
        # Cluster Load
        # We can approximate from the number of active nodes
        idle_nodes = ApprovalRequest.objects.filter(action_type="NODE SUSPEND", status="APPROVED").count()
        # Note: this is a mock representation
        active_nodes = max(0, 128 - idle_nodes)
        cluster_load_pct = active_nodes / 128.0
        
        # Read Learning Engine confidence
        import json
        from pathlib import Path
        learning_file = Path(__file__).parent.parent / "learning_engine_experience.jsonl"
        confidence = 100
        experiences = 0
        if learning_file.exists():
            with open(learning_file, "r") as f:
                lines = f.readlines()
                experiences = len(lines)
                if experiences > 50:
                    confidence = min(99.9, 80 + (experiences / 10.0))
        
        return Response({
            "ml_anomaly_trend": ml_data,
            "total_cost_saved_usd": round(total_saved, 2),
            "cluster_load_pct": round(cluster_load_pct * 100, 1),
            "active_nodes": active_nodes,
            "learning_engine": {
                "experiences_logged": experiences,
                "model_confidence": round(confidence, 1)
            }
        })

    @action(detail=False, methods=['get'])
    def learning_updates(self, request):
        import json
        from pathlib import Path
        learning_file = Path(__file__).parent.parent / "learning_engine_experience.jsonl"
        updates = []
        if learning_file.exists():
            with open(learning_file, "r") as f:
                lines = f.readlines()
                # Get the last 20 updates, reverse them
                for line in reversed(lines[-20:]):
                    try:
                        updates.append(json.loads(line.strip()))
                    except:
                        pass
        return Response(updates)
