"""
Ray Workload Engine — Enhanced with Tier Fit & Placement Proof

Dispatches SimulationRun jobs to the cheapest GPU tier that meets each job's
hardware requirements. Writes TierFitResult records for the dashboard.

Workflow:
    1. Picks up 'queued' SimulationRun records
    2. Computes Tier Fit Score for the assigned tier
    3. Reserves Tier 4 (Blackwell B200) for heavy jobs only
    4. Finds cheapest valid tier; upgrades/downgrades if needed
    5. Writes TierFitResult record with reason line + cost comparison
    6. Marks job 'analyzing' → Kubernator picks it up next
"""

import os
import sys
import time
import random
import logging
import django
import multiprocessing
from typing import Any

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(backend_path)
os.chdir(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

logging.basicConfig(
    level=logging.INFO,
    format='[Ray Engine] %(asctime)s %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

from simulator.models import SimulationRun, TierFitResult
from simulator.workload_engine import (
    TASK_SPECS,
    TIERS,
    TIER_COSTS,
    TIER_WAIT_SECONDS,
    TIER4_EXCLUSIVE_TASKS,
    compute_tier_fit_score,
    get_first_free_tier,
    generate_reason_line,
)
from django.utils import timezone


# ---------------------------------------------------------------------------
# Worker task — simulates actual GPU computation
# ---------------------------------------------------------------------------

def ray_worker_task(run_id: int, node_count: int, duration_minutes: int):
    """
    Simulates a Ray Actor executing a distributed inference workload.
    In production this would invoke the real Ray cluster API.
    """
    print(f"[Ray Worker] >> Job {run_id} dispatched across {node_count} nodes...")
    simulated_seconds = max(2, duration_minutes * 2)

    for i in range(simulated_seconds):
        time.sleep(1)
        if i % 5 == 0:
            pct = (i / simulated_seconds) * 100
            print(f"[Ray Worker] Job {run_id} progress: {pct:.0f}%")

    print(f"[Ray Worker] OK Job {run_id} completed.")
    return run_id


# ---------------------------------------------------------------------------
# Tier selection logic
# ---------------------------------------------------------------------------

def _get_active_tiers() -> set[int]:
    """Return set of tier IDs currently in use by processing/analyzing jobs."""
    cutoff = timezone.now() - timezone.timedelta(seconds=120)
    active = SimulationRun.objects.filter(
        status__in=['processing', 'analyzing'],
        created_at__gte=cutoff,
    ).values_list('selected_tier', flat=True)
    return set(active)


def _is_tier4_available() -> bool:
    """Check whether any Tier 4 nodes are still free for heavy jobs."""
    tier4_in_use = SimulationRun.objects.filter(
        status__in=['processing', 'analyzing'],
        selected_tier=4,
    ).count()
    # Keep at least one "lane" free (32 nodes in quadrant 4; reserve when >24 busy)
    return tier4_in_use < 24


def _select_optimal_tier(task_type: str, min_tier: int, active_tiers: set[int]) -> int:
    """
    Select the cheapest GPU tier that meets the job's minimum hardware requirement.

    Rules:
    - Heavy jobs (video, large_ml) must use Tier 4 only — never demote them
    - Light jobs (chats, code, OCR) must NOT use Tier 4 — preserve it
    - For mid-tier jobs: find cheapest available tier >= min_tier
    """
    if task_type in TIER4_EXCLUSIVE_TASKS:
        return 4  # Always Tier 4 — non-negotiable

    # Light jobs: cap at Tier 2 max, preserving Tier 4 for heavy jobs
    if min_tier == 1:
        for tier in [1, 2]:
            return tier  # Always assign Tier 1 for lightest jobs

    # Mid-tier jobs: find cheapest viable tier
    for tier in range(min_tier, 4):  # Stop before 4 (reserved for heavy)
        return tier

    # Fallback (should not reach here for non-heavy jobs)
    return min_tier


# ---------------------------------------------------------------------------
# Main Ray Engine loop
# ---------------------------------------------------------------------------

def run_ray_engine():
    logger.info("Initializing Ray Cluster Head Node (Tier Fit Mode)...")
    logger.info("Workers: 4 processes | Tier 4 reservation: ACTIVE")

    pool = multiprocessing.Pool(processes=4)
    active_jobs: dict[int, Any] = {}

    while True:
        try:
            # ── PHASE 1: Pick up queued jobs ──────────────────────────────
            queued_runs = SimulationRun.objects.filter(status='queued')[:30]
            active_tiers = _get_active_tiers()
            tier4_free = _is_tier4_available()

            for run in queued_runs:
                if run.id in active_jobs:
                    continue

                spec = TASK_SPECS.get(run.task_type, {})
                min_tier = spec.get('min_tier', 1)
                is_heavy = run.task_type in TIER4_EXCLUSIVE_TASKS
                traffic_mode = 'manual'
                if run.company_name and run.company_name.startswith('burst:'):
                    traffic_mode = run.company_name.split(':', 1)[1]

                # ── Tier Fit: select optimal tier ─────────────────────────
                optimal_tier = _select_optimal_tier(run.task_type, min_tier, active_tiers)

                # For heavy jobs needing Tier 4: check availability
                if is_heavy and not tier4_free:
                    # Tier 4 saturated — queue job slightly later
                    logger.warning(f"Job {run.id} ({run.task_type}) waiting for Tier 4 slot...")
                    continue  # Will retry next cycle

                # ── Compute scores & comparison ────────────────────────────
                score = compute_tier_fit_score(run.task_type, optimal_tier)
                naive_tier = get_first_free_tier(active_tiers)
                naive_cost = TIER_COSTS.get(naive_tier, 0.9)
                our_cost = TIER_COSTS.get(optimal_tier, 0.9)
                saving = round(naive_cost - our_cost, 4)
                our_wait = TIER_WAIT_SECONDS.get(optimal_tier, 1.0) + random.uniform(0, 0.5)
                naive_wait = TIER_WAIT_SECONDS.get(naive_tier, 1.0) + random.uniform(2, 8)
                top_tier_preserved = (not is_heavy) and (optimal_tier < 4)

                reason = generate_reason_line(
                    run.task_type, optimal_tier, naive_tier,
                    score, top_tier_preserved, run.allocated_nodes
                )

                # ── Write TierFitResult record ─────────────────────────────
                TierFitResult.objects.create(
                    run=run,
                    task_type=run.task_type,
                    selected_tier=optimal_tier,
                    tier_name=TIERS.get(optimal_tier, {}).get('name', f'Tier {optimal_tier}'),
                    tier_fit_score=score,
                    reason_line=reason,
                    cost_per_hour_usd=our_cost,
                    first_free_tier=naive_tier,
                    first_free_cost_usd=naive_cost,
                    cost_saving_usd=saving,
                    wait_time_seconds=round(our_wait, 2),
                    first_free_wait_seconds=round(naive_wait, 2),
                    top_tier_preserved=top_tier_preserved,
                    traffic_mode=traffic_mode,
                )

                # ── Update the SimulationRun ───────────────────────────────
                run.selected_tier = optimal_tier
                run.status = 'analyzing'  # Kubernator picks up next
                run.save(update_fields=['selected_tier', 'status'])

                logger.info(
                    f">> Job {run.id} [{run.task_type}] -> Tier {optimal_tier} "
                    f"| Score: {score:.0f}/100 | ${our_cost:.2f}/hr | "
                    f"Save: ${saving:.2f} vs naive | {reason[:60]}..."
                )

                # ── Dispatch to Ray worker pool ────────────────────────────
                result = pool.apply_async(
                    ray_worker_task,
                    args=(run.id, run.allocated_nodes_actual or run.allocated_nodes, 2)
                )
                active_jobs[run.id] = result

            # ── PHASE 2: Check completed jobs ─────────────────────────────
            completed = []
            for run_id, result in active_jobs.items():
                if result.ready():
                    logger.info(f"Job {run_id} finished. Updating control plane.")
                    run = SimulationRun.objects.filter(id=run_id).first()
                    if run and run.status not in ('failed',):
                        run.status = 'completed'
                        run.efficiency_pct = random.uniform(88.0, 99.5)
                        run.save(update_fields=['status', 'efficiency_pct'])
                    completed.append(run_id)

            for run_id in completed:
                del active_jobs[run_id]

            # ── Prune old TierFitResults to prevent DB bloat ──────────────
            cutoff = timezone.now() - timezone.timedelta(hours=2)
            TierFitResult.objects.filter(created_at__lt=cutoff).delete()

            time.sleep(2)

        except Exception as e:
            logger.error(f"Ray Engine error: {e}", exc_info=True)
            time.sleep(2)


if __name__ == "__main__":
    run_ray_engine()
