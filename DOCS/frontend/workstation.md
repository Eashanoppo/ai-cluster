# 💻 Workstation Interface & Simulation Controls

## 1. Overview

The **Workstation** ([frontend/src/app/(workstation)/workstation/page.tsx](file:///d:/Ai-Cluster/frontend/src/app/(workstation)/workstation/page.tsx)) is the interactive control plane for NeuronOps. It enables operators to submit AI tasks, configure workload complexity, test auto-scaling rules, and inspect AI-generated recommendations.

---

## 2. Workstation Interface Layout

```
+-----------------------------------------------------------------------------------+
|                            NEURONOPS WORKSTATION PLANE                            |
+---------------------------------+-------------------------------------------------+
| SECTION 1: Task Configuration   | SECTION 2: Allocation & Hardware Preview        |
| Task Selector (Dropdown)        | Requested Tier Selection (Tiers 1 - 4)          |
| Concurrent Users (Slider: 1-500)| Requested Nodes Slider (1 - 32)                 |
| File Input Size (GB: 0.1 - 50)  | Thinking Depth (Slider: 1 - 5)                  |
| Complexity Factor (1.0 - 5.0)   | Prompt Text Input Area                          |
+---------------------------------+-------------------------------------------------+
| BUTTON: "RUN WORKLOAD SIMULATION" (POST /api/simulator/runs/)                    |
+-----------------------------------------------------------------------------------+
| SECTION 3: Live Simulation Report Output                                          |
| Allocation Verdict: OPTIMAL (AUTO-SCALED UP) | Efficiency Score: 100%             |
| Bottleneck Analysis & AI Talking Points                                          |
+-----------------------------------------------------------------------------------+
```

---

## 3. Form Parameters & API Payload Mapping

When an operator submits a simulation run, the form state maps directly to backend model fields:

```typescript
const payload = {
  task_type: selectedTask,         // e.g. "large_ml_project"
  user_count: userCount,           // e.g. 50
  file_input_size_gb: fileSize,    // e.g. 10.0
  image_count: imageCount,         // e.g. 0
  thinking_depth: thinkingDepth,   // e.g. 3
  complexity_factor: complexity,   // e.g. 2.5
  allocated_nodes: requestedNodes, // e.g. 32
  prompt: promptText               // e.g. "Fine-tune 70B parameter model"
};
```
