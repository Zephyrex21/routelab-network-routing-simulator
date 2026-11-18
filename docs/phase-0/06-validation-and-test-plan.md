# 06 — Validation and Test Plan

## Validation before simulation

A topology is algorithm-ready only when all checks pass:

1. Project schema version is supported.
2. Project ID and name are present; router and link IDs are unique.
3. Router count is within the first-release range (1–20 for imported fixtures; the creation flow should encourage 2–20).
4. Every link endpoint refers to an existing router.
5. A link does not connect a router to itself.
6. An undirected router pair appears at most once, regardless of endpoint order.
7. Link cost is an integer from 1 through 999.
8. Link status is exactly `up` or `down`.
9. Router positions are finite numbers.
10. Links and routers contain no unsupported extra domain fields unless the schema is deliberately versioned.

An isolated router and a disconnected component are valid topologies. They must not be rejected merely because the graph is not fully connected.

## Deterministic unit-test matrix

| ID | Scenario | Input | Expected result |
|---|---|---|---|
| T-001 | Basic shortest route | R1–R2 = 4; R2–R3 = 3; R1–R3 = 10 | R1→R3 minimum cost is 7 via R2. |
| T-002 | Direct route wins | R1–R2 = 2; R2–R3 = 9; R1–R3 = 4 | R1→R3 uses direct link, cost 4. |
| T-003 | Link disabled | Use T-001; disable R2–R3 | R1→R3 becomes direct cost 10. |
| T-004 | Disconnected component | R1–R2 connected; R3 isolated | R1 cannot reach R3; R3 reaches itself at cost 0. |
| T-005 | Equal-cost alternatives | R1–R2–R4 and R1–R3–R4 both total 6 | Cost is 6; selected next hop follows documented deterministic tie-break. |
| T-006 | Link cost update | Increase R1–R2 in T-001 beyond direct R1–R3 cost | New run chooses the cheaper direct route. |
| T-007 | One router | Single R1, no links | Self route is reachable at cost 0; no other destination exists. |
| T-008 | Source equals destination | Packet source and destination both R2 | One-router path `[R2]`, cost 0, zero links/hops. |
| T-009 | Invalid cost | Cost = 0, negative, decimal or >999 | Validation blocks algorithm execution. |
| T-010 | Duplicate undirected link | Add R1–R2 and R2–R1 | Validation rejects the duplicate pair. |
| T-011 | Removed router endpoint | Link still references deleted router | Deletion removes the link in the editor; imported invalid file is rejected. |
| T-012 | Stable rerun | Run same project twice | Identical normalized inputs produce identical tables, metrics and event sequence. |

## Algorithm-specific assertions

### Distance Vector

- Initial tables contain self cost 0, active direct neighbours and otherwise unreachable destinations.
- A router only uses information advertised by an active immediate neighbour.
- All routers use the prior round snapshot; updates are committed simultaneously.
- Every changed entry has an event with old and new values.
- Final stable round has no changes.
- `roundsWithChanges` is less than or equal to `roundsExecuted`.
- `vectorMessages` equals active directed neighbour relationships multiplied by executed rounds.

### Link State

- Every router originates one LSA, including isolated routers.
- A router accepts an LSA at most once for a run.
- Flooding never crosses a down link or disconnected component.
- Routers in the same connected component receive the same set of originated LSAs under the reliable model.
- Each router's Dijkstra run returns correct distances for the LSDB it received.
- `dijkstraRuns` equals router count.
- LSA transmissions, acceptances, duplicates and Dijkstra work are separate metrics.

## UI integration tests

- A topology edit marks the prior run stale.
- Moving a router on the canvas does not alter route cost or stale the run.
- Changing algorithm does not mutate topology.
- Play/pause/step/back/reset update the selected snapshot without mutating the final result.
- The event selected in the timeline is synchronized with router/table highlighting.
- Packet animation follows only the route produced by the selected algorithm run.
- An unreachable destination does not animate a packet.
- Light/dark preference persists where LocalStorage is available; storage failure does not crash the app.
- Reduced-motion mode disables nonessential movement.

## Manual presentation scenario

1. Load the Routing Basics preset.
2. Run Distance Vector and show the initialization and at least one update round.
3. Open R1's routing table and show the route to R3.
4. Reset and run Link State; show LSA flooding, the LSDB and Dijkstra.
5. Compare final route costs for R1→R3.
6. Disable a link on the selected best route and rerun.
7. Show the new route and explain that this project models a fresh run after topology change, not timed failure recovery.

## Quality gate

No phase is accepted solely because the UI looks correct. Algorithm outputs, edge cases, UI state handling and accessibility must be verified against this plan before moving to the next phase.
