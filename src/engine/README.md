# Routing Engine

Phase 3 delivers a UI-independent routing engine. It consumes a validated persisted RouteLab project and produces a schema-aligned simulation run envelope.

- `graph/normalizeNetwork.js` — strict project validation, sorted undirected adjacency and connected components.
- `algorithms/distanceVector.js` — synchronous Bellman-Ford-style Distance Vector.
- `algorithms/linkState.js` — LSA origination/flooding, per-router LSDBs and Dijkstra integration.
- `algorithms/dijkstra.js` — deterministic single-source shortest paths.
- `algorithms/shared.js` — events, metadata, route entries and snapshots.
- `algorithms/index.js` — public exports and `runRoutingAlgorithm` facade.

The engine imports no React, React Flow, DOM or presentation modules. See `docs/phase-3/` for behaviour and sign-off.
