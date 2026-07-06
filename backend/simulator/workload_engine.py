"""
Workload engine for the cluster simulator.

Computes required node counts, GPU build configurations (Tiers), and allocation status
based on user tasks and allocated node counts. Deterministic and state-free.
"""

from dataclasses import dataclass
from typing import Literal

# ---------------------------------------------------------------------------
# Hardware configuration definitions (Build Types)
# ---------------------------------------------------------------------------

TOTAL_NODES = 128

TIERS: dict[int, dict] = {
    1: {
        "name": "RTX 3090 Build",
        "color": "#a3be8c", # Nord14 Green
        "ram": "16GB DDR5",
        "vram": "24GB GDDR6X",
        "temp": 65,
        "power": 350,
    },
    2: {
        "name": "RTX 4090 Build",
        "color": "#ebcb8b", # Nord13 Yellow
        "ram": "32GB DDR5",
        "vram": "24GB GDDR6X",
        "temp": 60,
        "power": 450,
    },
    3: {
        "name": "RTX 5090 Build",
        "color": "#d08770", # Nord12 Orange
        "ram": "64GB DDR5",
        "vram": "32GB GDDR7",
        "temp": 58,
        "power": 600,
    },
    4: {
        "name": "Blackwell B200 Build",
        "color": "#bf616a", # Nord11 Red
        "ram": "128GB LPDDR5",
        "vram": "192GB HBM3",
        "temp": 55,
        "power": 700,
    },
}

# Quadrant boundaries in the 128-node grid map
TIER_NODE_RANGES = {
    1: range(0, 32),
    2: range(32, 64),
    3: range(64, 96),
    4: range(96, 128),
}

# ---------------------------------------------------------------------------
# Task specifications & Resource mapping
# ---------------------------------------------------------------------------

TASK_SPECS: dict[str, dict] = {
    "ocr_data_retrieval": {
        "label": "OCR & Data Retrieval",
        "base_nodes": 8,
        "min_tier": 1,
        "icon": "📄",
    },
    "image_generation": {
        "label": "Image Generation",
        "base_nodes": 16,
        "min_tier": 2,
        "icon": "🎨",
    },
    "batch_vision": {
        "label": "Batch Vision Processing",
        "base_nodes": 24,
        "min_tier": 3,
        "icon": "🖼️",
    },
    "image_editing": {
        "label": "Image Editing",
        "base_nodes": 12,
        "min_tier": 2,
        "icon": "✂️",
    },
    "large_ml_project": {
        "label": "Large ML Project",
        "base_nodes": 64,
        "min_tier": 4,
        "icon": "🧠",
    },
}

# ---------------------------------------------------------------------------
# Allocation Evaluation
# ---------------------------------------------------------------------------

Verdict = Literal["optimal", "overload", "idle_waste"]


@dataclass
class AllocationResult:
    required_nodes: int
    allocated_nodes_requested: int
    allocated_nodes_actual: int
    selected_tier: int
    tier_name: str
    efficiency_pct: float
    verdict: Verdict
    verdict_label: str
    warning_message: str
    requires_intervention: bool


def calculate_required_nodes(
    task_type: str,
    file_input_size_gb: float = 1.0,
    image_count: int = 0,
    thinking_depth: int = 1,
    complexity_factor: float = 1.0,
) -> int:
    """Calculate needed nodes based on task profile parameters."""
    if task_type not in TASK_SPECS:
        return 8

    spec = TASK_SPECS[task_type]
    base = spec["base_nodes"]

    # Parameter adjustments
    depth_multiplier = 1.0 + (thinking_depth * 0.1)
    complexity_multiplier = complexity_factor

    nodes = base * depth_multiplier * complexity_multiplier

    # Task specific scaling
    if task_type == "ocr_data_retrieval" and file_input_size_gb > 1.0:
        nodes += (file_input_size_gb * 1.5)
    elif task_type == "batch_vision" and image_count > 1:
        nodes += ((image_count - 1) * 4)

    return max(1, min(32, int(nodes)))


