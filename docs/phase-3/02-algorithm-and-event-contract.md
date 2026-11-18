# Algorithm, events and metrics contract

This document records how the runtime outputs map to the Phase 0 specification and the shared `simulation-run.schema.json` envelope.

## Common route entry

Each router's `finalTables[routerId]` array contains one entry per known destination, sorted by destination router ID:

- `destinationRouterId` — destination router.
- `nextHopRouterId` — immediate next router; `null` for self and unreachable entries.
- `cost` — finite total path cost, or `null` when unreachable.
- `status` — `reachable` or `unreachable`.
- `path` — ordered router IDs; self route is `[routerId]`, unreachable route is `[]`.

No JavaScript `Infinity` value is serialized.

## Distance Vector events

| Event type | Meaning |
|---|---|
| `distance-vector.initialized` | Initial tables created. |
| `distance-vector.round.started` | Round begins; prior tables are frozen for all calculations. |
| `distance-vector.vector.sent` | One full vector sent over one directed neighbour relationship. |
| `distance-vector.route.updated` | A router's cost, reachability or next hop changed for a destination. |
| `distance-vector.round.completed` | Round summary, including whether tables changed. |
| `distance-vector.converged` | A stable check round completed with no changes. |
| `distance-vector.completed` | Successful run envelope is ready. |

`roundsExecuted` includes the final stable-check round. `roundsWithChanges` counts only rounds that changed at least one table. `vectorMessages` counts directed full-vector transmissions; an undirected active link contributes two transmissions per executed round. These are educational model counts, not bytes or elapsed time.

The safety bound is `max(1, routerCount - 1)` rounds. If no stable check occurs within the bound, a `RoutingConvergenceError` is thrown.

## Link State events

| Event type | Meaning |
|---|---|
| `link-state.lsa.originated` | Router creates its own LSA. |
| `link-state.lsa.transmitted` | One LSA copy is sent from one router to a neighbour. |
| `link-state.lsa.accepted` | A router receives an LSA origin for the first time. |
| `link-state.lsa.duplicate-suppressed` | A received LSA origin is already in that router's LSDB. |
| `link-state.flooding.completed` | Flooding has exhausted its deterministic message queue. |
| `link-state.dijkstra.*` | One per-router Dijkstra run emits start, settle, relaxation and completion events. |
| `link-state.completed` | Successful run envelope is ready. |

Metrics remain distinct:

- `lsaOriginations` — one originated LSA per router.
- `lsaTransmissions` — actual messages dequeued and sent in the flooding model, including copies later suppressed as duplicates.
- `lsaAcceptances` — first-time remote LSA receipts into router databases; local origination is not counted as a receipt.
- `lsaDuplicatesSuppressed` — duplicate receptions ignored.
- `dijkstraRuns` — one per router.
- `dijkstraSettledVertices` — total finite-distance vertices settled across all runs.
- `dijkstraRelaxationAttempts` — adjacency entries examined across all Dijkstra runs, including checks skipped because the neighbour was already settled.

Do not compare `roundsExecuted` directly against `lsaTransmissions` as a generic speed metric. They measure different categories of algorithm work.

## Snapshots

Each snapshot's `sequence` points to the exact event sequence after which the snapshot is valid. Distance Vector emits an initialization snapshot and one snapshot after each completed round. Link State emits a post-flooding LSDB summary and a shortest-path-tree snapshot after each router's Dijkstra run.

The snapshots are presentation-ready state captures. Phase 4 should use them for stepping and playback rather than recomputing routing while the user watches.

## Deterministic tie-breaks

- Router IDs are compared as case-sensitive strings using stable lexical ordering (`R10` sorts before `R2`).
- Distance Vector chooses the lexically smallest immediate next-hop ID for equal cost.
- Dijkstra selects the unsettled router with lowest distance, then lexical router ID. Equal-cost relaxations choose lexical first hop, then lexical predecessor ID.
- Adjacency lists, LSAs, flooding queue messages and destination table entries are sorted deterministically.


## Final Link State forwarding path consistency

Each router still runs Dijkstra independently using its own LSDB. The per-source Dijkstra snapshots retain that router's selected predecessor tree for algorithm visualization. After all tables are calculated, the published `finalTables` path field is reconstructed by following the current router's own `nextHopRouterId` entry for the destination at every hop. Each step verifies that the remaining route cost decreases by exactly the active link cost. This distinction matters in equal-cost topologies: a downstream router may choose a different valid equal-cost suffix from the suffix in the source router's Dijkstra predecessor tree. The published final forwarding path now reflects the actual hop-by-hop forwarding-table chain used by Packet Explorer.
