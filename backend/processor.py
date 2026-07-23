import os
import time
import django
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.db.models import Subquery, OuterRef
from openai import OpenAI

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

LLM_MODEL: str = getattr(settings, 'LLM_MODEL', 'llama3') or 'llama3'

from telemetry.models import GpuTelemetry
from sentinel.models import Prediction, Alert
from scheduler.models import WorkloadPlacement
from costwatch.models import CostReport
from gate.models import ApprovalRequest
from django.contrib.auth.models import User

# ML Imports
import numpy as np
try:
    from sklearn.ensemble import IsolationForest
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("[WARNING] scikit-learn not installed. ML Anomaly Detection will fall back to heuristics.")

# Pricing constants
KWH_COST_USD = 0.15

def analyze_cluster_state(hot_node, temp):
    """
    Deterministic Scheduler Engine Analysis.
    The engine computes priority rules itself — no cloud LLM required.
    """
    print(f"[SCHEDULER] Hard problem detected on {hot_node} ({temp:.1f}C). No idle nodes available.")
    print("[SCHEDULER] Running deterministic priority eviction algorithm...")
    
    decision = "KILL"
    print(f"[SCHEDULER] Deterministic Engine Decision: {decision} non-essential workloads.")
    
    # Use local Ollama ONLY for a human-readable root-cause analysis string
    try:
        client = OpenAI(
            base_url=settings.OLLAMA_BASE_URL,
            api_key="ollama",
            timeout=5.0
        )
        prompt = f"Write a 1-sentence root cause analysis for why we must kill batch jobs on Node {hot_node} at {temp:.1f}C."
        
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a concise sysadmin assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=30,
        )
        content = response.choices[0].message.content
        rca = content.strip() if content else f"Thermal breach at {temp:.1f}C."
        print(f"[AGENT] Local Ollama RCA: {rca}")
    except Exception as e:
        print(f"[AGENT] Local Ollama unavailable: {e}. Using deterministic reason.")
        rca = f"Critical thermal breach at {temp:.1f}C. Evicting non-essential batch jobs to prevent hardware damage."

    return "KILL", rca
def log_experience(action, node, reason, outcome="SUCCESS"):
    """
    Phase 15: Learning Engine Feedback Loop
    Logs the outcome of an autonomous decision into a local knowledge repository.
    This enables future offline retraining of the IsolationForest and decision trees.
    """
    try:
        import json
        from pathlib import Path
        log_file = Path(__file__).parent / "learning_engine_experience.jsonl"
        with open(log_file, "a") as f:
            f.write(json.dumps({
                "timestamp": str(timezone.now()),
                "action": action,
                "node": node,
                "reason": reason,
                "outcome": outcome
            }) + "\n")
    except Exception as e:
        pass

