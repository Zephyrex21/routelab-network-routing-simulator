# Phase 10.4 — Exportable Learning Reports

## Purpose

Turn a RouteLab simulation or algorithm comparison into a self-contained, printable learning artifact that can be saved as a PDF using the browser's native print destination.

## Simulation report

The Simulation Studio report includes:
- Network name, topology revision, router and link counts.
- A generated SVG topology diagram with link costs and disabled-link styling.
- Simulation algorithm, status, event count and timestamps.
- Numeric metrics produced by the routing engine.
- Final routing tables for every router, including destination, next hop, cost, reachability and selected path.
- Selected event-by-event learning explanations and key takeaways.

## Comparison report

The Comparison Lab report includes:
- The shared topology and SVG diagram.
- All-pairs reachability/cost agreement summary.
- The selected source router's complete Distance Vector vs Link State destination table.
- Algorithm-specific work profiles, explicitly avoiding a misleading common speed score.
- Selected route-pair agreement and optional baseline/modified-link failure experiment results.
- Selected learning highlights from both algorithm event streams.

## Export workflow

1. Generate a simulation or run both algorithms in Comparison Lab.
2. Choose Export report / Export comparison report.
3. RouteLab opens a self-contained, print-styled report in a new browser tab.
4. Choose Print / Save as PDF and select the browser's PDF destination.

No PDF library or network request is required. The report is assembled from current engine results and escaped project labels, then rendered as standalone HTML with inline styles and an inline SVG topology diagram.

## Scope and accuracy

Reports are generated from the active in-memory run/comparison and its matching topology revision. The report utility rejects mismatched project identity/revision rather than combining unrelated data. Learning notes are selected from recorded algorithm events and use the same explanation view model shown in Simulation Studio.

The PDF itself is produced by the browser's print engine, not by RouteLab server-side rendering. The reports document RouteLab's educational models and do not claim to represent live RIP/OSPF network traffic.

## Validation

Model tests cover both report builders, topology SVG content, route table/metric coverage, mismatch rejection and HTML escaping. Chromium smoke checks open both report tabs and verify their rendered headings, topology diagram, printable action and report sections.

Run the complete gate with `npm run check:release`.
