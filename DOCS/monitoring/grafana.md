# Grafana Visualization

Grafana serves as the primary visual observability tool for the hardware layer of the NeuronOps cluster.

## Dashboard Architecture

While the Next.js Workstation UI is designed for operational control and high-level workflow visualization, Grafana is strictly for deep-dive hardware metrics.

Grafana connects directly to the Prometheus TSDB container, bypassing the Django backend entirely.

## Key Visualizations

The dashboards are configured to consume the `dcgm_fi_*` metrics emitted by the telemetry generator.

### 1. Cluster Heatmap
A dense grid visualizing the `dcgm_fi_dev_gpu_temp` of all 128 nodes simultaneously. This allows operators to visually spot the "Thermal Anomalies" that the `PredictionEngine` flags.

### 2. Utilization Gauges
Aggregated cluster-wide utilization (`dcgm_fi_prof_gr_engine_active`). When a "Viral Event" traffic scenario is injected via the Workstation UI, this gauge will visually spike from 10% to 95%+.

### 3. Power Draw
A time-series graph mapping the total wattage of the cluster. When the `ConsolidationEngine` successfully merges workloads and puts nodes to sleep, this graph will demonstrate the physical power savings.
