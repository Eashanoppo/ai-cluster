import os
import sys
import time
import django
import multiprocessing

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(backend_path)
os.chdir(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

from simulator.models import SimulationRun
from django.utils import timezone

def ray_worker_task(run_id, node_count, duration_minutes):
    """
    Simulates a Ray Actor executing a distributed inference workload.
    """
    print(f"[Ray Worker] Started processing Distributed Job {run_id} across {node_count} nodes...")
    
    # In a real cluster, this would block and execute ML training/inference.
    # We simulate the duration of the job here. (Accelerated for hackathon)
    simulated_seconds = duration_minutes * 2 # 2 seconds per minute of job length
    
    for i in range(simulated_seconds):
        time.sleep(1)
        if i % 10 == 0:
            print(f"[Ray Worker] Job {run_id} progress: {(i/simulated_seconds)*100:.1f}%")
            
    print(f"[Ray Worker] Completed Job {run_id} successfully.")
    return run_id

def run_ray_engine():
    print("[Ray Engine] Initializing Ray Cluster Head Node...")
    print("[Ray Engine] 4 Workers connected and waiting for distributed jobs.")
    
    pool = multiprocessing.Pool(processes=4)
    active_jobs = {}
    
    while True:
        try:
            # Find jobs that Kubernator placed in 'processing' state
            processing_runs = SimulationRun.objects.filter(status='processing')
            
            for run in processing_runs:
                if run.id not in active_jobs:
                    print(f"[Ray Engine] Received scheduled job {run.id}. Dispatching to Ray Workers...")
                    
                    # Dispatch to Ray worker pool asynchronously
                    result = pool.apply_async(
                        ray_worker_task, 
                        args=(run.id, run.allocated_nodes_actual, 2)
                    )
                    active_jobs[run.id] = result
            
            # Check completed jobs
            completed = []
            for run_id, result in active_jobs.items():
                if result.ready():
                    print(f"[Ray Engine] Finished Job {run_id}. Updating Control Plane.")
                    run = SimulationRun.objects.filter(id=run_id).first()
                    if run:
                        run.status = 'completed'
                        run.save()
                    completed.append(run_id)
            
            for run_id in completed:
                del active_jobs[run_id]

            time.sleep(2)
        except Exception as e:
            print(f"Error in Ray Engine: {e}")
            time.sleep(2)

if __name__ == "__main__":
    run_ray_engine()
