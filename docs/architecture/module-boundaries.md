# Module Boundaries

| Module | Owns | Must not own |
|---|---|---|
| `features/topology` | Editor interactions, selection and topology form state | Routing calculations or protocol semantics |
| `engine/graph` | Strict project normalization, undirected adjacency and connected components | React Flow nodes, components or DOM |
| `shared/validation` | Versioned persisted-project validation shared by the editor and engine | Routing calculations or UI state |
| `engine/algorithms/distanceVector.js` | Vector initialization, synchronous rounds, events and final tables | Playback timers or rendering |
| `engine/algorithms/linkState.js` | LSA creation/flood model, per-router LSDBs and shortest paths | React component state |
| `engine/algorithms/dijkstra.js` | Deterministic single-source shortest path and relaxations | UI labels or animations |
| `engine/algorithms/shared.js` | Run metadata, event sequencing, snapshots and route-entry helpers | Protocol-specific calculations |
| `engine/simulation` | Event ordering, immutable snapshots and replay cursor helpers | Network topology editing controls |
| `features/simulation` | User controls and view-model mapping | Algorithm implementation |
| `features/routing-tables` | Table presentation and filters | Route cost computation |
| `features/packet-explorer` | Per-router forwarding-table traversal, route validation and packet journey presentation | Inventing a route, traversing a disabled link or bypassing the routing result |
| `features/network-failure` | Isolated link/cost experiment variants and before/after route outcome analysis | Mutating the baseline project silently or claiming live protocol recovery |
| `features/comparison` | Side-by-side rendering of defined metrics | Comparing unlike counters as wall-clock speed |
| `shared/data` | Presets and static labels | Mutable live application state |
| `store` | Cross-feature application state | Domain algorithm logic |
