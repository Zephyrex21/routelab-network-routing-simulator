# RouteLab

![RouteLab CI](https://github.com/Zephyrex21/routelab-network-routing-simulator/actions/workflows/ci.yml/badge.svg?branch=main)

**An Interactive Web-Based Simulator for Distance Vector and Link State Routing Algorithms**

RouteLab is an educational Computer Networks project built in controlled phases. The current release combines a public product homepage, a dedicated interactive lab workspace with collapsible navigation, a responsive typography system, an interactive network topology editor, tested routing algorithms, a replayable Simulation Studio, a hop-by-hop Packet Explorer, a controlled Network Failure Lab and a live cross-algorithm Comparison Lab.

> **Current status: Phase 8 — Release Preparation.** RouteLab now includes the interactive topology editor, tested Distance Vector and Link State algorithms, a replayable Simulation Studio, validated hop-by-hop packet forwarding, isolated network-change experiments, live comparison of route costs, reachability, selected paths, routing tables and algorithm-specific work metrics, plus Phase 7 accessibility, responsive, dependency and dev-server security hardening.

## Run locally

### Requirements

- Node.js 22.12+ recommended (Vite 7 requires Node.js 20.19+ or 22.12+).
- npm 10+ recommended.
- `package-lock.json` is committed. Use `npm ci` for clean, reproducible installations and commit an updated lockfile whenever dependencies change.

### Setup

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite (the default is `http://localhost:5173`).

### Tests and production build

```bash
npm test
npm run test:engine
npm run test:simulation
npm run test:packet
npm run test:failure
npm run test:comparison
npm run build
npm run audit
npm run preview
```

`npm test` runs the topology-model, UI regression, routing-engine, simulation view-model/controller, packet-forwarding, failure-experiment and cross-algorithm comparison tests using Node's built-in test runner. `npm run test:engine` runs only the routing-engine suite; `npm run test:simulation` runs only the Phase 4 simulation suite; `npm run test:packet` and `npm run test:failure` run the Phase 5 feature suites; `npm run test:comparison` runs the Phase 6 comparison suite. `npm run audit` runs the high-severity npm audit gate after dependency installation. `npm run check` runs all tests and the Vite production build; `npm run check:release` runs tests, build and the npm audit gate in one command.

## Application routes

| Path | Screen | Current state |
|---|---|---|
| `/` | Public homepage | Product introduction, feature guide and entry points into the lab |
| `/lab/overview` | Lab overview | Workspace overview and current project entry point |
| `/lab/studio` | Network Studio | Interactive Phase 2 topology editor |
| `/lab/simulation` | Simulation Studio | Interactive Phase 4 playback, event timeline, topology highlighting and routing-table explorer |
| `/lab/packets` | Packet Explorer | Interactive hop-by-hop forwarding journey for both algorithms |
| `/lab/failures` | Network Failure Lab | Before/after link status and cost experiments for one selected algorithm |
| `/lab/compare` | Comparison Lab | Live route, routing-table, metrics and failure-scenario comparison |

The original workspace paths (`/studio`, `/simulation`, `/packets`, `/failures`, `/compare` and `/overview`) redirect to their new `/lab/*` equivalents for bookmark compatibility. The public homepage intentionally renders without the lab sidebar; entering any lab route reveals the workspace shell.

## Deployment and continuous integration

The repository includes a GitHub Actions quality workflow that runs on pushes and pull requests targeting `main`. It installs the committed lockfile with `npm ci`, runs `npm test`, builds the production bundle and checks the dependency tree with `npm audit --audit-level=high`.

Dependabot checks npm dependencies and GitHub Actions weekly. Vercel deployment configuration is included in `vercel.json`, including the SPA rewrite required by React Router history routes. See [Phase 8 deployment and release notes](docs/phase-8/06-deployment-and-final-release.md) before connecting the repository to a Vercel project.

## Academic project documentation

The Phase 8 documentation contains:
- [Final project report draft](docs/phase-8/03-final-academic-report.md)
- [Algorithm flowcharts](docs/phase-8/04-algorithm-flowcharts.md)
- [Testing checklist and viva preparation](docs/phase-8/05-test-and-viva-guide.md)
- [Deployment and final release guide](docs/phase-8/06-deployment-and-final-release.md)

Complete the report's identity fields, insert screenshots from the actual application, and paste real test/build/audit output before submitting it.

## Phase 7 quality and security

- Vite dev and preview servers bind to `127.0.0.1` only; do not expose the Vite dev server to a LAN or public network.
- Vite is pinned to `7.3.8`, which includes the fix for GHSA-p4f5-76q4-ffq7.
- Recharts was removed because the project does not import it; comparison bars use CSS.
- Dialogs and the mobile navigation drawer lock background interaction, manage keyboard focus and restore focus after closing.
- Inputs have programmatically associated labels, hints and errors; small tertiary text colours meet 4.5:1 contrast against their primary page/surface backgrounds.
- The stylesheet honours `prefers-reduced-motion`; the app is designed for responsive widths down to 320px.
- `npm audit` must be run after install. Previous npm output reported high-severity vulnerabilities but did not include advisory details in the shared terminal excerpt; the current transitive audit therefore remains a local release gate.

## Phase 6 algorithm comparison

- Run both routing algorithms against the same validated saved topology and revision.
- Compare all ordered source/destination pairs for reachability, minimum route cost and selected path.
- Inspect a selected source router's full routing-table comparison, including next hop, cost and route agreement.
- Plot Distance Vector and Link State path costs for each destination on one common cost scale.
- Keep Distance Vector update rounds/vector messages and Link State LSA/Dijkstra work counters in separate, explicitly defined metric profiles.
- Run both algorithms on baseline and isolated one-link variants to compare route changes after a link disable/enable or cost edit.
- Never combine unlike event counters into one speed score or describe them as elapsed convergence time.

## Phase 5 packet and failure experiments

- Generate a routing result for the selected algorithm and source/destination pair.
- Derive each packet hop from the current router's own final forwarding-table entry; verify active links, next-hop consistency, path cost and loop freedom.
- Step, play, pause, reset and replay the conceptual packet marker along the validated path.
- Handle unreachable destinations without animating a route; source-equals-destination is a zero-hop delivery.
- In Network Failure Lab, disable/enable one link or change its integer cost (1–999), then rerun the selected algorithm from initialization against baseline and modified topologies.
- Save an experiment as a separate project without overwriting the baseline.

## Phase 2 topology editor

- Add up to 20 routers with stable numeric IDs (`R1`, `R2`, ...).
- Move routers on the canvas; positions are saved in the project.
- Drag from a source handle to a target handle to connect routers.
- Select routers to edit their display labels; IDs remain stable.
- Select links to edit integer cost (1–999), enable/disable, or delete.
- Deleting a router also removes its attached links; the final router cannot be deleted.
- Load Starter Network, Diamond Topology or Disconnected Components.
- Create new one-router projects.
- Protect unsaved edits when switching projects; avoid dirtying the project when a link-cost field is left unchanged.
- Save/open a local project library (up to 30 projects).
- Import/export schema-versioned JSON project files.
- Validate project shape and topology before save/import/export.

## Project persistence

Projects are stored locally in the current browser under `routelab-project-library-v1`. Saves are explicit; editing marks the project as unsaved. Use JSON export for backups or transfer between browsers. No account, backend, telemetry or cloud sync is included.

## Product boundaries

- Small, undirected networks with 1–20 routers.
- Positive integer link costs from 1 to 999.
- Link state is `up` or `down`; disabled links remain visible in the editor and are excluded by the algorithm input normalizer.
- Distance Vector uses synchronous neighbour-table exchanges based on the Bellman-Ford recurrence.
- Link State models deterministic LSA flooding followed by Dijkstra at each router.
- Topology changes invalidate prior simulation results and require a fresh run.
- The project is an educational simulator, not a production RIP/OSPF implementation or packet-capture tool.

## Project structure

- `src/app/` — application entry, router setup and theme provider.
- `src/components/layout/` — shared navigation and page shell.
- `src/components/ui/` — reusable interface primitives.
- `src/features/topology/` — Network Studio, router node, project model and local project store.
- `src/shared/data/presets/` — starter topology definitions.
- `src/shared/validation/` — shared strict project-contract validation.
- `src/engine/` — UI-independent network normalization, Distance Vector, Link State, Dijkstra and run-envelope modules.
- `src/features/simulation/` — event-driven playback, topology activity visualization, routing-table views and timeline controls.
- `src/features/packet-explorer/` — per-router next-hop forwarding validation, packet journey playback and topology visualization.
- `src/features/network-failure/` — isolated topology variants and before/after route outcome analysis.
- `src/features/comparison/` — cross-algorithm route/table comparison, work profiles and one-link sensitivity experiments.
- `src/styles/` — design tokens and application styles.
- `docs/phase-0/` — product scope, user flows, design system, algorithm specification and validation plan.
- `docs/phase-1/` — UI foundation implementation and QA notes.
- `docs/phase-2/` — topology editor implementation notes, manual QA and preset catalogue.
- `docs/phase-3/` — routing-engine implementation, event/metric contract, tests and sign-off.
- `docs/phase-4/` — Simulation Studio implementation, playback semantics, QA and sign-off.
- `docs/phase-5/` — packet-forwarding rules, failure-experiment semantics, QA and sign-off.
- `docs/phase-6/` — cross-algorithm comparison rules, comparable metrics, sensitivity experiments, regression notes and sign-off.
- `docs/phase-7/` — accessibility, responsive, dependency/security and release-hardening notes, manual QA and sign-off.
- `docs/contracts/` — versioned network-project and simulation-run contracts.
- `tests/` — Node-based tests for topology model, routing algorithms, simulation replay/view models and UI runtime regressions.

## Development sequence

Phase 0 Foundation → Phase 1 UI Shell → **Phase 2 Topology Builder** → **Phase 3 Routing Engine** → **Phase 4 Simulation Studio** → Phase 5 Packet Explorer & Failure Lab → **Phase 6 Comparison** → **Phase 7 QA & Polish** → Phase 8 Deployment & Academic Documentation.

See [`docs/phase-2/README.md`](docs/phase-2/README.md) for the topology builder, [`docs/phase-3/README.md`](docs/phase-3/README.md) for the routing engine,  [`docs/phase-4/README.md`](docs/phase-4/README.md) for the interactive Simulation Studio, and [`docs/phase-5/README.md`](docs/phase-5/README.md) for packet forwarding and network-change experiments. See [`docs/phase-6/README.md`](docs/phase-6/README.md) for the live comparison laboratory and [`docs/phase-8/README.md`](docs/phase-8/README.md) for the public homepage and workspace shell.


## Troubleshooting a blank page

If Vite reports that the development server is ready but the browser shows an empty page, open the browser developer tools (F12) and inspect the Console. A successful `npm run dev` only confirms that the Vite server started; it does not guarantee that React mounted successfully.

This release fixes the Phase 2 blank-screen regression caused by missing `Boxes` and `Route` icon imports in `OverviewPage.jsx`. After extracting this updated archive, run `npm install` once and then `npm run dev`. If an older dev server is still running, stop it with Ctrl+C before starting the updated project.
