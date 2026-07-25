import os
import sys
import time
import django
import random

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(backend_path)
os.chdir(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

from simulator.models import SimulationRun
from telemetry.models import GpuTelemetry
from scheduler.models import WorkloadPlacement
from django.utils import timezone

def rank_nodes_for_workload(required_nodes, tier):
    """
    Ranks nodes based on VRAM availability and Temperature.
    Uses telemetry history.
    """
    # Fetch latest telemetry for all nodes
    cutoff = timezone.now() - timezone.timedelta(seconds=120)
    recent = GpuTelemetry.objects.filter(timestamp__gte=cutoff)
    
    node_stats = {}
    for r in recent:
        # Keep latest for each node
        node_stats[r.node_id] = {
            'temp': r.temperature_celsius,
            'vram_avail': r.vram_total_mb - r.vram_usage_mb,
            'util': r.gpu_utilization_percent
        }
        
    # We want low temp, high vram availability, low util
    def score_node(n_id):
        stats = node_stats.get(n_id, {'temp': 30, 'vram_avail': 10000, 'util': 0})
        # Higher score is better
        # Normalize arbitrarily for sorting
        temp_score = max(0, 100 - stats['temp']) * 0.4
        vram_score = min(100, (stats['vram_avail'] / 24000) * 100) * 0.4
        util_score = max(0, 100 - stats['util']) * 0.2
        return temp_score + vram_score + util_score

    # Filter out failing nodes
    healthy_nodes = [n for n, stats in node_stats.items() if stats['temp'] < 85.0]
    
    if not healthy_nodes:
        return []

    # Sort nodes by score descending
    ranked = sorted(healthy_nodes, key=score_node, reverse=True)
    return ranked[:required_nodes]

def run_kubernator_scheduler():
    print("[Kubernator Scheduler] Starting Control Plane Loop...")
    
    while True:
        try:
            # Look for jobs needing placement
            pending_runs = SimulationRun.objects.filter(status='analyzing')
            
            for run in pending_runs:
                print(f"[Kubernator] Scheduling Run {run.id} (Tier {run.selected_tier}, {run.allocated_nodes} nodes requested)")
                
                best_nodes = rank_nodes_for_workload(run.allocated_nodes, run.selected_tier)
                
                if len(best_nodes) < run.allocated_nodes:
                    print(f"[Kubernator] WARNING: Insufficient healthy nodes for Run {run.id}. Triggering overload.")
                    run.status = 'completed'
                    run.verdict = 'overload'
                    run.save()
                    continue
                    
                # Create WorkloadPlacement
                placement = WorkloadPlacement.objects.create(
                    run=run,
                    target_node=best_nodes[0],  # Primary node
                    estimated_completion_time=timezone.now() + timezone.timedelta(minutes=2),
                    placement_reason=f"Ranked #1 for Tier {run.selected_tier} with score based on VRAM/Temp."
                )
                
                run.status = 'processing'
                run.allocated_nodes_actual = len(best_nodes)
                run.save()
                
                print(f"[Kubernator] Assigned {run.id} to {best_nodes}")

            time.sleep(2)
        except Exception as e:
            print(f"Error in Kubernator: {e}")
            time.sleep(2)

if __name__ == "__main__":
    run_kubernator_scheduler()
