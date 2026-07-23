# ⚙️ Workload Engine & Resource Calculation

## 1. Overview

The **Workload Engine** ([backend/simulator/workload_engine.py](file:///d:/Ai-Cluster/backend/simulator/workload_engine.py)) is a deterministic resource calculation module that converts high-level AI computing requests into precise physical node allocations.

---

## 2. Resource Demand Formula

When a user submits a workload through the Workstation, required nodes are computed using the following mathematical specification:

$$\text{Nodes}_{\text{required}} = \max\left(1, \left\lfloor \left[ \text{BaseNodes} \times (1.0 + 0.1 \times \text{Depth}) \times \text{Complexity} + \text{TaskAdjustment} \right] \times \text{Concurrency} \right\rfloor \right)$$

### Parameter Definitions:
1. **$\text{BaseNodes}$**: Base node baseline defined per task type.
2. **$\text{Depth}$**: Thinking depth factor ($1 \le \text{Depth} \le 5$). Adds $10\%$ per depth level.
3. **$\text{Complexity}$**: Floating point multiplier ($1.0 \le \text{Complexity} \le 5.0$).
4. **$\text{TaskAdjustment}$**:
   * For `ocr_data_retrieval`: If $\text{FileInputSize} > 1.0\text{ GB}$, add $\text{FileInputSize} \times 1.5$ nodes.
   * For `batch_vision`: If $\text{ImageCount} > 1$, add $(\text{ImageCount} - 1) \times 4$ nodes.
5. **$\text{Concurrency}$**: Scale factor based on active users: $\max\left(1.0, \frac{\text{UserCount}}{50.0}\right)$.

---

## 3. Python Implementation Breakdown

```python
# From backend/simulator/workload_engine.py (lines 142-173)
def calculate_required_nodes(
    task_type: str,
    user_count: int = 1,
    file_input_size_gb: float = 1.0,
    image_count: int = 0,
    thinking_depth: int = 1,
    complexity_factor: float = 1.0,
) -> int:
    if task_type not in TASK_SPECS:
        return 8

    spec = TASK_SPECS[task_type]
    base = spec["base_nodes"]

    depth_multiplier = 1.0 + (thinking_depth * 0.1)
    complexity_multiplier = complexity_factor

    nodes = base * depth_multiplier * complexity_multiplier

    if task_type == "ocr_data_retrieval" and file_input_size_gb > 1.0:
        nodes += (file_input_size_gb * 1.5)
    elif task_type == "batch_vision" and image_count > 1:
        nodes += ((image_count - 1) * 4)

    concurrency_multiplier = max(1.0, user_count / 50.0)
    nodes = nodes * concurrency_multiplier

    return max(1, int(nodes))
```

---

## 4. Efficiency Score & Verdict Calculation

Once required nodes are computed, the engine compares requested nodes against required nodes to derive an efficiency percentage and verdict label:

$$\text{Efficiency}_{\%} = \min\left(100.0, \frac{\text{RequiredNodes}}{\max(1, \text{ActualAllocatedNodes})} \times 100\right)$$

### Allocation Verdict Categories

| Requested vs Required | Auto-Scaling Action | Output Verdict Label |
|:---|:---|:---|
| $\text{Allocated} < \text{Required}$ | Auto-scale up to $\text{Required}$ | `OPTIMAL (AUTO-SCALED UP)` |
| $\text{Allocated} > \text{Required}$ | Auto-release excess nodes to $\text{Required}$ | `OPTIMAL (AUTO-RELEASED SURPLUS)` |
| $\text{Allocated} = \text{Required}$ | Direct match | `OPTIMAL` |
| Low load on high tier | Auto-fallback to lower tier | `OPTIMAL (IDLE FALLBACK)` |
| Target tier saturated | Auto-route to next available tier | `OPTIMAL (AUTONOMOUS ROUTING)` |
| All tiers busy | Auto-distribute across shared tier | `OPTIMAL (AUTONOMOUS LOAD SHARING)` |
