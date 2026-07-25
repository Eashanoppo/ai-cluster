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
    "video_generation": {
        "label": "Video Generation",
        "base_nodes": 32,
        "min_tier": 4,
        "icon": "🎥",
    },
    "code_edit": {
        "label": "Code Editing",
        "base_nodes": 4,
        "min_tier": 1,
        "icon": "💻",
    },
    "production_saas": {
        "label": "Production SaaS Workload",
        "base_nodes": 48,
        "min_tier": 3,
        "icon": "☁️",
    },
    "normal_chats": {
        "label": "Normal Chats",
        "base_nodes": 2,
        "min_tier": 1,
        "icon": "💬",
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
    user_count: int = 1,
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

    # Apply user scale
    concurrency_multiplier = max(1.0, user_count / 50.0)
    nodes = nodes * concurrency_multiplier

    return max(1, int(nodes))


def assess_allocation(
    task_type: str,
    allocated_nodes: int,
    user_count: int = 1,
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
        task_type, user_count, file_input_size_gb, image_count, thinking_depth, complexity_factor
    )

    default_tier = spec["min_tier"]
    tier = default_tier

    warning_message = ""
    requires_intervention = False
    actual_allocated = allocated_nodes

    # Fetch active tiers from database
    try:
        from django.utils import timezone
        from datetime import timedelta
        from simulator.models import SimulationRun
        
        cutoff = timezone.now() - timedelta(seconds=120)
        active_runs = SimulationRun.objects.filter(
            status__in=["processing", "analyzing", "pending"],
            created_at__gte=cutoff
        ).values_list('selected_tier', flat=True)
        active_tiers = set(active_runs)
    except Exception:
        active_tiers = set()

    found_tier = False
    is_idle_fallback = False

    # 1. Idle Resource Fallback check
    if allocated_nodes <= 12 and default_tier > 1:
        fallback_tier = max(1, default_tier - 1)
        if fallback_tier not in active_tiers:
            tier = fallback_tier
            is_idle_fallback = True
            found_tier = True

    # 2. Autonomous Tier Routing
    if not found_tier:
        for t in range(default_tier, 5):
            if t not in active_tiers:
                tier = t
                found_tier = True
                break

    if not found_tier:
        # Overload: All eligible tiers are busy. Auto-stack / Load-balance autonomously.
        tier = default_tier
        tier_info = TIERS[tier]
        actual_allocated = required
        verdict: Verdict = "optimal"
        verdict_label = "OPTIMAL (AUTONOMOUS LOAD SHARING)"
        requires_intervention = False
        warning_message = f"All tiers busy. Autonomously distributing {required} nodes across shared active Tier {tier} resources."
    else:
        tier_info = TIERS[tier]
        # Standard node allocation evaluation
        if allocated_nodes < required:
            # Auto-scale up regardless of deficit size
            actual_allocated = required
            verdict = "optimal"
            verdict_label = "OPTIMAL (AUTO-SCALED UP)"
            warning_message = f"Autonomous SaaS scaled allocation from {allocated_nodes} to {required} required nodes."
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

        # Prepend routing/fallback warnings
        if is_idle_fallback:
            verdict_label = "OPTIMAL (IDLE FALLBACK)"
            warning_message = f"Workload is low resource-intensive. Automatically fell back from Tier {default_tier} to a lower spec Tier {tier} cluster. " + warning_message
        elif tier > default_tier:
            verdict_label = "OPTIMAL (AUTONOMOUS ROUTING)"
            warning_message = f"Autonomous SaaS routed task from busy Tier {default_tier} to available Tier {tier}. " + warning_message

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


# ---------------------------------------------------------------------------
# Tier Fit & Placement Proof — Hackathon Challenge Module
# ---------------------------------------------------------------------------

# Hourly cost per node per tier (USD).
# Based on approximate spot-market GPU rental rates.
TIER_COSTS: dict[int, float] = {
    1: 0.90,   # RTX 3090 — consumer class
    2: 2.50,   # RTX 4090 — prosumer
    3: 5.00,   # RTX 5090 — workstation
    4: 18.00,  # Blackwell B200 — enterprise HPC
}

# Simulated queue wait times per tier (seconds).
# Lower tiers have more nodes available → shorter queue.
TIER_WAIT_SECONDS: dict[int, float] = {
    1: 0.5,
    2: 1.2,
    3: 3.0,
    4: 8.0,
}

# Jobs that REQUIRE Tier 4 exclusively (others must not consume it)
TIER4_EXCLUSIVE_TASKS = {"large_ml_project", "video_generation"}


def compute_tier_fit_score(task_type: str, selected_tier: int) -> float:
    """
    Score how well a job was placed on the selected tier (0–100).

    100 = perfect: cheapest tier that exactly meets the job's minimum need.
    Penalises over-provisioning (cheap job on expensive GPU) and
    under-provisioning (job forced below its minimum tier).
    """
    spec = TASK_SPECS.get(task_type)
    if spec is None:
        return 50.0

    min_tier = spec["min_tier"]

    # Under-provisioned: job on a tier below its minimum requirement
    if selected_tier < min_tier:
        return max(0.0, 20.0 - (min_tier - selected_tier) * 10)

    # Perfect fit: placed on the exact minimum viable tier
    if selected_tier == min_tier:
        return 100.0

    # Over-provisioned: job used a more expensive tier than necessary
    # Lose 22 points per wasted tier level
    waste = selected_tier - min_tier
    score = max(0.0, 100.0 - waste * 22.0)
    return round(score, 1)


def get_first_free_tier(active_tiers: set[int]) -> int:
    """
    Simulate the naive 'First Free' scheduler:
    Simply picks the lowest-indexed tier that is not currently overloaded,
    without considering the job's actual hardware requirements.
    This represents a traditional round-robin / bin-packing approach.
    """
    for tier in range(1, 5):
        if tier not in active_tiers:
            return tier
    # All tiers busy — fall back to Tier 1
    return 1


def generate_reason_line(
    task_type: str,
    selected_tier: int,
    first_free_tier: int,
    score: float,
    top_tier_preserved: bool,
    nodes_allocated: int = 1,
) -> str:
    """
    Generate a single human-readable sentence explaining the tier placement decision.
    Designed for the Placement Proof dashboard panel.
    """
    spec = TASK_SPECS.get(task_type, {})
    task_label = spec.get("label", task_type.replace("_", " ").title())
    tier_info = TIERS.get(selected_tier, {})
    tier_name = tier_info.get("name", f"Tier {selected_tier}")
    vram = tier_info.get("vram", "N/A")
    cost = TIER_COSTS.get(selected_tier, 0.0)
    first_free_cost = TIER_COSTS.get(first_free_tier, 0.0)
    saving = round(first_free_cost - cost, 2)

    if task_type in TIER4_EXCLUSIVE_TASKS:
        preserved_note = (
            f"; Tier 4 was reserved and kept available for this job"
            if top_tier_preserved
            else ""
        )
        return (
            f"{task_label} placed on {tier_name} — requires {vram} VRAM, "
            f"only Tier 4 meets this need at ${cost:.2f}/hr per node{preserved_note}."
        )

    if selected_tier == spec.get("min_tier", 1):
        saving_note = (
            f", saving ${saving:.2f}/hr vs naive Tier {first_free_tier} placement"
            if saving > 0
            else ""
        )
        return (
            f"{task_label} assigned to {tier_name} — minimum viable tier "
            f"at ${cost:.2f}/hr per node (score {score:.0f}/100){saving_note}."
        )

    return (
        f"{task_label} routed to {tier_name} at ${cost:.2f}/hr — "
        f"Tier {spec.get('min_tier', 1)} was busy; next available tier selected "
        f"(Tier Fit score {score:.0f}/100)."
    )
