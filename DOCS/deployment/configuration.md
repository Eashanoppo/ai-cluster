# ⚙️ Environment Configuration & Secret Matrix

## 1. Overview

This document provides a matrix of environment variables, defaults, secret configurations, and feature flags used across the NeuronOps stack.

---

## 2. Environment Variables Reference Matrix

| Variable Name | Component | Default Value | Description |
|:---|:---|:---|:---|
| `DATABASE_URL` | Backend / Workers | `postgres://neuronops:password@db:5432/neuronops_db` | PostgreSQL connection string |
| `DJANGO_SETTINGS_MODULE` | Django Core | `neuronops.settings` | Target settings module |
| `SECRET_KEY` | Django Core | `django-insecure-...` | Production secret key for session signing |
| `DEBUG` | Django Core | `True` (Dev) / `False` (Prod) | Enables detailed error pages & SQL logging |
| `OLLAMA_BASE_URL` | Processor / SDK | `http://localhost:11434/v1` | URL endpoint for local Ollama LLM service |
| `LLM_MODEL` | Processor / SDK | `llama3` | Model identifier for root cause analysis |
| `GEMINI_API_KEY` | Antigravity SDK | `""` (Optional) | API key for external cloud LLM fallback |
| `NEXT_PUBLIC_API_URL` | Frontend | `http://localhost:8000/api` | Public REST API URL consumed by client |
| `PORT` | Web Servers | `8000` (Backend) / `3000` (Frontend) | Service binding ports |

---

## 3. `.env` File Example Configuration (`backend/.env`)

```ini
# NeuronOps Production Environment Configuration
DEBUG=False
SECRET_KEY=e83f91a27b409c123456789abcdef0123456789abcdef0123456789abcdef
DATABASE_URL=postgres://neuronops:ProductionPassword123@localhost:5432/neuronops_db

# Local Ollama LLM Integration
OLLAMA_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3

# Optional Cloud AI Fallback Key
GEMINI_API_KEY=AIzaSyA1234567890abcdefghijklmnopqrstuv
```
