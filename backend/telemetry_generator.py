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
import json
from datetime import datetime
from django.conf import settings
from prometheus_client import start_http_server, Gauge  # type: ignore

NODES = [f"Node-{i:03d}" for i in range(1, 129)]

# DCGM Exporter Metrics (simulating Prometheus naming)
DCGM_FI_DEV_GPU_UTIL = Gauge('DCGM_FI_DEV_GPU_UTIL', 'GPU Utilization (%)', ['node', 'gpu'])
DCGM_FI_DEV_GPU_TEMP = Gauge('DCGM_FI_DEV_GPU_TEMP', 'GPU Temperature (C)', ['node', 'gpu'])
DCGM_FI_DEV_FB_USED = Gauge('DCGM_FI_DEV_FB_USED', 'GPU Framebuffer used (MB)', ['node', 'gpu'])
DCGM_FI_DEV_POWER_USAGE = Gauge('DCGM_FI_DEV_POWER_USAGE', 'GPU Power usage (W)', ['node', 'gpu'])
DCGM_FI_DEV_XID_ERRORS = Gauge('DCGM_FI_DEV_XID_ERRORS', 'Value of the last XID error encountered', ['node', 'gpu'])

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

def apply_drift(current, target_min, target_max, step=1.5):
    target = random.uniform(target_min, target_max)
    if current < target:
        return min(current + random.uniform(0, step), target_max)
    else:
        return max(current - random.uniform(0, step), target_min)

def read_disaster_state():
    state_file = os.path.join(settings.BASE_DIR, 'disaster_state.json')
    if os.path.exists(state_file):
        try:
            with open(state_file, 'r') as f:
                data = json.load(f)
                # Ensure the scenario is recent (within last 30 seconds)
                ts = datetime.fromisoformat(data.get('timestamp'))
                if (timezone.now().replace(tzinfo=None) - ts).total_seconds() < 30:
                    return data.get('scenario')
        except Exception:
            pass
    return 'manual'

def generate_telemetry():
    print("Starting Partitioned Quadrant Telemetry Generator...")
    # Start Prometheus HTTP server on port 8001
    print("Starting Prometheus DCGM Exporter endpoint on http://0.0.0.0:8001/metrics")
    start_http_server(8001)
    
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
            # Check for active workstation simulation runs
            cutoff = timezone.now() - timedelta(seconds=120)
            recent_runs = SimulationRun.objects.filter(
                created_at__gte=cutoff,
                status__in=['analyzing', 'processing', 'completed']
            ).exclude(verdict='overload')

            tier_loads = {1: 0, 2: 0, 3: 0, 4: 0}
            for run in recent_runs:
                nodes = run.allocated_nodes_actual or run.allocated_nodes
                tier = run.selected_tier
                if tier in tier_loads:
                    tier_loads[tier] += nodes

            active_node_indices = set()
            node_tier_map = {}
            for tier, total_nodes in tier_loads.items():
                if total_nodes == 0: continue
                start_idx = (tier - 1) * 32
                assigned = 0
                idx = start_idx
                while assigned < total_nodes and len(active_node_indices) < 128:
                    if idx not in active_node_indices:
                        active_node_indices.add(idx)
                        node_tier_map[idx] = tier
                        assigned += 1
                    idx = (idx + 1) % 128
                    
            # Random thermal anomaly / crash simulation under high load
            # Or manually injected via Workstation Simulator
            thermal_crash_node = None
            injected_scenario = read_disaster_state()
            
            if injected_scenario in ['gpu_failure', 'memory_leak', 'kill_gpu', 'shutdown_node'] and len(active_node_indices) > 0:
                # Manual injection target
                thermal_crash_node = NODES[list(active_node_indices)[0]]
                print(f"🔥 INJECTED {injected_scenario.upper()} SIMULATED ON {thermal_crash_node} 🔥")
            elif len(active_node_indices) > 64 and random.random() < 0.05:
                # Auto random crash under high load
                thermal_crash_node = NODES[random.choice(list(active_node_indices))]
                print(f"🔥 AUTO THERMAL CRASH SIMULATED ON {thermal_crash_node} 🔥")

            telemetry_objects = []

            for idx, node in enumerate(NODES):
                hist = last_metrics[node]
                is_active = idx in active_node_indices
                
                from telemetry.dcgm_exporter_sim import DCGMExporterSim
                
                workload_status = "idle"
                if is_active:
                    workload_status = "active"
                
                if injected_scenario == 'gpu_failure' and node == thermal_crash_node:
                    workload_status = "gpu_failure"
                elif injected_scenario == 'memory_leak' and node == thermal_crash_node:
                    workload_status = "memory_leak"
                elif injected_scenario == 'kill_gpu' and node == thermal_crash_node:
                    workload_status = "idle"
                elif injected_scenario == 'shutdown_node' and node == thermal_crash_node:
                    workload_status = "idle"

                assigned_tier = node_tier_map.get(idx, (idx // 32) + 1)
                if assigned_tier not in TIER_SPECS:
                    assigned_tier = 1
                tier_spec = TIER_SPECS[assigned_tier]
                vram_total = tier_spec["vram_total_mb"]
                
                hist = DCGMExporterSim.generate_metrics(node, tier_spec, workload_status, hist)
                last_metrics[node] = hist

                # Update Prometheus Metrics
                DCGM_FI_DEV_GPU_UTIL.labels(node=node, gpu='gpu0').set(hist["util"])
                DCGM_FI_DEV_GPU_TEMP.labels(node=node, gpu='gpu0').set(hist["temp"])
                DCGM_FI_DEV_FB_USED.labels(node=node, gpu='gpu0').set(hist["vram"])
                DCGM_FI_DEV_POWER_USAGE.labels(node=node, gpu='gpu0').set(hist["power"])
                
                # Mock XID error if failure
                xid = 43 if workload_status == "gpu_failure" else 0
                DCGM_FI_DEV_XID_ERRORS.labels(node=node, gpu='gpu0').set(xid)

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
            if recent_runs.exists():
                print(f"Tick | ACTIVE simulations found: {recent_runs.count()} | Activated multiple tiers (nodes count: {sum(tier_loads.values())}) | Pruned {deleted_count} records")
            else:
                print(f"Tick | Idle state (no active simulation) | All 128 nodes OFF | Pruned {deleted_count} records")

            time.sleep(1)
    except KeyboardInterrupt:
        print("Telemetry Generator stopped.")

if __name__ == "__main__":
    generate_telemetry()
