import random
from typing import Dict, Any

class DCGMExporterSim:
    """
    Simulates the NVIDIA DCGM Exporter per node.
    Generates high-fidelity GPU telemetry metrics based on workload profile and status.
    """
    
    @staticmethod
    def generate_metrics(node_id: str, tier_spec: Dict[str, Any], workload_status: str, last_hist: Dict[str, float]) -> Dict[str, float]:
        """
        Generates simulated DCGM metrics for a given node.
        Includes temperature, utilization, power, and PCIe bandwidth.
        """
        def apply_drift(current, target_min, target_max, step=1.5):
            target = random.uniform(target_min, target_max)
            if current < target:
                return min(current + random.uniform(0, step), target_max)
            else:
                return max(current - random.uniform(0, step), target_min)
                
        metrics = dict(last_hist)
        vram_total = tier_spec["vram_total_mb"]
        
        if workload_status == "active":
            metrics["temp"] = apply_drift(metrics.get("temp", 30), tier_spec["temp_min"], tier_spec["temp_max"])
            metrics["util"] = apply_drift(metrics.get("util", 0), tier_spec["util_min"], tier_spec["util_max"])
            metrics["vram"] = apply_drift(metrics.get("vram", 0), vram_total * 0.7, vram_total * 0.9)
            metrics["power"] = apply_drift(metrics.get("power", 10), tier_spec["power_min"], tier_spec["power_max"])
            metrics["pcie_tx"] = random.uniform(100, 500) # MB/s
            metrics["pcie_rx"] = random.uniform(100, 500) # MB/s
        elif workload_status == "idle":
            metrics["temp"] = apply_drift(metrics.get("temp", 25), 25.0, 30.0)
            metrics["util"] = apply_drift(metrics.get("util", 0), 0.0, 0.0)
            metrics["vram"] = apply_drift(metrics.get("vram", 0), 0.0, 0.0)
            metrics["power"] = apply_drift(metrics.get("power", 10), 8.0, 12.0)
            metrics["pcie_tx"] = 0.0
            metrics["pcie_rx"] = 0.0
        elif workload_status == "gpu_failure":
            metrics["temp"] = 99.5
            metrics["util"] = 100.0
            metrics["power"] = tier_spec["power_max"] * 1.1
            metrics["pcie_tx"] = 0.0
        elif workload_status == "memory_leak":
            metrics["vram"] = vram_total * 0.99
            metrics["temp"] = apply_drift(metrics.get("temp", 80), 80.0, 85.0)
            
        return metrics
