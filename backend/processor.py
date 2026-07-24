import os
import time
import json
import random
from pathlib import Path
import django
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.db.models import Subquery, OuterRef
from openai import OpenAI
import numpy as np

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

LLM_MODEL = getattr(settings, 'LLM_MODEL', 'llama3') or 'llama3'

from telemetry.prometheus_sim import PrometheusSim
from cluster_infra.kubernetes_sim import KubernetesSim, PodSpec
from cluster_infra.ray_sim import RaySim
from telemetry.models import GpuTelemetry
from sentinel.models import Prediction, Alert
from scheduler.models import WorkloadPlacement
from costwatch.models import CostReport
from gate.models import ApprovalRequest
from simulator.models import SimulationRun
from django.contrib.auth.models import User

try:
    from sklearn.ensemble import IsolationForest
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

KWH_COST_USD = 0.15
LEARNING_FILE = Path(__file__).parent / "learning_engine_experience.jsonl"

class LearningEngine:
    """ Phase 25: Learning Engine """
    def __init__(self):
        self.knowledge_base = {
            "thermal_threshold": 90.0,
            "cost_threshold": 0.05,
            "migration_success_rate": 0.95
        }
        self.load_experiences()
    
    def log_experience(self, action, target, reason, outcome="SUCCESS", confidence=1.0):
        try:
            update_id = f"LE-2026-{random.randint(100, 999)}"
            with open(LEARNING_FILE, "a") as f:
                f.write(json.dumps({
                    "id": update_id,
                    "timestamp": str(timezone.now()),
                    "action": action,
                    "target": target,
                    "reason": reason,
                    "outcome": outcome,
                    "confidence": confidence
                }) + "\n")
            print(f"[LEARNING ENGINE] Experience logged {update_id} for {action} on {target}.")
        except Exception:
            pass

    def load_experiences(self):
        if not LEARNING_FILE.exists():
            return
        # A simple offline retraining simulation that dynamically alters internal parameters
        try:
            with open(LEARNING_FILE, "r") as f:
                lines = f.readlines()
                if len(lines) > 100:
                    print("[LEARNING ENGINE] Analyzing historical experiences and adjusting policy weights.")
                    self.knowledge_base["thermal_threshold"] = 88.5 # Simulated optimization
        except Exception:
            pass

    def get_node_weight(self, node_id):
        return 1.0

class PredictionEngine:
    """ Phase 21: Failure Prediction Engine """
    def __init__(self):
        self.iso_forest = IsolationForest(contamination=0.1, random_state=42) if ML_AVAILABLE else None

    def analyze(self):
        if not ML_AVAILABLE or self.iso_forest is None:
            return {}
            
        temps = PrometheusSim.query("dcgm_fi_dev_gpu_temp")
        utils = PrometheusSim.query("dcgm_fi_dev_gpu_util")
        powers = PrometheusSim.query("dcgm_fi_dev_power_usage")
        
        if not temps:
            return {}
            
        temp_map = {item['metric']['node']: float(item['value'][1]) for item in temps}
        util_map = {item['metric']['node']: float(item['value'][1]) for item in utils}
        power_map = {item['metric']['node']: float(item['value'][1]) for item in powers}
        
        node_ids = list(temp_map.keys())
        features = [[temp_map[n], util_map.get(n, 0), power_map.get(n, 0)] for n in node_ids]
        
        X = np.array(features)
        try:
            predictions = self.iso_forest.fit_predict(X)
            scores = self.iso_forest.score_samples(X)
            
            anomaly_map = {}
            for i, node in enumerate(node_ids):
                prob = min(0.99, max(0.01, (0.5 - scores[i]) * 2.0))
                if predictions[i] == -1:
                    prob = max(prob, 0.85)
                anomaly_map[node] = prob
            return anomaly_map
        except Exception:
            return {}

