# 🔄 Complete End-to-End Data Flow Architecture

## 1. Overview

This document details how data moves through the NeuronOps platform across three primary operational loops:
1. **The Telemetry Data Pipeline**: Metric generation -> database storage -> background evaluation -> UI polling.
2. **The Workload Execution Pipeline**: User request submission -> calculation engine -> tier selection -> auto-scaling -> status updates.
3. **The Autonomous Remediation Loop**: Thermal breach detection -> failure probability calculation -> migration/eviction trigger -> approval gate log.

---

## 2. Telemetry Pipeline Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant TG as Telemetry Generator (telemetry_generator.py)
    participant DB as PostgreSQL Database
    participant DP as Processor Engine (processor.py)
    participant API as Django REST API (/api/telemetry/latest/)
    participant UI as Next.js Dashboard UI

    loop Every 5 Seconds
        TG->>DB: Query active SimulationRun instances (last 120s)
        TG->>TG: Compute power/temp drift across 128 nodes
        TG->>DB: GpuTelemetry.objects.bulk_create(128 records)
        TG->>DB: Delete records older than 10 minutes
    end

    loop Every 5 Seconds
        DP->>DB: Fetch latest telemetry per node via Subquery
        DP->>DP: Compute dynamic failure prob: (temp - 40) / 60
        alt Temp >= 90°C
            DP->>DB: Create CRITICAL Alert record
            alt Idle Nodes Available
                DP->>DB: Execute Live Migration -> WorkloadPlacement
            else No Idle Nodes
                DP->>DB: Execute KILL NON-ESSENTIAL -> ApprovalRequest
            end
        else Temp < 85°C
            DP->>DB: Auto-resolve existing node alerts
        end
        DP->>DB: Create global Prediction record (max threat node)
    end

    loop Every 3 Seconds
        UI->>API: GET /api/telemetry/latest/
        API->>DB: Query GpuTelemetry for latest 128 nodes
        DB-->>API: Return JSON array of node metrics
        API-->>UI: Update React cluster grid map state
    end
```

---

## 3. Workload Execution Data Flow

```mermaid
flowchart TD
    A[User Submits Task in Workstation UI] -->|POST /api/simulator/runs/| B[Simulator REST API View]
    B --> C[workload_engine.py calculate_required_nodes]
    
    C --> D{Calculate Resource Demand}
    D -->|base_nodes * multipliers| E[Required Nodes Count]
    
    E --> F[assess_allocation]
    F --> G{Check Active Tiers & Cluster Load}
    
    G -->|Idle Fallback eligible| H[Route to Tier - 1]
    G -->|Saturated target tier| I[Route to Tier + 1]
    G -->|All Tiers Busy| J[Autonomous Load Sharing]
    G -->|Sufficient Capacity| K[Allocate Tier Nodes]

    H --> L[Save SimulationRun to DB status=processing]
    I --> L
    J --> L
    K --> L

    L --> M[Trigger Async agy_service.py AI Report]
    M --> N[Save AI Report & Recommendations to DB]
    N --> O[Update SimulationRun status=completed]
    O --> P[Frontend Polls & Renders Verdict / Graphs]
```

---

## 4. Operational Threshold Data Matrix

The following table summarizes the data state transformations triggered by real-time metrics:

| Metric | Condition | Component Responsible | Action Taken | DB Model Updated |
|:---|:---|:---|:---|:---|
| **Temperature** | `≥ 90°C` | `processor.py` | Generate CRITICAL thermal alert | `sentinel.Alert` |
| **Temperature** | `< 85°C` | `processor.py` | Auto-resolve existing alerts | `sentinel.Alert` |
| **Temperature** | `≥ 90°C` & Idle Nodes Exist | `processor.py` | Auto-migrate live workload | `scheduler.WorkloadPlacement` & `gate.ApprovalRequest` |
| **Temperature** | `≥ 90°C` & No Idle Nodes | `processor.py` | Execute deterministic non-essential workload eviction | `gate.ApprovalRequest` |
| **GPU Utilization** | `< 5%` | `processor.py` | Record energy waste report | `costwatch.CostReport` |
| **Cluster Load** | `> 80%` | `processor.py` | Trigger AI autonomous task termination query | `simulator.SimulationRun` & `gate.ApprovalRequest` |
| **Cluster Load** | `> 90%` | `processor.py` | Auto-execute Emergency Load Shedding | `gate.ApprovalRequest` |
