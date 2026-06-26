import os
import time
import random
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

from telemetry.models import GpuTelemetry
from scheduler.models import WorkloadPlacement
from gate.models import ApprovalRequest
from django.utils import timezone
from datetime import timedelta

NODES = ["Node-01", "Node-02", "Node-14", "Node-08", "Node-19"]

# Initialize state for each node
node_states = {
    node: {
        "status": "normal",
        "temp": random.uniform(40, 50),
        "util": random.uniform(20, 40),
        "vram": random.uniform(10000, 30000),
        "power": random.uniform(100, 150),
        "spike_ticks": 0,  # Track how long a spike has been active
    } for node in NODES
}

def apply_drift(current, target_min, target_max, step=2.0):
    target = random.uniform(target_min, target_max)
    if current < target:
        return min(current + random.uniform(0, step), target_max)
    else:
        return max(current - random.uniform(0, step), target_min)

def generate_telemetry():
    print("Starting Dynamic Telemetry Generator...")
    try:
        while True:
            # --- React to Scheduler interventions ---
            # FIX: WorkloadPlacement uses 'migrated_at', NOT 'created_at'
            try:
                recent_migrations = WorkloadPlacement.objects.filter(
                    migrated_at__gte=timezone.now() - timedelta(seconds=15)
                )
                for mig in recent_migrations:
                    if mig.source_node in node_states and node_states[mig.source_node]["status"] == "spike":
                        node_states[mig.source_node]["status"] = "normal"
                        node_states[mig.source_node]["spike_ticks"] = 0
                        print(f"[REACTION] Scheduler migrated workloads off {mig.source_node}. Forcing cooldown!")
            except Exception:
                pass  # Table might not exist yet on first run

            try:
                recent_kills = ApprovalRequest.objects.filter(
                    status="APPROVED",
                    requested_at__gte=timezone.now() - timedelta(seconds=15)
                )
                for req in recent_kills:
                    if req.target_resource in node_states and node_states[req.target_resource]["status"] == "spike":
                        node_states[req.target_resource]["status"] = "normal"
                        node_states[req.target_resource]["spike_ticks"] = 0
                        print(f"[REACTION] Execution Gate approved KILL on {req.target_resource}. Forcing cooldown!")
            except Exception:
                pass

            # --- Count how many nodes are currently spiking ---
            spiking_count = sum(1 for n in NODES if node_states[n]["status"] == "spike")

            for node in NODES:
                state = node_states[node]

                # --- Natural spike expiry: auto-cool after 6 ticks (30s) ---
                if state["status"] == "spike":
                    state["spike_ticks"] += 1
                    if state["spike_ticks"] >= 6:
                        state["status"] = "normal"
                        state["spike_ticks"] = 0
                        print(f"[{node}] SPIKE naturally expired. Returning to NORMAL.")
                        continue

                # --- State transitions ---
                # Only allow 1 node to spike at a time for clear chart visuals
                if random.random() < 0.03:  # 3% chance per tick
                    if state["status"] == "normal":
                        if spiking_count == 0:  # Only spike if no other node is spiking
                            state["status"] = "spike"
                            state["spike_ticks"] = 0
                            spiking_count += 1
                            print(f"[{node}] entered SPIKE state!")
                        elif random.random() < 0.3:  # 30% chance to go idle instead
                            state["status"] = "idle"
                            print(f"[{node}] entered IDLE state.")
                    elif state["status"] == "idle":
                        state["status"] = "normal"
                        print(f"[{node}] returned to NORMAL from IDLE.")

                # --- Apply drift based on state ---
                if state["status"] == "idle":
                    state["temp"] = apply_drift(state["temp"], 30, 35)
                    state["util"] = apply_drift(state["util"], 0, 5)
                    state["vram"] = apply_drift(state["vram"], 0, 2000)
                    state["power"] = apply_drift(state["power"], 40, 60)
                elif state["status"] == "spike":
                    state["temp"] = apply_drift(state["temp"], 88, 98, step=4.0)
                    state["util"] = apply_drift(state["util"], 90, 100)
                    state["vram"] = apply_drift(state["vram"], 60000, 78000)
                    state["power"] = apply_drift(state["power"], 350, 400)
                else:  # normal
                    state["temp"] = apply_drift(state["temp"], 40, 60)
                    state["util"] = apply_drift(state["util"], 20, 70)
                    state["vram"] = apply_drift(state["vram"], 10000, 50000)
                    state["power"] = apply_drift(state["power"], 100, 250)

                GpuTelemetry.objects.create(
                    node_id=node,
                    gpu_id=0,
                    temperature_celsius=state["temp"],
                    vram_usage_mb=state["vram"],
                    vram_total_mb=80000,
                    gpu_utilization_percent=state["util"],
                    power_draw_watts=state["power"]
                )
            status_parts = []
            for n in NODES:
                s = node_states[n]["status"][:3].upper()
                t = node_states[n]["temp"]
                status_parts.append(f"{n}={s} {t:.0f}C")
            print(f"Tick | Nodes: {', '.join(status_parts)}")
            time.sleep(5)
    except KeyboardInterrupt:
        print("Telemetry Generator stopped.")

if __name__ == "__main__":
    generate_telemetry()