def assess_allocation(
    task_type: str,
    allocated_nodes: int,
    file_input_size_gb: float = 1.0,
    image_count: int = 0,
    thinking_depth: int = 1,
    complexity_factor: float = 1.0,
) -> AllocationResult:
    """
    Evaluate allocation of nodes (1-32) vs required nodes.
    Applies cluster occupancy check, auto-scaling, overload human intervention, and idle fallback.
    """
    spec = TASK_SPECS.get(task_type, TASK_SPECS["ocr_data_retrieval"])
    required = calculate_required_nodes(
        task_type, file_input_size_gb, image_count, thinking_depth, complexity_factor
    )

    default_tier = spec["min_tier"]
    tier = default_tier

    warning_message = ""
    requires_intervention = False
    actual_allocated = allocated_nodes

    # 1. Idle Resource Fallback check
    # If the task is not that resource hungry (e.g. allocated_nodes <= 12) and minimum tier is Tier 2, 3 or 4,
    # automatically fallback to a lower spec cluster tier to save resource costs.
    is_idle_fallback = False
    if allocated_nodes <= 12 and default_tier > 1:
        tier = max(1, default_tier - 1)
        is_idle_fallback = True

    # 2. Cluster Occupancy / Overload check
    # Check if there is another active task running in the same quadrant tier
    try:
        from django.utils import timezone
        from datetime import timedelta
        from simulator.models import SimulationRun
        
        cutoff = timezone.now() - timedelta(seconds=120)
        active_in_tier = SimulationRun.objects.filter(
            selected_tier=tier,
            status__in=["processing", "analyzing", "pending"],
            created_at__gte=cutoff
        ).exists()
    except Exception:
        active_in_tier = False

    tier_info = TIERS[tier]

    if active_in_tier:
        # Overload: another task is active in this tier. Block and request human intervention.
        actual_allocated = allocated_nodes
        verdict: Verdict = "overload"
        next_tier = min(4, tier + 1)
        verdict_label = "OVERLOAD (HUMAN INTERVENTION REQUIRED)"
        requires_intervention = True
        warning_message = f"CRITICAL: Quadrant Tier {tier} ({tier_info['name']}) is overloaded by another active task. Human intervention required. Please approve workload migration to Tier {next_tier} from the dashboard."
    else:
        # Standard node allocation evaluation
        if allocated_nodes < required:
            deficit_pct = (required - allocated_nodes) / required
            if deficit_pct <= 0.20:
                # Deficit is small (< 20%): auto-scale up (recoup nodes)
                actual_allocated = required
                verdict = "optimal"
                verdict_label = "OPTIMAL (AUTO-SCALED UP)"
                warning_message = f"Warning: Deficit under 20%. Auto-scaling allocation from {allocated_nodes} to required {required} nodes."
            else:
                # Deficit is large (> 20%): block and request human intervention
                actual_allocated = allocated_nodes
                verdict = "overload"
                verdict_label = "OVERLOAD (HUMAN INTERVENTION REQUIRED)"
                requires_intervention = True
                warning_message = f"CRITICAL: Deficit too large ({deficit_pct*100:.0f}%). Human intervention required. Allocate at least {required} nodes to run."
        elif allocated_nodes > required:
            # Excess allocation: auto-release excess nodes to reduce waste
            actual_allocated = required
            verdict = "optimal"
            verdict_label = "OPTIMAL (AUTO-RELEASED SURPLUS)"
            warning_message = f"System auto-released {allocated_nodes - required} excess idle nodes to reduce cluster waste."
        else:
            # Perfect allocation match
            actual_allocated = required
            verdict = "optimal"
            verdict_label = "OPTIMAL"

        # Prepend fallback warning if fallback triggered
        if is_idle_fallback:
            verdict_label = "OPTIMAL (IDLE FALLBACK)"
            warning_message = f"Workload is low resource-intensive. Automatically fell back from Tier {default_tier} to a lower spec Tier {tier} cluster. " + warning_message

    efficiency_pct = min(100.0, (required / max(1, actual_allocated)) * 100)

    return AllocationResult(
        required_nodes=required,
        allocated_nodes_requested=allocated_nodes,
        allocated_nodes_actual=actual_allocated,
        selected_tier=tier,
        tier_name=tier_info["name"],
        efficiency_pct=round(efficiency_pct, 1),
        verdict=verdict,
        verdict_label=verdict_label,
        warning_message=warning_message.strip(),
        requires_intervention=requires_intervention,
    )

