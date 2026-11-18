# 05 — Algorithm Specification

This document defines the educational models to be implemented. It intentionally distinguishes the concepts being taught from complete production protocol implementations.

## Shared graph model

- Routers are vertices.
- An active, undirected link is an edge with a positive integer cost.
- A down link is omitted from the graph supplied to an algorithm.
- Disconnected components are valid input.
- Costs are finite integers in the range 1–999.
- Negative costs, zero-cost links and directed links are not supported in the first release.
- Neighbour iteration is sorted by router ID to keep execution deterministic.

## A. Distance Vector

### Educational model

A synchronous Distance Vector model based on the Bellman-Ford recurrence. Each router maintains an estimate of the minimum cost to each destination and exchanges its current table with immediate neighbours.

For router `x`, destination `y`, and neighbour `v`:

`D_x(y) = min over v in N(x) of [ c(x,v) + D_v(y) ]`

The value received from a neighbour is always read from the previous round. All routers calculate the next round from the same previous snapshot, and their tables are committed simultaneously. This is the synchronous classroom model, not a timer-driven distributed RIP implementation.

### Initialization

For every router `x`:

- Cost from `x` to itself is `0`; next hop is `null`.
- An active direct neighbour `v` has cost `c(x,v)` and next hop `v`.
- Every other destination is `unreachable` (serialized with `cost: null` and `nextHopRouterId: null`).
- Down links are ignored.

### Round execution

1. Freeze the current routing tables as the round's advertisement snapshot.
2. For every active directed neighbour relationship `x → v`, model router `x` sending its full vector to `v`.
3. For every router `x` and destination `y`, evaluate all active neighbours `v` using `cost(x,v) + previousTable[v][y].cost` when the neighbour's route is reachable.
4. Choose the lowest finite candidate cost.
5. If two candidates have equal cost, choose the lexicographically smallest immediate next-hop router ID. Router IDs use the stable `R<number>` form in the UI; lexical comparison is the specified fallback for any valid ID.
6. Preserve the self route (`x → x`, cost `0`, no next hop).
7. Commit all next tables simultaneously and emit changed-entry events.
8. Stop when an entire round produces no table changes. Include the final stable check round in `roundsExecuted`; count rounds that changed at least one table separately as `roundsWithChanges`.

### Safety bound

Run at most `max(1, routerCount - 1)` rounds, including a possible final stable-check round. With a finite graph of positive costs and synchronous exchanges, shortest simple paths can be learned within this bound; the stable check confirms no further change. If the engine reaches the bound without stability, return an explicit convergence error rather than silently claiming success.

### Message metric

`vectorMessages` counts one full-vector transmission per active directed neighbour relationship per executed round. Since links are undirected, each active physical link can carry two directed vector transmissions in a round. This is a model event count, not elapsed time or actual network bytes.

### Explicit non-features

The first version does not simulate split horizon, poisoned reverse, triggered updates, route timers, packet loss, administrative distance, hop-count limits or RIP wire-format messages. Explain this in the help/limitations view.

## B. Link State

### Educational model

A simplified link-state model with three distinct stages:

1. Each router originates a Link State Advertisement (LSA) describing its active directly connected neighbours and link costs.
2. LSAs are flooded across active links using reliable first-reception forwarding with duplicate suppression.
3. Each router builds its own link-state database and runs Dijkstra from itself to produce its routing table.

This demonstrates the Link State concept and Dijkstra's algorithm; it is not a complete OSPF implementation.

### LSA contents

Each LSA contains:

- `originRouterId`
- `sequenceNumber` (one deterministic sequence per generated topology run in the educational model)
- `links`: sorted list of `{ neighborRouterId, cost }` for active directly connected links

An isolated router originates an LSA with an empty link list.

### Deterministic flooding model

