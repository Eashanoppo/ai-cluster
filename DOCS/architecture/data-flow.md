# Data Flow Architecture

NeuronOps is primarily a data-driven system. There are two major streams of data flowing through the architecture: **Telemetry Data** (bottom-up from the hardware simulation) and **Workload Data** (top-down from the user scenarios).

## Telemetry Data Flow (Hardware up to UI)

```mermaid
sequenceDiagram
    participant HW as Telemetry Generator (Hardware)
    participant Prom as Prometheus (TSDB)
    participant CP as processor.py (Control Plane)
    participant DB as Relational Database
    participant UI as Dashboard & Workstation

    Note over HW: Simulates 128 Nodes
    HW->>HW: Generate DCGM Metrics (Temp, VRAM)
    Prom->>HW: HTTP GET /metrics (Every 5s)
    HW-->>Prom: Return Prometheus exposition format
    
    loop Every 5 Seconds
        CP->>Prom: Query PromQL (avg, max over time)
        Prom-->>CP: Return aggregated cluster state
        CP->>CP: ML Anomaly Detection & Thermal Checks
        CP->>DB: Save state to DB (Alerts, Load % )
    end
    
    UI->>Prom: Grafana Direct Connect
    UI->>DB: Poll active alerts and system load
```

### Telemetry Lifecycle
1. **Generation (`telemetry_generator.py`)**: Runs continuously, applying sine waves and randomized noise to simulate GPUs under load, including injecting simulated failures based on the `disaster_state.json`.
2. **Scraping (Prometheus)**: Standard TSDB scraping of the exposed endpoint.
3. **Analysis (`processor.py`)**: Queries Prometheus via PromQL to determine if the cluster is overheating (`dcgm_fi_dev_gpu_temp > 85`) or overallocated (`sum(dcgm_fi_prof_gr_engine_active) > 95%`).
4. **Action**: If anomalies are found, the Control Plane generates interventions in the Database, which are instantly reflected in the React Workstation UI.

---

## Workload Data Flow (Scenario down to Hardware)

```mermaid
sequenceDiagram
    participant UI as Workstation UI
    participant TG as Traffic Generator
    participant DB as Database
    participant CP as processor.py
    participant Sim as Ray/K8s Sims

    UI->>TG: Start Scenario (Viral Event, 5 mins)
    
    loop Traffic Loop
        TG->>DB: Bulk Create SimulationRuns (QUEUED)
    end
    
    loop Control Loop
        CP->>DB: Fetch QUEUED Workloads
        CP->>CP: Calculate Node & Tier Requirements
        CP->>DB: Update to PROCESSING
        CP->>Sim: Dispatch via KubernetesSim / RaySim
    end
    
    loop Completion Loop
        CP->>DB: Fetch PROCESSING Workloads
        CP->>CP: Simulate Execution Time
        CP->>DB: Update to COMPLETED (Assign Efficiency %)
    end
    
    UI->>DB: Poll runs order_by('-id')
    DB-->>UI: Real-time Kanban Update
```

### Workload Lifecycle
1. **Injection (`traffic_generator.py`)**: Reads the active configuration and creates database records representing tasks (e.g., `video_generation`, `llm_training`).
2. **Scheduling (`processor.py - SchedulerEngine`)**: Pulls these records, maps them to required hardware tiers, and pseudo-allocates them using mocked infrastructure APIs (`cluster_infra`).
3. **Resolution**: The Control Plane finishes the jobs, marking them complete and assigning efficiency scores.
