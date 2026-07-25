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
    """
    Phase 25: Learning Engine — Enhanced with Tier Fit simulation awareness.

    Learns from each simulation's TierFitResult outcomes to:
    - Adjust thermal thresholds per tier
    - Detect rising temperature trends BEFORE a breach occurs
    - Pre-emptively migrate workloads to prevent failure
    """
    def __init__(self):
        self.knowledge_base = {
            "thermal_threshold": 90.0,
            "cost_threshold": 0.05,
            "migration_success_rate": 0.95,
            # Per-tier learned thermal thresholds
            "tier_thresholds": {1: 90.0, 2: 88.0, 3: 86.0, 4: 82.0},
        }
        # Rolling temperature history per node (last 10 samples) for trend detection
        self._temp_history: dict[str, list[float]] = {}
        # Track nodes for which we've already issued a pre-emptive alert
        self._pre_migrated: set[str] = set()
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

    def learn_from_tier_fit(self):
        """
        Read recent TierFitResult records and adjust per-tier thermal thresholds.
        If a tier consistently produces high-scoring placements, we can relax its threshold.
        If a tier sees failed jobs, tighten the threshold.
        """
        try:
            from simulator.models import TierFitResult
            from django.utils import timezone
            cutoff = timezone.now() - timezone.timedelta(hours=1)
            for tier in range(1, 5):
                results = TierFitResult.objects.filter(
                    selected_tier=tier,
                    created_at__gte=cutoff,
                ).values_list('tier_fit_score', flat=True)
                scores = list(results)
                if len(scores) < 5:
                    continue
                avg_score = sum(scores) / len(scores)
                # High avg score → tier is being used efficiently → can tolerate slightly higher temp
                # Low avg score → over-provisioning detected → tighten threshold to force redistribution
                current = self.knowledge_base["tier_thresholds"].get(tier, 88.0)
                if avg_score > 85:
                    self.knowledge_base["tier_thresholds"][tier] = min(92.0, current + 0.2)
                elif avg_score < 50:
                    self.knowledge_base["tier_thresholds"][tier] = max(78.0, current - 0.5)
                print(
                    f"[LEARNING ENGINE] Tier {tier} avg Tier Fit Score={avg_score:.0f} → "
                    f"thermal threshold adjusted to {self.knowledge_base['tier_thresholds'][tier]:.1f}°C"
                )
        except Exception:
            pass

    def record_temp(self, node_id: str, temp: float):
        """Push latest temperature into per-node rolling history (max 10 samples)."""
        history = self._temp_history.setdefault(node_id, [])
        history.append(temp)
        if len(history) > 10:
            history.pop(0)

    def is_trending_hot(self, node_id: str, tier: int) -> bool:
        """
        Return True if this node's temperature is trending upward and is projected
        to breach the learned tier threshold within the next 2 samples.
        This allows a PRE-EMPTIVE migration BEFORE actual failure.
        """
        history = self._temp_history.get(node_id, [])
        if len(history) < 4:
            return False
        # Simple linear trend: compare avg of last 2 vs avg of previous 2
        recent_avg = sum(history[-2:]) / 2
        prior_avg = sum(history[-4:-2]) / 2
        rising_rate = recent_avg - prior_avg  # degrees per sample interval
        threshold = self.knowledge_base["tier_thresholds"].get(tier, 90.0)
        projected_next = recent_avg + (rising_rate * 2)
        return projected_next >= (threshold * 0.92)  # 92% of threshold = act early

    def load_experiences(self):
        if not LEARNING_FILE.exists():
            return
        try:
            with open(LEARNING_FILE, "r") as f:
                lines = f.readlines()
                if len(lines) > 100:
                    print("[LEARNING ENGINE] Analyzing historical experiences and adjusting policy weights.")
                    # Count migration successes vs failures to calibrate threshold
                    successes = sum(1 for l in lines if '"outcome": "SUCCESS"' in l)
                    total = len(lines)
                    success_rate = successes / total if total > 0 else 0.95
                    # If success rate is high, we can be more aggressive (lower threshold slightly)
                    if success_rate > 0.90:
                        self.knowledge_base["thermal_threshold"] = 88.0
                        print(f"[LEARNING ENGINE] High success rate ({success_rate:.0%}). Threshold tightened to 88°C.")
                    else:
                        self.knowledge_base["thermal_threshold"] = 91.0
                        print(f"[LEARNING ENGINE] Lower success rate ({success_rate:.0%}). Threshold relaxed to 91°C.")
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

        tick_count = 0  # Used to space out learning updates

        while True:
            tick_count += 1

            # 0. Periodically learn from Tier Fit simulation outcomes (every 10 ticks)
            if tick_count % 10 == 0:
                self.learning_engine.learn_from_tier_fit()

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

                # Feed temp into learning engine for trend analysis
                self.learning_engine.record_temp(node_id, temp)

                base_prob = max(0.01, min(0.95, (temp - 40) / 60.0))
                prob = max(base_prob, anomaly_scores.get(node_id, 0.01))

                if prob > max_prob:
                    max_prob = prob
                    max_prob_node = node_id

                # Use Learning Engine dynamic threshold (global + per-tier)
                thermal_threshold = self.learning_engine.knowledge_base.get("thermal_threshold", 90.0)

                # Determine node tier from index (Node-000..031 = Tier1, etc.)
                try:
                    node_idx = int(node_id.split('-')[1])
                    node_tier = (node_idx // 32) + 1
                except Exception:
                    node_tier = 1
                tier_threshold = self.learning_engine.knowledge_base["tier_thresholds"].get(node_tier, thermal_threshold)

                # ── PRE-EMPTIVE migration: act BEFORE thermal breach ──────
                if self.learning_engine.is_trending_hot(node_id, node_tier):
                    pre_recent = ApprovalRequest.objects.filter(
                        target_resource=node_id,
                        action_type="PREDICTIVE MIGRATION",
                        requested_at__gte=timezone.now() - timedelta(minutes=2)
                    ).exists()
                    if not pre_recent and node_id not in self.learning_engine._pre_migrated:
                        reason = (
                            f"[PREDICTIVE] Tier {node_tier} node {node_id} temp trending hot "
                            f"({temp:.1f}°C). Pre-emptive migration triggered before breach at "
                            f"{tier_threshold:.1f}°C."
                        )
                        print(f"[LEARNING ENGINE] [PREDICTIVE] {reason}")
                        ApprovalRequest.objects.create(
                            action_type="PREDICTIVE MIGRATION",
                            target_resource=node_id,
                            reason=reason,
                            status="APPROVED",
                            approved_by=admin_user,
                        )
                        self.learning_engine.log_experience(
                            "PREDICTIVE MIGRATION", node_id, reason,
                            outcome="PRE_EMPTIVE", confidence=0.88
                        )
                        self.learning_engine._pre_migrated.add(node_id)
                elif temp < tier_threshold * 0.85:
                    # Node cooled down — remove from pre-migrated set
                    self.learning_engine._pre_migrated.discard(node_id)

                if temp >= tier_threshold or prob > 0.90:
                    hot_nodes.append((node_id, temp))
                    if not Alert.objects.filter(node_id=node_id, resolved=False).exists():
                        new_alerts.append(Alert(node_id=node_id, severity="CRITICAL", message=f"ML Predicted Anomaly (Score: {prob*100:.0f}%)"))
                elif temp < 85 and prob < 0.70:
                    Alert.objects.filter(node_id=node_id, resolved=False).update(resolved=True)

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
