# NVIDIA DCGM Skill for AI Cluster Digital Twin

Version: 1.0

---

# Purpose

This document defines how **NVIDIA DCGM (Data Center GPU Manager)** is represented and integrated within the AI Cluster Digital Twin project.

The project **does not require physical NVIDIA GPUs**.

Instead, the architecture must be designed so that **simulated GPU telemetry can later be replaced with real NVIDIA DCGM telemetry without changing the rest of the system.**

DCGM is treated as the **future production telemetry source**.

---

# Project Philosophy

Current Development

Telemetry Simulator

↓

Prometheus

↓

Ray

↓

ML

↓

Recommendation Engine

Future Production

Real NVIDIA GPUs

↓

DCGM

↓

DCGM Exporter

↓

Prometheus

↓

Ray

↓

ML

↓

Recommendation Engine

Only the telemetry source changes.

Everything else remains identical.

---

# Role in This Project

Current Prototype

Telemetry Simulator

Future Production

NVIDIA DCGM

The simulator must faithfully emulate DCGM metrics.

This minimizes future migration effort.

---

# Responsibilities

DCGM is responsible for

✓ GPU health monitoring

✓ GPU utilization

✓ GPU memory statistics

✓ GPU temperature

✓ GPU power usage

✓ GPU clocks

✓ ECC errors

✓ GPU hardware health

✓ NVLink statistics (future)

DCGM is NOT responsible for

✗ Machine Learning

✗ Recommendations

✗ Dashboards

✗ Kubernetes scheduling

✗ Alert generation

---

# Digital Twin Strategy

Every simulated GPU represents

A physical NVIDIA GPU.

Every simulated node represents

A GPU server.

Example

Worker-1

GPU-0

GPU-1

Worker-2

GPU-0

GPU-1

Worker-3

GPU-0

GPU-1

The simulator should expose telemetry exactly as DCGM Exporter would.

---

# Telemetry Pipeline

Current

Simulated GPU

↓

Telemetry Generator

↓

Prometheus Exporter

↓

Prometheus

Future

GPU

↓

DCGM

↓

DCGM Exporter

↓

Prometheus

No downstream component changes.

---

# Required Simulated Metrics

Every simulated GPU must generate

GPU utilization

GPU memory used

GPU memory total

GPU temperature

GPU power draw

GPU fan speed

GPU clock

GPU state

GPU ECC errors

GPU availability

Optional

GPU throttling

PCIe throughput

NVLink throughput

Power limit

Thermal limit

---

# Metric Naming

Whenever possible

Use DCGM Exporter naming conventions.

Examples

DCGM_FI_DEV_GPU_UTIL

DCGM_FI_DEV_GPU_TEMP

DCGM_FI_DEV_FB_USED

DCGM_FI_DEV_POWER_USAGE

DCGM_FI_DEV_ECC_DBE_VOL_TOTAL

Using the same names simplifies production migration.

---

# Simulated GPU States

Every GPU should exist in one state.

Idle

↓

Data Loading

↓

Training

↓

Validation

↓

Checkpoint Saving

↓

Idle

Each state modifies telemetry naturally.

---

# Idle

Expected values

GPU Utilization

0–5%

Temperature

35–45°C

Memory

Low

Power

Low

Fan

Slow

---

# Data Loading

GPU Utilization

10–30%

Temperature

45–55°C

Memory

Moderate

Power

Moderate

---

# Training

GPU Utilization

90–100%

Temperature

70–85°C

Memory

High

Power

High

Fan

Fast

---

# Validation

GPU Utilization

40–60%

Temperature

Moderate

Memory

Medium

Power

Medium

---

# Checkpoint Saving

GPU Utilization

10–20%

Memory

High

Temperature

Moderate

Power

Medium

---

# Failure Simulation

The simulator must generate realistic failures.

Never generate random values.

Failures should evolve gradually.

---

## Cooling Failure

Temperature

65

↓

68

↓

72

↓

77

↓

84

↓

90

↓

95

GPU utilization begins to decrease due to thermal throttling.

Recommendation

Drain Node

