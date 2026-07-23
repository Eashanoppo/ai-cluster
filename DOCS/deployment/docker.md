# 🐳 Docker Setup & Multi-Container Guide

## 1. Overview

NeuronOps is packaged for multi-container orchestration using Docker and Docker Compose. This document provides Dockerfile specifications, image layer optimization, container networking, and local deployment workflows.

---

## 2. Dockerfile Specifications

### A. Backend Container ([backend/Dockerfile](file:///d:/Ai-Cluster/backend/Dockerfile))
```dockerfile
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

EXPOSE 8000

CMD ["gunicorn", "neuronops.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### B. Frontend Container ([frontend/Dockerfile](file:///d:/Ai-Cluster/frontend/Dockerfile))
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 3. Docker Compose Orchestration Guide

To bring up the complete NeuronOps stack:

```bash
# 1. Build and launch all 5 containers in background
docker-compose up -d --build

# 2. View streaming logs from all services
docker-compose logs -f

# 3. Check running container status
docker-compose ps

# 4. Stop and remove containers/networks
docker-compose down
```

---

## 4. Container Health Check Verification

```bash
# Check PostgreSQL status
docker-compose exec db pg_isready -U neuronops -d neuronops_db

# Check Backend API status
curl -i http://localhost:8000/api/telemetry/latest/

# Check Frontend status
curl -i http://localhost:3000/
```
