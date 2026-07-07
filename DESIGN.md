---
name: ClustroConnect Design System
version: beta
description: >
  Unified Nord design system for both the ClustroConnect Dashboard (Polar Night dark mode)
  and Workstation (Snow Storm light mode). Commits to rounded corners (12px / 0.75rem)
  throughout both interfaces.

colors:
  # Snow Storm — Workstation light background & elevated elements
  ws-bg: "#eceff4"
  ws-surface: "#e5e9f0"
  ws-surface-raised: "#d8dee9"

  # Polar Night — Dashboard dark background & elevated elements
  db-bg: "#2e3440"
  db-surface: "#3b4252"
  db-surface-raised: "#434c5e"
  db-border: "#4c566a"

  # Frost — Primary interactive accents
  interactive: "#5e81ac"
  interactive-hover: "#81a1c1"
  interactive-subtle: "#88c0d0"
  interactive-teal: "#8fbcbb"

  # Aurora — Semantic status mappings
  status-overload: "#bf616a"
  status-advanced: "#d08770"
  status-warning: "#ebcb8b"
  status-optimal: "#a3be8c"
  status-special: "#b48ead"

  # Hardware Tier Configurations & Profiles
  tier-1:
    label: "RTX 3090 Build"
    vram: "24GB GDDR6X"
    ram: "16GB DDR5"
    temp: 65
    power: 350
    color: "#a3be8c" # Nord14 Green
  tier-2:
    label: "RTX 4090 Build"
    vram: "24GB GDDR6X"
    ram: "32GB DDR5"
    temp: 60
    power: 450
    color: "#ebcb8b" # Nord13 Yellow
  tier-3:
    label: "RTX 5090 Build"
    vram: "32GB GDDR7"
    ram: "64GB DDR5"
    temp: 58
    power: 600
    color: "#d08770" # Nord12 Orange
  tier-4:
    label: "Blackwell B200 Build"
    vram: "192GB HBM3"
    ram: "128GB LPDDR5"
    temp: 55
    power: 700
    color: "#bf616a" # Nord11 Red

rounded:
  default: 12px
  lg: 16px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px

typography:
  fontFamily: "Inter, sans-serif"
  fontMono: "JetBrains Mono, monospace"
---

# Design Specifications

## Overview
This system unifies the visual language of the ClustroConnect Dashboard and Workstation under the **Nord theme**. 
- The **Dashboard** uses a dark **Polar Night** ambiance to show system state and metrics in a clinical, clean control-room view.
- The **Workstation** uses a bright **Snow Storm** ambiance to denote user configuration, chat, and simulation tasks.
- **Round geometry** (12px / 0.75rem) replaces the previous sharp borders to enhance visual quality, rendering a premium, state-of-the-art interface.

---

## Hardware Configurations (Build Types)

When a workstation task runs on any tier, the corresponding quadrant nodes on the server map grid light up in the tier color and telemeters represent the hardware specs:

| Tier | GPU Build | VRAM | RAM | Nominal Temp | Power Draw |
|------|-----------|------|-----|--------------|------------|
| Tier 1 | RTX 3090 | 24GB VRAM | 16GB RAM | 65°C | 350W |
| Tier 2 | RTX 4090 | 24GB VRAM | 32GB RAM | 60°C | 450W |
| Tier 3 | RTX 5090 | 32GB VRAM | 64GB RAM | 58°C | 600W |
| Tier 4 | Blackwell B200 | 192GB VRAM | 128GB RAM | 55°C | 700W |

---

## Theme Configurations

### Workstation Ambiance (Snow Storm - Light Mode)
- **bg**: `#eceff4`
- **surface**: `#e5e9f0`
- **surface-raised**: `#d8dee9`
- **text-primary**: `#2e3440` (Polar Night dark ink)
- **text-secondary**: `#3b4252`

### Dashboard Ambiance (Polar Night - Dark Mode)
- **bg**: `#2e3440` (Dark background)
- **surface**: `#3b4252` (Card surface background)
- **surface-raised**: `#434c5e`
- **border**: `#4c566a`
- **text-primary**: `#eceff4` (Snow storm light text)
- **text-secondary**: `#e5e9f0`

---

## Shapes & Radii
- All cards, panels, buttons, and inputs must use `border-radius: 12px` (equivalent to `rounded-xl`).
- Status badges use pill shapes (`rounded-full`).

---

## Do's and Don'ts
- ✅ Do apply rounded corners (12px) to all containers in both Dashboard and Workstation views.
- ✅ Do show active telemetry metrics that correspond directly to the selected GPU build specifications.
- ✅ Do use Polar Night for the Dashboard background and Snow Storm for the Workstation background.
- ❌ Don't mix sharp corners and rounded corners in the same page.
- ❌ Don't place the Legacy Dashboard button in the main header (nest it in settings).
