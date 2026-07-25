# 🤝 Contributor Guide & Engineering Standards

## 1. Overview

Thank you for contributing to **NeuronOps**! This document outlines coding standards, Pull Request procedures, testing practices, and guidelines for extending system components.

---

## 2. Code Style & Standards

### Python Backend Standards
* **Formatting**: Follow PEP 8 guidelines. Use Black or Ruff with line length 100.
* **Type Annotations**: Use strict type hints for all function parameters and return types.
* **Imports**: Group standard library imports first, third-party imports second, local app imports third.

### TypeScript / Frontend Standards
* **Strict Mode**: `tsconfig.json` enforces TypeScript `strict: true`. No implicit `any`.
* **Component Architecture**: Keep UI components modular, accessible (WCAG-aligned), and free of inline complex math.
* **State Scope**: Keep transient UI state local (`useState`); use React Context or server actions for global state.

---

## 3. How to Extend System Capabilities

### A. Adding a New Workload Task Type
1. Edit [backend/simulator/models.py](file:///d:/Ai-Cluster/backend/simulator/models.py) to add the choice to `TASK_CHOICES`.
2. Edit [backend/simulator/workload_engine.py](file:///d:/Ai-Cluster/backend/simulator/workload_engine.py) to define `TASK_SPECS` (`base_nodes`, `min_tier`, `icon`).
3. Run Django migrations: `python manage.py makemigrations && python manage.py migrate`.

### B. Adding a New Recommendation Rule
1. Open [backend/simulator/agy_service.py](file:///d:/Ai-Cluster/backend/simulator/agy_service.py).
2. Add your rule logic to `generate_simulation_report()` in the fallback generator block.
3. Test your rule by submitting matching task parameters via the Workstation.

---

## 4. Pull Request (PR) Workflow

1. **Branch Naming**: Use `feature/short-description` or `fix/issue-number`.
2. **Commit Messages**: Use Conventional Commits formatting:
   * `feat: add autonomous tier routing for video generation`
   * `fix: correct telemetry drift bounds on Tier 4 Blackwell nodes`
   * `docs: update system overview Mermaid diagrams`
3. **Verification**: Run unit tests and confirm code builds cleanly before creating a PR:
   ```bash
   cd backend && python manage.py test
   cd ../frontend && npm run build
   ```
