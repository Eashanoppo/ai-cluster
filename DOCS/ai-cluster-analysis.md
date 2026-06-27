# NeuronOps — Comprehensive Project Analysis Report

> 🤖 **Applying knowledge of `@orchestrator`** — Multi-domain synthesis across Frontend, Backend, Database, and DevOps layers.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Functional Architecture](#3-functional-architecture)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Authentication Flow](#6-authentication-flow)
7. [Data Flow — End to End](#7-data-flow--end-to-end)
8. [Background Services](#8-background-services)
9. [Frontend Component Map](#9-frontend-component-map)
10. [Local Setup Guide](#10-local-setup-guide)
11. [Docker Setup (Alternative)](#11-docker-setup-alternative)
12. [Verification Checklist](#12-verification-checklist)

---

## 1. Project Overview

**NeuronOps** is an autonomous AI cluster management and observability platform. It simulates a live GPU compute cluster (5 nodes) and applies real-time intelligence to:

| Goal | Description |
|------|-------------|
| **Thermal Prediction** | Monitors GPU temperatures and computes failure probability per node using a formula driven by real telemetry |
| **Autonomous Scheduling** | Automatically migrates LLM workloads off hot nodes to idle ones — no human required |
| **Cost Intelligence** | Detects idle GPU nodes and quantifies the dollar waste in real time |
| **Human-in-the-Loop Gate** | Escalates dangerous or ambiguous actions (e.g., temperature > 95 °C) to a human operator for approval before execution |
| **AI Copilot** | Provides a natural-language chat interface powered by a local Ollama LLM or OpenRouter, giving operational advice about the cluster |

The project is designed as a full-stack demonstration of autonomous infrastructure intelligence — deterministic decision logic at the core, with LLMs used only for human-readable root-cause analysis, not for critical path decisions.

---

## 2. Tech Stack

### Backend

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Framework | **Django** | `>=5.0, <6.1` (settings confirm Django 6.0.6 comment) |
| REST API | **Django REST Framework** | `>=3.14.0` |
| Auth | **djangorestframework-simplejwt** | `>=5.3.1` — JWT tokens (1-day access, 7-day refresh) |
| CORS | **django-cors-headers** | `>=4.3.1` |
| API Docs | **drf-spectacular** | `>=0.27.0` — OpenAPI/Swagger at `/api/docs/` |
| Database URL | **dj-database-url** | `>=2.1.0` |
| Env vars | **python-dotenv** | `>=1.0.0` |
| LLM client | **openai** `>=1.12.0` | Used for both Ollama (local) and OpenRouter (cloud) via OpenAI-compatible API |
| PostgreSQL driver | **psycopg2-binary** | `>=2.9.9` (for Docker/production) |
| Database (dev) | **SQLite** | Default; auto-selected when `DATABASE_URL` is unset |
| Database (prod) | **PostgreSQL 15** | Via Docker Compose |
| LLM (local, optional) | **Ollama** | `llama3.1:8b` default; used for RCA and Copilot |

### Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | **Next.js** | `16.2.9` (App Router, Turbopack in dev) |
| UI Library | **React** | `19.2.4` |
| Language | **TypeScript** | `^5` |
| Styling | **Tailwind CSS v4** | `^4` (PostCSS integration) |
| Icons | **lucide-react** | `^1.21.0` |
| Charts | **Recharts** | `^3.9.0` |
| Class merging | **clsx** + **tailwind-merge** | `^2.1.1` / `^3.6.0` |
| Linting | **ESLint** | `^9` with `eslint-config-next` |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Containerization | **Docker** + **Docker Compose v3.8** |
| DB container | **postgres:15-alpine** |
| Dev server ports | Frontend: `3000`, Backend: `8000`, Postgres: `5432` |

---

## 3. Functional Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (localhost:3000)                       │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Login Page │  │  Dashboard  │  │ApprovalGate  │  │  Copilot   │  │
│  │ /login     │  │  / (root)   │  │ (Gate module)│  │  Chat UI   │  │
│  └────────────┘  └─────────────┘  └──────────────┘  └────────────┘  │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTP (Bearer JWT in cookie)
                            │ API_URL = http://127.0.0.1:8000/api
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 DJANGO API SERVER (127.0.0.1:8000)                    │
│                                                                        │
│  /api/token/          JWT issue endpoint (no auth required)           │
│  /api/token/refresh/  JWT refresh                                     │
│  /api/sentinel/       Predictions + Alerts (IsClusterOperator)        │
│  /api/scheduler/      Workload Placements                             │
│  /api/costwatch/      Cost Reports                                    │
│  /api/copilot/        LLM query proxy                                 │
│  /api/gate/           Approval Requests (human gate)                  │
│  /api/docs/           Swagger UI                                      │
│  /admin/              Django Admin                                     │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ ORM queries
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite dev / PostgreSQL prod)             │
│                                                                        │
│  telemetry_gputelemetry   sentinel_prediction   sentinel_alert        │
│  scheduler_workloadplace  costwatch_costreport  gate_approvalrequest  │
└───────────────────────────▲──────────────────────────────────────────┘
                            │ Django ORM writes (every 5s)
                 ┌──────────┴───────────┐
                 │                      │
   ┌─────────────────────┐   ┌─────────────────────┐
   │  telemetry_generator│   │  processor.py        │
   │  (background script)│   │  (background script) │
   │                     │   │                      │
   │  Simulates 5 GPU    │   │  Reads latest        │
   │  nodes: Node-01,02, │   │  telemetry per node, │
   │  08, 14, 19.        │   │  computes: failure   │
   │  States: normal,    │   │  probability, alerts,│
   │  spike, idle.       │   │  cost waste, and     │
   │  Writes GpuTelemetry│   │  scheduling actions. │
   │  every 5s.          │   │  Runs every 5s.      │
   └─────────────────────┘   └──────────┬───────────┘
                                        │
                                        ▼ (optional, for RCA only)
                             ┌─────────────────────┐
                             │  Ollama / OpenRouter │
                             │  (local LLM, optional│
                             │  for human-readable  │
                             │  root-cause analysis)│
                             └─────────────────────┘
```

---

## 4. Database Schema

### `telemetry.GpuTelemetry`
Stores raw per-tick GPU metrics for each node.

| Column | Type | Notes |
|--------|------|-------|
| `id` | PK | Auto |
| `node_id` | CharField(100) | Indexed, e.g. `Node-01` |
| `gpu_id` | IntegerField | Default 0 |
| `temperature_celsius` | FloatField | Key driver for all decisions |
| `vram_usage_mb` | FloatField | |
| `vram_total_mb` | FloatField | Default 80,000 |
| `gpu_utilization_percent` | FloatField | <5% triggers idle/cost detection |
| `power_draw_watts` | FloatField | Used to compute wasted energy cost |
| `timestamp` | DateTimeField | auto_now_add, indexed with node_id |

### `sentinel.Prediction`
One prediction record per processor tick. Capped at 50 rows.

| Column | Type | Notes |
|--------|------|-------|
| `id` | PK | |
| `node_id` | CharField(100) | Node with highest failure probability |
| `failure_probability` | FloatField | Range 0.01–0.95; formula: `(temp - 40) / 60` |
| `reason` | TextField | Human-readable description |
| `predicted_at` | DateTimeField | auto_now_add, indexed |

### `sentinel.Alert`
Triggered when a node exceeds 90 °C.

| Column | Type | Notes |
|--------|------|-------|
| `id` | PK | |
| `node_id` | CharField(100) | |
| `severity` | CharField(10) | `LOW / MEDIUM / HIGH / CRITICAL` |
| `message` | TextField | |
| `created_at` | DateTimeField | auto_now_add |
| `resolved` | BooleanField | Default False; indexed with node_id |

### `scheduler.WorkloadPlacement`
Records of workload migration actions executed.

| Column | Type | Notes |
|--------|------|-------|
| `id` | PK | |
| `job_id` | CharField(100) | e.g. `LLM-CTX-1719447600` |
| `source_node` | CharField(100) | Origin node |
| `target_node` | CharField(100) | Destination node |
| `reason` | TextField | |
| `migrated_at` | DateTimeField | auto_now_add |
| `status` | CharField(20) | `PENDING / COMPLETED` |

### `costwatch.CostReport`
Records of identified idle-node cost waste.

| Column | Type | Notes |
|--------|------|-------|
| `id` | PK | |
| `node_id` | CharField(100) | |
| `idle_time_hours` | FloatField | Always 1.0 per tick detection |
| `wasted_cost_usd` | DecimalField(10,2) | `(power_draw_watts / 1000) × $0.15/kWh` |
| `reported_at` | DateTimeField | auto_now_add |

### `gate.ApprovalRequest`
Human-in-the-loop approval queue.

| Column | Type | Notes |
|--------|------|-------|
| `id` | PK | |
| `action_type` | CharField(100) | e.g. `LLM Session Live Migration` |
| `target_resource` | CharField(100) | The hot node |
| `reason` | TextField | Deterministic or LLM-generated |
| `requested_at` | DateTimeField | auto_now_add |
| `approved_by` | FK → User | Null until reviewed |
| `approved_at` | DateTimeField | Nullable |
| `status` | CharField(20) | `PENDING / APPROVED / REJECTED`; indexed |

---

## 5. API Reference

Base URL: `http://127.0.0.1:8000/api`

All endpoints (except `/token/`) require `Authorization: Bearer <jwt>` header.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/token/` | POST | Obtain JWT (username + password) |
| `/token/refresh/` | POST | Refresh access token |
| `/sentinel/predictions/` | GET | List failure predictions (latest 50) |
| `/sentinel/alerts/` | GET | List alerts |
| `/scheduler/placements/` | GET | List workload placements |
| `/costwatch/reports/` | GET | List cost reports |
| `/copilot/query/` | POST | Send a natural-language query to LLM |
| `/gate/approvals/` | GET | List PENDING approval requests |
| `/gate/approvals/<id>/` | PATCH | Approve or reject a request |
| `/schema/` | GET | OpenAPI schema (JSON) |
| `/docs/` | GET | Swagger UI |

**Standardized Response Envelope** (via `core.renderers.StandardizedJSONRenderer`):
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

**Permission Layer**: `IsClusterOperator` (defined in `core/permissions.py`) — extends `IsAuthenticated`.

---

## 6. Authentication Flow

```
1. User visits /login (Next.js client component)
2. Submits username + password via React useActionState + Server Action
3. Server Action (auth.ts) POSTs to http://127.0.0.1:8000/api/token/
4. Django returns { data: { access, refresh } }
5. Server Action extracts access token, stores as httpOnly cookie named 'jwt'
   - maxAge: 1 day
   - sameSite: 'lax'
   - secure: only in production
6. Next.js redirect('/') → Dashboard
7. All subsequent API calls from Next.js Server Components:
   - Read 'jwt' cookie from next/headers
   - Attach as Bearer token in Authorization header
8. Logout: Server Action deletes 'jwt' cookie → redirect('/login')
9. Any API 401 response → dashboard catches error → redirect to /login
```

> **Security note**: The JWT is stored in an `httpOnly` cookie, not `localStorage` — it is inaccessible to JavaScript and protected against XSS.

---

## 7. Data Flow — End to End

```
Every 5 seconds:

[telemetry_generator.py]
  → Simulates 5 nodes (Node-01, 02, 08, 14, 19)
  → State machine: normal / spike / idle
  → Writes GpuTelemetry rows to DB

[processor.py] (reads DB, same 5s cycle)
  → Reads latest GpuTelemetry per node
  → For each node:
      temp >= 90 °C  → create Alert (CRITICAL)
      util < 5%      → create CostReport (wasted cost)
  → Computes max failure_probability across cluster
  → Creates 1 Prediction row per tick (prunes to last 50)
  → Scheduler decision:
      hot node exists AND idle node exists?
        → create APPROVED WorkloadPlacement (auto-executed)
        → create APPROVED ApprovalRequest (logged, auto)
      hot node exists AND NO idle node?
        → calls analyze_cluster_state() (optionally asks Ollama for RCA)
        → creates PENDING ApprovalRequest (waits for human)

[Next.js Dashboard] (page.tsx — Server Component, no-store cache)
  → On every page load, fetches concurrently:
      /api/sentinel/predictions/ → SentinelChart (thermal prediction model)
      /api/scheduler/placements/ → Scheduler.Actions panel
      /api/costwatch/reports/    → Autonomous.Fleet (Local LLMs) panel
      /api/gate/approvals/       → ApprovalGate sidebar
  → Renders live data

[ApprovalGate component]
  → Shows PENDING requests
  → Human clicks APPROVE/REJECT
  → PATCH to /api/gate/approvals/<id>/
  → gate/views.py perform_update():
      if newly APPROVED → creates WorkloadPlacement (execution logged)
      telemetry_generator reacts to migration → forces node cooldown

[Copilot component]
  → User types query
  → POST /api/copilot/query/
  → Copilot view proxies to Ollama (or OpenRouter)
  → Returns LLM response
```

---

## 8. Background Services

Three processes must run simultaneously for the full system to operate:

| Process | Command | Purpose | Interval |
|---------|---------|---------|----------|
| **API Server** | `python manage.py runserver` | Serves REST API | Continuous |
| **Telemetry Generator** | `python telemetry_generator.py` | Simulates GPU nodes | Every 5s |
| **Processor** | `python processor.py` | Intelligence & scheduling | Every 5s |

**Telemetry Generator — Node State Machine:**

```
normal ──(3% chance)──► spike  (only 1 node at a time)
normal ──(3% × 30%)──► idle
idle   ──(3% chance)──► normal
spike  ──(6 ticks/30s)─► normal  (auto expiry)
spike  ──(migration executed)──► normal  (forced cooldown)
```

**Processor — Decision Logic (Deterministic, not LLM-driven):**

```
if temp >= 90:         → CRITICAL Alert
if util < 5%:          → CostReport (wasted $)
if hot AND idle exist: → AUTO migrate (APPROVED)
if hot AND no idle:    → Call analyze_cluster_state()
  → deterministic KILL decision
  → Ollama used ONLY for 1-sentence RCA string (optional, with 5s timeout)
  → Create PENDING ApprovalRequest → waits for human
if temp >= 95:         → Escalate even auto-approvals to PENDING
```

---

## 9. Frontend Component Map

```
src/app/
├── layout.tsx              Root layout (font, metadata)
├── page.tsx                Dashboard (Server Component — fetches all data)
├── globals.css             Tailwind CSS v4 design tokens
├── loading.tsx             Suspense loading UI
├── error.tsx               Error boundary UI
├── login/
│   └── page.tsx            Login form (Client Component)
├── actions/
│   ├── auth.ts             loginAction, logoutAction (Server Actions)
│   ├── copilot.ts          Copilot query Server Action
│   ├── gate.ts             Approval approve/reject Server Actions
│   └── sentinel.ts         (Sentinel-related Server Action)
├── services/
│   └── api.ts              fetchWithAuth, getPredictions, getPlacements,
│                           getCostReports, getPendingApprovals
└── components/ui/
    ├── Chart.tsx            SentinelChart — Recharts line chart of failure probability
    ├── SentinelChartInner.tsx  Inner chart component
    ├── NodeTopology.tsx     Live node topology grid visualization
    ├── TelemetryLog.tsx     Scrolling telemetry log
    ├── ApprovalGate.tsx     Human-in-the-loop approval panel
    └── Copilot.tsx          AI chat interface
```

**Dashboard Layout (4-column XL grid):**

| Column | Content |
|--------|---------|
| Left (1/4) | NodeTopology + TelemetryLog + Identified Waste ($ total) |
| Center (2/4) | SentinelChart (thermal prediction) + Scheduler.Actions + Autonomous.Fleet panels |
| Right (1/4) | ApprovalGate + CopilotChat |

---

## 10. Local Setup Guide

### Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Python | 3.10+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 8+ | `npm --version` |
| Git | Any | `git --version` |
| Ollama (optional) | Any | `ollama --version` |

---

### Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd ai-cluster
```

---

### Step 2 — Backend Setup

#### 2a. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Generate a secure secret key and add it to `.env`:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Edit `backend/.env`:
```env
SECRET_KEY=<paste-generated-key-here>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Leave DATABASE_URL commented for SQLite (default, easiest for local dev)
# DATABASE_URL=postgres://neuronops:password@localhost:5432/neuronops_db

# Optional: configure Ollama for local LLM support
# OLLAMA_BASE_URL=http://localhost:11434/v1
# LLM_MODEL=llama3.1:8b
```

#### 2b. Create Virtual Environment and Install Dependencies

```bash
# Linux (zsh/bash)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

```powershell
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### 2c. Run Database Migrations

```bash
python manage.py migrate
```

#### 2d. Seed the Database

```bash
python seed_data.py
```

> This creates the default admin user:
> - **Username:** `admin`
> - **Password:** `password123`

#### 2e. Start the Three Backend Processes

> [!IMPORTANT]
> All three must run simultaneously. Open **three terminal tabs**, each with `venv` activated.

**Tab 1 — API Server:**
```bash
python manage.py runserver
# → http://127.0.0.1:8000
```

**Tab 2 — Telemetry Generator:**
```bash
python telemetry_generator.py
# Outputs: "Tick | Nodes: Node-01=NOR 52C, ..."
```

**Tab 3 — Processor:**
```bash
python processor.py
# Outputs: "Starting NeuronOps Deterministic Processor..."
```

**Single-terminal alternative (Linux):**
```bash
python manage.py runserver & python telemetry_generator.py & python processor.py &
# Stop all: kill %1 %2 %3
```

---

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

### Step 4 — Access the Application

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Next.js Dashboard |
| `http://localhost:3000/login` | Login page |
| `http://127.0.0.1:8000/api/docs/` | Swagger API Documentation |
| `http://127.0.0.1:8000/admin/` | Django Admin Panel |

Login with `admin` / `password123`.

---

## 11. Docker Setup (Alternative)

Runs the full stack (PostgreSQL + Django + Processor + Telemetry + Next.js):

```bash
# From project root
docker-compose up --build
```

**Services started:**

| Service | Port | Description |
|---------|------|-------------|
| `db` | 5432 | PostgreSQL 15 |
| `backend` | 8000 | Django API |
| `processor` | — | Background processor |
| `telemetry` | — | Telemetry generator |
| `frontend` | 3000 | Next.js frontend |

> [!NOTE]
> In Docker mode, the frontend connects to the backend at `http://backend:8000/api` (internal Docker network). For local dev, it uses `http://127.0.0.1:8000/api`.

---

## 12. Verification Checklist

After starting all services, verify each component:

- [ ] **Backend API** → `curl http://127.0.0.1:8000/api/docs/` returns 200
- [ ] **JWT Auth** → `POST http://127.0.0.1:8000/api/token/` with `{"username":"admin","password":"password123"}` returns an access token
- [ ] **Telemetry** → `telemetry_generator.py` terminal shows "Tick | Nodes: ..." every 5s
- [ ] **Processor** → `processor.py` terminal shows predictions and scheduling decisions every 5s
- [ ] **Frontend** → `http://localhost:3000` redirects to `/login`, login succeeds, dashboard loads with live charts
- [ ] **Copilot** → Copilot chat sends a query; if Ollama is offline, it returns `LLM_UNAVAILABLE` (expected)
- [ ] **ApprovalGate** → Dashboard shows any PENDING requests; approving triggers a WorkloadPlacement

---

## Summary of Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Deterministic scheduling core** | LLMs are not reliable enough for critical infra decisions; the scheduler uses pure heuristics |
| **Ollama used for RCA only** | LLMs add value for human-readable explanations, not for logic |
| **httpOnly cookie auth** | Prevents XSS token theft vs. localStorage |
| **Next.js Server Components for data fetching** | SSR with `cache: 'no-store'` ensures the dashboard always shows live data |
| **SQLite as default DB** | Zero-config local dev; Docker Compose upgrades to Postgres for production-like testing |
| **50-row prediction cap** | Prevents unbounded DB growth in a long-running demo environment |
| **Single-spike constraint** | Only 1 node spikes at a time in telemetry for clean chart visualizations |
