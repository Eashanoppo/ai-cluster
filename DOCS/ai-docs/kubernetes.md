# Kubernetes Skill for AI Cluster Digital Twin

Version: 1.0

---

# Purpose

This document defines how Kubernetes should be used in the AI Cluster Digital Twin project.

The objective is NOT to demonstrate every Kubernetes feature.

The objective is to orchestrate a simulated AI GPU cluster using cloud-native best practices.

The architecture should be easy to replace with real GPU infrastructure in the future.

---

# Project Role

Kubernetes is responsible for

✓ Running all services

✓ Restarting failed services

✓ Internal networking

✓ Service discovery

✓ Scaling services

✓ Configuration management

✓ Health monitoring

✓ Resource isolation

Kubernetes is NOT responsible for

✗ Machine Learning

✗ Telemetry generation logic

✗ Recommendation logic

---

# Cluster Layout

The project should deploy a local Kind cluster.

Example

Kind Cluster

├── Control Plane

├── Worker-1

├── Worker-2

├── Worker-3

└── Worker-4

Worker nodes represent simulated GPU servers.

No real GPUs are required.

---

# Namespace Design

Never deploy everything into default.

Create namespaces

monitoring

simulation

ai

system

Example

monitoring

Prometheus

Grafana

simulation

Telemetry Generator

Node Simulator

ai

Ray

Anomaly Detection

Recommendation Engine

---

# Required Deployments

Deploy the following applications

Telemetry Generator

Prometheus

Grafana

Ray Head

Ray Workers

Anomaly Detection API

Recommendation Engine

Every application should use a Deployment.

---

# Replica Strategy

Default replicas

Telemetry Generator

1

Prometheus

1

Grafana

1

Ray Head

1

Ray Worker

2

Recommendation API

2

Anomaly Service

2

Replica counts should be configurable.

---

# Services

Every Deployment must expose a Service.

Never communicate using Pod IPs.

Example

telemetry-service

prometheus-service

grafana-service

ray-head

recommendation-service

---

# ConfigMaps

Store

simulation interval

cluster size

metric frequency

failure injection settings

dashboard configuration

Never hardcode configuration.

---

# Secrets

Store

API keys

Database credentials

Authentication tokens

Never commit Secrets into Git.

---

# Health Probes

Every application must expose

/health

/readiness

/liveness

Example

FastAPI

GET /health

returns

status

healthy

---

# Resource Requests

Every Pod should define

requests

limits

Example

Telemetry Generator

CPU

250m

Memory

256Mi

Recommendation Engine

CPU

500m

Memory

512Mi

Prometheus

CPU

500m

Memory

1Gi

---

# Internal Communication

Applications communicate only through Services.

Example

Recommendation Service

↓

Prometheus Service

↓

Prometheus API

Never use Pod IPs.

---

# Pod Responsibilities

Telemetry Generator

Produces GPU metrics.

Prometheus

Stores metrics.

Grafana

Displays metrics.

Ray

Parallel processing.

Anomaly Service

Predicts failures.

Recommendation Engine

Suggests operator actions.

Every Pod should have one responsibility.

---

# Scaling Rules

Scale

Recommendation Engine

Ray Workers

Telemetry Generator

when workload increases.

Do not scale

Prometheus

Grafana

for this local prototype.

---

# Persistent Storage

Prometheus

Persistent Volume

Grafana

Persistent Volume

Telemetry Generator

No storage

Recommendation Engine

Stateless

Ray Workers

Stateless

---

# Monitoring

Every application exposes

/metrics

Prometheus scrapes

Telemetry Generator

Recommendation Engine

Anomaly Service

Ray

FastAPI metrics

---

# Labels

Every Deployment

app

component

version

environment

Example

app=telemetry

component=simulation

version=v1

environment=development

---

# Recommended Folder Structure

deployments/

base/

namespace.yaml

telemetry.yaml

prometheus.yaml

grafana.yaml

ray-head.yaml

ray-worker.yaml

anomaly.yaml

recommendation.yaml

services/

configmaps/

ingress/

---

# Rolling Updates

Always use RollingUpdate.

Never recreate Pods simultaneously.

Example

Old Pods

↓

One replaced

↓

Healthy

↓

Next replaced

---

# Failure Recovery

If

Telemetry Generator

fails

↓

Restart automatically.

If

Recommendation Engine

fails

↓

Restart automatically.

Pods should never require manual recovery.

---

# Networking

Internet

↓

Ingress (optional)

↓

Recommendation API

↓

Internal Services

↓

Prometheus

↓

Telemetry

Internal communication remains inside the cluster.

---

# Future Migration

Current

Telemetry Generator

↓

Prometheus

Future

NVIDIA DCGM Exporter

↓

Prometheus

No other service should require modification.

This abstraction is mandatory.

---

# AI Agent Rules

Always

✓ Create one Deployment per service.

✓ Create one Service per Deployment.

✓ Separate ConfigMaps from Secrets.

✓ Use labels consistently.

✓ Configure readiness and liveness probes.

✓ Use resource requests and limits.

✓ Keep Pods stateless unless persistent storage is required.

✓ Expose Prometheus metrics.

✓ Use Deployments instead of naked Pods.

✓ Design Kubernetes manifests so simulated telemetry can later be replaced by NVIDIA DCGM without architectural changes.

Never

✗ Hardcode Pod IPs.

✗ Store configuration inside images.

✗ Mix multiple unrelated services in one Pod.

✗ Modify running Pods manually.

✗ Assume a real GPU exists.

---

# Success Criteria

A successful deployment should look like

Kind Cluster

├── Prometheus

├── Grafana

├── Telemetry Generator

├── Ray Head

├── Ray Workers

├── Anomaly Detection

└── Recommendation Engine

All services are healthy.

Prometheus continuously scrapes telemetry.

Grafana visualizes metrics.

Ray processes workloads.

The ML service predicts anomalies.

The Recommendation Engine suggests operational actions.

The entire platform functions correctly without requiring physical GPU hardware.