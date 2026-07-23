# 🚀 Deployment Architecture & Container Orchestration

## 1. Overview

NeuronOps is containerized for seamless deployment across local development environments, staging clusters, and production-grade Kubernetes infrastructures. This document covers container topologies, startup dependencies, volume management, and orchestrator configurations.

---

## 2. Docker Compose Infrastructure Topology

The project provides a multi-container arrangement defined in [docker-compose.yml](file:///d:/Ai-Cluster/docker-compose.yml).

```mermaid
graph TD
    subgraph Docker Network: neuronops-net
        Postgres[db: postgres:15-alpine]
        Backend[backend: Django REST API]
        Processor[processor: Deterministic Worker]
        TelemGen[telemetry: Telemetry Generator]
        Frontend[frontend: Next.js 15 Web Server]
    end

    Postgres <-->|Port 5432| Backend
    Postgres <-->|Port 5432| Processor
    Postgres <-->|Port 5432| TelemGen

    Backend <-->|Port 8000| Frontend
    Frontend <-->|Port 3000| ExternalUser((User Browser))
```

---

## 3. Container Specifications & Dependency Graph

### Service Definitions

#### 1. `db` (PostgreSQL Database)
* **Image**: `postgres:15-alpine`
* **Exposed Ports**: `5432:5432`
* **Volume Mount**: `pgdata:/var/lib/postgresql/data`
* **Environment Variables**: `POSTGRES_USER=neuronops`, `POSTGRES_PASSWORD=password`, `POSTGRES_DB=neuronops_db`

#### 2. `backend` (Django REST API)
* **Build Context**: `./backend` ([backend/Dockerfile](file:///d:/Ai-Cluster/backend/Dockerfile))
* **Exposed Ports**: `8000:8000`
* **Dependencies**: `db`
* **Command**: `gunicorn neuronops.wsgi:application --bind 0.0.0.0:8000` (or `python manage.py runserver 0.0.0.0:8000`)

#### 3. `processor` (Background Processor Engine)
* **Build Context**: `./backend`
* **Dependencies**: `db`, `backend`
* **Command**: `python processor.py`

#### 4. `telemetry` (Telemetry Generator)
* **Build Context**: `./backend`
* **Dependencies**: `db`, `backend`
* **Command**: `python telemetry_generator.py`

#### 5. `frontend` (Next.js Dashboard)
* **Build Context**: `./frontend` ([frontend/Dockerfile](file:///d:/Ai-Cluster/frontend/Dockerfile))
* **Exposed Ports**: `3000:3000`
* **Dependencies**: `backend`
* **Environment Variables**: `NEXT_PUBLIC_API_URL=http://backend:8000/api`

---

## 4. Container Startup Lifecycle Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Docker as Docker Engine
    participant DB as db (PostgreSQL)
    participant BE as backend (Django API)
    participant Proc as processor Worker
    participant Telem as telemetry Worker
    participant FE as frontend (Next.js)

    Docker->>DB: Start container postgres:15-alpine
    DB->>DB: Initialize database & wait for port 5432 readyness
    Docker->>BE: Start container backend
    BE->>DB: Execute migrations (python manage.py migrate)
    BE->>DB: Seed default database tables (python seed_data.py)
    BE->>BE: Start Gunicorn / Django WSGI server on port 8000
    Docker->>Proc: Start container processor (python processor.py)
    Docker->>Telem: Start container telemetry (python telemetry_generator.py)
    Docker->>FE: Start container frontend (Next.js server on port 3000)
    FE->>BE: Healthcheck ping GET /api/telemetry/latest/
```

---

## 5. Kubernetes Production Architecture

For production Kubernetes deployments, NeuronOps translates into the following Kubernetes resources:

```yaml
# Conceptual Kubernetes Topology
Namespaces:
  - neuronops-system

Deployments:
  - backend-deployment (Replicas: 3, HPA: 50% CPU)
  - processor-deployment (Replicas: 1, Singleton Lock)
  - telemetry-generator-deployment (Replicas: 1, Singleton Lock)
  - frontend-deployment (Replicas: 2)

StatefulSets:
  - postgres-statefulset (1 Primary, 1 Read Replica)

Services:
  - backend-service (ClusterIP: Port 8000)
  - frontend-service (LoadBalancer / Ingress: Port 80 / 443)
  - postgres-service (ClusterIP: Port 5432)
```

For full Kubernetes deployment manifests, refer to [kubernetes.md](file:///d:/Ai-Cluster/docs/deployment/kubernetes.md).
