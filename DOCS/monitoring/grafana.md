# 📉 Grafana Visualization Dashboards

## 1. Overview

NeuronOps integrates Grafana dashboards to provide real-time visualization of cluster thermal states, GPU utilization heatmaps, power consumption trends, and cost efficiency metrics.

---

## 2. Dashboard Layout & Panel Architecture

```
+-----------------------------------------------------------------------------------+
|                        NEURONOPS GRAFANA SYSTEM DASHBOARD                         |
+---------------------------------+-------------------------------------------------+
| PANEL 1: Cluster Heatmap (128)  | PANEL 2: Active Load Gauge                      |
| Query: gpu_temperature_celsius  | Query: active_nodes / 128                       |
+---------------------------------+-------------------------------------------------+
| PANEL 3: Power Consumption (W)  | PANEL 4: Idle Cost Waste ($ USD)                |
| Query: sum(power_draw_watts)    | Query: sum(wasted_cost_usd)                     |
+---------------------------------+-------------------------------------------------+
| PANEL 5: Sentinel Threat Prob   | PANEL 6: Recent Migration Audit Logs            |
| Query: failure_probability      | Query: count(WorkloadPlacement)                 |
+---------------------------------+-------------------------------------------------+
```

---

## 3. Core PromQL Dashboard Queries

### 1. Cluster-Wide Power Consumption (Watts)
```promql
sum(neuronops_gpu_power_draw_watts)
```

### 2. Tier 4 Blackwell B200 Average Temperature
```promql
avg(neuronops_gpu_temperature_celsius{tier="4"})
```

### 3. Idle Node Power Waste Rate ($/hr)
```promql
sum(neuronops_gpu_power_draw_watts{neuronops_gpu_utilization_percent="0"} / 1000) * 0.15
```

---

## 4. Grafana JSON Provisioning Setup

Dashboards are provisioned automatically via Docker volume mounts:
* **Provisioning Config**: `/etc/grafana/provisioning/dashboards/dashboards.yml`
* **Dashboard JSON**: `/etc/grafana/provisioning/dashboards/neuronops-overview.json`
