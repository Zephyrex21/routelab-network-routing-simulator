# Changelog

## Phase 10.2 — Interactive Learning Mode

- Added prediction challenges based on the next unseen Distance Vector or Link State decision in the simulation event stream.
- Added answer selection, explicit submission, immediate correctness feedback, concise reasoning and key takeaways before revealing the recorded event.
- Added focused practice coverage for neighbour-vector use, route-cost updates, convergence, LSA duplicate suppression, Dijkstra settling and relaxation.
- Kept practice questions derived from existing immutable simulation events; routing engine logic and simulation run contracts remain unchanged.
- Added responsive practice UI and Chromium browser coverage for the complete predict, submit, feedback and reveal flow.


## Phase 10.1 — Guided Algorithm Explanations

- Added event-aware, student-facing explanations for Distance Vector updates, neighbour advertisements and convergence.
- Added Link State explanations for LSA flooding, Dijkstra settling and route relaxation decisions.
- Integrated a live learning panel into Simulation Studio that follows the selected playback event, including a useful pre-run state.
- Kept explanations in the presentation/view-model layer; routing algorithms and simulation output contracts remain unchanged.
- Added model and workspace regression tests for explanation coverage.


## 0.9.6 — Active-project reliability

- Standardized Simulation Studio, Packet Explorer, Network Failure Lab and Comparison Lab on the explicit active-project selection contract; no workspace silently falls back to an unrelated saved project.
- Fixed missing `getSavedProjects` references that could crash Failure Lab and Comparison Lab when no project was selected.
- Added runtime regression coverage for workspace empty states with saved projects present but no active selection.
- Updated the README's live demo, Vite release, dependency-audit status and local setup guidance.
- Clarified that the homepage topology graphic is an animated preview, not an editable canvas.

## 0.9.5 — Phase 9.1 Design System Foundation

- Added a unified Inter interface typeface with system-font fallbacks and IBM Plex Mono for technical values.
- Defined shared typography, spacing, radius, content-width and motion tokens.
- Refined light/dark neutral surfaces, border contrast, blue accent and focus-ring colours.
- Introduced a shared foundation stylesheet for consistent page headings, body copy, controls, navigation and card typography.
- Improved responsive content gutters and page-header behaviour.
- Updated the workspace release label to Phase 9.1 and aligned the browser theme colour with the new neutral palette.

# Changelog

## 0.9.4 — Project state, persistence and simulation performance

- Added explicit active-project selection so every lab workspace uses the topology opened in Network Studio.
- Prevented an unsaved workspace from silently falling back to an unrelated saved project.
- Preserved damaged or unsupported project-library data instead of overwriting it on the next save.
- Replaced silent saved-project eviction with an explicit 30-project limit.
- Protected the project currently open in Network Studio from accidental deletion.
- Added bounded router-coordinate validation to project imports and the JSON Schema.
- Indexed Link State Dijkstra event ranges to reduce repeated event-history scans during playback.
- Removed the simulation minimap overlay and added a clear no-link state for failure experiments.
- Added controlled error handling around algorithm-comparison failure experiments.
- Improved download URL cleanup and exposed the active project name in the workspace sidebar.

# Changelog

## 0.9.3 — Vite 8 compatibility

- Updated `@vitejs/plugin-react` to 6.3.0 so its Vite peer dependency supports the repository's Vite 8.3.8 installation.
- Refreshed the committed npm lockfile from the compatible dependency graph.
- Updated dependency-version regression tests to match the current Vite 8, React plugin 6 and Lucide 1 release lines.
- Kept the existing UI, routing engine and persisted project contracts unchanged.


## 0.9.2 — Canvas interaction & visual polish

- Added left-drag panning from the empty Network Studio canvas while keeping router dragging in Select mode.
- Removed the React Flow minimap overlay to free up canvas space; zoom and fit controls remain available.
- Increased the public homepage's centered desktop side gutters and removed the tilt from the topology preview window.
- Added viewport-based reveal transitions, a subtle animated packet path, router pulse and link-flow motion.
- Added workspace page entrance and canvas interaction polish with reduced-motion support.
- Added regression tests for canvas panning, minimap removal, homepage spacing, straight preview geometry and animation accessibility.


