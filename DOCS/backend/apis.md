# 🔌 REST API Specifications & Endpoint Reference

## 1. Overview

NeuronOps exposes RESTful JSON APIs for all frontend dashboard, workstation, sentinel, costwatch, and gate approval operations.

---

## 2. API Endpoint Matrix

| Method | Endpoint URL | App | Description |
|:---|:---|:---|:---|
| `POST` | `/api/simulator/runs/` | `simulator` | Submit a new simulation run / task request |
| `GET` | `/api/simulator/runs/` | `simulator` | List all historic simulation runs |
| `GET` | `/api/simulator/runs/active/` | `simulator` | List currently active processing runs |
| `GET` | `/api/telemetry/latest/` | `telemetry` | Fetch latest telemetry record for all 128 nodes |
| `GET` | `/api/sentinel/alerts/` | `sentinel` | Fetch active thermal and system alerts |
| `POST` | `/api/sentinel/alerts/{id}/resolve/` | `sentinel` | Mark an alert as resolved |
| `GET` | `/api/sentinel/predictions/` | `sentinel` | Fetch node failure probability predictions |
| `GET` | `/api/gate/requests/` | `gate` | Fetch approval requests |
| `POST` | `/api/gate/requests/{id}/approve/` | `gate` | Approve an action request |
| `POST` | `/api/gate/requests/{id}/reject/` | `gate` | Reject an action request |
| `GET` | `/api/costwatch/reports/` | `costwatch` | Fetch idle energy waste cost reports |

---

## 3. Detailed Request/Response Schemas

### 1. `POST /api/simulator/runs/`

#### Request Body (JSON)
```json
{
  "task_type": "large_ml_project",
  "user_count": 50,
  "file_input_size_gb": 10.0,
  "image_count": 0,
  "thinking_depth": 3,
  "complexity_factor": 2.5,
  "allocated_nodes": 32,
  "prompt": "Run distributed LLM pre-training on 64 Blackwell B200 nodes."
}
```

#### Response (201 Created)
```json
{
  "id": 104,
  "task_type": "large_ml_project",
  "user_count": 50,
  "selected_tier": 4,
  "allocated_nodes": 32,
  "allocated_nodes_actual": 64,
  "required_nodes": 64,
  "efficiency_pct": 100.0,
  "verdict": "optimal",
  "status": "processing",
  "created_at": "2026-07-22T05:30:00Z"
}
```

---

### 2. `GET /api/telemetry/latest/`

#### Response (200 OK)
```json
[
  {
    "node_id": "Node-001",
    "gpu_id": 0,
    "temperature_celsius": 64.2,
    "vram_usage_mb": 18432.0,
    "vram_total_mb": 24576.0,
    "gpu_utilization_percent": 84.5,
    "power_draw_watts": 341.0,
    "timestamp": "2026-07-22T05:30:05Z"
  },
  {
    "node_id": "Node-097",
    "gpu_id": 0,
    "temperature_celsius": 54.8,
    "vram_usage_mb": 172800.0,
    "vram_total_mb": 196608.0,
    "gpu_utilization_percent": 98.0,
    "power_draw_watts": 685.0,
    "timestamp": "2026-07-22T05:30:05Z"
  }
]
```

---

### 3. `POST /api/gate/requests/12/approve/`

#### Response (200 OK)
```json
{
  "id": 12,
  "action_type": "LLM Session Live Migration",
  "target_resource": "Node-014",
  "status": "APPROVED",
  "approved_at": "2026-07-22T05:30:10Z",
  "approved_by": "admin"
}
```
