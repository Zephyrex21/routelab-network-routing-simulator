# Phase 1 — Screen map and navigation model

## Global shell

Every main route shares:

- Persistent desktop sidebar.
- Responsive top bar with current page context.
- Workspace preview label; no actual project is created in Phase 1.
- About RouteLab dialog.
- Theme toggle.
- Main content landmark and skip link.
- Footer with product and course context.

## Navigation hierarchy

```text
RouteLab
├── Overview                  /
└── Workspace
    ├── Network Studio        /studio
    ├── Simulation            /simulation
    ├── Packet Explorer       /packets
    └── Compare algorithms    /compare
```

## Screen responsibilities

### Overview

Introduces RouteLab, states the two routing approaches, presents the intended learning flow, reports the current build milestone and provides a recent-project empty state. New-project and load-sample actions are visible but unavailable until Phase 2.

### Network Studio

Establishes the workspace layout specified in Phase 0: top project/action row; left tool rail; central canvas; right inspector; bottom event log. The central topology visual is explicitly marked as a static concept preview. Editing and export/run controls are disabled.

### Simulation

Explains the planned simulation playback model and shows disabled playback controls as a layout concept. No time, step count, convergence or route result is generated.

### Packet Explorer

Shows the planned source-to-destination journey structure and the fields that will eventually be calculated. Source, destination, hop count and path cost remain unpopulated until the underlying engine exists.

### Compare algorithms

Provides a conceptual comparison of Distance Vector and Link State. No runtime chart, benchmark or convergence metric is presented in Phase 1.

## Responsive behaviour

- Above 760 px: fixed sidebar and main content column.
- At or below 760 px: sidebar becomes a slide-in drawer; top bar exposes the menu control.
- At or below 960 px: Network Studio inspector moves below the canvas/tool region.
- At small mobile widths: overview grids stack; data summaries wrap; packet journey compresses without implying actual packet movement.
