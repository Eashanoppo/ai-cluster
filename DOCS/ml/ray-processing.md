# ⚡ Distributed Processing Architecture (Ray Paradigm)

## 1. Overview

NeuronOps adopts the **Ray Distributed Processing Model** to orchestrate asynchronous tasks, distributed inference sessions, and telemetry aggregation. This document explains how Ray's actor model and task queues map onto the digital twin architecture.

---

## 2. Distributed Ray Task Abstraction Diagram

```mermaid
graph TD
    subgraph Ray Head Node [Django API & Scheduler]
        HeadScheduler[Ray Global Scheduler]
        ObjectStore[Shared Memory Object Store]
    end

    subgraph Ray Worker Nodes [128 Compute Nodes]
        W1[Worker Actor: Quadrant 1 - Nodes 1-32]
        W2[Worker Actor: Quadrant 2 - Nodes 33-64]
        W3[Worker Actor: Quadrant 3 - Nodes 65-96]
        W4[Worker Actor: Quadrant 4 - Nodes 97-128]
    end

    HeadScheduler -->|Dispatch Workload Slice| W1
    HeadScheduler -->|Dispatch Workload Slice| W2
    HeadScheduler -->|Dispatch Workload Slice| W3
    HeadScheduler -->|Dispatch Workload Slice| W4

    W1 -->|Push Telemetry Futures| ObjectStore
    W2 -->|Push Telemetry Futures| ObjectStore
    W3 -->|Push Telemetry Futures| ObjectStore
    W4 -->|Push Telemetry Futures| ObjectStore
```

---

## 3. Ray Actor Placement & Task Routing

In distributed cluster setups, workloads submitted to `workload_engine.py` map onto Ray remote function calls:

```python
# Conceptual Ray Processing Pattern
import ray

@ray.remote(num_gpus=1)
def process_workload_slice(node_id: str, task_type: str, data_payload: dict):
    # Simulated GPU inference execution
    return {"node_id": node_id, "status": "COMPLETED", "execution_time_ms": 120}

# Ray Cluster Invocation Pattern
futures = [
    process_workload_slice.options(resources={f"node:{node}": 1}).remote(node, "batch_vision", {})
    for node in allocated_nodes_list
]
results = ray.get(futures)
```

---

## 4. Distributed Fault Tolerance & Actor Supervision

1. **Worker Failure Detection**: Ray heatbeats detect dead worker nodes within 3000ms.
2. **Dynamic Task Re-Execution**: Failed task futures are automatically re-routed to healthy nodes in the same quadrant.
3. **Actor State Preservation**: Object store references guarantee zero data loss during live migrations.