- Every router originates exactly one LSA for a run.
- The origin enqueues that LSA for every active neighbour, sorted by neighbour ID.
- When a router receives an LSA for the first time, it accepts the LSA and forwards it to all active neighbours except the incoming neighbour.
- Duplicate receptions are logged or counted as suppressed and are not forwarded again.
- Queue ordering is deterministic: origin router ID, then sending/receiving router IDs and insertion order.
- LSAs can only travel inside their connected component. Every router in a component eventually receives the LSAs originated by routers in that component.
- The resulting local databases are equivalent within a connected component under this reliable flooding model.

### Dijkstra execution

Run Dijkstra independently from every router using that router's LSDB.

1. Set source distance to `0`; all other tentative distances to infinity.
2. Select the unsettled router with lowest tentative distance; break equal-distance selection by lexicographically smallest router ID.
3. Relax its known active neighbours in sorted router-ID order.
4. A lower candidate cost replaces the current distance and predecessor/first-hop data.
5. An equal-cost candidate uses the lexicographically smaller next hop from the source. If the next hop is also identical, use a deterministic predecessor-ID fallback.
6. Continue until all reachable routers are settled.
7. Generate a route entry for every destination, marking unreachable destinations explicitly.

The implementation should retain a source-to-destination path for Link State results so the Packet Explorer can animate the path selected by the source's own shortest-path tree.

### Metrics

Keep these as separate Link State metrics:

- `lsaOriginations`: number of LSAs originated (one per router).
- `lsaTransmissions`: number of LSA sends over a link in the flooding model.
- `lsaAcceptances`: first-time LSA receipts into a router's database.
- `lsaDuplicatesSuppressed`: duplicate receptions ignored.
- `dijkstraRuns`: number of per-router Dijkstra executions.
- `dijkstraSettledVertices`: total vertices settled across all runs.
- `dijkstraRelaxationAttempts`: total edge-relaxation attempts.

These counts are educational model statistics, not a timing benchmark.

## C. Routing-table contract

Every router table has one entry per known router destination:

- `destinationRouterId`
- `nextHopRouterId` (null for self/unreachable)
- `cost` (finite number for reachable; null for unreachable)
- `status` (`reachable` or `unreachable`)
- `path` (optional ordered router IDs for the selected route; self path contains only the router)

A packet route must be derived from the final routing result. The Packet Explorer must not animate through disabled links or invent an intermediate router.

## D. Network changes and simulation lifecycle

A topology edit invalidates results tied to the prior topology revision. In the first release, a rerun starts from algorithm initialization using the new network. This is a deliberate reset-based experiment and must not be described as live protocol failure recovery.

## E. Comparison policy

The fair direct comparison is:

- Final minimum route cost for the same source/destination and topology.
- Reachability and selected route (noting equal-cost alternative routes may differ by deterministic tie-break rules).
- Algorithm-specific model events and work counts, with their definitions shown.

Do not put `roundsExecuted` and `lsaTransmissions` on one unlabeled “speed” scale. They count different kinds of model work. Do not claim wall-clock convergence time from these counters.

## F. Complexity notes for documentation

- Distance Vector performs table calculations across routers, destinations and neighbours per round. A simple implementation is approximately `O(R × V × E)` across `R` rounds (or `O(R × V × degree-sum)`), with `V` routers and `E` undirected links.
- Dijkstra with a simple array/linear minimum selection is `O(V² + E)` per source; a priority queue implementation can improve this, but the first 2–20 router teaching target does not require premature optimization.
- LSA flooding work depends on the graph and the duplicate-suppression model; count the actual simulated transmissions rather than assuming every physical link carries one LSA exactly once.

## G. Required edge cases

- One-router topology.
- Isolated router.
- Multiple disconnected components.
- Direct route versus cheaper multi-hop route.
- Equal-cost alternatives.
- Link disabled or re-enabled.
- Cost changed to a different positive integer.
- Source equals destination.
- Unreachable destination.
- Invalid topology rejected before algorithm execution.