class CostEngine:
    """ Phase 23: Cost Optimization Engine """
    def evaluate(self, node_id, utilization, power, admin_user, learning_engine):
        if utilization < 5:
            wasted_cost = (power / 1000.0) * KWH_COST_USD
            recent_sleep = ApprovalRequest.objects.filter(
                target_resource=node_id,
                action_type="NODE SUSPEND",
                requested_at__gte=timezone.now() - timedelta(minutes=5)
            ).exists()
            
            if not recent_sleep:
                reason = f"Cost Optimization: Node idle. Suspending to save ${wasted_cost:.2f}/hr."
                ApprovalRequest.objects.create(
                    action_type="NODE SUSPEND", target_resource=node_id,
                    reason=reason, status="APPROVED", approved_by=admin_user
                )
                learning_engine.log_experience("NODE SUSPEND", node_id, reason)
                return True
        return False

class CapacityEngine:
    """ Phase 24: Capacity Management Engine """
    def evaluate(self, cluster_load_pct, active_nodes, admin_user, learning_engine):
        forecasted_load = min(1.0, cluster_load_pct + 0.05)
        
        if cluster_load_pct > 0.95:
            recent_shed = ApprovalRequest.objects.filter(action_type="CAPACITY SHEDDING", requested_at__gte=timezone.now() - timedelta(minutes=1)).exists()
            if not recent_shed:
                # Do NOT autonomously terminate. Require human interference.
                reason = "CRITICAL: Cluster load breached 95%. Human approval required to shed batch tasks."
                ApprovalRequest.objects.create(
                    action_type="CAPACITY SHEDDING", target_resource="Batch Workloads",
                    reason=reason, status="PENDING", approved_by=None
                )
                learning_engine.log_experience("CAPACITY SHEDDING (PENDING)", "Batch Workloads", reason)
                
        elif cluster_load_pct >= 0.75:
            # 75% - Warn human
            from sentinel.models import Alert
            if not Alert.objects.filter(node_id="Cluster", resolved=False, message__contains="75%").exists():
                Alert.objects.create(node_id="Cluster", severity="WARNING", message=f"Cluster load reached {cluster_load_pct*100:.0f}%. Watch load.")
            
            recent_ai = ApprovalRequest.objects.filter(action_type="AI AUTONOMOUS TERMINATION", requested_at__gte=timezone.now() - timedelta(minutes=2)).exists()
            if not recent_ai and cluster_load_pct > 0.85:
                # Still do some autonomous shedding if >85% but <95%
                task_to_kill = "video_generation" # Simulated LLM fallback
                SimulationRun.objects.filter(status__in=["processing", "analyzing"], task_type__icontains=task_to_kill).update(status="failed", response_text="[AI AUTONOMOUS OVERRIDE] Task terminated to stabilize.")
                reason = f"AI autonomously decided to terminate '{task_to_kill}' to stabilize load."
                ApprovalRequest.objects.create(
                    action_type="AI AUTONOMOUS TERMINATION", target_resource=task_to_kill,
                    reason=reason, status="APPROVED", approved_by=admin_user
                )
                learning_engine.log_experience("AI AUTONOMOUS TERMINATION", task_to_kill, reason)

class MigrationEngine:
    """ Phase 22: Live Migration Engine """
    def trigger_live_migration(self, hot_node, temp, target_node, admin_user, learning_engine):
        reason = f"Live Migration off {hot_node} to {target_node} due to thermal anomaly ({temp:.1f}C)."
        ApprovalRequest.objects.create(
            action_type="LIVE MIGRATION", target_resource=hot_node,
            reason=reason, status="APPROVED", approved_by=admin_user
        )
        WorkloadPlacement.objects.create(
            job_id=f"MIG-{int(time.time())}", source_node=hot_node, target_node=target_node,
            reason=reason, status="COMPLETED"
        )
        # Call Kubernetes API to actually trigger migration
        pod_id = KubernetesSim.create_deployment(PodSpec(
            workload_id=f"workload-{int(time.time())}",
            image="aios-workload",
            resources={"gpu": 1},
            affinity={"node_target": target_node},
            tolerations=["maintenance"]
        ))
        RaySim.assign_worker(pod_id, "migrated-workload")
        
        learning_engine.log_experience("LIVE MIGRATION", hot_node, reason)

