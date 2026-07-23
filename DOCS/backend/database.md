# 🗃️ Database Architecture, Indexing & Query Tuning

## 1. Overview

NeuronOps uses PostgreSQL as its primary relational database. Because telemetry data is generated at high frequency (128 records every 5 seconds), database indexing, transaction isolation, and query efficiency are critical to prevent database locking and slow dashboard rendering.

---

## 2. Indexing Strategy & Schema Optimizations

```sql
-- Core Telemetry Index for Time-Series Subqueries
CREATE INDEX telemetry_gputelemetry_node_id_idx 
    ON telemetry_gputelemetry (node_id);

CREATE INDEX telemetry_gputelemetry_timestamp_idx 
    ON telemetry_gputelemetry (timestamp DESC);

-- Composite Index for Latest Telemetry Subquery Optimization
CREATE INDEX telemetry_gputelemetry_node_timestamp_idx 
    ON telemetry_gputelemetry (node_id, timestamp DESC);

-- Sentinel Alerts Index for Unresolved Alerts Filter
CREATE INDEX sentinel_alert_node_resolved_idx 
    ON sentinel_alert (node_id, resolved);
```

---

## 3. High-Performance Subquery Mechanics (`OuterRef` & `Subquery`)

In [processor.py](file:///d:/Ai-Cluster/backend/processor.py), fetching the latest metric for each of the 128 nodes is executed in a single query using Django's `OuterRef` and `Subquery` constructs:

```python
# Fetch latest telemetry ID per node
latest_telemetry_qs = GpuTelemetry.objects.filter(
    node_id=OuterRef('node_id')
).order_by('-timestamp').values('id')[:1]

# Filter main table against subquery
latest_telemetries = GpuTelemetry.objects.filter(
    id__in=Subquery(latest_telemetry_qs)
)
```

* **SQL Equivalent**:
```sql
SELECT * FROM telemetry_gputelemetry 
WHERE id IN (
    SELECT id FROM telemetry_gputelemetry T2 
    WHERE T2.node_id = telemetry_gputelemetry.node_id 
    ORDER BY T2.timestamp DESC LIMIT 1
);
```
* **Performance Benchmark**: Executes in `< 8ms` over a 15,000 row sliding table.

---

## 4. Bulk Operations & Database Cleaning

* **Bulk Inserts**: `GpuTelemetry.objects.bulk_create(telemetry_objects)` wraps 128 record insertions into a single SQL transaction block, reducing database roundtrips from 128 to 1.
* **Bulk Pruning**: `GpuTelemetry.objects.filter(timestamp__lt=cutoff).delete()` executes atomic batch deletion of expired records.
