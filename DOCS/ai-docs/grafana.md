# Grafana Skill for AI Cluster Digital Twin

Version: 1.0

---

# Purpose

This document defines how **Grafana** should be used in the AI Cluster Digital Twin.

Grafana is the **visualization and operational intelligence dashboard** of the platform.

Its responsibility is not simply drawing graphs.

Its purpose is to provide cluster operators with a real-time understanding of

- Cluster Health
- GPU Health
- Workloads
- Anomalies
- Recommendations
- Infrastructure Status

Grafana should become the primary operational dashboard.

---

# Project Philosophy

Raw telemetry is difficult for humans to interpret.

Telemetry

↓

Prometheus

↓

Grafana

↓

Operational Insights

Grafana should answer

✓ What is happening?

✓ Why is it happening?

✓ Which node is affected?

✓ How severe is it?

✓ What should the operator do?

---

# Responsibilities

Grafana is responsible for

✓ Visualizing telemetry

✓ Visualizing anomalies

✓ Visualizing recommendations

✓ Cluster monitoring

✓ Historical analysis

✓ Performance trends

✓ Dashboard organization

Grafana is NOT responsible for

✗ Collecting metrics

✗ Detecting anomalies

✗ Training ML models

✗ Making recommendations

✗ Executing infrastructure changes

---

# Overall Architecture

Telemetry Generator

↓

Prometheus

↓

Grafana

↓

Cluster Operator

Grafana only reads data.

It never writes data.

---

# Data Sources

Primary

Prometheus

Future

Loki (Logs)

Tempo (Tracing)

Current prototype only requires Prometheus.

---

# Dashboard Philosophy

Every dashboard should answer a specific operational question.

Avoid dashboards with dozens of unrelated graphs.

Each dashboard should have a single responsibility.

---

# Required Dashboards

1.

Cluster Overview

2.

Node Health

3.

GPU Health

4.

Training Workloads

5.

Anomaly Detection

6.

Recommendation Center

7.

Ray Cluster

8.

Telemetry Generator

9.

Prometheus Health

10.

System Health

---

# Dashboard 1

Cluster Overview

Purpose

Overall cluster status.

Display

Cluster Health Score

Running Nodes

Healthy GPUs

Active Workloads

Current Alerts

Recommendations

CPU Usage

Memory Usage

Average GPU Utilization

Average Temperature

Power Consumption

This should be the landing page.

---

# Dashboard 2

Node Health

One panel per node.

Display

Node Status

CPU

Memory

Power

Temperature

Running GPUs

Current Workload

Health Score

Current Recommendation

Operators should quickly identify unhealthy nodes.

---

# Dashboard 3

GPU Health

Display

GPU Utilization

GPU Temperature

GPU Memory

Power

Clock

Fan Speed

ECC Errors

Health Score

Each GPU should have its own row.

---

# Dashboard 4

Training Workloads

Display

Current Job

Training State

GPU Assignment

Utilization

Memory

Training Duration

Completed Jobs

Idle GPUs

Useful for understanding workload distribution.

---

# Dashboard 5

Anomaly Detection

Display

Current Anomalies

Severity

Confidence

Affected Nodes

Affected GPUs

Timeline

Anomaly Count

Prediction Latency

Historical Trend

This dashboard shows ML intelligence.

---

# Dashboard 6

Recommendation Center

Display

Active Recommendations

Priority

Confidence

Reason

Suggested Action

Node

GPU

Recommendation Timeline

Resolved Recommendations

Critical Recommendations

This is the most important dashboard.

---

# Dashboard 7

Ray Cluster

Display

Ray Workers

Running Tasks

Completed Tasks

Failed Tasks

Queue Size

Worker Utilization

Inference Latency

Shows distributed processing performance.

---

# Dashboard 8

Telemetry Generator

Display

Simulation Speed

Cluster State

Running Nodes

Failure Injection Status

Current Workloads

Simulation Time

Generated Metrics

Useful during demonstrations.

---

# Dashboard 9

Prometheus Health

Display

Targets

Scrape Status

Failed Targets

Storage

Retention

Query Performance

Ensures observability is functioning.

---

# Dashboard 10

System Health

Display

API Availability

CPU

Memory

Disk

Network

Container Status

Pod Status

Namespace Status

Provides infrastructure overview.

---

# Recommended Panels

Use

Stat

Gauge

Time Series

Table

Heatmap

Bar Gauge

State Timeline

Avoid unnecessary pie charts.

---

# Cluster Health Score

Create a calculated metric.

Inputs

Healthy Nodes

Healthy GPUs

Active Failures

Recommendations

Anomalies

