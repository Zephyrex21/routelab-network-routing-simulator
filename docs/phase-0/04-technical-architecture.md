# 04 — Technical Architecture

## Architectural principle

**The routing engine is a pure, testable domain layer. React renders its outputs but does not own routing logic.**

## Proposed layers

1. **Presentation:** pages, panels, graph canvas, controls, charts and accessibility text.
2. **Feature orchestration:** topology editor, simulation experience, routing tables, packet explorer and comparison.
3. **Application state:** active project, unsaved edits, selected router, selected algorithm, run history and playback cursor.
4. **Domain model:** routers, links, topology validation, route entries and simulation events.
5. **Algorithm engine:** graph utilities, Distance Vector, LSA flooding and Dijkstra.
6. **Persistence adapter:** local save/load with explicit schema version and safe parse/migration path.

## Data flow

`User action → feature/controller → validated domain input → algorithm engine → immutable run result (snapshots + events + final tables) → presentation components`.

Topology edits create a new topology revision. Results are associated with the exact revision/fingerprint used to compute them. A result whose input revision no longer matches the active network is stale.

## State management decision

Start with React state and `useReducer`/Context for shared application state. Keep domain functions outside components. Add a dedicated store library only if state complexity demonstrates a need; do not introduce global state libraries pre-emptively.

## Persistence decision

- First release: LocalStorage adapter for small project documents and preferences.
- Include `schemaVersion` on persisted projects.
- Validate parsed data before loading.
- Keep persistence calls behind an adapter so IndexedDB or a cloud service can be introduced later without rewriting features.
- Avoid storing derived algorithm runs indefinitely in the initial version; recompute from the topology when needed unless a clear user requirement emerges.

## Error boundaries and validation

- Validate all user-authored topology data before execution.
- Algorithms receive normalized immutable input.
- Algorithm results contain explicit status and errors rather than silently returning partial routes.
- UI components display errors; the engine does not manipulate DOM or React state.

## Source structure

```text
RouteLab/
├── docs/
│   ├── phase-0/
│   ├── contracts/
│   └── architecture/
├── public/
├── src/
│   ├── app/                  # App entry and route composition
│   ├── components/           # Shared UI primitives
│   ├── features/
│   │   ├── dashboard/
│   │   ├── topology/
│   │   ├── simulation/
│   │   ├── routing-tables/
│   │   ├── packet-explorer/
│   │   └── comparison/
│   ├── engine/
│   │   ├── graph/             # Normalization, validation, adjacency
│   │   ├── algorithms/        # Distance Vector, Link State, Dijkstra
│   │   └── simulation/        # Snapshots, events, replay controller
│   ├── shared/
│   │   ├── data/              # Presets and schema constants
│   │   └── utils/
│   ├── store/                # App-level reducer/context
│   └── styles/               # Design tokens and global styles
├── index.html
├── package.json
└── vite.config.js
```

## Module contracts

- `engine/graph` accepts a project topology and returns normalized graph data plus validation diagnostics.
- `engine/algorithms` accepts normalized graph input and returns algorithm-specific results; it has no UI dependencies.
- `engine/simulation` converts algorithm execution into ordered snapshots and events.
- `features` coordinate user actions and map domain results into view models.
- `components` remain reusable and presentation-focused.

## Dependency policy

React + Vite + JavaScript form the application foundation. Tailwind CSS v4 is used through the Vite plugin. `@xyflow/react` powers the node/edge editor and Lucide React provides icons. Comparison visuals use lightweight native CSS rather than a chart dependency because no Recharts API is used in the shipped source. Avoid adding a backend in the first release because the planned use cases can run locally in the browser.
