# Routing Algorithms

Implemented in Phase 3:

- `distanceVector.js` — synchronous neighbour-table exchanges using the Bellman-Ford recurrence.
- `linkState.js` — LSA origination, deterministic reliable flooding, duplicate suppression and per-router LSDB creation.
- `dijkstra.js` — deterministic single-source shortest paths with path reconstruction.
- `shared.js` — run envelope utilities, events, snapshots and normalized route entries.
- `index.js` — public algorithm API.

The authoritative rules are in `docs/phase-0/05-algorithm-specification.md`; runtime details are documented in `docs/phase-3/02-algorithm-and-event-contract.md`.
