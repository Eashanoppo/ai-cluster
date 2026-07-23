# Premium Multi-Page Dashboard Overhaul Plan

## Goal
Overhaul the single-page terminal-themed dashboard into a premium, modern, multi-page SaaS dashboard using Next.js App Router, while preserving the existing backend API integrations.

## Tasks
- [x] Refactor global layouts: Create sidebar navigation, header layout, and a **collapsible floating AI Copilot popup** in a `(dashboard)` route group layout → Implemented in `layout.tsx` with `Sidebar`, `HeaderNotifications`, `WorkstationStatusBanner`, and a Framer Motion floating Copilot button/popup.
- [x] Create Overview/Dashboard page: Summary metrics (Peak Temp, Total Savings, Approvals Required, System Status KPI cards) → `(dashboard)/page.tsx` — 4-card hero banner + 2-column layout with Sentinel chart, NodeTopology, ApprovalGate, TelemetryLog, Job Reallocations.
- [x] Create Sentinel (Thermal Predictions) page: Detailed list of node predictions, failure probabilities, and a chart of GPU temperatures → `(dashboard)/sentinel/page.tsx`
- [x] Create Scheduler (Placements) page: Workload placements table, node loads, and active migrations history → `(dashboard)/scheduler/page.tsx`
- [x] Create CostWatch (Fleet Redirection) page: Reclaimable waste breakdown, fleet activity log → `(dashboard)/costwatch/page.tsx` with `CostReportsTable` component.
- [x] Create Execution Gate (Approvals) page: List of pending approvals with Approve/Reject buttons and audit log → `(dashboard)/gate/page.tsx`
- [x] AI Copilot: Floating popup drawer toggled by a fixed bottom-right "Ask Assistant" button. Context-awareness (telemetry injection) is a future enhancement.
- [x] Update styles and typography: `globals.css` with Polar Night dark mode (zinc-950 base), Inter + JetBrains Mono fonts, Tailwind CSS v4, Framer Motion page transitions.

## Done When
- [x] The app compiles with no TypeScript or lint errors.
- [x] The user can navigate between five distinct pages (Overview, Sentinel, Scheduler, CostWatch, Gate) via a responsive collapsible Sidebar.
- [x] Live telemetry simulation and backend API fetching are fully integrated into each corresponding module page.

## Notes
- **Actual Theme (as shipped):** Polar Night dark mode — `zinc-950` background, `#5e81ac` (Nord Frost blue) as primary accent, JetBrains Mono for labels. The sand/beige concept was superseded by the Nord dark system.
- Framer Motion (`^12.42.0`) is used for layout transitions (sidebar collapse, Copilot popup animations).
- No shadcn/Radix UI used; custom CSS utilities in `globals.css`.
- A `(workstation)` route group also exists at `/workstation` for the Workstation Simulator feature.
- Old single-page components preserved in `components/ui-old/` for reference.