Example

Health

96%

This becomes the project's main KPI.

---

# GPU Heatmap

Display

Rows

GPU

Columns

Time

Color

Temperature

Operators quickly identify hotspots.

---

# Temperature Dashboard

Display

Current Temperature

Historical Temperature

Average Temperature

Maximum Temperature

Temperature Trend

Overheating GPUs highlighted automatically.

---

# Utilization Dashboard

Display

Current Utilization

Historical Utilization

Average Utilization

Idle GPUs

Overloaded GPUs

Useful for workload balancing.

---

# Memory Dashboard

Display

Memory Used

Memory Available

Memory Growth

Memory Leak Candidates

Future OOM Risk

---

# Power Dashboard

Display

Current Power

Historical Power

Power Trend

Power Peaks

Power Efficiency

Useful for identifying abnormal consumption.

---

# Recommendation Dashboard

Display

Recommendation

Reason

Priority

Confidence

Expected Impact

Affected Node

Affected GPU

Recommendation Status

Operators should immediately understand what action is suggested.

---

# Anomaly Timeline

Show

Time

↓

Anomaly

↓

Recommendation

↓

Resolution

This tells the complete operational story.

---

# Node Detail Dashboard

Selecting a node should display

Node Health

GPU List

Running Jobs

Temperature

Power

Recommendations

Historical Graphs

---

# Variables

Support dashboard variables.

Examples

Node

GPU

Namespace

Environment

Cluster

Time Range

Avoid creating duplicate dashboards.

---

# Refresh Rate

Recommended

5 seconds

or

10 seconds

Avoid refreshing every second.

---

# Time Ranges

Support

Last 5 Minutes

Last 15 Minutes

Last Hour

Last 24 Hours

Custom

Useful for anomaly analysis.

---

# Colors

Recommended

Green

Healthy

Yellow

Warning

Orange

High Risk

Red

Critical

Gray

Offline

Keep colors consistent.

---

# Dashboard Layout

Top

Cluster Summary

↓

Middle

Node & GPU Health

↓

Bottom

Recommendations

Operators should see important information first.

---

# Alerts

Grafana alerts are optional.

Primary decisions come from

Recommendation Engine.

Grafana alerts should only support visualization.

---

# Integration with Prometheus

Grafana reads

Prometheus

↓

Metrics

↓

Panels

Grafana never communicates directly with

Telemetry Generator.

---

# Integration with Recommendation Engine

Recommendation Engine

↓

Prometheus Metrics

↓

Grafana Dashboard

Current recommendations should always be visible.

---

# Integration with Ray

Display

Inference Latency

Worker Count

Worker Utilization

Completed Tasks

Failed Tasks

---

# Integration with Kubernetes

Display

Deployment Status

Pod Count

Restart Count

CPU

Memory

Namespace Health

Useful for infrastructure debugging.

---

# Performance

Dashboard loading

<2 seconds

Refresh

5–10 seconds

Avoid heavy PromQL queries.

---

# Folder Structure

configs/

grafana/

dashboards/

datasources/

panels/

variables/

alerts/

deployments/

---

# Dashboard Provisioning

Store dashboards as JSON.

Automatically load them during deployment.

Never create dashboards manually in production.

Dashboard provisioning should be reproducible.

---

# Security

Grafana should

Use authentication

Be available only inside the cluster

Support read-only users

Avoid anonymous access

---

# AI Agent Rules

Always

✓ Build dashboards around operational questions.

✓ Use Prometheus as the only data source.

✓ Provision dashboards automatically.

✓ Keep layouts simple.

✓ Highlight recommendations.

✓ Highlight anomalies.

✓ Use meaningful colors.

✓ Use dashboard variables.

✓ Keep dashboard refresh reasonable.

✓ Design dashboards for operators, not developers.

Never

✗ Build dashboards with random charts.

✗ Duplicate information.

✗ Display raw telemetry without context.

✗ Query Telemetry Generator directly.

✗ Depend on manual dashboard creation.

✗ Overuse pie charts.

---

# Success Criteria

Grafana is successful when

✓ Operators immediately understand cluster health.

✓ GPU health is visible in real time.

✓ Historical telemetry is easy to analyze.

✓ Anomalies are clearly displayed.

✓ Recommendations are the focal point of decision-making.

✓ Ray processing status is visible.

✓ Prometheus health is monitored.

✓ Dashboards work without modification when replacing the simulator with real NVIDIA DCGM Exporter.

Grafana should function as the **single operational control center** of the AI Cluster Digital Twin, transforming raw telemetry and ML predictions into clear, actionable visual intelligence for cluster operators.