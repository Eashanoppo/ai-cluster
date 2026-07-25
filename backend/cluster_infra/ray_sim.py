import uuid
from typing import Dict, Any
from .kubernetes_sim import KubernetesSim

class RaySim:
    """
    Simulates a Ray distributed computing cluster executing workloads on Kubernetes Pods.
    """
    
    _workers: Dict[str, Dict[str, Any]] = {}
    _checkpoints: Dict[str, Any] = {}
    
    @classmethod
    def assign_worker(cls, pod_id: str, workload_id: str) -> str:
        """
        Assigns a Ray worker to a Kubernetes Pod.
        """
        worker_id = f"ray-worker-{uuid.uuid4().hex[:6]}"
        
        cls._workers[worker_id] = {
            "id": worker_id,
            "pod_id": pod_id,
            "workload_id": workload_id,
            "status": "Running"
        }
        
        # Simulate Kubernetes pod transitioning to running state
        KubernetesSim.update_pod_status(pod_id, "Running")
        
        return worker_id
        
    @classmethod
    def save_checkpoint(cls, worker_id: str, state: Any):
        """Simulate saving a distributed checkpoint"""
        if worker_id in cls._workers:
            workload_id = cls._workers[worker_id]["workload_id"]
            cls._checkpoints[workload_id] = state
            
    @classmethod
    def get_checkpoint(cls, workload_id: str) -> Any:
        return cls._checkpoints.get(workload_id)
        
    @classmethod
    def simulate_worker_crash(cls, worker_id: str):
        if worker_id in cls._workers:
            cls._workers[worker_id]["status"] = "Failed"
            pod_id = cls._workers[worker_id]["pod_id"]
            KubernetesSim.update_pod_status(pod_id, "Failed")