---

## Memory Leak

Memory usage continuously rises.

Utilization remains constant.

Example

20 GB

↓

24 GB

↓

29 GB

↓

34 GB

↓

40 GB

Recommendation

Restart Training Job

Reduce Batch Size

---

## Thermal Throttling

Temperature

High

Power

High

Utilization

Drops

This is a strong anomaly pattern.

---

## ECC Error Growth

ECC errors

0

↓

1

↓

2

↓

4

↓

8

↓

15

Recommendation

Schedule Hardware Maintenance

---

## Idle GPU

Utilization

0%

Temperature

Low

Power

Low

Recommendation

Power Down GPU

or

Schedule New Workload

---

## Node Failure

Telemetry suddenly stops.

Prometheus detects

Missing metrics.

Recommendation

Restart Node

Investigate Worker

---

# Telemetry Frequency

Recommended

Every second

Prometheus

Scrape every

5–15 seconds

ML

Sliding Window

60 seconds

---

# Data Quality

Telemetry should

Be continuous.

Be realistic.

Contain trends.

Contain noise.

Contain seasonal variation.

Avoid

Random jumps

Impossible values

Instant failures

Negative temperatures

Memory larger than capacity

---

# ML Compatibility

The simulator should generate telemetry suitable for

Isolation Forest

Autoencoder

LSTM

One-Class SVM

Future algorithms should require no simulator changes.

---

# Future Production Migration

Current

TelemetryGenerator

↓

Prometheus

Future

DCGM Exporter

↓

Prometheus

The following services should remain unchanged

Ray

Grafana

Recommendation Engine

ML Models

FastAPI APIs

This architectural compatibility is mandatory.

---

# Integration with Kubernetes

Current Deployment

Telemetry Generator Pod

Future Deployment

DCGM Exporter DaemonSet

Each Kubernetes worker node would run

One DCGM Exporter.

The project architecture should already support this.

---

# Integration with Prometheus

Prometheus

↓

Scrapes

↓

Telemetry Endpoint

The telemetry source should never push metrics.

Prometheus always pulls.

---

# Integration with Ray

Ray reads

Historical telemetry

from Prometheus.

Ray never communicates directly with DCGM.

---

# Integration with Recommendation Engine

Recommendation Engine receives

Anomaly score

↓

Feature summary

↓

Recommendation

It never directly reads GPU telemetry.

---

# Resource Requirements

Current Simulator

CPU

Low

Memory

Low

Future DCGM

Minimal CPU

Minimal Memory

The architecture should assume telemetry collection is inexpensive.

---

# Folder Structure

apps/

telemetry-generator/

gpu/

metrics/

states/

failures/

exporter/

simulation/

tests/

Future

apps/

dcgm-exporter/

No other directory should require modification.

---

# AI Agent Rules

Always

✓ Design the simulator to mimic NVIDIA DCGM.

✓ Use realistic telemetry trends.

✓ Generate state-based metrics.

✓ Generate gradual failures.

✓ Keep metric names compatible with DCGM Exporter.

✓ Make telemetry replaceable.

✓ Keep telemetry independent from ML.

✓ Support multiple GPUs per node.

✓ Support multiple worker nodes.

✓ Expose Prometheus-compatible metrics.

Never

✗ Generate purely random telemetry.

✗ Couple telemetry generation with anomaly detection.

✗ Hardcode GPU counts.

✗ Assume physical GPUs exist.

✗ Change downstream services when replacing the simulator with DCGM.

---

# Success Criteria

The telemetry layer is considered successful when

✓ Prometheus cannot distinguish between simulated telemetry and future DCGM telemetry.

✓ Grafana dashboards work without modification.

✓ Ray receives realistic historical metrics.

✓ ML models learn meaningful operational patterns.

✓ Recommendation Engine produces realistic operational decisions.

✓ Replacing the simulator with NVIDIA DCGM Exporter requires changing only the telemetry source.

The Digital Twin should accurately emulate the behavior of a real NVIDIA GPU cluster while remaining completely executable on a standard development laptop without dedicated GPU hardware.