# NeuronOps AI Cluster Management SaaS - Full Technical Documentation

## 1. Project Overview
NeuronOps is a Next-Generation AI Cluster Management SaaS designed to simulate, monitor, and autonomously orchestrate large-scale GPU datacenters. It acts as an intelligent virtual sysadmin that bridges the gap between observability and autonomous DevOps execution.

The core infrastructure simulates a **128-node GPU cluster** divided into four distinct 32-node hardware tiers:
- **Tier 1:** RTX 3090 Build (Optimized for light tasks, chat inference)
- **Tier 2:** RTX 4090 Build (Optimized for mid-range generation)
- **Tier 3:** RTX 5090 Build (Optimized for advanced compute)
- **Tier 4:** Blackwell B200 (Exclusive to massive parallel processing and video generation)

## 2. System Architecture & Tech Stack

### 2.1 Frontend (Client-Side)
- **Framework:** Next.js (React) built with TypeScript.
- **Styling:** Tailwind CSS (Custom 'Nord' color palette integration).
- **Icons & Charts:** Lucide-React for iconography, Recharts for dynamic telemetry visualizations.
- **State Management:** React Hooks (`useState`, `useEffect`, `useRef`) managing real-time polling and WebSocket-like state synchronization.

### 2.2 Backend (Server-Side)
- **Framework:** Django & Django REST Framework (DRF) running on Python.
- **Database:** SQLite (default for prototyping) / PostgreSQL (production scalable).
- **Authentication:** JSON Web Tokens (JWT) via `djangorestframework-simplejwt`.
- **Background Processes:** Independent Python worker scripts (`processor.py`, `telemetry_generator.py`) managing continuous state.

### 2.3 Artificial Intelligence (LLM Integration)
- **APIs:** Cloud integration via OpenRouter (LLaMA 3.1, Claude, etc.) and Local offline execution via Ollama API.
- **Usage:** Used for the conversational "Copilot" assistant and the Background Processor's deterministic "Autonomous Decision Engine" for load shedding.

---

## 3. Core Capabilities & Autonomous Features

### 3.1 Intelligent Hardware Routing
When a task is submitted via the Workstation, the `workload_engine.py` evaluates the task's compute profile (base nodes required, user concurrency, input size, thinking depth). 
- **Light tasks** (e.g., standard OCR or basic chat) are routed exclusively to Tier 1 (RTX 3090).
- **Heavy tasks** (e.g., Video Generation) are routed to Tier 4 (Blackwell).
The SaaS chooses these assignments autonomously to prevent Blackwell compute waste.

### 3.2 Elastic Workload Scaling
- **Auto-Scaling Up:** If a task requires 1180 nodes (massive user spike), the system autonomously load-shares the requested nodes across the maximum physical capacity of the tier without rejecting the task.
- **Auto-Scaling Down:** If user concurrency drops drastically, the system dynamically identifies surplus idle GPUs and auto-releases them to conserve datacenter power usage.

### 3.3 Fault-Tolerant Live Migration
Monitored by the Sentinel engine, if a specific GPU node reaches extreme thermal thresholds (e.g., >95°C) mid-execution, the `processor.py` autonomously orchestrates a **Live Migration**. The workload is shifted seamlessly to a healthy, idle node, preventing hardware damage and ensuring zero-downtime execution.

### 3.4 AI-Driven Load Threshold Responses
The background processor continuously evaluates global cluster load:
- **>80% Load (AI Autonomous Termination):** The system securely pings the LLM engine to evaluate the current processes. The AI decides which non-essential tasks (e.g., image generation) to temporarily hold or terminate to stabilize the cluster.
- **>90% Load (Human Escalation Alert):** The system logs a critical `EMERGENCY LOAD SHEDDING` event and escalates a warning to the human monitoring layer (Execution Gate) to maintain oversight.

---

## 4. Backend Engine Specifications

### 4.1 `simulator/workload_engine.py`
The brain of the resource allocator.
- Calculates node requirements using a multiplier system: `base_nodes * (1.0 + thinking_depth) * concurrency_multiplier`.
- Explores `active_tiers` (tracking recent simulations via a 120-second rolling window).
- Enforces autonomous overrides, completely bypassing legacy human intervention roadblocks to ensure continuous pipeline execution.

### 4.2 `processor.py`
The continuous background daemon that acts as the "sysadmin".
- Loops indefinitely to parse the latest hardware telemetry.
- Evaluates `cluster_load_pct`.
- Auto-generates `ApprovalRequest` logs with `status="APPROVED"` for its own autonomous decisions, serving as a transparent audit trail.
- Interacts with the `Ollama/OpenRouter` API to get 1-word deterministic termination answers during 80%+ load spikes.

### 4.3 `telemetry_generator.py`
The simulation data provider.
- Reads active runs from the database.
- Uses controlled randomized drift variables to generate live statistics (Temperature °C, VRAM GB, Power W, Utilization %) for all 128 nodes based on their exact physical capabilities.
- Automatically dims or "turns off" nodes when no workloads are actively assigned to their specific Tier.

### 4.4 `copilot/views.py`
Provides conversational endpoints for the frontend assistant.
- Injects a strict system prompt instructing the LLM to behave as a Cluster Sysadmin.
- Securely parses frontend user messages and returns Markdown-formatted operational advice or heuristic data.

---

## 5. Database Schema (Key Models)

### `simulator.SimulationRun`
Stores all workstation tasks.
- `task_type`: e.g., 'batch_vision', 'code_edit'.
- `prompt`: The user's specific request.
- `selected_tier`: The GPU hardware tier assigned.
- `allocated_nodes_actual`: How many physical nodes the engine successfully spun up.
- `status`: 'processing', 'completed', 'failed', or 'pending' (legacy).

### `telemetry.GpuTelemetry`
High-frequency timeseries data.
- `node_id`: String identifier (001 to 128).
- `temperature`, `utilization`, `vram_usage`, `power_draw`.

### `gate.ApprovalRequest`
The audit log for all system actions.
- `action_type`: 'MIGRATE', 'KILL NON-ESSENTIAL WORKLOADS', 'EMERGENCY LOAD SHEDDING'.
- `status`: 'PENDING', 'APPROVED', 'REJECTED'.

### `sentinel.Alert` & `sentinel.Prediction`
Predictive maintenance tracking.
- Logs nodes with highest failure probabilities based on sustained thermal/utilization stress.

---

## 6. Setup & Configuration

### Prerequisites
- Python 3.10+
- Node.js 18+
- Optional: Local Ollama runtime for offline AI decision capabilities.

### Environment Variables (`backend/.env`)
```ini
SECRET_KEY=django-insecure-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
# Database
# DATABASE_URL=postgres://user:pass@localhost:5432/neuronops_db
# LLM Integration
OLLAMA_BASE_URL=http://localhost:11434/v1
OPENROUTER_API_KEY=sk-or-v1-...
LLM_MODEL=llama3.1:8b
```

### Execution Protocol
For full system initialization, four concurrent terminal processes must be running:
1. `npm run dev` (Frontend UI)
2. `python manage.py runserver` (Django API HTTP Server)
3. `python telemetry_generator.py` (Continuous hardware metric stream)
4. `python processor.py` (Autonomous sysadmin evaluation loop)
