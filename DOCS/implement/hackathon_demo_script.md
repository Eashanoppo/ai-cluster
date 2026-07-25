# NeuronOps: Hackathon Demo Script (Phase 21)

This script is designed for the final presentation of the NeuronOps AI Cloud Operating System to the judges. It walks through the core problem, the solution, and a live demonstration of the platform's autonomous capabilities.

## Pre-requisites (Environment Setup)
1. Terminal 1 (Frontend): `cd d:\Ai-Cluster\frontend && npm run dev`
2. Terminal 2 (Backend API): `cd d:\Ai-Cluster\backend && ..\venv\Scripts\activate && python manage.py runserver`
3. Terminal 3 (Telemetry Mock): `cd d:\Ai-Cluster\backend && ..\venv\Scripts\activate && python telemetry_generator.py`
4. Terminal 4 (AI Brain): `cd d:\Ai-Cluster\backend && ..\venv\Scripts\activate && python processor.py`

---

## 1. The Hook (1 minute)
> "Good afternoon judges. The AI industry is facing a trillion-dollar bottleneck: compute infrastructure. Today, DevOps teams manually babysit clusters of $40,000 GPUs using static dashboards like Grafana, reacting to thermal crashes *after* they happen. We built **NeuronOps**, an autonomous AI Operating System that bridges the gap between observability and execution."

## 2. The Solution (1 minute)
> "NeuronOps doesn't just show you what's wrong—it fixes it. Using Scikit-Learn Isolation Forests and LLM logic, it ingests live hardware telemetry, predicts thermal failures, and migrates tasks automatically. Let's look at the live platform."

## 3. The Live Demo (2 minutes)
*Action: Open the browser to `localhost:3000` showing the main dashboard.*
> "Here is our Global Dashboard. Notice the **Digital Twin Projection** widget in the center. It uses live telemetry to forecast what the cluster will look like in 10 minutes."
*Action: Point to the Cluster Topology Heatmap.*
> "You can see our simulated 128-node cluster. Most are green (optimal), but our ML engine detects anomalies."
*Action: Open the Simulator page at `localhost:3000/simulator`.*
> "Let's inject a scenario. We will simulate a **Thermal Anomaly** on one of our Blackwell nodes using our built-in simulator."
*Action: Hit 'Launch Simulation Run' with GPU Failure selected. Wait for the `processor.py` terminal to log the action, or view the AI Action Log on the Dashboard.*
> "Look at the AI Action Log. Our Isolation Forest detected the thermal spike, scored the nodes, and seamlessly migrated the workload to a cooler node—zero human intervention required."

## 4. Cost Optimization & Auto-scaling (1 minute)
> "But it's not just about fault tolerance; it's about cost. If you look at our Action Log, you'll see a recent event: 'COST OPTIMIZATION: Put 14 idle nodes to sleep'. The system automatically scales down idle nodes to save thousands of dollars a month, and instantly wakes them up when the Workload backlog increases."

## 5. Under the Hood (Infrastructure) (1 minute)
> "Underneath this Next.js and Django layer, we have completely documented the Kubernetes (K8s), Ray distributed computing, and NVIDIA DCGM configurations required to deploy this in a real datacenter. You can view these production-ready YAML configs in our `infrastructure/` directory."

## 6. The Conclusion
> "NeuronOps is the future of infrastructure management. It maximizes GPU lifespan, slashes power consumption, and eliminates 3AM paging for DevOps engineers. Thank you."
