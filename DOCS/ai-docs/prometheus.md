# Prometheus Skill for AI Cluster Digital Twin

Version: 1.0

---

# Purpose

This document defines how **Prometheus** should be used in the AI Cluster Digital Twin project.

Prometheus is the **central telemetry collection and time-series storage system**.

It continuously collects metrics from all simulated cluster components and provides historical telemetry for visualization, anomaly detection, and intelligent operational recommendations.

Prometheus is the single source of truth for operational metrics.

---

# Project Role

Prometheus is responsible for

✓ Collecting metrics

✓ Storing historical telemetry

✓ Providing time-series data

✓ Supplying data to Grafana

✓ Supplying data to the ML pipeline

✓ Monitoring application health

✓ Monitoring infrastructure health

Prometheus is NOT responsible for

✗ Generating telemetry

✗ Detecting anomalies

✗ Training ML models

✗ Making recommendations

✗ Managing Kubernetes

---

# Overall Architecture

Telemetry Generator
        │
        ▼
 /metrics Endpoint
        │
        ▼
 Prometheus Server
        │
 ┌──────┼──────────────┐
 ▼      ▼              ▼
Grafana Ray       Recommendation API

Every intelligent component reads telemetry from Prometheus.

---

# Project Data Flow

Simulated GPU Nodes

↓

Telemetry Generator

↓

Prometheus Exporter

↓

Prometheus

↓

Historical Metrics

↓

ML Analysis

↓

Recommendations

Prometheus becomes the telemetry backbone.

---

# Components to Monitor

Prometheus should scrape

Telemetry Generator

Ray Head

Ray Workers

Recommendation Engine

Anomaly Detection Service

FastAPI Services

Node Exporter (optional)

Prometheus itself

Grafana

Every service should expose metrics.

---

# Scrape Strategy

Default scrape interval

15 seconds

Development

5 seconds

High-frequency simulation

1–5 seconds

Choose a value that balances realism and resource usage.

---

# Required Metrics

Every simulated GPU should expose

gpu_utilization_percent

gpu_temperature_celsius

gpu_memory_used_mb

gpu_memory_total_mb

gpu_power_watts

gpu_fan_speed_percent

gpu_ecc_errors

gpu_clock_mhz

gpu_state

These metrics simulate NVIDIA DCGM.

---

# Application Metrics

Every service should expose

Request count

Request duration

Error count

Queue length

Inference latency

Task count

Recommendation count

Prediction confidence

Worker utilization

These help monitor the software itself.

---

# Metric Naming

Always use descriptive names.

Good

gpu_temperature_celsius

gpu_power_watts

ray_worker_tasks_total

recommendation_generated_total

Bad

temp

gpu1

value

metric1

Metric names should describe exactly what they measure.

---

# Labels

Use labels consistently.

Example

node="worker-1"

gpu="gpu0"

environment="development"

service="telemetry"

cluster="digital-twin"

Labels make filtering possible.

---

# Example Metric

gpu_temperature_celsius{
    node="worker-2",
    gpu="gpu0"
} 71

Every metric should contain useful context.

---

# Metric Types

Use

Gauge

for

Temperature

Power

Memory

Utilization

Fan Speed

Current Queue

Use

Counter

for

Requests

Predictions

Recommendations

Errors

Completed Tasks

Use

Histogram

for

Inference latency

HTTP latency

Processing duration

Never misuse metric types.

---

# Historical Storage

Prometheus stores

Time

↓

Metric

↓

Value

Example

12:00

GPU Temp

65

12:01

66

12:02

68

12:03

70

This historical data becomes ML input.

---

# Sliding Window

ML should request

Last 60 seconds

or

Last 120 seconds

instead of current values.

Anomalies are patterns over time.

Not single values.

---

# PromQL Usage

The Recommendation Engine and ML service should query Prometheus using PromQL.

Examples

Average GPU utilization

Maximum GPU temperature

Average memory usage

Rate of ECC errors

Power trend

Temperature trend

PromQL becomes the API for telemetry.

---

# Query Examples

