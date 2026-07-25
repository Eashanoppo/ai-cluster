import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from django.utils import timezone
from telemetry.models import GpuTelemetry

class PrometheusSim:
    """
    Simulates a Prometheus server API for the AI Control Plane.
    In a real environment, processors.py would query Prometheus via PromQL.
    Here, we provide a Python API that translates queries into Django ORM calls.
    """

    @staticmethod
    def query(query_string: str) -> List[Dict[str, Any]]:
        """
        Simulate a Prometheus query.
        Supported basic query types:
        - 'dcgm_fi_dev_gpu_temp'
        - 'dcgm_fi_dev_gpu_util'
        - 'dcgm_fi_dev_power_usage'
        """
        now = timezone.now()
        ten_seconds_ago = now - timedelta(seconds=10)
        
        # Get the latest telemetry for all nodes within the last 10 seconds
        telemetry_qs = GpuTelemetry.objects.filter(timestamp__gte=ten_seconds_ago).order_by('-timestamp')
        
        seen_nodes = set()
        latest_telemetry = []
        for t in telemetry_qs:
            if t.node_id not in seen_nodes:
                seen_nodes.add(t.node_id)
                latest_telemetry.append(t)

        results = []
        for t in latest_telemetry:
            value = 0.0
            if "gpu_temp" in query_string:
                value = t.temperature_celsius
            elif "gpu_util" in query_string:
                value = t.gpu_utilization_percent
            elif "power_usage" in query_string:
                value = t.power_draw_watts
                
            results.append({
                "metric": {
                    "node": t.node_id,
                    "gpu": str(t.gpu_id),
                },
                "value": [now.timestamp(), str(value)]
            })

        return results

    @staticmethod
    def query_range(query_string: str, start: datetime, end: datetime, step: int = 15) -> List[Dict[str, Any]]:
        """
        Simulate a Prometheus range query.
        Returns a time series of the metric for the specified period.
        """
        telemetry_qs = GpuTelemetry.objects.filter(timestamp__gte=start, timestamp__lte=end).order_by('node_id', 'timestamp')
        
        node_series = {}
        for t in telemetry_qs:
            if t.node_id not in node_series:
                node_series[t.node_id] = []
                
            value = 0.0
            if "gpu_temp" in query_string:
                value = t.temperature_celsius
            elif "gpu_util" in query_string:
                value = t.gpu_utilization_percent
            elif "power_usage" in query_string:
                value = t.power_draw_watts
                
            node_series[t.node_id].append([t.timestamp.timestamp(), str(value)])
            
        results = []
        for node_id, values in node_series.items():
             results.append({
                "metric": {
                    "node": node_id,
                    "gpu": "0",
                },
                "values": values
            })
            
        return results
