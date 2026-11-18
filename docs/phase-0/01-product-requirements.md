# 01 — Product Requirements

Requirements are grouped by capability. `Must` items define the first release; later enhancements must not block them.

## Functional requirements

| ID | Priority | Requirement | Acceptance summary |
|---|---|---|---|
| FR-001 | Must | Create a network project | User can create a named topology with a unique project ID. |
| FR-002 | Must | Add, rename and remove routers | Router IDs remain unique and deletion safely handles connected links. |
| FR-003 | Must | Move routers on the canvas | Position is saved with the project and has no effect on algorithm cost. |
| FR-004 | Must | Add and remove links | Endpoints must exist; self-links and duplicate undirected pairs are rejected. |
| FR-005 | Must | Edit link cost and status | Cost is an integer from 1 to 999; status is `up` or `down`. |
| FR-006 | Must | Validate topology | Invalid input is blocked with a clear, actionable message. |
| FR-007 | Must | Load predefined scenarios | At least three documented small topologies are available. |
| FR-008 | Must | Save and reopen locally | Projects are persisted locally with a schema version. |
| FR-009 | Must | Execute Distance Vector | Synchronous rounds produce per-router routing-table snapshots. |
| FR-010 | Must | Execute Link State | LSA flooding produces a local topology database per router, then Dijkstra tables. |
| FR-011 | Must | Inspect simulation steps | Each step has sequence, event type, actor and human-readable explanation. |
| FR-012 | Must | Control playback | User can play, pause, step forward, step backward and reset. |
| FR-013 | Must | Inspect routing tables | User can select a router and view destination, next hop, cost and reachability. |
| FR-014 | Must | Explore a packet route | User selects source/destination and sees the computed route and hops. |
| FR-015 | Must | Experiment with link changes | A link can be disabled/enabled or have its cost changed, followed by a fresh run. |
| FR-016 | Must | Compare the algorithms | Both algorithms run against the same normalized topology and show their results. |
| FR-017 | Must | Explain model metrics | Metric definitions and non-comparability caveats are visible in the UI/help. |
| FR-018 | Must | Support light and dark themes | Theme preference persists locally; contrast remains readable. |
| FR-019 | Must | Handle unreachable routes | Unreachable is represented explicitly; no fake route is shown. |
| FR-020 | Must | Reset experiment state | User can restore a clean run without corrupting the saved topology. |

## Non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| NFR-001 | Correctness | Algorithm logic is independent of React components and has unit-testable pure functions. |
| NFR-002 | Determinism | Normalized identical input produces identical results and event order. |
| NFR-003 | Performance | Initial target is a responsive experience for 2–20 routers on a typical student laptop. |
| NFR-004 | Reliability | Invalid projects or corrupted local data fail safely with a recovery path. |
| NFR-005 | Accessibility | Keyboard-operable controls, visible focus, semantic labels and reduced-motion support. |
| NFR-006 | Responsiveness | Main workspace prioritizes desktop but must remain usable on tablet/mobile. |
| NFR-007 | Privacy | No account or telemetry is required; project data remains local in the first release. |
| NFR-008 | Maintainability | Features, engine, shared UI and persistence are separated into clear modules. |
| NFR-009 | Explainability | Algorithm events and displayed metrics have plain-language descriptions. |
| NFR-010 | Presentation | The app has a consistent premium visual system in both themes. |

## User stories

- As a student, I want to build a small topology so that I can experiment with different link costs.
- As a student, I want to step through Distance Vector updates so that I can see how routers learn routes from neighbours.
- As a student, I want to inspect LSA distribution and Dijkstra's process so that I can distinguish Link State from Distance Vector.
- As a student, I want to inspect any router's table so that I can understand its next-hop decision.
- As a student, I want to disable a link and rerun the algorithms so that I can see an alternate route.
- As a student, I want both algorithms to use the same topology so that their final path costs can be compared fairly.

## Out of scope clarification

FR-015 is a controlled experiment followed by a new run. It is not a simulation of timed failure detection or production-protocol convergence after an active network failure.
