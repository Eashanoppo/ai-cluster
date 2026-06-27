# Premium Multi-Page Dashboard Overhaul Plan

## Goal
Overhaul the single-page terminal-themed dashboard into a premium, modern, multi-page SaaS dashboard using Next.js App Router, while preserving the existing backend API integrations and polishing the light-mode beige/sand design system.

## Tasks
- [ ] Refactor global layouts: Create sidebar navigation, header layout, and a **collapsible right-side AI Copilot drawer** in a new `(dashboard)` layout group → Verify: Clicking the Copilot icon in the header toggles the slide-out drawer on any page.
- [ ] Create Overview/Dashboard page: Summary metrics (Sentinel warnings, cost savings, active placements, pending approvals) → Verify: Navigate to `/` and see high-level KPIs.
- [ ] Create Sentinel (Thermal Predictions) page: Detailed list of node predictions, failure probabilities, and a modern chart of GPU temperatures → Verify: Navigate to `/sentinel` and see GPU prediction lists and interactive charts.
- [ ] Create Scheduler (Placements) page: Workload placements table, node loads, and active migrations history → Verify: Navigate to `/scheduler` and see active job placement and migration tables.
- [ ] Create CostWatch (Fleet Redirection) page: Reclaimable waste breakdown, Ollama provisioning status, and fleet activity log → Verify: Navigate to `/costwatch` and see cost savings and Ollama task redirection.
- [ ] Create Execution Gate (Approvals) page: List of pending approvals with action buttons (Approve/Reject) and a past approvals audit log → Verify: Navigate to `/gate` and interact with approval requests.
- [ ] Enhance AI Copilot: Improve the Copilot with **context-awareness** (injecting active page telemetry or system predictions into the LLM context) → Verify: Asking Copilot about cluster state yields responses customized to active metrics.
- [ ] Update styles and typography: Refine the CSS theme in `globals.css` with clean border geometries (0px-2px sharp edges), elegant shadow effects, smooth page transitions, and modern typographic hierarchy (Inter & Playfair Display) → Verify: UI elements look premium, high-contrast, and align with the modern sand/beige aesthetic.

## Done When
- [ ] The app compiles with no TypeScript or lint errors.
- [ ] The user can navigate between five distinct pages (Overview, Sentinel, Scheduler, CostWatch, Gate) via a responsive Sidebar.
- [ ] Live telemetry simulation and backend API fetching are fully integrated into each corresponding module page.

## Notes
- Theme: Sand/Beige light mode (`#E5E2D8`) with bold typography and sharp minimalist edges.
- No third-party UI libraries like shadcn or Radix unless explicitly requested; use custom CSS/Tailwind utilities.
- Keep animations light (using CSS transitions) and respect system motion settings.
