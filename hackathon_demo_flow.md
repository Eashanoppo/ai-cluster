# Hackathon Demo Script: AI Cloud Operating System

This script provides a step-by-step walkthrough to demonstrate the full capabilities of the NeuronOps AI Cloud Operating System.

## Pre-requisites
1. Run `python manage.py runserver` (Backend)
2. Run `npm run dev` (Frontend)
3. Run `python processor.py` (AI Engine)
4. (Optional) Run `kubectl get pods` in the background to show the `infrastructure/` files are ready.

---

## Step 1: The Simulator (Phase 2 & 9)
1. Navigate to the **Simulator** page via the Sidebar.
2. Under **Company Wizard**, select "AI Startup" with a $5,000 budget and "Global" region.
3. Under **Workload Builder**, queue up **Image Generation** and **Batch OCR** workloads to simulate heavy GPU load.
4. Explain to the judges: *"Instead of waiting for physical hardware to heat up, we are using a Digital Twin simulator to instantly mimic traffic spikes and hardware behavior."*

## Step 2: Live Heatmap & Telemetry (Phase 6 & 11)
1. Navigate to the **Dashboard** page.
2. Show the **Cluster Topology** and **GPU Heatmap**.
3. Point out that nodes are dynamically changing colors from Green to Yellow as the simulated workloads are processed.
4. Explain: *"The backend is generating telemetry as if we had NVIDIA DCGM running. Our Machine Learning engine (Isolation Forest) is actively scoring these telemetry feeds for anomalies."*

## Step 3: Injecting a Failure (Phase 11 & 12)
1. Go back to the **Simulator** page.
2. Under **Disaster Scenario Injector**, click **"Inject GPU Thermal Failure (>90°C)"** and execute.
3. Rapidly switch back to the **Dashboard**.
4. Watch the **AI Decision Center** widget.
5. Explain: *"Look at the decision logs. The Isolation Forest detected a multi-dimensional anomaly (Temp vs VRAM). Instead of crashing, the AI autonomously captured a checkpoint, cordoned the node, and executed a Live Migration to a healthy node without human intervention."*

## Step 4: Digital Twin & Capacity Shedding (Phase 9 & 14)
1. Go back to the **Simulator**.
2. Inject **"Simulate Capacity Exhaustion"**.
3. On the **Dashboard**, point to the **Digital Twin Projection** widget which will flash a warning about 15-minute queue collapse.
4. Watch the **AI Decision Center** log an autonomous **CAPACITY SHEDDING** event.
5. Explain: *"The Digital Twin forecasted a catastrophic collapse. The AI proactively terminated low-priority batch workloads to preserve core cluster integrity."*

## Step 5: Cost Optimization & Learning (Phase 13 & 15)
1. Stop injecting workloads. Wait 30 seconds.
2. Watch the logs for **NODE SUSPEND**.
3. Explain: *"As the cluster cools down, the processor identifies nodes with <5% utilization. It puts them to sleep to save power costs. Furthermore, every decision made today was logged into the Experience Feedback Loop, allowing the system to refine its Isolation Forest thresholds offline for tomorrow."*

## Conclusion
* "What we've shown is not just a dashboard—it's an autonomous, self-healing operating system for AI infrastructure."*
