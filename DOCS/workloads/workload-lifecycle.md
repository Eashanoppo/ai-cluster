# Workload Lifecycle

The handling of workloads in NeuronOps represents a massive distributed state machine. Because the system is designed to simulate a real datacenter acting under intense stress, workloads are not processed synchronously. Instead, they flow through an asynchronous queuing architecture.

## Architecture

```mermaid
graph TD
    User([Operator Workstation])
    API[Django REST API]
    TG[TrafficGenerator Daemon]
    DB[(SimulationRun Database)]
    Control[SchedulerEngine (processor.py)]
    K8s[KubernetesSim]
    Ray[RaySim]
    
    User -- "Selects Scenario & Time Accel" --> API
    API -- "Configures" --> TG
    TG -- "Bulk Creates (Queued)" --> DB
    Control -- "Polls (Queued)" --> DB
    Control -- "Transitions to (Processing)" --> DB
    Control -- "Dispatches" --> K8s
    Control -- "Dispatches" --> Ray
    Control -- "Evaluates & Completes" --> DB
```

## The 3 Phases of a Workload

Every workload (represented by the `SimulationRun` model in `backend/simulator/models.py`) goes through the following lifecycle.

### 1. Ingestion (`status='queued'`)
Triggered by the `TrafficGenerator`.
When an operator activates a Scenario (e.g. `viral_event`), the Traffic Generator calculates the Requests Per Second (RPS) and multi-threads `bulk_create` operations into the Postgres/SQLite database. It assigns a random task type (e.g. `video_generation`, `llm_training`), assigning it a priority, but leaving the `allocated_nodes` and hardware decisions blank.

### 2. Allocation (`status='processing'`)
Triggered by the `WorkloadSchedulerEngine` inside `processor.py`.
The Control Plane continuously loops, picking up batches of 50 `queued` runs. It queries the `WorkloadEngine` to compute:
- How many nodes are required.
- Which Tier is appropriate (e.g., Tier 4 Blackwells for LLM Training).
It then mocks deployment by invoking `KubernetesSim.create_deployment()` and `RaySim.assign_worker()`. The status in the database is transitioned to `processing`.

### 3. Resolution (`status='completed'` or `failed`)
Still managed by the `WorkloadSchedulerEngine`.
Because this is a time-accelerated simulation, jobs do not actually run for hours. During every tick of the Control Plane loop, there is a probability matrix applied to all `processing` jobs. 
- Some jobs successfully finish and are marked `completed`, receiving a randomized `efficiency_pct`.
- If the AI Control Plane was forced to perform **Capacity Shedding** due to extreme cluster heat or load (>95%), batch workloads may be forcefully terminated and transitioned to `failed`.
