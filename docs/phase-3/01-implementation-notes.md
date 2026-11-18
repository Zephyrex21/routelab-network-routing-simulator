# Phase 3 implementation notes

## Scope delivered

- Shared project validation was extracted to `src/shared/validation/projectValidation.js`; the topology model re-exports the same validator and schema-version constant. This avoids making the routing engine depend on a React feature module.
- `src/engine/graph/normalizeNetwork.js` validates and converts a version-1 RouteLab project into sorted, undirected adjacency lists. Disabled (`down`) links are excluded.
- `src/engine/algorithms/distanceVector.js` implements synchronous, previous-round-only Bellman-Ford table exchanges and reconstructs final paths from the converged next-hop tables.
- `src/engine/algorithms/linkState.js` originates one LSA per router, floods it with deterministic duplicate suppression, builds per-router LSDBs and runs Dijkstra for every source.
- `src/engine/algorithms/dijkstra.js` implements deterministic linear-minimum Dijkstra suitable for the 1–20 router teaching scope.
- `src/engine/algorithms/shared.js` provides run metadata, event sequencing, route entries, snapshots and run-envelope assembly.
- `src/engine/algorithms/index.js` provides the `runRoutingAlgorithm(project, algorithm, options)` facade and named exports.

## Public API

```js
import { runRoutingAlgorithm } from './src/engine/algorithms/index.js';

const result = runRoutingAlgorithm(project, 'distance-vector');
// or: runRoutingAlgorithm(project, 'link-state')

console.log(result.finalTables.R1);
console.log(result.events);
console.log(result.metrics);
console.log(result.snapshots);
```

Supported algorithm IDs are `distance-vector` and `link-state`. Invalid projects throw an error named `RoutingInputError` with code `INVALID_NETWORK_PROJECT`. Unsupported algorithm IDs throw a descriptive error. A Distance Vector safety-bound failure throws `RoutingConvergenceError`; it is never silently reported as a completed run.

Options are intended primarily for deterministic tests and replay: `runId`, `startedAt` and `clock`. The default run ID and timestamps are generated when omitted.

## Architectural boundaries

- Engine modules import no React, React Flow, DOM APIs or presentation code.
- The input is the persisted RouteLab project contract, not the React Flow graph.
- The normalizer is the only adapter from a persisted project to an algorithm graph.
- Algorithms return structured run envelopes; they do not mutate the input project.
- Algorithm execution is synchronous and deterministic for a fixed project and fixed run metadata.
- UI animation timing must be driven by snapshots/events in Phase 4, not by delaying algorithm computation.

## Distance Vector execution

All routers calculate a new table from the same frozen previous-round tables. The implementation emits one vector-send event per active directed neighbour relationship per round, computes all next tables, commits them together, and emits route-update events. The stable check round is included in `roundsExecuted`.

Final `path` values are derived by following the converged per-router next-hop entries. This makes the returned table directly useful to the future Packet Explorer while keeping path calculation separate from the algorithm's advertised next hop and cost.

## Link State execution

Every router originates an LSA with sequence number 1 for this educational run. A deterministic min-heap orders messages by origin ID, sender ID, receiver ID and insertion order. First-time receivers accept and forward; already-known LSAs are counted as duplicate suppressions. Each router then runs Dijkstra over the LSDB it received, not over the global graph object.

The Dijkstra implementation uses linear minimum selection (`O(V² + E)` for one run), which is appropriate for the current 1–20 router scope and makes its selection process easy to explain.
