import os
import time
import random
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

from telemetry.models import GpuTelemetry
from simulator.models import SimulationRun
from django.utils import timezone
from datetime import timedelta

NODES = [f"Node-{i:03d}" for i in range(1, 129)]

# Define hardware profile specs per Tier
TIER_SPECS = {
    1: {
        "vram_total_mb": 24576, # 24GB
        "temp_min": 63.0,
        "temp_max": 67.0,
        "power_min": 330.0,
        "power_max": 350.0,
        "util_min": 75.0,
        "util_max": 90.0,
    },
    2: {
        "vram_total_mb": 24576, # 24GB
        "temp_min": 58.0,
        "temp_max": 62.0,
        "power_min": 420.0,
        "power_max": 450.0,
        "util_min": 80.0,
        "util_max": 95.0,
    },
    3: {
        "vram_total_mb": 32768, # 32GB
        "temp_min": 56.0,
        "temp_max": 60.0,
        "power_min": 560.0,
        "power_max": 600.0,
        "util_min": 85.0,
        "util_max": 98.0,
    },
    4: {
        "vram_total_mb": 196608, # 192GB
        "temp_min": 53.0,
        "temp_max": 57.0,
        "power_min": 660.0,
        "power_max": 700.0,
        "util_min": 90.0,
        "util_max": 100.0,
    },
}

def apply_drift(current, target_min, target_max, step=1.5):
    target = random.uniform(target_min, target_max)
    if current < target:
        return min(current + random.uniform(0, step), target_max)
    else:
        return max(current - random.uniform(0, step), target_min)

def generate_telemetry():
    print("Starting Partitioned Quadrant Telemetry Generator...")
    
    # Track persistent running telemetry metrics to drift smoothly
    last_metrics = {
        node: {
            "temp": 28.0,
            "util": 0.0,
            "vram": 0.0,
            "power": 10.0
        } for node in NODES
    }

    try:
        while True:
            # Check for active workstation simulation run
            active_run = None
            try:
                # Get latest run created/completed within last 120 seconds
                cutoff = timezone.now() - timedelta(seconds=120)
                latest = SimulationRun.objects.filter(
                    created_at__gte=cutoff
                ).order_by('-created_at').first()
                if latest and latest.status in ['processing', 'completed'] and latest.verdict != 'overload':
                    active_run = latest
            except Exception as e:
                print(f"Error checking SimulationRun: {e}")

            active_tier = None
            active_nodes_count = 0
            if active_run:
                active_tier = active_run.selected_tier
                active_nodes_count = active_run.allocated_nodes_actual or active_run.allocated_nodes

            # Determine quadrant ranges
            # Tier 1: Nodes 1-32, Tier 2: 33-64, Tier 3: 65-96, Tier 4: 97-128
            active_node_indices = set()
            if active_tier:
                start_idx = (active_tier - 1) * 32
                # Only activate the first 'active_nodes_count' nodes in this quadrant
                for i in range(min(active_nodes_count, 32)):
                    active_node_indices.add(start_idx + i)

            telemetry_objects = []

            for idx, node in enumerate(NODES):
                hist = last_metrics[node]
                is_active = idx in active_node_indices

                if is_active:
                    spec = TIER_SPECS[active_tier]
                    vram_total = spec["vram_total_mb"]
                    hist["temp"] = apply_drift(hist["temp"], spec["temp_min"], spec["temp_max"])
                    hist["util"] = apply_drift(hist["util"], spec["util_min"], spec["util_max"])
                    hist["vram"] = apply_drift(hist["vram"], vram_total * 0.7, vram_total * 0.9)
                    hist["power"] = apply_drift(hist["power"], spec["power_min"], spec["power_max"])
                else:
                    # Inactive / OFF state: room temperature, 0 utilization, 0 VRAM, standby 10W power
                    vram_total = 24576  # Default VRAM total for inactive nodes
                    # Determine actual vram total based on node quadrant if needed
                    node_quad = (idx // 32) + 1
                    if node_quad in TIER_SPECS:
                        vram_total = TIER_SPECS[node_quad]["vram_total_mb"]

                    hist["temp"] = apply_drift(hist["temp"], 25.0, 30.0)
                    hist["util"] = apply_drift(hist["util"], 0.0, 0.0)
                    hist["vram"] = apply_drift(hist["vram"], 0.0, 0.0)
                    hist["power"] = apply_drift(hist["power"], 8.0, 12.0)

                telemetry_objects.append(
                    GpuTelemetry(
                        node_id=node,
                        gpu_id=0,
                        temperature_celsius=hist["temp"],
                        vram_usage_mb=hist["vram"],
                        vram_total_mb=vram_total,
                        gpu_utilization_percent=hist["util"],
                        power_draw_watts=hist["power"]
                    )
                )

            # Bulk create all telemetry objects in a single database transaction
            if telemetry_objects:
                GpuTelemetry.objects.bulk_create(telemetry_objects)

            # Data-cleanup: Prune records older than 10 minutes to prevent DB bloat
            prune_cutoff = timezone.now() - timedelta(minutes=10)
            deleted_count, _ = GpuTelemetry.objects.filter(timestamp__lt=prune_cutoff).delete()

            # Output logs
            if active_run:
                print(f"Tick | ACTIVE simulation found: {active_run} | Activated Tier {active_tier} (nodes count: {active_nodes_count}) | Pruned {deleted_count} records")
            else:
                print(f"Tick | Idle state (no active simulation) | All 128 nodes OFF | Pruned {deleted_count} records")

            time.sleep(5)
    except KeyboardInterrupt:
        print("Telemetry Generator stopped.")

if __name__ == "__main__":
    generate_telemetry()
