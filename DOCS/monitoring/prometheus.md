# 📊 Prometheus Monitoring & Metrics Registry

## 1. Overview

NeuronOps exports system metrics using standard Prometheus exposition formatting. This document details metric naming conventions, gauge registries, scrape configuration, and alerting rule definitions.

---

## 2. Prometheus Scrape Configuration (`prometheus.yml`)

```yaml
global:
  scrape_interval: 5s
  evaluation_interval: 5s

scrape_configs:
  - job_name: 'neuronops_telemetry'
    metrics_path: '/api/telemetry/metrics/'
    static_configs:
      - targets: ['backend:8000']
        labels:
          cluster: 'neuronops-digital-twin'
          environment: 'production'
```

---

## 3. Metric Registry Specification

| Metric Name | Type | Labels | Description |
|:---|:---|:---|:---|
| `neuronops_gpu_temperature_celsius` | Gauge | `node`, `tier` | Current GPU core temperature in °C |
| `neuronops_gpu_utilization_percent` | Gauge | `node`, `tier` | GPU compute engine utilization percentage (0–100%) |
| `neuronops_gpu_power_draw_watts` | Gauge | `node`, `tier` | Real-time power consumption in Watts |
| `neuronops_gpu_vram_usage_mb` | Gauge | `node`, `tier` | VRAM memory allocation in MB |
| `neuronops_cluster_active_nodes` | Gauge | `cluster` | Count of active non-idle compute nodes (0–128) |
| `neuronops_cluster_cost_waste_usd` | Counter | `cluster` | Cumulative idle energy cost waste in USD |

---

## 4. Alerting Rules (`alerts.rules.yml`)

```yaml
groups:
  - name: neuronops_alerts
    rules:
      - alert: GpuThermalBreachCritical
        expr: neuronops_gpu_temperature_celsius >= 90
        for: 5s
        labels:
          severity: critical
        annotations:
          summary: "Critical Thermal Threshold Breached on {{ $labels.node }}"
          description: "GPU core temperature reached {{ $value }}°C. Autonomous failover initiated."

      - alert: ClusterOverloadWarning
        expr: (neuronops_cluster_active_nodes / 128) > 0.80
        for: 15s
        labels:
          severity: warning
        annotations:
          summary: "Cluster Capacity Breached 80%"
          description: "Active node load reached {{ $value | humanizePercentage }}. AI task termination engaged."
```
