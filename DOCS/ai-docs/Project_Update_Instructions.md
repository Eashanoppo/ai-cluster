# Project Update Instructions

## Vision

Transform the simulator into an autonomous AI Cloud Operating System.

## Simulator

-   Company wizard
-   Workload profiles (Chat, Coding, Research, OCR, Image, Video, SaaS
    Builder, Training)
-   Configure users, SLA, budget, latency, duration
-   Scenario mode

## processors.py

Single autonomous brain: -
Observe→Analyze→Predict→Decide→Execute→Measure→Learn - Scheduler -
Resource optimizer - Failure predictor - Cost optimizer - Energy
optimizer - Learning engine (history-based) - Decision engine

## Cluster

-   Kubernetes pod creation
-   Ray worker assignment
-   Smart GPU selection
-   Live migration
-   Idle/zombie cleanup
-   GPU consolidation

## Capacity

-   0-60 Healthy

-   60-75 Optimize

-   75-90 Warn

-   90-95 Queue and optimize

-   95 Human approval required

## Dashboard

-   Topology
-   GPU health
-   Power
-   Cost
-   SLA
-   Migrations
-   Failure prediction
-   Decision explanations

## Predictive

-   Saturation forecast
-   Failure prediction
-   Pre-scaling

## Learning

Learn from telemetry/history only. No external AI tokens.

## Demo

Judge configures company, launches workloads, processors.py autonomously
manages cluster, handles failures, optimizes and reports KPIs.
