# Ray Skill for AI Cluster Digital Twin

Version: 1.0

---

# Purpose

This document defines how **Ray** should be used in the AI Cluster Digital Twin project.

Ray is **NOT** the monitoring system.

Ray is **NOT** responsible for Kubernetes orchestration.

Ray is **NOT** responsible for storing telemetry.

Ray exists to provide **distributed computation** for AI workloads across the simulated cluster.

Its responsibility is to make the intelligence layer scalable.

---

# Project Role

Ray is responsible for

✓ Parallel telemetry analysis

✓ Distributed anomaly detection

✓ Feature extraction

✓ Recommendation generation

✓ Parallel simulation tasks

✓ Future distributed model training

Ray is NOT responsible for

✗ Collecting telemetry

✗ Visualizing dashboards

✗ Storing metrics

✗ Managing Kubernetes

✗ Running Prometheus

---

# Overall Architecture

Telemetry Generator
        │
        ▼
Prometheus
        │
        ▼
Telemetry API
        │
        ▼
Ray Cluster
        │
 ┌──────┼──────────────┐
 ▼      ▼              ▼
Worker1 Worker2     Worker3
 │        │            │
 ▼        ▼            ▼
Analyze  Analyze     Analyze
GPU A    GPU B       GPU C
        │
        ▼
Merge Results
        │
        ▼
Recommendation Engine

Ray becomes the distributed processing layer.

---

# Ray Cluster

Deploy

1 Ray Head

2-4 Ray Workers

Example

Ray Cluster

├── Ray Head

├── Ray Worker 1

├── Ray Worker 2

└── Ray Worker 3

The Head coordinates work.

Workers execute tasks.

---

# Kubernetes Deployment

Deploy

ray-head

Deployment

Service

ray-worker

Deployment

Multiple replicas

Workers automatically connect to the Head.

---

# Communication Flow

Telemetry Generator

↓

Prometheus

↓

Anomaly Service

↓

Ray Cluster

↓

Recommendation Engine

Ray should never communicate directly with Grafana.

---

# Ray Responsibilities

Each worker should process one or more simulated nodes.

Example

Worker 1

GPU1

GPU2

GPU3

Worker 2

GPU4

GPU5

GPU6

Worker 3

GPU7

GPU8

GPU9

The workload should be evenly distributed.

---

# Data Flow

Prometheus

↓

Last 60 Seconds

↓

Telemetry Window

↓

Ray Tasks

↓

Anomaly Scores

↓

Recommendation Engine

---

# Remote Tasks

Use remote functions for

Telemetry preprocessing

Feature extraction

Inference

Recommendation scoring

Aggregation

Avoid remote functions for

Simple loops

Small calculations

HTTP requests

Configuration loading

Logging

---

# Actors

Use Ray Actors only for stateful services.

Example

Cluster State

Recommendation Cache

Model Manager

Do NOT use Actors for one-time computations.

---

# Object Store

Large telemetry windows should be placed inside Ray's Object Store.

Avoid repeatedly copying data between workers.

Workflow

Telemetry

↓

Object Store

↓

Workers

↓

Results

This reduces memory usage.

---

# Task Granularity

Good

One task per node

One task per GPU

One task per telemetry window

Bad

One task per metric

One task per temperature value

One task per API request

Tasks should be coarse enough to justify distributed execution.

---

# Parallel Anomaly Detection

Example

20 simulated nodes

↓

20 Ray Tasks

↓

Isolation Forest

↓

20 Anomaly Scores

↓

Merge Results

Instead of sequential analysis.

---

# Parallel Recommendation Generation

Input

Node A anomaly

Node B anomaly

Node C anomaly

↓

Ray Workers

↓

Generate Recommendations

↓

Merge

↓

Operator Dashboard

---

# Feature Extraction

Each worker extracts

Average temperature

Maximum temperature

Power trend

Memory growth

GPU utilization trend

ECC growth

Temperature rate

Utilization variance

These features become ML input.

