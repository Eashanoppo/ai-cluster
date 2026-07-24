# Recommendation Engine

NeuronOps is not just a reactive system; it is highly proactive. The AI Control Plane continually evaluates cluster state to propose operational changes to the human operator, saving power and maximizing throughput.

## Core Recommendation Types

The engine (`backend/processor.py`) evaluates three main optimization vectors:

### 1. Live Migration
If a specific hardware node is running unusually hot (but hasn't breached the termination threshold), the `MigrationEngine` will find a cold, idle node in the same Tier and recommend a **Live Migration**.
- **Action**: Triggers a background transfer, moving the simulated `Pod` to the new node without dropping the workload.

### 2. Workload Consolidation
If the cluster has multiple nodes operating at very low utilization (e.g., `<30%`), the `ConsolidationEngine` calculates the power waste of keeping multiple motherboards active for minimal GPU usage.
- **Action**: Recommends merging fragmented workloads onto a single node, freeing up the others to be powered down or placed into a deep sleep state.

### 3. Capacity Shedding
During an extreme "Viral Event" traffic scenario where the entire cluster utilization exceeds `95%`, the `CapacityEngine` intervenes to protect mission-critical workloads (like realtime inference).
- **Action**: Recommends instantly terminating all "Batch" workloads (e.g. video rendering) to free up VRAM for priority tasks.

## Approval Flow
These recommendations are written to the `ApprovalRequest` table in the database and surfaced to the UI. The operator can `Approve` or `Reject` them, feeding data back into the `LearningEngine` loop.