## 0.9.1 — Phase 8: Release Preparation

- Added GitHub Actions CI for tests, production build and high-severity dependency audit.
- Added weekly Dependabot updates for npm and GitHub Actions.
- Added Vercel SPA rewrite and baseline security headers for production hosting.
- Added a security reporting policy.
- Added the final academic report draft, algorithm flowcharts, test checklist and viva preparation guide.
- Updated repository documentation and release instructions; no license was selected or added.


## 0.9.0 — Phase 8: Public Home & Workspace Shell Refinement

- Added a public-facing RouteLab homepage at `/` with product introduction, feature pathways, routing model overview and clear entry points into the lab.
- Moved the interactive application into the `/lab/*` route namespace so visitors no longer see workspace navigation until they enter the lab.
- Added redirects from the original `/studio`, `/simulation`, `/packets`, `/failures`, `/compare` and `/overview` paths to their new `/lab/*` equivalents.
- Added a persistent, collapsible desktop sidebar with a compact icon-rail mode, accessible labels/tooltips and an expanded mobile drawer.
- Refined the lab topbar with sidebar controls, breadcrumbs and a direct link back to the public homepage.
- Introduced a consistent typography scale and raised small labels, navigation, controls, helper copy and section descriptions to improve readability and hierarchy.
- Added responsive public-home layouts and reduced-motion handling.
- Added Phase 8 route, sidebar, typography and public-home regression tests and implementation notes.


## 0.8.0 — Phase 7: QA, Accessibility & Release Hardening

- Secured Vite development and preview defaults to loopback-only access (`127.0.0.1`) with an explicit local host allowlist and strict filesystem serving.
- Pinned Vite to 7.3.8, the patched Vite 7 release for the Nov 10, 2026 `__vite-browser-external` remote-code-execution advisory.
- Removed the unused Recharts dependency; comparison visuals are implemented with native CSS and no Recharts API is referenced by the source.
- Refined modal accessibility with unique title/description IDs, an app-level inert state, body scroll locking, focus containment, Escape handling and focus restoration.
- Refined mobile navigation as a modal drawer with background inertness, keyboard focus containment, an explicit close action and scroll locking.
- Improved reusable field controls with generated IDs and programmatic hint/error associations; IconButton now defaults to `type="button"` to prevent accidental form submission. Error toasts are announced assertively while other notifications remain polite.
- Raised tertiary text contrast to WCAG AA 4.5:1 against light/dark page and surface backgrounds.
- Updated dynamic browser theme-color metadata, focus styling, narrow viewport layout and Phase 7 product/version labels.
- Added Phase 7 regression checks for security config, accessibility behaviour, contrast, reduced motion, import limits and release metadata.
- Added release check and npm audit scripts plus Phase 7 implementation, manual QA and sign-off documentation.

## 0.7.0 — Phase 6: Algorithm Comparison & Analytics

- Replaced the conceptual Comparison preview with a live Comparison Lab running Distance Vector and Link State against the same saved topology ID and revision.
- Added all ordered source/destination route comparisons for reachability, minimum path cost and selected path.
- Added selected-source routing-table comparison with next hop, cost, path and agreement classification.
- Added a shared-scale route-cost chart for the selected source across all destinations.
- Added separate, explicitly defined work profiles for Distance Vector and Link State metrics; no mixed speed score or elapsed-time claims.
- Added a cross-algorithm one-link experiment that reruns both algorithms on baseline and isolated modified topologies.
- Fixed an equal-cost Link State forwarding-path inconsistency: final table paths now follow router-by-router next-hop decisions and verify decreasing remaining cost, while source Dijkstra snapshots remain available for algorithm teaching.
- Added comparison model tests covering shipped presets, 12 generated positive-weight graphs, disconnected paths, routing tables, metric definitions, failure outcomes, validation and immutability.
- Updated dashboard, sidebar, about dialog, README and phase documentation for Phase 6.


## 0.6.0 — Phase 5: Packet Explorer & Network Failure Lab

