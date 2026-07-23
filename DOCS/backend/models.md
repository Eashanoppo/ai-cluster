# 🗄️ Database Models & Entity Reference

## 1. Overview

This document serves as the authoritative reference for all Django ORM database models across the 6 domain apps of NeuronOps.

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    SimulationRun ||--o{ WorkloadPlacement : triggers
    GpuTelemetry ||--o{ Alert : evaluates
    GpuTelemetry ||--o{ Prediction : calculates
    GpuTelemetry ||--o{ CostReport : evaluates
    Alert ||--o{ ApprovalRequest : escalates
    WorkloadPlacement ||--o{ ApprovalRequest : logs
    User ||--o{ ApprovalRequest : approves

    SimulationRun {
        int id PK
        string task_type
        int user_count
        float file_input_size_gb
        int thinking_depth
        float complexity_factor
        int selected_tier
        int allocated_nodes
        int allocated_nodes_actual
        int required_nodes
        float efficiency_pct
        string verdict
        string status
        json recommendations
        datetime created_at
    }

    GpuTelemetry {
        int id PK
        string node_id IX
        int gpu_id
        float temperature_celsius
        float vram_usage_mb
        float vram_total_mb
        float gpu_utilization_percent
        float power_draw_watts
        datetime timestamp IX
    }

    Alert {
        int id PK
        string node_id IX
        string severity
        string message
        datetime created_at
        boolean resolved
    }

    Prediction {
        int id PK
        string node_id
        float failure_probability
        string reason
        datetime predicted_at
    }

    CostReport {
        int id PK
        string node_id
        float idle_time_hours
        float wasted_cost_usd
        datetime created_at
    }

    ApprovalRequest {
        int id PK
        string action_type
        string target_resource
        string reason
        string status
        datetime requested_at
        datetime approved_at
        int approved_by_id FK
    }

    WorkloadPlacement {
        int id PK
        string job_id
        string source_node
        string target_node
        string reason
        string status
        datetime created_at
    }
```

---

## 3. Detailed Model Field Specifications

### 1. `simulator.SimulationRun` ([backend/simulator/models.py](file:///d:/Ai-Cluster/backend/simulator/models.py))
* `task_type`: CharField(32, choices=TASK_CHOICES).
* `user_count`: IntegerField(default=1).
* `file_input_size_gb`: FloatField(default=1.0).
* `thinking_depth`: IntegerField(default=1, range 1-5).
* `complexity_factor`: FloatField(default=1.0, range 1.0-5.0).
* `selected_tier`: IntegerField() (1-4).
* `allocated_nodes`: IntegerField() (Requested nodes).
* `allocated_nodes_actual`: IntegerField(null=True) (Final allocated nodes after auto-scale).
* `required_nodes`: IntegerField() (Computed demand).
* `efficiency_pct`: FloatField(default=0.0).
* `verdict`: CharField(16, choices=VERDICT_CHOICES).
* `status`: CharField(16, choices=STATUS_CHOICES, default='analyzing').
* `bottleneck_analysis`: TextField().
* `recommendations`: JSONField(default=list).
* `demo_talking_points`: JSONField(default=list).
* `ai_raw_report`: JSONField(default=dict).

### 2. `telemetry.GpuTelemetry` ([backend/telemetry/models.py](file:///d:/Ai-Cluster/backend/telemetry/models.py))
* `node_id`: CharField(32, db_index=True) (e.g. `Node-001`).
* `gpu_id`: IntegerField(default=0).
* `temperature_celsius`: FloatField().
* `vram_usage_mb`: FloatField().
* `vram_total_mb`: FloatField(default=24576).
* `gpu_utilization_percent`: FloatField().
* `power_draw_watts`: FloatField().
* `timestamp`: DateTimeField(auto_now_add=True, db_index=True).

### 3. `sentinel.Alert` ([backend/sentinel/models.py](file:///d:/Ai-Cluster/backend/sentinel/models.py))
* `node_id`: CharField(32, db_index=True).
* `severity`: CharField(16, choices=SEVERITY_CHOICES) (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
* `message`: TextField().
* `created_at`: DateTimeField(auto_now_add=True).
* `resolved`: BooleanField(default=False).

### 4. `sentinel.Prediction` ([backend/sentinel/models.py](file:///d:/Ai-Cluster/backend/sentinel/models.py))
* `node_id`: CharField(32).
* `failure_probability`: FloatField() (0.01 to 0.95).
* `reason`: TextField().
* `predicted_at`: DateTimeField(auto_now_add=True).

### 5. `costwatch.CostReport` ([backend/costwatch/models.py](file:///d:/Ai-Cluster/backend/costwatch/models.py))
* `node_id`: CharField(32).
* `idle_time_hours`: FloatField(default=1.0).
* `wasted_cost_usd`: FloatField().
* `created_at`: DateTimeField(auto_now_add=True).

### 6. `gate.ApprovalRequest` ([backend/gate/models.py](file:///d:/Ai-Cluster/backend/gate/models.py))
* `action_type`: CharField(64).
* `target_resource`: CharField(64).
* `reason`: TextField().
* `status`: CharField(16, choices=STATUS_CHOICES, default='PENDING').
* `requested_at`: DateTimeField(auto_now_add=True).
* `approved_at`: DateTimeField(null=True, blank=True).
* `approved_by`: ForeignKey(User, null=True, blank=True).
