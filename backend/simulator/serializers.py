"""Simulator app serializers."""

from rest_framework import serializers
from .models import SimulationRun
from .workload_engine import TASK_SPECS, TIERS
from .models import SimulationRun, CompanyProfile


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = '__all__'



class SimulationRunCreateSerializer(serializers.Serializer):
    """Input payload for creating a new simulation run / chat message."""
    prompt = serializers.CharField(max_length=2000, required=False, default="")
    task_type = serializers.ChoiceField(choices=list(TASK_SPECS.keys()))
    user_count = serializers.IntegerField(min_value=1, max_value=100000, default=1)
    allocated_nodes = serializers.IntegerField(min_value=1, max_value=128)
    file_input_size_gb = serializers.FloatField(min_value=0.1, max_value=100.0, default=1.0)
    image_count = serializers.IntegerField(min_value=0, max_value=10000, default=0)
    thinking_depth = serializers.IntegerField(min_value=1, max_value=5, default=1)
    complexity_factor = serializers.FloatField(min_value=1.0, max_value=5.0, default=1.0)
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default="Default AI Co")
    priority = serializers.ChoiceField(choices=["Critical", "High", "Normal", "Background"], default="Normal")
    chat_session_id = serializers.CharField(max_length=64, required=False, allow_blank=True)


class SimulationRunSerializer(serializers.ModelSerializer):
    """Full simulation run / chat conversation output serializer."""
    task_label = serializers.SerializerMethodField()
    tier_name = serializers.SerializerMethodField()
    verdict_display = serializers.SerializerMethodField()

    class Meta:
        model = SimulationRun
        fields = [
            'id', 'task_type', 'task_label', 'prompt', 'response_text', 'chat_session_id', 'user_count',
            'file_input_size_gb', 'image_count', 'thinking_depth', 'complexity_factor',
            'company_name', 'priority',
            'selected_tier', 'tier_name', 'allocated_nodes', 'allocated_nodes_actual', 'required_nodes',
            'efficiency_pct', 'verdict', 'verdict_display',
            'status', 'bottleneck_analysis', 'recommendations', 'demo_talking_points',
            'ai_raw_report', 'created_at', 'completed_at', 'acknowledged',
        ]
        read_only_fields = fields

    def get_task_label(self, obj: SimulationRun) -> str:
        return TASK_SPECS.get(obj.task_type, {}).get("label", obj.task_type)

    def get_tier_name(self, obj: SimulationRun) -> str:
        return TIERS.get(obj.selected_tier, {}).get("name", f"Tier {obj.selected_tier}")

    def get_verdict_display(self, obj: SimulationRun) -> str:
        mapping = {
            "optimal": "OPTIMAL",
            "overload": "OVERLOAD",
            "idle_waste": "IDLE WASTE",
        }
        return mapping.get(obj.verdict, obj.verdict.upper())


class SimulationRunListSerializer(serializers.ModelSerializer):
    """Compact list serializer for the history view."""
    task_label = serializers.SerializerMethodField()
    tier_name = serializers.SerializerMethodField()
    verdict_display = serializers.SerializerMethodField()

    class Meta:
        model = SimulationRun
        fields = [
            'id', 'task_type', 'task_label', 'prompt', 'selected_tier', 'tier_name',
            'company_name', 'priority',
            'allocated_nodes', 'allocated_nodes_actual', 'required_nodes',
            'efficiency_pct', 'verdict', 'verdict_display', 'status',
            'chat_session_id', 'created_at', 'acknowledged', 'ai_raw_report',
            'bottleneck_analysis', 'recommendations', 'demo_talking_points',
        ]

    def get_task_label(self, obj: SimulationRun) -> str:
        return TASK_SPECS.get(obj.task_type, {}).get("label", obj.task_type)

    def get_tier_name(self, obj: SimulationRun) -> str:
        return TIERS.get(obj.selected_tier, {}).get("name", f"Tier {obj.selected_tier}")

    def get_verdict_display(self, obj: SimulationRun) -> str:
        mapping = {"optimal": "OPTIMAL", "overload": "OVERLOAD", "idle_waste": "IDLE WASTE"}
        return mapping.get(obj.verdict, obj.verdict.upper())
