# Kubernetes Simulation Architecture

While NeuronOps is deployed using Docker Compose for simplicity, it structurally simulates a Kubernetes cluster to test the AI Control Plane's orchestration logic.

## `KubernetesSim` Module

Located at `backend/cluster_infra/kubernetes_sim.py`, this module exposes a mocked Kubernetes API.

### `PodSpec`
When the `SchedulerEngine` assigns a workload, it generates a `PodSpec` object. This closely mirrors a real K8s manifest:
```python
PodSpec(
    workload_id="workload-1234",
    image="aios-workload",
    resources={"gpu": 4},
    affinity={"node_target": "node-42"},
    tolerations=["maintenance"]
)
```

### Orchestration Behaviors

1. **Node Affinity**: The Control Plane explicitly sets `node_target` in the `PodSpec` to map the workload to the mathematically calculated hardware Tier.
2. **Live Migration (Eviction)**: When the `MigrationEngine` intervenes on an overheating node, it invokes the Kubernetes simulator to "Evict" the pod and recreate the identical `PodSpec` with a new `node_target`.
3. **Cordoning**: If the ML Anomaly Detection engine predicts imminent failure, the simulated node is marked as `Cordoned`, rejecting any new `PodSpec` assignments until the temperature drops.
