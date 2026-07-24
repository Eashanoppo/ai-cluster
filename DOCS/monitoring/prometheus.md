# Prometheus TSDB Integration

NeuronOps uses Prometheus as the core Time Series Database (TSDB) to bridge the simulated hardware metrics and the AI Control Plane. 

## Data Scraping Architecture

```mermaid
graph TD
    Generator[telemetry_generator.py (Port 8000)]
    Prom[(Prometheus TSDB)]
    Processor[processor.py Engine]
    Grafana[Grafana Dashboard]
    
    Generator -- "Exposes /metrics" --> Prom
    Prom -- "Scrapes every 5s" --> Prom
    Processor -- "PromQL Queries" --> Prom
    Grafana -- "Visualizes" --> Prom
```

## Simulated NVIDIA DCGM Metrics
The `telemetry_generator.py` script mimics the exact output format of the real `dcgm-exporter` used in production Kubernetes clusters. 

Key metrics generated include:
- `dcgm_fi_dev_gpu_temp`: The current GPU temperature in Celsius.
- `dcgm_fi_prof_gr_engine_active`: The graphics/compute engine utilization percentage.
- `dcgm_fi_dev_power_usage`: The wattage currently being drawn by the node.
- `dcgm_fi_dev_fb_used`: The VRAM currently allocated.

By outputting these exact metric names, the system allows you to plug in off-the-shelf Grafana dashboards designed for real hardware without any modifications.

## Querying from the Control Plane
The `PrometheusSim` abstraction class (`backend/telemetry/prometheus_sim.py`) acts as the client for the AI Control Plane. It executes HTTP requests to the Prometheus REST API, passing PromQL queries like `avg(dcgm_fi_dev_gpu_temp)` to make real-time scheduling decisions.
