# ☸️ Production Kubernetes Manifests & Deployment

## 1. Overview

This document provides production-ready Kubernetes manifests for deploying **NeuronOps** on managed Kubernetes services (EKS, GKE, AKS, or bare-metal K8s clusters).

---

## 2. Namespace & Secret Manifest (`00-namespace-secrets.yaml`)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: neuronops-system
---
apiVersion: v1
kind: Secret
metadata:
  name: neuronops-secrets
  namespace: neuronops-system
type: Opaque
stringData:
  POSTGRES_USER: "neuronops"
  POSTGRES_PASSWORD: "ProductionSecurePassword123!"
  POSTGRES_DB: "neuronops_db"
  SECRET_KEY: "django-insecure-prod-key-replacement-string"
```

---

## 3. Database StatefulSet Manifest (`01-postgres.yaml`)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: neuronops-system
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          envFrom:
            - secretRef:
                name: neuronops-secrets
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: pgdata
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: pgdata
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: db
  namespace: neuronops-system
spec:
  ports:
    - port: 5432
  selector:
    app: postgres
```

---

## 4. Backend Deployment Manifest (`02-backend.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neuronops-backend
  namespace: neuronops-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: neuronops/backend:latest
          env:
            - name: DATABASE_URL
              value: "postgres://neuronops:ProductionSecurePassword123!@db:5432/neuronops_db"
          ports:
            - containerPort: 8000
          readinessProbe:
            httpGet:
              path: /api/telemetry/latest/
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: neuronops-system
spec:
  ports:
    - port: 8000
  selector:
    app: backend
```

---

## 5. Singleton Workers Manifest (`03-workers.yaml`)

> [!IMPORTANT]
> Processor and Telemetry worker pods must be run as **single-replica singletons** (`replicas: 1`) to prevent duplicate metric generation and race conditions.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neuronops-processor
  namespace: neuronops-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: processor
  template:
    metadata:
      labels:
        app: processor
    spec:
      containers:
        - name: processor
          image: neuronops/backend:latest
          command: ["python", "processor.py"]
          env:
            - name: DATABASE_URL
              value: "postgres://neuronops:ProductionSecurePassword123!@db:5432/neuronops_db"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neuronops-telemetry
  namespace: neuronops-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: telemetry
  template:
    metadata:
      labels:
        app: telemetry
    spec:
      containers:
        - name: telemetry
          image: neuronops/backend:latest
          command: ["python", "telemetry_generator.py"]
          env:
            - name: DATABASE_URL
              value: "postgres://neuronops:ProductionSecurePassword123!@db:5432/neuronops_db"
```