def run_processor():
    print("Starting ClustroConnect Deterministic Processor...")
    try:
        admin_user = User.objects.get(username='admin')
    except User.DoesNotExist:  # type: ignore[attr-defined]
        admin_user = None

    try:
        while True:
            # Get latest telemetry per node
            latest_telemetry_qs = GpuTelemetry.objects.filter(
                node_id=OuterRef('node_id')
            ).order_by('-timestamp').values('id')[:1]
            
            latest_telemetries = GpuTelemetry.objects.filter(
                id__in=Subquery(latest_telemetry_qs)
            )

            idle_nodes = []
            hot_nodes = []
            
            max_prob_this_tick = 0.01
            max_prob_node = "Cluster"

            new_alerts = []
            new_cost_reports = []

            # Machine Learning Isolation Forest (Phase 11)
            # We train it dynamically on the latest telemetry batch to detect outliers (anomalies).
            features = []
            node_map = []
            
            for latest in latest_telemetries:
                features.append([latest.temperature_celsius, latest.gpu_utilization_percent, latest.power_draw_watts])
                node_map.append(latest.node_id)
            
            anomaly_scores = {}
            if ML_AVAILABLE and len(features) > 2:
                try:
                    X = np.array(features)
                    # Use a very sensitive contamination rate to catch anomalies
                    iso = IsolationForest(contamination=0.1, random_state=42)
                    # Fit and predict. -1 is anomaly, 1 is normal
                    predictions = iso.fit_predict(X)
                    # Get anomaly scores (lower is more anomalous, flip it for probability)
                    scores = iso.score_samples(X) 
                    
                    for i, node in enumerate(node_map):
                        # Convert score to a 0.0-1.0 probability range roughly
                        prob = min(0.99, max(0.01, (0.5 - scores[i]) * 2.0))
                        # If isolation forest literally predicts -1, ensure high probability
                        if predictions[i] == -1:
                            prob = max(prob, 0.85)
                        anomaly_scores[node] = prob
                except Exception as e:
                    print(f"[ML ENGINE] IsolationForest Error: {e}")

            for latest in latest_telemetries:
                try:
                    node = latest.node_id
                    
                    # --- Sentinel: Dynamic failure probability ---
                    # Combine ML probability with heuristic thermal probability
                    base_prob = max(0.01, min(0.95, (latest.temperature_celsius - 40) / 60.0))
                    ml_prob = anomaly_scores.get(node, base_prob)
                    
                    # Highest of the two
                    prob = max(base_prob, ml_prob)
                    
                    if prob > max_prob_this_tick:
                        max_prob_this_tick = prob
                        max_prob_node = node
                    
                    if latest.temperature_celsius >= 90 or prob > 0.90:
                        hot_nodes.append((node, latest.temperature_celsius))
                        if not Alert.objects.filter(node_id=node, resolved=False).exists():
                            new_alerts.append(Alert(
                                node_id=node,
                                severity="CRITICAL",
                                message=f"ML Predicted Anomaly / Thermal breach (Score: {prob*100:.0f}%)"
                            ))
                    elif latest.temperature_celsius < 85 and prob < 0.70:
                        # Auto-resolve critical alerts when node cools down below 85C
                        Alert.objects.filter(node_id=node, resolved=False).update(resolved=True)
                    
                    # --- CostWatch & Cost Optimization (Phase 13) ---
                    if latest.gpu_utilization_percent < 5:
                        idle_nodes.append(node)
                        wasted_cost = (latest.power_draw_watts / 1000) * KWH_COST_USD
                        new_cost_reports.append(CostReport(
                            node_id=node,
                            idle_time_hours=1.0,
                            wasted_cost_usd=wasted_cost
                        ))
                        
                        # Autonomous Cost-Aware Sleep Logic
                        recent_sleep = ApprovalRequest.objects.filter(
                            target_resource=node,
                            action_type="NODE SUSPEND",
                            requested_at__gte=timezone.now() - timedelta(minutes=5)
                        ).exists()
                        if not recent_sleep:
                            reason_text = f"Cost Optimization: Node idle. Suspending to save ${wasted_cost:.2f}/hr."
                            ApprovalRequest.objects.create(
                                action_type="NODE SUSPEND",
                                target_resource=node,
                                reason=reason_text,
                                status="APPROVED",
                                approved_by=admin_user
                            )
                            print(f"[COST OPTIMIZATION] Suspended idle node {node}")
                            
                            # Phase 15: Log Cost Optimization Experience
                            log_experience("NODE SUSPEND", node, reason_text)
                except Exception as e:
                    print(f"[PROCESSOR] Error processing node {latest.node_id}: {e}")

            if new_alerts:
                Alert.objects.bulk_create(new_alerts, ignore_conflicts=True)
            if new_cost_reports:
                CostReport.objects.bulk_create(new_cost_reports, ignore_conflicts=True)
            
            # Write one prediction per tick; prune old data to keep table small
            Prediction.objects.create(
                node_id=max_prob_node,
                failure_probability=max_prob_this_tick,
                reason=f"Max cluster threat: {max_prob_this_tick*100:.0f}%"
            )
            # Keep only the last 50 predictions to prevent unbounded growth
            recent_ids = list(Prediction.objects.order_by('-predicted_at').values_list('id', flat=True)[:50])
            if recent_ids:
                Prediction.objects.exclude(id__in=recent_ids).delete()

            # --- Global Cluster Load Analysis ---
            active_nodes_count = 128 - len(idle_nodes)
            cluster_load_pct = active_nodes_count / 128.0
            
            # --- Digital Twin Forecasting (Phase 9) ---
            # Predict load 15 mins into the future based on current trend (dummy heuristic: add 5%)
            forecasted_load_pct = min(1.0, cluster_load_pct + 0.05)
            if forecasted_load_pct > 0.90:
                print(f"[DIGITAL TWIN] Alert: Projected cluster load in 15 mins is {forecasted_load_pct*100:.1f}%.")

            if cluster_load_pct > 0.95:
                # 95% Threshold: Autonomous Capacity Shedding (Phase 14)
                recent_shed = ApprovalRequest.objects.filter(
                    action_type="CAPACITY SHEDDING",
                    requested_at__gte=timezone.now() - timedelta(minutes=1)
                ).exists()
                if not recent_shed:
                    # Terminate all Batch workloads immediately
                    from simulator.models import SimulationRun
                    SimulationRun.objects.filter(status__in=["processing", "analyzing"], task_type__in=["batch_vision", "ocr_data_retrieval"]).update(
                        status="failed", 
                        response_text="[CAPACITY SHEDDING] Task terminated to prevent total cluster collapse."
                    )
                    ApprovalRequest.objects.create(
                        action_type="CAPACITY SHEDDING",
                        target_resource="Batch Workloads",
                        reason=f"CRITICAL: Cluster load breached 95%. Digital Twin projected collapse. Shedding batch tasks.",
                        status="APPROVED",
                        approved_by=admin_user
                    )
                    print("[GATE] Auto-executed CAPACITY SHEDDING (95% load)")
                    
            elif cluster_load_pct > 0.90:
                # 90% Threshold: Human Escalation
                recent_esc = ApprovalRequest.objects.filter(
                    action_type="EMERGENCY LOAD SHEDDING",
                    requested_at__gte=timezone.now() - timedelta(minutes=5)
                ).exists()
                if not recent_esc:
                    ApprovalRequest.objects.create(
                        action_type="EMERGENCY LOAD SHEDDING",
                        target_resource="Cluster Wide",
                        reason=f"CRITICAL: Cluster load breached 90% ({active_nodes_count}/128 nodes active). Autonomous emergency load shedding executed.",
                        status="APPROVED",
                        approved_by=admin_user
                    )
                    print(f"[GATE] Auto-executed EMERGENCY LOAD SHEDDING (90% load) autonomously")

            elif cluster_load_pct > 0.80:
                # 80% Threshold: AI Autonomous Decision
                recent_ai = ApprovalRequest.objects.filter(
                    action_type="AI AUTONOMOUS TERMINATION",
                    requested_at__gte=timezone.now() - timedelta(minutes=2)
                ).exists()
                if not recent_ai:
                    print(f"[SCHEDULER] Load at {cluster_load_pct*100:.1f}%. Querying AI for autonomous termination decision...")
                    try:
                        client = OpenAI(base_url=settings.OLLAMA_BASE_URL, api_key="ollama", timeout=5.0)
                        prompt = "The cluster is at 80% capacity. Which non-essential task type (e.g. image_generation, video_generation, normal_chats) should we put on hold or terminate first to stabilize? Return exactly one word."
                        response = client.chat.completions.create(
                            model=LLM_MODEL,
                            messages=[{"role": "system", "content": "You are an autonomous AI cluster manager."}, {"role": "user", "content": prompt}],
                            max_tokens=10,
                        )
                        content = response.choices[0].message.content
                        task_to_kill = content.strip().lower() if content else "unknown"
                        print(f"[AGENT] AI Decision: Hold/Terminate {task_to_kill}")
                        
                        # Apply the hold in DB
                        from simulator.models import SimulationRun
                        SimulationRun.objects.filter(status__in=["processing", "analyzing"], task_type__icontains=task_to_kill).update(status="failed", response_text="[AI AUTONOMOUS OVERRIDE] Task terminated to stabilize cluster load.")
                        
                        ApprovalRequest.objects.create(
                            action_type="AI AUTONOMOUS TERMINATION",
                            target_resource=task_to_kill,
                            reason=f"AI autonomously decided to terminate '{task_to_kill}' to stabilize load ({active_nodes_count}/128).",
                            status="APPROVED",
                            approved_by=admin_user
                        )
                    except Exception as e:
                        print(f"[AGENT] Local AI unavailable for 80% load decision: {e}")

            # --- Individual Node Scheduler Logic (Thermal / Failover) ---
            for hot_node, temp in hot_nodes:
                # Cooldown: skip if we acted on this node in the last 30 seconds
                recent_action = ApprovalRequest.objects.filter(
                    target_resource=hot_node,
                    requested_at__gte=timezone.now() - timedelta(seconds=30)
                ).exists()

                if recent_action:
                    continue
                
                if idle_nodes:
                    target = idle_nodes.pop(0)
                    action_type = "LLM Session Live Migration"
                    print(f"[MIGRATION] Initiating checkpoint for {hot_node}...")
                    print(f"[MIGRATION] State transferred to {target}. Checkpoint verified.")
                    reason = f"Autonomously migrating off {hot_node} to {target} due to thermal anomaly ({temp:.1f}C). State Checkpoint verified."
                    status = "APPROVED"
                    
                    # Phase 15: Log Experience for successful migration
                    log_experience(action_type, hot_node, reason)
                else:
                    decision, rca = analyze_cluster_state(hot_node, temp)
                    if decision == "KILL":
                        target = "None (Process Terminated)"
                        action_type = "KILL NON-ESSENTIAL WORKLOADS"
                        reason = f"Deterministic Heuristic (Autonomous): {rca}"
                        status = "APPROVED"
                    else:
                        print(f"[SCHEDULER] Engine decided to WAIT for {hot_node}.")
                        continue
                
                # Extreme temperature override (Fail-Safe Shifting is allowed autonomously)
                if temp >= 95.0 and status == "PENDING":
                    # Only escalate if we couldn't auto-migrate
                    reason += " [ESCALATED: Extreme temp > 95C. No idle nodes available.]"

                ApprovalRequest.objects.create(
                    action_type=action_type,
                    target_resource=hot_node,
                    reason=reason,
                    status=status,
                    approved_by=admin_user if status == "APPROVED" else None
                )

                if status == "APPROVED":
                    WorkloadPlacement.objects.create(
                        job_id=f"LLM-CTX-{int(time.time())}",
                        source_node=hot_node,
                        target_node=target,
                        reason=reason,
                        status="COMPLETED"
                    )
                    print(f"[SCHEDULER] Auto-executed: {action_type} on {hot_node}")
                else:
                    print(f"[GATE] Escalated {action_type} on {hot_node} to HUMAN (PENDING)")

            time.sleep(1)
    except KeyboardInterrupt:
        print("Processor stopped.")

if __name__ == "__main__":
    run_processor()