Average utilization

avg(gpu_utilization_percent)

Maximum temperature

max(gpu_temperature_celsius)

Average memory usage

avg(gpu_memory_used_mb)

Temperature of one node

gpu_temperature_celsius{node="worker-1"}

These queries are useful for dashboards and ML preprocessing.

---

# Retention

Development

24 hours

Prototype

7 days

Production simulation

15–30 days

Retention should be configurable.

---

# Storage

Prometheus should use a Persistent Volume.

Never store historical telemetry inside containers.

Persistent storage prevents data loss after restarts.

---

# Failure Detection

Prometheus should detect

Missing telemetry

Stopped services

Unavailable workers

Exporter failures

High latency

Restart loops

The ML system should distinguish

"No telemetry"

from

"Bad telemetry"

---

# Alerting Philosophy

Prometheus should collect data.

Recommendation Engine decides actions.

Avoid placing project intelligence inside Prometheus alerts.

Prometheus may expose warnings but should not replace ML.

---

# Integration with Grafana

Grafana reads directly from Prometheus.

Relationship

Prometheus

↓

Grafana

↓

Dashboards

Prometheus never creates dashboards.

---

# Integration with Ray

Ray reads telemetry history.

Ray never writes telemetry.

Relationship

Prometheus

↓

Ray

↓

Distributed Analysis

---

# Integration with Recommendation Engine

Recommendation Engine

↓

Prometheus Query

↓

Historical Metrics

↓

Decision

↓

Recommendation

Recommendations must always be based on telemetry history.

---

# Integration with Telemetry Generator

Telemetry Generator

↓

/metrics

↓

Prometheus

The generator never sends data directly.

Prometheus always pulls metrics.

---

# Pull Model

Prometheus uses

Pull

NOT Push.

Workflow

Prometheus

↓

Requests metrics

↓

Application responds

Every monitored service must expose

/metrics

---

# Simulated DCGM Compatibility

Current

Telemetry Generator

↓

Prometheus

Future

DCGM Exporter

↓

Prometheus

No downstream service should require modification.

This abstraction is mandatory.

---

# Folder Structure

configs/

prometheus/

prometheus.yml

rules/

targets/

dashboards/

deployments/

prometheus/

---

# Kubernetes Deployment

Deploy

One Prometheus instance

Persistent Volume

ConfigMap

Service

Namespace

monitoring

Expose internally only.

---

# Resource Allocation

Development

CPU

500m

Memory

1Gi

Increase if telemetry frequency grows.

---

# Logging

Log

Scrape failures

Target status

Configuration reloads

Storage warnings

Never log every metric.

---

# Security

Prometheus should remain inside the Kubernetes cluster.

Avoid public exposure.

If external access is required

Use authentication

TLS

Ingress

RBAC

---

# AI Agent Rules

Always

✓ Use Prometheus as the single telemetry database.

✓ Use pull-based metric collection.

✓ Expose /metrics on every service.

✓ Store telemetry with timestamps.

✓ Use meaningful metric names.

✓ Label every metric consistently.

✓ Store historical telemetry.

✓ Keep Prometheus independent of ML logic.

✓ Query Prometheus instead of directly querying applications.

✓ Persist telemetry using Persistent Volumes.

Never

✗ Push telemetry directly into Prometheus.

✗ Store telemetry inside Ray.

✗ Generate recommendations inside Prometheus.

✗ Hardcode scrape targets.

✗ Use random metric names.

✗ Mix logs with metrics.

✗ Expose Prometheus publicly without authentication.

---

# Success Criteria

A successful Prometheus deployment should

✓ Continuously scrape every simulated service.

✓ Maintain historical telemetry.

✓ Feed Grafana dashboards.

✓ Feed Ray and the ML pipeline.

✓ Detect unavailable services.

✓ Provide reliable time-series data.

✓ Support future NVIDIA DCGM integration without architectural changes.

Prometheus serves as the **observability backbone** of the AI Cluster Digital Twin, enabling every intelligent decision to be based on reliable historical telemetry rather than isolated measurements.