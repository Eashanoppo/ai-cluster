import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

from django.contrib.auth.models import User, Group

from sentinel.models import Prediction, Alert
from scheduler.models import WorkloadPlacement
from costwatch.models import CostReport
from gate.models import ApprovalRequest

def seed():
    # Create Operator Group
    operator_group, _ = Group.objects.get_or_create(name='Operators')

    # Create admin user
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'password123')
        admin_user.groups.add(operator_group)

    # Seed Sentinel
    if not Prediction.objects.exists():
        Prediction.objects.create(node_id="Node-14", failure_probability=0.89, reason="Thermal throttling detected on GPU 2")
        Prediction.objects.create(node_id="Node-02", failure_probability=0.12, reason="Normal operation")
    
    if not Alert.objects.exists():
        Alert.objects.create(node_id="Node-14", severity="CRITICAL", message="GPU Temp > 95C for 5 mins")
        Alert.objects.create(node_id="Node-08", severity="LOW", message="Inconsistent telemetry ping")

    # Seed Scheduler (Autonomous Actions)
    WorkloadPlacement.objects.all().delete()
    if not WorkloadPlacement.objects.exists():
        WorkloadPlacement.objects.create(job_id="OLLAMA-L3-8B-01", source_node="Idle Pool", target_node="Node-14", reason="Autonomous deployment to idle node", status="COMPLETED")
        WorkloadPlacement.objects.create(job_id="OPENROUTER-BRIDGE", source_node="Idle Pool", target_node="Node-03", reason="Monetizing unused capacity", status="COMPLETED")

    # Seed CostWatch
    if not CostReport.objects.exists():
        CostReport.objects.create(node_id="Node-08", idle_time_hours=4.5, wasted_cost_usd=12.45)
        CostReport.objects.create(node_id="Node-19", idle_time_hours=12.0, wasted_cost_usd=33.20)

    # Seed Gate
    if not ApprovalRequest.objects.exists():
        ApprovalRequest.objects.create(action_type="Evict Workload", target_resource="Node-14", reason="Thermal threshold breached", status="APPROVED", approved_by=User.objects.first())
        ApprovalRequest.objects.create(action_type="Scale Down", target_resource="AutoScalingGroup-A", reason="Low utilization", status="PENDING")

    print("Database seeded successfully with mock data.")

if __name__ == '__main__':
    seed()