- Replaced the Packet Explorer preview with a working packet-forwarding experience for Distance Vector and Link State results.
- Added strict per-router next-hop traversal, active-link verification, cost consistency checks, loop detection and route/path invariant checks.
- Added source/destination and algorithm selection, route generation, hop count, total cost, router-by-router forwarding details and packet marker playback controls.
- Added a shared SVG topology view with highlighted route, disabled links and animated packet marker; reduced-motion preferences disable nonessential movement.
- Added explicit unreachable and zero-hop self-delivery handling; unreachable routes never animate.
- Added Network Failure Lab for link disable/enable and integer link-cost experiments (1–999).
- Added isolated modified topology variants, fresh before/after algorithm runs, route outcome classification and side-by-side topology/path summaries.
- Added save-as-new-project for experiment variants without overwriting the baseline project.
- Added `/failures` navigation, Phase 5 dashboard status, feature documentation, QA plan and sign-off.
- Added packet-forwarding and failure-experiment automated tests.

## 0.5.0 — Phase 4: Simulation Studio

- Replaced the Simulation preview with an interactive studio connected to the Phase 3 routing engine.
- Added Distance Vector and Link State selection with runs tied to the latest saved project ID and topology revision.
- Added play, pause, replay, previous/next, reset, timeline seeking and adjustable playback speeds.
- Added event-driven router/link activity highlighting and selected source-to-destination path highlighting.
- Added bounded event timeline rendering for large event streams.
- Added Distance Vector snapshot-based routing tables and Link State Dijkstra progress tables replayed from visible events.
- Added algorithm-specific metrics and clear educational-model limitations.
- Added same-tab saved-project notifications and run invalidation on topology revision changes.
- Updated dashboard phase indicators and added Phase 4 implementation/QA/sign-off documentation.
- Added automated tests for playback helpers, event activity, snapshot selection and routing-table view models.

## 0.4.0 — Phase 3: Core Routing Engine

- Extracted strict project validation into a shared, UI-independent module while preserving the topology model exports.
- Added deterministic graph normalization and connected-component discovery; disabled links are omitted from algorithm graphs.
- Implemented synchronous Distance Vector with previous-round advertisements, simultaneous commits, route-change events, stable-check rounds and a safety bound.
- Implemented Link State LSA origination, deterministic flooding, first-time acceptance, duplicate suppression and per-router link-state databases.
- Implemented deterministic Dijkstra with distance/router, first-hop and predecessor tie-breaks.
- Added final route paths, sequence-numbered events, replay snapshots and algorithm-specific metrics.
- Added a public `runRoutingAlgorithm` facade and extensive deterministic/generated-graph tests.
- Updated project documentation and UI phase indicators.
- Kept Simulation UI playback and packet animation deferred to Phases 4 and 5.



## 0.3.1 — Blank-screen startup fix and diagnostics

- Fixed missing `Boxes` and `Route` imports in the overview dashboard. `Boxes` was referenced while the dashboard module initialized, causing a `ReferenceError` and preventing the entire React app from mounting.
- Added the missing `X` icon import in the dialog component to prevent a runtime error when a dialog is opened.
- Updated dashboard, sidebar and help copy to reflect the completed Phase 2 topology editor.
- Added an HTML-level boot fallback so module-loading failures display a helpful diagnostic instead of an empty viewport.
- Added a React error boundary for runtime rendering failures after the module graph loads.
- Added regression tests for the missing icon imports and boot fallback.

## 0.3.0 — Phase 2: Interactive Network Topology Builder

- Replaced the Network Studio preview canvas with an interactive React Flow topology editor.
- Added custom router nodes with connection handles and editable display labels.
- Added router creation, movement, selection, deletion and the 20-router guard.
- Added weighted undirected link creation, cost editing, enable/disable styling and deletion.
- Added duplicate/self-link prevention and schema-aligned topology validation.
- Added Starter Network, Diamond Topology and Disconnected Components presets.
- Added new project creation, explicit local save, saved-project library, JSON import and export.
- Added topology summary, validation feedback, activity indicators and responsive editor styling.
- Added an unsaved-changes guard before replacing the current project.
- Added automated topology-model tests and Phase 2 technical/QA documentation.
- Fixed the missing inspector help icon import in the former Studio preview.

## 0.2.0 — Phase 1: UI Foundation & Application Shell

- Added application navigation, dashboard, reusable UI components and theme switching.
- Added screen shells for Studio, Simulation, Packet Explorer and Comparison.