class ConsolidationEngine:
    """ Consolidates fragmented workloads to save power """
    def evaluate(self, util_map, admin_user, learning_engine):
        recent_action = ApprovalRequest.objects.filter(action_type="CONSOLIDATION", requested_at__gte=timezone.now() - timedelta(minutes=1)).exists()
        if recent_action:
            return
            
        underutilized = [node for node, util in util_map.items() if 0 < util < 30]
        if len(underutilized) > 1:
            target = underutilized[0]
            sources = underutilized[1:4] # Consolidate up to 3 at a time
            for src in sources:
                reason = "WORKLOAD CONSOLIDATION"
                ApprovalRequest.objects.create(
                    action_type="CONSOLIDATION", target_resource=src,
                    reason=reason, status="APPROVED", approved_by=admin_user
                )
                WorkloadPlacement.objects.create(
                    job_id=f"CONSOLIDATE-{int(time.time())}-{src}", source_node=src, target_node=target,
                    reason=reason, status="COMPLETED"
                )
                pod_id = KubernetesSim.create_deployment(PodSpec(
                    workload_id=f"workload-{int(time.time())}",
                    image="aios-workload",
                    resources={"gpu": 1},
                    affinity={"node_target": target},
                    tolerations=["maintenance"]
                ))
                RaySim.assign_worker(pod_id, "consolidated-workload")
                learning_engine.log_experience("WORKLOAD CONSOLIDATION", src, reason)

class WorkloadSchedulerEngine:
    """ Processes queued SimulationRun instances from TrafficGenerator """
    def evaluate(self, admin_user, learning_engine):
        from simulator.models import SimulationRun
        from cluster_infra.kubernetes_sim import KubernetesSim, PodSpec
        from cluster_infra.ray_sim import RaySim
        import random

        # Process queued
        queued_runs = SimulationRun.objects.filter(status='queued')[:50]
        for run in queued_runs:
            run.status = 'processing'
            run.save()
            
            # Simulate Kubernetes and Ray assignment
            pod_id = KubernetesSim.create_deployment(PodSpec(
                workload_id=f"workload-{run.id}",
                image="aios-workload",
                resources={"gpu": run.required_nodes},
                affinity={"node_target": "auto"},
                tolerations=[]
            ))
            RaySim.assign_worker(pod_id, f"sim-workload-{run.id}")
            
        # Transition old processing to completed 
        processing_runs = list(SimulationRun.objects.filter(status='processing').order_by('id')[:50])
        for run in processing_runs:
            if random.random() > 0.5: # 50% chance to complete per tick
                run.status = 'completed'
                run.efficiency_pct = random.uniform(80.0, 99.9)
                run.save()

