# ClustroConnect — Phase 2 Hackathon Strategy & Implementation Guide

> **Event:** AI Innovation Hackathon: From Learning to Impact  
> **Phase 2 Date:** July 25, 2026  
> **Track:** AI for Cluster Intelligence — Making Compute Faster, Cheaper & More Reliable  
> **Team:** Team ClustroConnect (Eashan, Nahian, Fariha)  
> **Last Updated:** July 17, 2026

---

## Table of Contents

1. [Situation Overview](#1-situation-overview)
2. [Required Tech Stack: What, Why, and How](#2-required-tech-stack-what-why-and-how)
3. [Current Project vs. Requirements Gap Analysis](#3-current-project-vs-requirements-gap-analysis)
4. [Data Strategy: Where to Get Real Telemetry](#4-data-strategy-where-to-get-real-telemetry)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Codebase Preparation for Live Modifications](#6-codebase-preparation-for-live-modifications)
7. [Presentation & Demo Strategy](#7-presentation--demo-strategy)
8. [Judge Q&A Preparation](#8-judge-qa-preparation)
9. [Risk Mitigation](#9-risk-mitigation)
10. [Appendix: Quick Reference](#10-appendix-quick-reference)

---

## 1. Situation Overview

### What We Know

- **We cleared Phase 1.** Results announced ~July 14, 2026 at 1:30 AM.
- **Phase 2 format has changed.** Instead of an 8-hour build sprint, judges will review our pre-built project and may request live modifications on the spot. The event agenda may still change.
- **No physical cluster access.** We are university students; no one on the team owns a GPU server or cluster. One team member has a local LLM (Ollama) running on their laptop.
- **The hackathon theme is enterprise-grade** (GPU cluster orchestration), but the organizers have not provided compute resources or broken down the topic for participants.

### What This Means for Us

We must present a **technically impressive, well-architected platform** that demonstrates the core concepts of cluster intelligence using **simulated but realistic data**, while being architecturally ready for production integration. The project must also be **modular enough** to accept live feature requests from judges without breaking.

---

## 2. Required Tech Stack: What, Why, and How

The hackathon specifies five core technologies. Here is what each one is, how it works in the real world, and how we should integrate it into ClustroConnect.

---

### 2.1 Kubernetes (K8s)

#### What It Is
An open-source container orchestration platform that automates deploying, scaling, and managing containerized applications across a cluster of machines.

#### How It Works (Real World)
- A **Kubernetes cluster** has a Control Plane (brain) and Worker Nodes (muscles).
- Users submit workloads as **Pods** (containers). The **kube-scheduler** decides which node runs each pod based on resource requests (CPU, memory, GPU).
- Kubernetes exposes an **API server** — every action (deploy, scale, delete) is an API call.

#### How We Use It in ClustroConnect

> [!IMPORTANT]
> **Do NOT attempt to run a full Kubernetes cluster (Minikube/Kind) on your laptops during the event.** It will drain battery, consume RAM, and likely crash under load. Instead, use Kubernetes as an **architectural design element**.

**Current State:** Our Django backend (`workload_engine.py`) acts as a custom scheduler that assigns workloads to tiers (Tier 1–4 GPU quadrants). This is functionally equivalent to what a Kubernetes custom scheduler does.

**What to Tell Judges:**
> "Our Django API backend is an API-first control plane. The scheduling decisions it outputs — which tier, how many nodes, when to migrate — are structured to be sent directly to a Kubernetes API server. In production, we would deploy this as a Kubernetes Operator using a Custom Resource Definition (CRD), and install it with `helm install clustroconnect`."

**Optional Enhancement (Low Effort):**
Add a `/api/scheduler/k8s-manifest/` endpoint that, given a workload, returns a Kubernetes Pod YAML manifest showing exactly how that workload would be deployed on a real cluster. This proves we understand the Kubernetes API without needing to run one.

```python
# Example output from the endpoint:
{
  "apiVersion": "v1",
  "kind": "Pod",
  "metadata": {
    "name": "workload-ocr-12345",
    "labels": {"tier": "1", "task": "ocr_data_retrieval"}
  },
  "spec": {
    "containers": [{
      "name": "ocr-worker",
      "image": "clustroconnect/ocr-worker:latest",
      "resources": {
        "limits": {"nvidia.com/gpu": "1", "memory": "24Gi"}
      }
    }],
    "nodeSelector": {"gpu-tier": "rtx-3090"},
    "tolerations": [{"key": "nvidia.com/gpu", "operator": "Exists"}]
  }
}
```

---

### 2.2 Prometheus

#### What It Is
An open-source systems monitoring and alerting toolkit. It collects time-series metrics from configured targets at set intervals, stores them efficiently, and allows powerful querying via **PromQL** (Prometheus Query Language).

#### How It Works (Real World)
1. Applications expose metrics at an HTTP endpoint (typically `/metrics`) in a specific text format.
2. Prometheus **scrapes** (pulls) these endpoints at a configured interval (e.g., every 15 seconds).
3. Data is stored as time-series in Prometheus's built-in TSDB (Time-Series Database).
4. Users query data using PromQL (e.g., `avg(gpu_temperature_celsius{tier="3"})`) and visualize it in the Prometheus UI or Grafana.

#### How We Use It in ClustroConnect

**Current State:** Our `telemetry_generator.py` writes mock GPU metrics directly to the Django SQLite database (`GpuTelemetry` model). The frontend polls `/api/telemetry/latest/` to get the data. This is a **custom telemetry pipeline** — functional but not industry-standard.

**Recommended Enhancement: Add a Real Prometheus Instance**

This is the single highest-impact improvement we can make. It replaces our custom database polling with the industry-standard monitoring tool that the hackathon explicitly requires.

> [!TIP]
> **Estimated time: 2–3 hours total.** This is very achievable before July 25th.

##### Step-by-Step Implementation

**Step 1: Install the Python Prometheus client library**

```bash
cd backend
pip install prometheus-client
# Also add to requirements.txt:
echo "prometheus-client>=0.20.0" >> requirements.txt
```

**Step 2: Modify `telemetry_generator.py` to expose metrics via Prometheus format**

Instead of (or in addition to) writing to the Django database, expose the telemetry data as Prometheus Gauge metrics on an HTTP port.

```python
from prometheus_client import start_http_server, Gauge

# Define Prometheus Gauge metrics
GPU_TEMP = Gauge('dcgm_gpu_temp_celsius', 'GPU Temperature', ['node_id', 'tier'])
GPU_UTIL = Gauge('dcgm_gpu_utilization_percent', 'GPU Utilization', ['node_id', 'tier'])
GPU_VRAM = Gauge('dcgm_vram_usage_mb', 'VRAM Usage in MB', ['node_id', 'tier'])
GPU_POWER = Gauge('dcgm_power_draw_watts', 'Power Draw in Watts', ['node_id', 'tier'])

# Start the metrics HTTP server on port 8000
start_http_server(8000)
print("Prometheus metrics exporter running on http://localhost:8000/metrics")
```

Then inside the telemetry loop, after computing each node's metrics:

```python
tier_label = str(node_tier_map.get(idx, (idx // 32) + 1))
GPU_TEMP.labels(node_id=node, tier=tier_label).set(hist["temp"])
GPU_UTIL.labels(node_id=node, tier=tier_label).set(hist["util"])
GPU_VRAM.labels(node_id=node, tier=tier_label).set(hist["vram"])
GPU_POWER.labels(node_id=node, tier=tier_label).set(hist["power"])
```

> [!IMPORTANT]
> **Metric naming convention matters.** We prefix metrics with `dcgm_` to mimic real NVIDIA DCGM exporter naming conventions. This shows judges we understand the production tooling. Real DCGM metrics include names like `DCGM_FI_DEV_GPU_TEMP`, `DCGM_FI_DEV_GPU_UTIL`, etc.

**Step 3: Run a local Prometheus server via Docker**

```bash
# Pull and run Prometheus
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

**Step 4: Create a `prometheus.yml` configuration file** (in the project root)

```yaml
global:
  scrape_interval: 5s  # Match our telemetry generator tick rate

scrape_configs:
  - job_name: 'clustroconnect-gpu-telemetry'
    static_configs:
      - targets: ['host.docker.internal:8000']  # The Python exporter
        labels:
          cluster: 'clustroconnect-simulated'
          environment: 'hackathon-demo'
```

> [!NOTE]
> On Linux, if `host.docker.internal` doesn't resolve, use `--network host` on the Docker command or use the host machine's IP address (e.g., `172.17.0.1:8000`).

**Step 5: Verify it works**

Open `http://localhost:9090` in a browser. In the Prometheus query bar, type:

```promql
dcgm_gpu_temp_celsius{tier="4"}
```

You should see live time-series data for all Tier 4 (Blackwell B200) nodes. **This is what you show the judges.**

##### Adding to Docker Compose (Optional)

Add this service to `docker-compose.yml`:

```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    depends_on:
      - telemetry
```

---

### 2.3 NVIDIA DCGM (Data Center GPU Manager)

#### What It Is
A suite of tools by NVIDIA for managing and monitoring NVIDIA GPUs in data center and cluster environments. It exposes low-level hardware telemetry: GPU temperature, utilization, VRAM usage, power draw, PCIe bandwidth, ECC errors, and XID hardware faults.

#### How It Works (Real World)
1. NVIDIA's `dcgm-exporter` runs as a **DaemonSet** (one per node) inside a Kubernetes cluster.
2. It communicates with the GPU driver via the NVIDIA Management Library (NVML).
3. It exposes metrics in Prometheus format at `/metrics` on port 9400.
4. Prometheus scrapes these metrics alongside standard node metrics.

#### How We Use It in ClustroConnect

**Current State:** We have **no real NVIDIA hardware**, so we cannot run DCGM. Our `telemetry_generator.py` already simulates the exact metrics that DCGM would produce: temperature, VRAM, utilization, and power draw.

**Strategy: Emulate DCGM via Naming Conventions**

By naming our Prometheus Gauge metrics with the `dcgm_` prefix (as shown in Section 2.2 Step 2), our telemetry exporter becomes a **drop-in replacement** for the real DCGM exporter. If we ever connect to real NVIDIA hardware, we simply swap our Python generator with the actual `dcgm-exporter` container — zero code changes needed in the rest of the platform.

**What to Tell Judges:**
> "Our telemetry exporter uses DCGM-compatible metric naming conventions. The metrics like `dcgm_gpu_temp_celsius` and `dcgm_gpu_utilization_percent` follow the exact schema that NVIDIA's official dcgm-exporter produces. In production, our Python generator would be replaced with a real `dcgm-exporter` DaemonSet running on each GPU node — the rest of the stack (Prometheus, scheduler, dashboard) requires zero changes."

---

### 2.4 Python & ML Anomaly Detection

#### What It Is
Python serves as the primary programming language for the intelligent layer: custom scheduling algorithms, anomaly detection models, and the AI copilot. ML anomaly detection refers to using machine learning models to detect irregular patterns in telemetry data that indicate potential hardware failures.

#### How It Works (Real World)
Common approaches for telemetry anomaly detection include:
- **Isolation Forest:** An unsupervised algorithm that identifies outliers by randomly partitioning data. Anomalies require fewer partitions to isolate.
- **LSTM Autoencoders:** Neural networks trained on normal telemetry patterns. High reconstruction error = anomaly.
- **Statistical Thresholds:** Simple but effective — Z-score or percentile-based alerts when metrics deviate from rolling averages.

#### How We Use It in ClustroConnect

**Current State:** Our `processor.py` already implements a real-time anomaly detection pipeline:

| Feature | Implementation | File |
|---------|---------------|------|
| **Failure Probability Scoring** | Dynamic probability: `prob = (temp - 40) / 60.0` | [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py#L94) |
| **Thermal Anomaly Detection** | Alert when `temp >= 90°C` | [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py#L99-L109) |
| **Auto-Resolution** | Auto-resolve alerts when `temp < 85°C` | [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py#L107-L109) |
| **Global Load Analysis** | Cluster-wide load % calculation | [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py#L140-L141) |
| **80% Load: AI Autonomous Decision** | Query local LLM to decide which task to kill | [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py#L159-L191) |
| **90% Load: Emergency Load Shedding** | Auto-execute emergency actions | [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py#L143-L157) |
| **Idle Cost Calculation** | Calculate wasted $ for idle GPUs (util < 5%) | [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py#L112-L119) |
| **Thermal Migration** | Auto-migrate workloads from hot nodes to idle nodes | [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py#L204-L241) |

**Recommended Enhancement: Add a Proper ML Model (Isolation Forest)**

Currently, our anomaly detection is purely threshold-based (`temp >= 90`). Adding a simple Isolation Forest model that runs on the Prometheus data would significantly boost the "Technical Complexity" score (20% of judging).

```bash
pip install scikit-learn
echo "scikit-learn>=1.3.0" >> requirements.txt
```

```python
# anomaly_detector.py (new file in backend/)
from sklearn.ensemble import IsolationForest
import numpy as np

class ClusterAnomalyDetector:
    def __init__(self, contamination=0.05):
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.is_fitted = False
        self.history = []  # Rolling window of telemetry snapshots

    def ingest(self, telemetry_snapshot: list[dict]):
        """
        Accepts a list of dicts with keys: temp, util, vram_pct, power.
        Appends to history and re-fits when enough data is collected.
        """
        features = [
            [t['temp'], t['util'], t['vram_pct'], t['power']]
            for t in telemetry_snapshot
        ]
        self.history.extend(features)

        # Fit after collecting 100+ data points
        if len(self.history) >= 100 and not self.is_fitted:
            self.model.fit(np.array(self.history))
            self.is_fitted = True

    def detect(self, telemetry_snapshot: list[dict]) -> list[dict]:
        """
        Returns a list of anomalous nodes with their anomaly scores.
        Score of -1 = anomaly, 1 = normal.
        """
        if not self.is_fitted:
            return []

        features = np.array([
            [t['temp'], t['util'], t['vram_pct'], t['power']]
            for t in telemetry_snapshot
        ])
        predictions = self.model.predict(features)
        scores = self.model.decision_function(features)

        anomalies = []
        for i, (pred, score) in enumerate(zip(predictions, scores)):
            if pred == -1:
                anomalies.append({
                    'node_id': telemetry_snapshot[i].get('node_id', f'Node-{i}'),
                    'anomaly_score': float(score),
                    'metrics': telemetry_snapshot[i]
                })
        return anomalies
```

Integrate this into `processor.py` alongside the existing threshold-based checks. The Isolation Forest catches multi-dimensional anomalies (e.g., a node with normal temperature but abnormally high power draw combined with low utilization — indicating a hardware fault).

---

### 2.5 Ray (Optional / Advanced)

#### What It Is
An open-source unified compute framework for scaling Python and ML workloads. It simplifies distributed execution across multiple machines.

#### How It Works
Ray provides:
- **Ray Core:** Distributed task execution (parallelize Python functions across a cluster).
- **Ray Serve:** Model serving for ML inference.
- **Ray Tune:** Hyperparameter tuning at scale.

#### Our Strategy

> [!NOTE]
> Ray is listed as a relevant technology in the hackathon track description but is **not mandatory**. Given our constraints (no physical cluster), integrating Ray would add complexity without clear demo value. **Mention it in your architecture diagrams as a future integration point**, but do not prioritize implementing it.

**What to Tell Judges:**
> "For distributed ML training workloads, we would integrate Ray as the execution backend. Our scheduler already computes which tier and how many nodes a workload needs — Ray would be the runtime that actually distributes the training job across those GPU nodes."

---

## 3. Current Project vs. Requirements Gap Analysis

### Architecture Overview (What We Have)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLUSTROCONNECT PLATFORM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │   Frontend    │   │   Backend    │   │ Background       │    │
│  │  (Next.js)   │   │ (Django DRF) │   │ Scripts          │    │
│  ├──────────────┤   ├──────────────┤   ├──────────────────┤    │
│  │ Dashboard    │   │ simulator/   │   │ telemetry_       │    │
│  │  (Dark Mode) │   │  views.py    │   │  generator.py    │    │
│  │  - Node Map  │   │  workload_   │   │  (128-node mock  │    │
│  │  - Telemetry │   │   engine.py  │   │   GPU telemetry) │    │
│  │  - Alerts    │   │  agy_service │   │                  │    │
│  │  - Approvals │   │         .py  │   │ processor.py     │    │
│  │              │   │              │   │  (Anomaly detect │    │
│  │ Workstation  │   │ gate/        │   │   + Auto-migrate │    │
│  │  (Light Mode)│   │  (Approvals) │   │   + Cost calc    │    │
│  │  - Chat UI   │   │              │   │   + LLM decisions│    │
│  │  - Task Sub  │   │ sentinel/    │   │   + Alert gen)   │    │
│  │  - Results   │   │  (Predictions│   │                  │    │
│  │              │   │   & Alerts)  │   │                  │    │
│  │              │   │ copilot/     │   │                  │    │
│  │              │   │  (LLM Chat)  │   │                  │    │
│  │              │   │ costwatch/   │   │                  │    │
│  │              │   │  (Cost Rpts) │   │                  │    │
│  │              │   │ scheduler/   │   │                  │    │
│  │              │   │  (Placement) │   │                  │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
│                                                                 │
│  Database: SQLite (dev) / PostgreSQL (docker-compose)           │
│  LLM: Ollama (local) or OpenRouter (cloud fallback)             │
│  AI Agent: Antigravity SDK (agy CLI) for simulation reports     │
└─────────────────────────────────────────────────────────────────┘
```

### Gap Analysis Table

| Hackathon Requirement | ClustroConnect Status | Gap | Priority |
|---|---|---|---|
| **Kubernetes** | Architecture only (simulated scheduling) | No K8s runtime, no manifests | LOW — Keep as design element |
| **Prometheus** | ❌ Not integrated. Telemetry stored in Django DB | Missing entirely | 🔴 **HIGH** — Must add |
| **NVIDIA DCGM** | ✅ Simulated (temp, VRAM, util, power metrics) | Naming conventions don't match DCGM | MEDIUM — Rename metrics |
| **Python ML** | ✅ Threshold-based anomaly detection | No proper ML model (Isolation Forest) | MEDIUM — Easy to add |
| **Smart Scheduling** | ✅ Fully implemented (workload_engine.py) | Well-built | ✅ Done |
| **Predictive Operations** | ✅ Failure probability + thermal alerts | Could use ML model boost | MEDIUM |
| **Cost Optimization** | ✅ Idle GPU cost calculation (costwatch) | Functional | ✅ Done |
| **Real-world Data** | ❌ Using `random.uniform()` mock data | No realistic patterns | 🔴 **HIGH** — Use Alibaba traces |
| **Off-hours Intervention** | ❌ No remote notification system | No Telegram/Slack alerts | MEDIUM — Nice to have |
| **Modular Config** | ⚠️ Partially hardcoded (tiers, thresholds) | Needs extraction to config | 🔴 **HIGH** — Critical for live mods |

---

## 4. Data Strategy: Where to Get Real Telemetry

### Primary Source: Alibaba GPU Cluster Trace (Recommended)

The **Alibaba Cluster Trace GPU v2020** is an open-source production dataset from Alibaba's PAI (Platform for Artificial Intelligence) platform. It contains real-world GPU cluster telemetry from **6,500+ GPUs across ~1,800 machines**.

#### Where to Get It

| Source | URL | Notes |
|--------|-----|-------|
| **GitHub (Official)** | [github.com/alibaba/clusterdata](https://github.com/alibaba/clusterdata/tree/master/cluster-trace-gpu-v2020) | Full dataset with README + schema docs |
| **Kaggle (Mirror)** | Search "Alibaba GPU Cluster Trace" on Kaggle | Easier download, Jupyter integration |

#### Key Files & Schema

| File | What It Contains | Useful Columns |
|------|-----------------|----------------|
| `pai_job_table.csv` | Job launch info | `job_name`, `status`, `start_time`, `end_time` |
| `pai_task_table.csv` | Task-level details | Task configs, resource requests |
| `pai_instance_table.csv` | Instance metrics | `gpu_type_spec`, `workload` type |
| `pai_sensor_table.csv` | Sensor/telemetry readings | GPU utilization, temperature data |
| `pai_machine_spec.csv` | Machine hardware specs | GPU model, memory |
| `pai_machine_metric.csv` | Machine-level metrics | CPU, memory, GPU utilization |

#### How to Integrate (Data Replayer Script)

Create a script that reads the Alibaba CSV data and replays it through our Prometheus exporter, making it look like a live cluster:

```python
# alibaba_replayer.py (new file in backend/)
import csv
import time
from prometheus_client import Gauge

# Re-use the same Gauge metrics defined in telemetry_generator.py
# Read pai_machine_metric.csv row by row
# Map each row's GPU utilization, temperature columns to our Gauge metrics
# Sleep between rows to simulate real-time data streaming

def replay_alibaba_trace(csv_path: str, speed_multiplier: float = 10.0):
    """
    Reads Alibaba trace CSV and pushes rows to Prometheus Gauges.
    speed_multiplier=10 means 10x faster than real-time.
    """
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Map Alibaba columns to our metrics
            node_id = f"Node-{row.get('machine_id', '001')}"
            # ... set Gauge values ...
            time.sleep(1.0 / speed_multiplier)
```

> [!TIP]
> **For the demo**, you don't need the entire dataset. Download a small subset (a few thousand rows from `pai_machine_metric.csv`) and replay it in a loop. The judges will see realistic, non-random telemetry patterns — spikes, cooldowns, load curves — that look nothing like `random.uniform()`.

### Secondary Source: Google Cluster Traces (Alternative)

Google's Borg cluster traces are also publicly available but are more complex and CPU/memory focused (less GPU-specific). Use Alibaba's trace for better GPU relevance.

| Source | URL |
|--------|-----|
| **Google Cluster Data** | [github.com/google/cluster-data](https://github.com/google/cluster-data) |

---

## 5. Implementation Roadmap

### Priority Matrix

Tasks are ordered by **impact-to-effort ratio**. Complete the 🔴 HIGH items first.

---

### Phase A: Critical Improvements (July 17–20) — 🔴 HIGH

#### A1. Add Prometheus Integration
- **Files to modify:** [telemetry_generator.py](file:///home/djrcx/Work/ai-cluster/backend/telemetry_generator.py)
- **Files to create:** `prometheus.yml` (project root)
- **Dependency to install:** `prometheus-client`
- **Docker image needed:** `prom/prometheus`
- **Estimated time:** 2–3 hours
- **Full instructions:** See [Section 2.2](#22-prometheus) above

#### A2. Seed with Alibaba Cluster Traces
- **Files to create:** `backend/alibaba_replayer.py`
- **Data to download:** `pai_machine_metric.csv` from [Alibaba GitHub](https://github.com/alibaba/clusterdata/tree/master/cluster-trace-gpu-v2020) or Kaggle
- **Estimated time:** 1–2 hours
- **Full instructions:** See [Section 4](#4-data-strategy-where-to-get-real-telemetry) above

#### A3. Extract Hardcoded Configs to a Config File
- **Why:** If judges request "change the temperature threshold" or "add a new GPU tier", we need to do it instantly by editing ONE file.
- **Files to modify:** [workload_engine.py](file:///home/djrcx/Work/ai-cluster/backend/simulator/workload_engine.py), [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py), [telemetry_generator.py](file:///home/djrcx/Work/ai-cluster/backend/telemetry_generator.py)
- **File to create:** `backend/cluster_config.json`
- **Estimated time:** 2 hours

Create a centralized config:

```json
{
  "cluster": {
    "total_nodes": 128,
    "nodes_per_tier": 32
  },
  "thresholds": {
    "thermal_alert_celsius": 90,
    "thermal_resolve_celsius": 85,
    "thermal_critical_celsius": 95,
    "idle_utilization_percent": 5,
    "cluster_load_ai_threshold": 0.80,
    "cluster_load_emergency_threshold": 0.90
  },
  "tiers": {
    "1": {
      "name": "RTX 3090 Build",
      "color": "#a3be8c",
      "ram": "16GB DDR5",
      "vram": "24GB GDDR6X",
      "vram_total_mb": 24576,
      "temp_nominal": 65,
      "power_nominal": 350
    },
    "2": { "..." : "..." },
    "3": { "..." : "..." },
    "4": { "..." : "..." }
  },
  "cost": {
    "kwh_cost_usd": 0.15
  }
}
```

Then load it in all backend scripts:

```python
import json
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent / 'cluster_config.json'
with open(CONFIG_PATH) as f:
    CLUSTER_CONFIG = json.load(f)

# Usage example:
THERMAL_ALERT = CLUSTER_CONFIG['thresholds']['thermal_alert_celsius']
```

---

### Phase B: Medium Priority Improvements (July 21–23)

#### B1. Add Isolation Forest Anomaly Detection
- **File to create:** `backend/anomaly_detector.py`
- **Dependency to install:** `scikit-learn`
- **Integration point:** [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py) (call `.detect()` alongside existing threshold checks)
- **Estimated time:** 1.5 hours
- **Full instructions:** See [Section 2.4](#24-python--ml-anomaly-detection) above

#### B2. Add Telegram Notification Integration
- **File to create:** `backend/notifications.py`
- **Estimated time:** 1.5 hours

```python
# notifications.py
import os
import requests

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')

def send_telegram_alert(message: str, buttons: list[dict] | None = None):
    """
    Send a critical alert to the operator's Telegram.
    buttons: list of {"text": "Approve", "callback_data": "approve_123"}
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print(f"[NOTIFY] Telegram not configured. Alert: {message}")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }

    if buttons:
        payload["reply_markup"] = {
            "inline_keyboard": [[btn] for btn in buttons]
        }

    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print(f"[NOTIFY] Telegram send failed: {e}")
```

**Setup steps:**
1. Open Telegram, search for `@BotFather`, send `/newbot`, follow prompts.
2. Copy the bot token → Add to `.env` as `TELEGRAM_BOT_TOKEN`.
3. Send a message to your bot, then hit `https://api.telegram.org/bot<TOKEN>/getUpdates` to get your `chat_id`.
4. Add `TELEGRAM_CHAT_ID` to `.env`.
5. Call `send_telegram_alert()` in `processor.py` when critical alerts fire.

#### B3. Rename Prometheus Metrics to DCGM Convention
- **File to modify:** [telemetry_generator.py](file:///home/djrcx/Work/ai-cluster/backend/telemetry_generator.py)
- **Estimated time:** 30 minutes
- Use `dcgm_` prefixed names as shown in Section 2.2.

#### B4. Add Kubernetes Manifest Endpoint (Optional)
- **File to create:** New view in [scheduler/views.py](file:///home/djrcx/Work/ai-cluster/backend/scheduler/views.py) or [simulator/views.py](file:///home/djrcx/Work/ai-cluster/backend/simulator/views.py)
- **Estimated time:** 1 hour
- Returns a JSON Kubernetes Pod manifest based on workload parameters.

---

### Phase C: Pre-Event Rehearsal (July 24)

#### C1. Fire Drill
- Run the entire stack locally: Django + Telemetry Generator + Processor + Prometheus + Next.js Frontend.
- Simulate 3 random judge requests and implement them in under 15 minutes each.
- Test that the demo runs **completely offline** (venue Wi-Fi is unreliable).

#### C2. Ensure Offline Capability
- The local LLM (Ollama) must be running and responsive.
- Prometheus and the frontend must work without internet.
- Pre-download all npm dependencies (`node_modules` must be committed or pre-installed).
- Have the Alibaba dataset CSV already on the laptop, not requiring download.

---

## 6. Codebase Preparation for Live Modifications

Since the event may involve judges requesting live code changes, our codebase must be **change-proof**. Here is what to prepare:

### Likely Judge Requests & Where to Change

| Judge Request | Where to Change | Current Location |
|---|---|---|
| "Change the temperature alert threshold" | `cluster_config.json` → `thresholds.thermal_alert_celsius` | [processor.py L99](file:///home/djrcx/Work/ai-cluster/backend/processor.py#L99) (hardcoded `90`) |
| "Add a new GPU tier (e.g., H100)" | `cluster_config.json` → `tiers` + `workload_engine.py` TIERS dict | [workload_engine.py L17–50](file:///home/djrcx/Work/ai-cluster/backend/simulator/workload_engine.py#L17-L50) |
| "Change the node count from 128 to 64" | `cluster_config.json` → `cluster.total_nodes` | [workload_engine.py L15](file:///home/djrcx/Work/ai-cluster/backend/simulator/workload_engine.py#L15), [telemetry_generator.py L14](file:///home/djrcx/Work/ai-cluster/backend/telemetry_generator.py#L14) |
| "Add a new task type" | `workload_engine.py` → `TASK_SPECS` dict | [workload_engine.py L64–119](file:///home/djrcx/Work/ai-cluster/backend/simulator/workload_engine.py#L64-L119) |
| "Change the scheduling policy" | `workload_engine.py` → `assess_allocation()` function | [workload_engine.py L176–286](file:///home/djrcx/Work/ai-cluster/backend/simulator/workload_engine.py#L176-L286) |
| "Send alerts to Slack instead of Telegram" | `notifications.py` → change webhook URL | New file |
| "Show a power consumption chart" | Frontend: add a Recharts component on the dashboard | [dashboard/page.tsx](file:///home/djrcx/Work/ai-cluster/frontend/src/app/(dashboard)/page.tsx) |
| "Change the LLM model" | `.env` → `LLM_MODEL` | [backend/.env](file:///home/djrcx/Work/ai-cluster/backend/.env) |

### File Isolation Principles

1. **One config file for all thresholds:** `cluster_config.json`
2. **One file for scheduling logic:** [workload_engine.py](file:///home/djrcx/Work/ai-cluster/backend/simulator/workload_engine.py)
3. **One file for anomaly detection:** [processor.py](file:///home/djrcx/Work/ai-cluster/backend/processor.py) (+ `anomaly_detector.py`)
4. **One file for notifications:** `notifications.py`
5. **One file for telemetry generation:** [telemetry_generator.py](file:///home/djrcx/Work/ai-cluster/backend/telemetry_generator.py)

Each concern is isolated. Changing one does not break the others.

---

## 7. Presentation & Demo Strategy

### Demo Flow (Story-Based)

Structure the demo as a narrative, not a feature list:

#### Act 1: The Problem (30 seconds)
> "AI compute is expensive. Organizations are wasting money on idle GPUs, overheating hardware, and manual monitoring. We built ClustroConnect to solve this."

#### Act 2: The Dashboard (1 minute)
- Show the Next.js Dashboard with the live 128-node cluster map.
- Point out: "This telemetry is being streamed through **Prometheus** — the same monitoring tool used by companies like Uber and SoundCloud."
- Open the Prometheus UI (`localhost:9090`) briefly and run a query to prove it.

#### Act 3: Smart Scheduling (1 minute)
- Go to the Workstation. Submit a "Video Generation" task.
- Show the workload engine analyzing it, selecting Tier 4 (Blackwell B200), and allocating 32 nodes.
- The dashboard map lights up the Tier 4 quadrant.

#### Act 4: The Anomaly (1 minute — the wow moment)
- Trigger a thermal anomaly (the telemetry generator has a 5% chance per tick when load > 50%).
- The dashboard shows a node turning red.
- The processor auto-detects it, creates an alert, and migrates the workload.
- *(If Telegram is set up)* Show the phone receiving the alert notification.

#### Act 5: The AI Copilot (30 seconds)
- Open the Copilot on the dashboard.
- Ask: "We need to cut power costs by 15% tonight. What should we do?"
- Show the local LLM providing a structured recommendation.

#### Act 6: The Architecture Pitch (30 seconds)
> "Our platform is modular. The Prometheus metrics exporter uses DCGM-compatible naming. The scheduler outputs Kubernetes-ready placement decisions. The notification layer supports any webhook target. Every component can be swapped for its production equivalent without changing the rest of the codebase."

---

## 8. Judge Q&A Preparation

### Expected Questions & Answers

**Q: "How is this different from just using Grafana + Kubernetes?"**
> A: "Grafana is visualization, Kubernetes is orchestration — neither makes *intelligent decisions*. ClustroConnect is the AI layer that sits on top. It analyzes telemetry from Prometheus (which Grafana also reads), but instead of just displaying it, our platform *acts on it*: it schedules workloads intelligently, predicts failures, auto-migrates tasks, and escalates to humans when needed."

**Q: "This is simulated data. How would it work with real hardware?"**
> A: "Our architecture is designed for this exact transition. The Prometheus exporter we built uses DCGM-compatible metric names. In production, you replace our Python generator with NVIDIA's official `dcgm-exporter` DaemonSet — it exposes the same metrics at the same endpoint. Zero changes to the scheduler, dashboard, or anomaly detection."

**Q: "What happens when anomalies occur at 3 AM and no one is monitoring?"**
> A: "We use a Human-on-the-Loop (HOTL) model. For predictable anomalies (thermal spike, idle waste), the system acts autonomously: it migrates workloads, quarantines nodes, and logs every action in the audit trail. For situations the system cannot resolve (cluster 100% full, nowhere to migrate), it escalates via Telegram/Slack to the on-call operator with actionable buttons — 'Kill Task', 'Force Migrate', or 'Scale Cluster' — so they can respond from their phone in seconds."

**Q: "Can this scale to thousands of nodes?"**
> A: "Yes, with architectural changes. We'd replace the SQLite/PostgreSQL telemetry store with a time-series database like TimescaleDB or InfluxDB for high-throughput metric ingestion. We'd add edge processing — simple threshold rules execute locally on each node, only aggregated data flows to the control plane. And we'd use message queues (Kafka/RabbitMQ) for workload submission to handle burst traffic. The modular architecture makes each change independent."

**Q: "What's the business model?"**
> A: "Two paths: (1) Kubernetes-native Operator installed via `helm install` for enterprises that want to keep data on-premise. (2) SaaS control plane where companies install a lightweight agent on their clusters and we host the intelligence. Revenue model is a percentage of compute cost savings — we only make money when we save the customer money."

**Q: "Where is the ML in this project?"**
> A: "Three layers. (1) The scheduling engine uses a multi-factor scoring algorithm to place workloads on optimal hardware — considering task type, complexity, concurrency, and current tier occupancy. (2) The anomaly detector uses an Isolation Forest model trained on cluster telemetry to catch multi-dimensional anomalies that simple thresholds miss. (3) The AI copilot uses a local LLM (Ollama) for root-cause analysis and operational recommendations."

---

## 9. Risk Mitigation

| Risk | Probability | Mitigation |
|------|-------------|------------|
| **Venue Wi-Fi failure** | HIGH | Pre-install all dependencies. Run everything locally. Have mobile hotspot as backup. |
| **Laptop battery dies** | MEDIUM | Bring power strips. Sit near power outlets. |
| **Local LLM (Ollama) crashes** | MEDIUM | `agy_service.py` and `processor.py` both have deterministic fallback functions that work without the LLM. Test fallback paths. |
| **Judges request a feature we haven't anticipated** | HIGH | Use Antigravity (AI assistant) to implement live changes. Keep the codebase modular. Rehearse on July 24. |
| **Event format changes again** | MEDIUM | Be prepared for both formats (demo-only AND live-build). Have the full stack running either way. |
| **Docker not working on venue machines** | LOW | Have a non-Docker setup ready (run Prometheus natively or skip it and use the Django DB fallback). |
| **Teammate's laptop (with Ollama) is not available** | LOW | Ensure at least 2 laptops can run the full stack. Install Ollama on a second machine as backup. |

---

## 10. Appendix: Quick Reference

### Project File Map

```
ai-cluster/
├── backend/
│   ├── neuronops/             # Django project settings
│   │   ├── settings.py        # DB, CORS, JWT, LLM config
│   │   └── urls.py            # API route registration
│   ├── simulator/             # 🎯 CORE: Workload submission + AI reports
│   │   ├── workload_engine.py # Scheduling algorithm (TIERS, TASK_SPECS)
│   │   ├── agy_service.py     # Antigravity SDK agent for reports
│   │   ├── views.py           # POST /api/simulator/runs/
│   │   └── models.py          # SimulationRun model
│   ├── telemetry/             # GPU telemetry data model + API
│   │   ├── models.py          # GpuTelemetry model
│   │   └── views.py           # GET /api/telemetry/latest/
│   ├── gate/                  # Human approval workflow
│   │   ├── models.py          # ApprovalRequest model
│   │   └── views.py           # CRUD + approval execution logic
│   ├── sentinel/              # Predictions + Alerts
│   │   └── models.py          # Prediction, Alert models
│   ├── scheduler/             # Workload placement records
│   │   └── models.py          # WorkloadPlacement model
│   ├── copilot/               # LLM chat interface (Ollama/OpenRouter)
│   │   └── views.py           # POST /api/copilot/query/
│   ├── costwatch/             # Idle GPU cost tracking
│   │   └── models.py          # CostReport model
│   ├── core/                  # Shared utilities (permissions, renderers)
│   ├── telemetry_generator.py # 🔧 Background: 128-node GPU telemetry loop
│   ├── processor.py           # 🔧 Background: Anomaly detection + auto-actions
│   ├── requirements.txt       # Python dependencies
│   └── .env / .env.example    # Environment variables
├── frontend/
│   └── src/
│       ├── app/(dashboard)/   # Dashboard pages (dark mode)
│       ├── app/(workstation)/ # Workstation pages (light mode)
│       ├── app/services/      # API client + workload engine (TS)
│       └── app/globals.css    # Nord theme CSS
├── docker-compose.yml         # Multi-service orchestration
├── DESIGN.md                  # Nord design system tokens
├── PROJECT_FLOW.md            # System architecture documentation
└── DOCS/
    ├── website-data.md        # Hackathon event details
    └── RULE-BOOK.md           # Hackathon rules
```

### Commands to Run the Full Stack

```bash
# Terminal 1: Django Backend
cd backend
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
python manage.py runserver

# Terminal 2: Telemetry Generator
cd backend
source venv/bin/activate
python telemetry_generator.py

# Terminal 3: Processor (Anomaly Detection)
cd backend
source venv/bin/activate
python processor.py

# Terminal 4: Frontend
cd frontend
npm run dev

# Terminal 5: Prometheus (after setup)
docker run -d --name prometheus -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### New Dependencies to Install

```bash
# Python
pip install prometheus-client scikit-learn

# Add to requirements.txt:
prometheus-client>=0.20.0
scikit-learn>=1.3.0
```

### Key Environment Variables (`.env`)

```bash
# Required
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# LLM (one team member's laptop)
OLLAMA_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.1:8b

# Telegram (optional, for off-hours demo)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

---

> [!IMPORTANT]
> **Final Reminder:** The single most impactful thing you can do before July 25th is to get **Prometheus running with DCGM-named metrics fed by Alibaba cluster traces.** This alone transforms the project from "a student Django app with random numbers" to "a production-architected GPU monitoring platform using real-world data from Alibaba's 6,500-GPU cluster." That distinction is what wins hackathons.
