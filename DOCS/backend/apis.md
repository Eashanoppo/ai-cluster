# REST APIs

The backend exposes several endpoints to power the Next.js Workstation UI and manage the simulation lifecycle.

## Endpoints (`backend/simulator/urls.py` & `views.py`)

### 1. `GET /api/simulator/runs/`
- **Purpose**: Fetches the 50 most recent `SimulationRun` objects, ordered chronologically (`order_by('-id')`).
- **Used By**: The Workstation Kanban board, polling every 2 seconds to animate jobs moving from Queued to Processing to Completed.

### 2. `POST /api/simulator/scenario_control/`
- **Purpose**: Controls the background `TrafficGenerator` daemon.
- **Payload**:
  ```json
  {
    "action": "start",
    "scenario_id": "viral_event",
    "duration_mins": 5,
    "acceleration": 2,
    "allowed_tasks": ["video_generation", "llm_inference"]
  }
  ```
- **Used By**: The Simulator Console UI when an operator begins an injection event.

### 3. `POST /api/simulator/inject_failure/`
- **Purpose**: Deliberately injects chaos into the system (e.g. `gpu_burn`, `node_failure`, `cooling_failure`).
- **Behavior**: Writes the disaster state to a local `disaster_state.json` file which is immediately picked up by the `telemetry_generator.py` script to skew the hardware metrics.

### 4. `GET /api/simulator/companies/`
- **Purpose**: Fetches all available `CompanyProfile` tenants.
- **Used By**: The Workstation setup wizard to select a traffic profile.