class SchedulerEngine:
    """ Phase 20: Scheduling Engine """
    def __init__(self):
        self.learning_engine = LearningEngine()
        self.prediction_engine = PredictionEngine()
        self.cost_engine = CostEngine()
        self.capacity_engine = CapacityEngine()
        self.migration_engine = MigrationEngine()
        self.consolidation_engine = ConsolidationEngine()
        self.workload_scheduler = WorkloadSchedulerEngine()

    def run_loop(self):
        print("Starting Digital Twin Processors Engine (Docs 20-25)...")
        try:
            admin_user = User.objects.get(username='admin')
        except User.DoesNotExist:
            admin_user = None

        while True:
            # 1. Collect Telemetry via Prometheus
            temps = PrometheusSim.query("dcgm_fi_dev_gpu_temp")
            utils = PrometheusSim.query("dcgm_fi_dev_gpu_util")
            powers = PrometheusSim.query("dcgm_fi_dev_power_usage")
            
            temp_map = {item['metric']['node']: float(item['value'][1]) for item in temps}
            util_map = {item['metric']['node']: float(item['value'][1]) for item in utils}
            power_map = {item['metric']['node']: float(item['value'][1]) for item in powers}
            
            # 2. Run Prediction Engine (Phase 21)
            anomaly_scores = self.prediction_engine.analyze()
            
            idle_nodes = []
            hot_nodes = []
            max_prob = 0.01
            max_prob_node = "Cluster"

            new_alerts = []
            new_cost_reports = []

            for node_id, temp in temp_map.items():
                util = util_map.get(node_id, 0)
                power = power_map.get(node_id, 0)
                
                base_prob = max(0.01, min(0.95, (temp - 40) / 60.0))
                prob = max(base_prob, anomaly_scores.get(node_id, 0.01))
                
                if prob > max_prob:
                    max_prob = prob
                    max_prob_node = node_id
                
                # Use Learning Engine dynamic threshold
                thermal_threshold = self.learning_engine.knowledge_base.get("thermal_threshold", 90.0)
                
                if temp >= thermal_threshold or prob > 0.90:
                    hot_nodes.append((node_id, temp))
                    if not Alert.objects.filter(node_id=node_id, resolved=False).exists():
                        new_alerts.append(Alert(node_id=node_id, severity="CRITICAL", message=f"ML Predicted Anomaly (Score: {prob*100:.0f}%)"))
                elif temp < 85 and prob < 0.70:
                    Alert.objects.filter(node_id=node_id, resolved=False).update(resolved=True)

                # 3. Cost Engine (Phase 23)
                if util < 5:
                    idle_nodes.append(node_id)
                    wasted_cost = (power / 1000) * KWH_COST_USD
                    new_cost_reports.append(CostReport(node_id=node_id, idle_time_hours=1.0, wasted_cost_usd=wasted_cost))
                    self.cost_engine.evaluate(node_id, util, power, admin_user, self.learning_engine)

            if new_alerts: Alert.objects.bulk_create(new_alerts, ignore_conflicts=True)
            if new_cost_reports: CostReport.objects.bulk_create(new_cost_reports, ignore_conflicts=True)

            Prediction.objects.create(node_id=max_prob_node, failure_probability=max_prob, reason=f"Max cluster threat: {max_prob*100:.0f}%")
            recent_ids = list(Prediction.objects.order_by('-predicted_at').values_list('id', flat=True)[:50])
            if recent_ids: Prediction.objects.exclude(id__in=recent_ids).delete()

            # 4. Capacity Engine (Phase 24)
            active_nodes_count = 128 - len(idle_nodes)
            cluster_load_pct = active_nodes_count / 128.0
            self.capacity_engine.evaluate(cluster_load_pct, active_nodes_count, admin_user, self.learning_engine)

            # 5. Migration Engine (Phase 22)
            for hot_node, temp in hot_nodes:
                recent_action = ApprovalRequest.objects.filter(target_resource=hot_node, requested_at__gte=timezone.now() - timedelta(seconds=30)).exists()
                if recent_action: continue
                
                if idle_nodes:
                    target = idle_nodes.pop(0)
                    self.migration_engine.trigger_live_migration(hot_node, temp, target, admin_user, self.learning_engine)
                else:
                    # Kill fallback
                    reason = f"Deterministic Heuristic: Thermal breach at {temp:.1f}C. No idle nodes."
                    ApprovalRequest.objects.create(action_type="KILL NON-ESSENTIAL", target_resource=hot_node, reason=reason, status="APPROVED", approved_by=admin_user)
                    self.learning_engine.log_experience("KILL NON-ESSENTIAL", hot_node, reason)
                    
            # 6. Consolidation Engine (Merge Workloads)
            self.consolidation_engine.evaluate(util_map, admin_user, self.learning_engine)

            # 7. Workload Scheduler Engine
            self.workload_scheduler.evaluate(admin_user, self.learning_engine)

            time.sleep(2)

if __name__ == "__main__":
    scheduler = SchedulerEngine()
    try:
        scheduler.run_loop()
    except KeyboardInterrupt:
        print("Processor stopped.")
