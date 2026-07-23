# ⚡ GPU Cluster Architecture & Grid Topology

## 1. Cluster Abstraction Overview

The **NeuronOps** GPU cluster simulates a high-density, multi-tenant AI datacenter environment consisting of **128 compute nodes** organized into a strict 16x8 matrix grid map. The cluster is partitioned into **4 Hardware Quadrants** representing distinct technological generations of GPU architecture.

---

## 2. 128-Node Grid Layout & Quadrant Partitioning

```
+-----------------------------------------------------------------------------------+
|                            NEURONOPS 128-NODE GRID MAP                            |
+---------------------------------+-------------------------------------------------+
| TIER 1: RTX 3090 (Nodes 001-032)| TIER 2: RTX 4090 (Nodes 033-064)                |
| Nodes 001 - 016 (Row 1)         | Nodes 033 - 048 (Row 3)                         |
| Nodes 017 - 032 (Row 2)         | Nodes 049 - 064 (Row 4)                         |
+---------------------------------+-------------------------------------------------+
| TIER 3: RTX 5090 (Nodes 065-096)| TIER 4: Blackwell B200 (Nodes 097-128)          |
| Nodes 065 - 080 (Row 5)         | Nodes 097 - 112 (Row 7)                         |
| Nodes 081 - 096 (Row 6)         | Nodes 113 - 128 (Row 8)                         |
+---------------------------------+-------------------------------------------------+
```

---

## 3. Hardware Specification Matrix by Tier

The hardware profiles are hardcoded in the workload engine ([backend/simulator/workload_engine.py](file:///d:/Ai-Cluster/backend/simulator/workload_engine.py)) and telemetry generator ([backend/telemetry_generator.py](file:///d:/Ai-Cluster/backend/telemetry_generator.py)):

| Attribute | Tier 1 (Nodes 1-32) | Tier 2 (Nodes 33-64) | Tier 3 (Nodes 65-96) | Tier 4 (Nodes 97-128) |
|:---|:---|:---|:---|:---|
| **GPU Architecture** | NVIDIA RTX 3090 | NVIDIA RTX 4090 | NVIDIA RTX 5090 | Blackwell B200 |
| **System RAM** | 16 GB DDR5 | 32 GB DDR5 | 64 GB DDR5 | 128 GB LPDDR5 |
| **VRAM Capacity** | 24,576 MB (24GB GDDR6X) | 24,576 MB (24GB GDDR6X) | 32,768 MB (32GB GDDR7) | 196,608 MB (192GB HBM3) |
| **Base Power Draw** | 330W – 350W | 420W – 450W | 560W – 600W | 660W – 700W |
| **Target Temperature** | 63.0°C – 67.0°C | 58.0°C – 62.0°C | 56.0°C – 60.0°C | 53.0°C – 57.0°C |
| **Active Utilization** | 75% – 90% | 80% – 95% | 85% – 98% | 90% – 100% |
| **Color Identifiers** | `#a3be8c` (Green) | `#ebcb8b` (Yellow) | `#d08770` (Orange) | `#bf616a` (Red) |

---

## 4. Node Indexing & Naming Rules

* **String Format**: `Node-001`, `Node-002`, ..., `Node-128`.
* **Zero-Padding**: All node IDs are padded to 3 digits using string formatting `Node-{i:03d}`.
* **Tier Mapping Formula**:
  $$\text{Tier}(i) = \lfloor \frac{i - 1}{32} \rfloor + 1 \quad \text{where } i \in [1, 128]$$

---

## 5. Network Abstraction & Cluster Fabric

Though simulated, the digital twin models high-bandwidth interconnects:
* **Tier 1 & Tier 2**: 100 Gbps PCIe Gen4 NVLink fabric.
* **Tier 3**: 400 Gbps PCIe Gen5 NVLink fabric.
* **Tier 4**: 800 Gbps Quantum-2 InfiniBand + NVLink 5.0 (used for distributed LLM tensor parallelism).
