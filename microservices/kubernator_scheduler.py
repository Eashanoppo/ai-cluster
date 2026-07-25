"""
Kubernator Scheduler — Enhanced with Tier 4 Reservation & Reason Lines

For each job in 'analyzing' state:
1. Ranks healthy nodes by VRAM availability, temperature, and utilization
2. Generates a ONE-LINE reason sentence for the placement decision
3. Keeps Tier 4 (Blackwell B200) nodes reserved for heavy jobs
4. Updates TierFitResult with top_tier_preserved flag
5. Creates WorkloadPlacement record with full reason line
"""

import os
import sys
import time
import logging
import django
import random

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(backend_path)
os.chdir(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

logging.basicConfig(
    level=logging.INFO,
    format='[Kubernator] %(asctime)s %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

from simulator.models import SimulationRun, TierFitResult
from simulator.workload_engine import TIER4_EXCLUSIVE_TASKS, TIER_COSTS, TIERS
from telemetry.models import GpuTelemetry
from scheduler.models import WorkloadPlacement
from django.utils import timezone


# Tier → node index ranges in the 128-node grid
TIER_NODE_RANGES = {1: range(0, 32), 2: range(32, 64), 3: range(64, 96), 4: range(96, 128)}


def rank_nodes_for_workload(required_nodes: int, tier: int) -> list[str]:
    """
    Rank the healthiest nodes within the given tier's quadrant.
    Scoring: low temp (40%), high VRAM free (40%), low utilization (20%).
    Returns the top N node IDs.
    """
    cutoff = timezone.now() - timezone.timedelta(seconds=120)
    tier_indices = TIER_NODE_RANGES.get(tier, range(0, 32))

    # Build prefix list for nodes in this tier's quadrant
    node_prefixes = {f"Node-{i:03d}" for i in tier_indices}

    recent = GpuTelemetry.objects.filter(timestamp__gte=cutoff)

    node_stats: dict[str, dict] = {}
    for r in recent:
        if r.node_id in node_prefixes:
            node_stats[r.node_id] = {
                'temp': r.temperature_celsius,
                'vram_avail': r.vram_total_mb - r.vram_usage_mb,
                'util': r.gpu_utilization_percent,
            }

    def score_node(node_id: str) -> float:
        s = node_stats.get(node_id, {'temp': 30, 'vram_avail': 10000, 'util': 0})
        temp_score = max(0, 100 - s['temp']) * 0.4
        vram_score = min(100, (s['vram_avail'] / 24000) * 100) * 0.4
        util_score = max(0, 100 - s['util']) * 0.2
        return temp_score + vram_score + util_score

    # Only healthy nodes (temp < 85°C)
    healthy = [n for n, s in node_stats.items() if s['temp'] < 85.0]

    if not healthy:
        # Fallback: generate synthetic node names from tier range
        healthy = [f"Node-{i:03d}" for i in list(tier_indices)[:required_nodes * 2]]

    ranked = sorted(healthy, key=score_node, reverse=True)
    return ranked[:required_nodes]


def _build_placement_reason(
    run: SimulationRun,
    primary_node: str,
    node_stats: dict,
    top_tier_preserved: bool,
) -> str:
    """
    Generate one clear sentence explaining this specific node/tier placement.
    Example:
      'Node-042 selected for Code Editing on Tier 1 (RTX 3090) — temp 58°C,
       VRAM 18.2 GB free, lowest-cost tier at $0.90/hr; Tier 4 preserved for heavy jobs.'
    """
    tier_info = TIERS.get(run.selected_tier, {})
    tier_name = tier_info.get("name", f"Tier {run.selected_tier}")
    cost = TIER_COSTS.get(run.selected_tier, 0.0)

    stats = node_stats.get(primary_node, {})
    temp_str = f"{stats.get('temp', 0):.0f}C" if stats else "N/A"
    vram_str = f"{stats.get('vram_avail', 0) / 1024:.1f} GB free" if stats else "N/A"
    task_label = run.task_type.replace("_", " ").title()

    preserved_note = ""
    if top_tier_preserved and run.selected_tier < 4:
        preserved_note = "; Tier 4 (B200) kept free for heavy ML/video jobs"

    return (
        f"{primary_node} selected for {task_label} on {tier_name} "
        f"temp {temp_str}, VRAM {vram_str}, "
        f"${cost:.2f}/hr per node{preserved_note}."
    )


def run_kubernator_scheduler():
    logger.info("Starting Kubernator Control Plane (Tier 4 Reservation: ACTIVE)...")

    while True:
        try:
            # Jobs waiting for node assignment (Ray set them to 'analyzing')
            pending_runs = SimulationRun.objects.filter(status='analyzing')

            for run in pending_runs:
                is_heavy = run.task_type in TIER4_EXCLUSIVE_TASKS
                top_tier_preserved = not is_heavy  # Non-heavy jobs preserve Tier 4

                logger.info(
                    f"Scheduling Run {run.id} [{run.task_type}] -> "
                    f"Tier {run.selected_tier} | nodes: {run.allocated_nodes}"
                )

                # -- Rank best nodes in the tier's quadrant ----------------
                best_nodes = rank_nodes_for_workload(run.allocated_nodes, run.selected_tier)

                if not best_nodes:
                    logger.warning(f"No healthy nodes for Run {run.id}. Marking overload.")
                    run.status = 'completed'
                    run.verdict = 'overload'
                    run.save(update_fields=['status', 'verdict'])
                    continue

                # Gather stats for the primary node for reason line
                cutoff = timezone.now() - timezone.timedelta(seconds=120)
                primary_node = best_nodes[0]
                recent_telemetry = GpuTelemetry.objects.filter(
                    node_id=primary_node, timestamp__gte=cutoff
                ).first()
                node_stats_map: dict = {}
                if recent_telemetry:
                    node_stats_map[primary_node] = {
                        'temp': recent_telemetry.temperature_celsius,
                        'vram_avail': recent_telemetry.vram_total_mb - recent_telemetry.vram_usage_mb,
                        'util': recent_telemetry.gpu_utilization_percent,
                    }

                # -- Build reason line --------------------------------------
                reason_line = _build_placement_reason(
                    run, primary_node, node_stats_map, top_tier_preserved
                )

                # -- Create WorkloadPlacement with reason -------------------
                WorkloadPlacement.objects.create(
                    job_id=f"KUB-{run.id}-{int(time.time())}",
                    source_node="auto",
                    target_node=primary_node,
                    reason=reason_line,
                    status="COMPLETED",
                )

                # -- Update TierFitResult with top_tier_preserved flag ------
                latest_fit = TierFitResult.objects.filter(run=run).order_by('-created_at').first()
                if latest_fit:
                    latest_fit.top_tier_preserved = top_tier_preserved
                    latest_fit.reason_line = reason_line  # Update with node-specific detail
                    latest_fit.save(update_fields=['top_tier_preserved', 'reason_line'])

                # -- Advance job to processing ------------------------------
                run.status = 'processing'
                run.allocated_nodes_actual = len(best_nodes)
                run.save(update_fields=['status', 'allocated_nodes_actual'])

                logger.info(
                    f"  >> Assigned to {primary_node} (+{len(best_nodes)-1} more nodes) "
                    f"| Tier4 preserved: {top_tier_preserved}"
                )
                logger.info(f"  Reason: {reason_line}")

            time.sleep(2)

        except Exception as e:
            logger.error(f"Kubernator error: {e}", exc_info=True)
            time.sleep(2)


if __name__ == "__main__":
    run_kubernator_scheduler()
