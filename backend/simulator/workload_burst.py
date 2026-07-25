"""
Workload Burst Generator — Tier Fit & Placement Proof Module

Generates realistic mixed workload bursts for ClustroConnect's Tier Fit demo.
Supports Peak Hours and Off-Peak traffic modes with editable task counts.

Usage:
    from simulator.workload_burst import run_workload_burst
    run_workload_burst(mode='peak')  # or 'off_peak', with optional overrides
"""

import random
import time
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Traffic mode presets (editable defaults, can be overridden per-call)
# ---------------------------------------------------------------------------

TRAFFIC_PRESETS = {
    "peak": {
        "video_generation":  100,
        "image_generation":  250,
        "code_edit":         500,
        "normal_chats":      2000,
        # Research tasks mapped to nearest available types
        "batch_vision":      500,   # research/batch
        "large_ml_project":  20,    # heavy GPU anchors that reserve Tier 4
        "ocr_data_retrieval": 100,
        "image_editing":     80,
        "production_saas":   50,
    },
    "off_peak": {
        "video_generation":  10,
        "image_generation":  25,
        "code_edit":         50,
        "normal_chats":      200,
        "batch_vision":      50,
        "large_ml_project":  3,
        "ocr_data_retrieval": 15,
        "image_editing":     10,
        "production_saas":   5,
    },
}

# Task type → default tier assignment (min tier requirement)
TASK_DEFAULT_TIER = {
    "video_generation":  4,
    "large_ml_project":  4,
    "batch_vision":      3,
    "production_saas":   3,
    "image_generation":  2,
    "image_editing":     2,
    "ocr_data_retrieval": 1,
    "code_edit":          1,
    "normal_chats":       1,
}

# Required nodes per task type
TASK_BASE_NODES = {
    "video_generation":  32,
    "large_ml_project":  64,
    "batch_vision":      24,
    "production_saas":   48,
    "image_generation":  16,
    "image_editing":     12,
    "ocr_data_retrieval": 8,
    "code_edit":          4,
    "normal_chats":       2,
}


def run_workload_burst(
    mode: str = "peak",
    traffic_mode_override: dict | None = None,
    batch_size: int = 50,
    delay_between_batches: float = 0.1,
) -> dict:
    """
    Generate a burst of SimulationRun records for the Tier Fit demo.

    Args:
        mode: 'peak' or 'off_peak' — selects the traffic preset
        traffic_mode_override: dict of {task_type: count} to override preset values
        batch_size: number of runs to insert per DB batch (prevents lock contention)
        delay_between_batches: seconds between batch inserts

    Returns:
        dict with counts of created jobs by type and total
    """
    from simulator.models import SimulationRun

    # Build task count map
    counts = dict(TRAFFIC_PRESETS.get(mode, TRAFFIC_PRESETS["peak"]))
    if traffic_mode_override:
        counts.update(traffic_mode_override)

    logger.info(f"[WorkloadBurst] Launching {mode.upper()} burst -- {sum(counts.values())} total jobs")
    print(f"[WorkloadBurst] >> Launching {mode.upper()} burst -- {sum(counts.values())} total jobs queued")

    all_runs = []
    created_counts: dict[str, int] = {}

    for task_type, count in counts.items():
        if count <= 0:
            continue
        tier = TASK_DEFAULT_TIER.get(task_type, 1)
        nodes = TASK_BASE_NODES.get(task_type, 4)
        created_counts[task_type] = count

        for _ in range(count):
            # Add slight randomness to make it feel organic
            node_variance = random.randint(-1, 2)
            actual_nodes = max(1, nodes + node_variance)

            all_runs.append(SimulationRun(
                task_type=task_type,
                status='queued',
                priority=_assign_priority(task_type, mode),
                selected_tier=tier,
                required_nodes=actual_nodes,
                allocated_nodes=actual_nodes,
                efficiency_pct=0.0,
                # Store traffic mode in company_name field for tracking
                company_name=f"burst:{mode}",
            ))

    # Insert in batches to avoid SQLite lock contention
    total_created = 0
    for i in range(0, len(all_runs), batch_size):
        batch = all_runs[i:i + batch_size]
        SimulationRun.objects.bulk_create(batch)
        total_created += len(batch)
        if delay_between_batches > 0:
            time.sleep(delay_between_batches)

    logger.info(f"[WorkloadBurst] Created {total_created} SimulationRun records in {mode} mode")
    print(f"[WorkloadBurst] OK Created {total_created} jobs | Mode: {mode.upper()}")

    return {
        "mode": mode,
        "total_created": total_created,
        "by_type": created_counts,
    }


def _assign_priority(task_type: str, mode: str) -> str:
    """Assign realistic priority based on task type and traffic mode."""
    if task_type in ("large_ml_project", "video_generation"):
        return "Critical"
    if task_type in ("production_saas", "batch_vision") and mode == "peak":
        return random.choice(["High", "Critical"])
    if task_type in ("code_edit", "normal_chats"):
        return random.choice(["Normal", "Normal", "Background"])
    return random.choice(["Normal", "High"])
