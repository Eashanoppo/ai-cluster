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

NODES = [f"Node-{i:03d}" for i in range(1, 129)]

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

            telemetry_objects = []

            for node in NODES:
                state = node_states[node]

                # --- Natural spike expiry: auto-cool after 6 ticks (30s) ---
                if state["status"] == "spike":
                    state["spike_ticks"] += 1
                    if state["spike_ticks"] >= 6:
                        state["status"] = "normal"
                        state["spike_ticks"] = 0
                        print(f"[{node}] SPIKE naturally expired. Returning to NORMAL.")
                        # Continue to build normal state telemetry for this tick
                        state["temp"] = apply_drift(state["temp"], 40, 60)
                        state["util"] = apply_drift(state["util"], 20, 70)
                        state["vram"] = apply_drift(state["vram"], 10000, 50000)
                        state["power"] = apply_drift(state["power"], 100, 250)

                # --- State transitions ---
                # Allow up to 5 spiking nodes at a time for 128 nodes
                if random.random() < 0.04:  # 4% chance per tick
                    if state["status"] == "normal":
                        rand_choice = random.random()
                        if rand_choice < 0.25:  # 25% of transitions from normal go to idle
                            state["status"] = "idle"
                            print(f"[{node}] entered IDLE state.")
                        elif rand_choice < 0.35 and spiking_count < 5:  # 10% of transitions go to spike
                            state["status"] = "spike"
                            state["spike_ticks"] = 0
                            spiking_count += 1
                            print(f"[{node}] entered SPIKE state!")
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

                telemetry_objects.append(
                    GpuTelemetry(
                        node_id=node,
                        gpu_id=0,
                        temperature_celsius=state["temp"],
                        vram_usage_mb=state["vram"],
                        vram_total_mb=80000,
                        gpu_utilization_percent=state["util"],
                        power_draw_watts=state["power"]
                    )
                )

            # Bulk create all telemetry objects in a single database transaction
            if telemetry_objects:
                GpuTelemetry.objects.bulk_create(telemetry_objects)

            # Data-cleanup cron job emulation: Prune records older than 10 minutes to prevent DB bloat
            cutoff = timezone.now() - timedelta(minutes=10)
            deleted_count, _ = GpuTelemetry.objects.filter(timestamp__lt=cutoff).delete()

            # Print concise summary instead of printing all 128 nodes individually
            nominal_count = sum(1 for n in NODES if node_states[n]["status"] == "normal")
            idle_count = sum(1 for n in NODES if node_states[n]["status"] == "idle")
            spike_count = sum(1 for n in NODES if node_states[n]["status"] == "spike")
            print(f"Tick | Nodes: 128 total [Nominal={nominal_count}, Idle={idle_count}, Spike={spike_count}] | Pruned {deleted_count} records")

            time.sleep(5)
    except KeyboardInterrupt:
        print("Telemetry Generator stopped.")

if __name__ == "__main__":
    generate_telemetry()