---

# Sliding Window

Each worker processes

Last 60 seconds

or

Last 120 seconds

of telemetry.

Avoid analyzing isolated points.

Patterns over time are more meaningful.

---

# Future ML Training

Future architecture

Historical Data

↓

Ray Dataset

↓

Distributed Training

↓

Model

↓

Recommendation Engine

The current prototype only performs inference.

Training is optional.

---

# Resource Allocation

Ray Head

CPU

1

Memory

1Gi

Ray Worker

CPU

1

Memory

1Gi

Adjust replicas as workload grows.

---

# Scaling Strategy

Increase

Ray Worker replicas

when

More simulated nodes

Higher telemetry frequency

Larger ML models

Do not scale the Head aggressively.

---

# Fault Tolerance

If one worker crashes

↓

Ray redistributes tasks

↓

Processing continues

No manual recovery should be required.

---

# Model Loading

Load ML models once during worker startup.

Avoid loading models for every task.

Good

Worker starts

↓

Load model

↓

Reuse

Bad

Receive task

↓

Load model

↓

Predict

↓

Unload

---

# Supported Algorithms

Current project

Isolation Forest

Optional

One-Class SVM

Autoencoder

LSTM

Prophet

The implementation should allow replacing algorithms without changing Ray architecture.

---

# Performance Goals

Ray should reduce

Inference latency

Recommendation latency

CPU bottlenecks

Sequential execution

while improving scalability.

---

# Logging

Each worker logs

Worker ID

Task ID

Execution time

Prediction time

Errors

Never print excessive debugging logs.

---

# Metrics

Expose

Task count

Task duration

Worker utilization

Inference latency

Failure count

Queue size

Prometheus should scrape Ray metrics.

---

# Integration with Prometheus

Prometheus stores telemetry.

Ray reads telemetry.

Ray never stores telemetry permanently.

Relationship

Telemetry

↓

Prometheus

↓

Ray

↓

Recommendations

---

# Integration with Kubernetes

Kubernetes

↓

Schedules Ray Pods

↓

Ray executes distributed computation

Responsibilities remain separate.

---

# Integration with Recommendation Engine

Ray returns

Anomaly score

Confidence

Failure probability

Detected features

Recommendation Engine converts these into

Human-readable actions.

Example

Input

High temperature

High power

Low utilization

↓

Recommendation

Drain worker-3

Confidence

96%

---

# Folder Structure

apps/

ray/

head/

worker/

shared/

tasks/

actors/

models/

config/

tests/

---

# Coding Standards

Use

Python 3.12+

Type hints

Small remote tasks

Reusable Actors

No duplicated logic

Shared utilities

Dependency injection

---

# AI Agent Rules

Always

✓ Use Ray only for parallelizable workloads.

✓ Keep Head lightweight.

✓ Scale Workers horizontally.

✓ Load ML models once.

✓ Use Object Store for large datasets.

✓ Design tasks around telemetry windows.

✓ Separate inference from recommendation generation.

✓ Expose Prometheus metrics.

✓ Keep Ray stateless whenever possible.

✓ Write modular remote functions.

Never

✗ Use Ray for simple sequential logic.

✗ Store telemetry inside Ray.

✗ Communicate directly with Grafana.

✗ Mix monitoring logic with ML logic.

✗ Load models repeatedly.

✗ Create excessively small tasks.

✗ Bypass Kubernetes networking.

---

# Success Criteria

A successful Ray deployment should

✓ Receive telemetry from the anomaly service.

✓ Distribute work across multiple workers.

✓ Analyze all simulated nodes in parallel.

✓ Return anomaly predictions.

✓ Scale by increasing worker replicas.

✓ Recover automatically from worker failures.

✓ Integrate cleanly with Kubernetes.

✓ Feed high-quality results into the Recommendation Engine.

The Ray layer should function as the distributed intelligence engine of the AI Cluster Digital Twin, enabling scalable analysis without requiring physical GPU hardware.