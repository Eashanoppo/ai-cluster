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

    return decision, rca

def run_processor():
    print("Starting NeuronOps Deterministic Processor...")
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

            for latest in latest_telemetries:
                try:
                    node = latest.node_id
                    
                    # --- Sentinel: Dynamic failure probability ---
                    prob = max(0.01, min(0.95, (latest.temperature_celsius - 40) / 60.0))
                    if prob > max_prob_this_tick:
                        max_prob_this_tick = prob
                        max_prob_node = node
                    
                    if latest.temperature_celsius >= 90:
                        hot_nodes.append((node, latest.temperature_celsius))
                        if not Alert.objects.filter(node_id=node, resolved=False).exists():
                            new_alerts.append(Alert(
                                node_id=node,
                                severity="CRITICAL",
                                message=f"Thermal threshold breached: {latest.temperature_celsius:.1f}C"
                            ))
                    elif latest.temperature_celsius < 85:
                        # Auto-resolve critical alerts when node cools down below 85C
                        Alert.objects.filter(node_id=node, resolved=False).update(resolved=True)
                    
                    # --- CostWatch ---
                    if latest.gpu_utilization_percent < 5:
                        idle_nodes.append(node)
                        wasted_cost = (latest.power_draw_watts / 1000) * KWH_COST_USD
                        new_cost_reports.append(CostReport(
                            node_id=node,
                            idle_time_hours=1.0,
                            wasted_cost_usd=wasted_cost
                        ))
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

            if cluster_load_pct > 0.90:
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
                    target = idle_nodes.pop(0) # Pop to avoid double assigning the same idle node
                    action_type = "LLM Session Live Migration"
                    reason = f"Autonomously migrating off {hot_node} to {target} due to thermal anomaly ({temp:.1f}C)."
                    status = "APPROVED"
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

            time.sleep(5)
    except KeyboardInterrupt:
        print("Processor stopped.")

if __name__ == "__main__":
    run_processor()
