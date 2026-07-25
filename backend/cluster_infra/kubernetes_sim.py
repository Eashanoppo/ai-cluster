import uuid
from typing import Dict, Any, List
from django.utils import timezone
from dataclasses import dataclass

@dataclass
class PodSpec:
    workload_id: str
    image: str
    resources: Dict[str, Any]
    affinity: Dict[str, Any]
    tolerations: List[str]

class KubernetesSim:
    """
    Simulates a Kubernetes API Server and Controller Manager.
    Manages the lifecycle of simulated Pods across the cluster.
    """
    
    # In-memory cluster state
    _pods: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    def create_deployment(cls, spec: PodSpec) -> str:
        """
        Simulates receiving a deployment spec and scheduling a Pod.
        Returns the Pod ID.
        """
        pod_id = f"pod-{uuid.uuid4().hex[:8]}"
        
        # Simplified Scheduling Logic
        # In a real cluster, the kube-scheduler would evaluate nodes.
        # Here we just mark it as scheduled for the simulator.
        
        cls._pods[pod_id] = {
            "id": pod_id,
            "workload_id": spec.workload_id,
            "status": "Pending",
            "created_at": timezone.now(),
            "node_target": spec.affinity.get("node_target", None)
        }
        
        # Simulate quick scheduling
        cls._pods[pod_id]["status"] = "Scheduled"
        
        return pod_id
        
    @classmethod
    def update_pod_status(cls, pod_id: str, status: str):
        """Simulate kubelet status updates"""
        if pod_id in cls._pods:
            cls._pods[pod_id]["status"] = status
            
    @classmethod
    def get_pod_status(cls, pod_id: str) -> str:
        return cls._pods.get(pod_id, {}).get("status", "Unknown")
        
    @classmethod
    def delete_pod(cls, pod_id: str):
        if pod_id in cls._pods:
            del cls._pods[pod_id]
