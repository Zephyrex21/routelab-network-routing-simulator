# 07 — Decisions, Assumptions and Risks

## Architecture decision record (ADR) summary

| ID | Decision | Reason | Consequence |
|---|---|---|---|
| ADR-001 | Build a browser-first React + Vite application | The initial experience is local and visual; server features are not required. | No backend in initial release. |
| ADR-002 | Use JavaScript, not TypeScript | Keeps the project aligned with the chosen development workflow. | Use JSDoc and clear contracts to support maintainability. |
| ADR-003 | Use an independent routing engine | Algorithms must be testable without rendering. | Engine exports pure functions and structured results. |
| ADR-004 | Store an app-owned topology model separately from canvas nodes/edges | View-library data should not define domain truth. | Add adapters between domain and React Flow. |
| ADR-005 | Use undirected positive-integer links | Keeps first release aligned to standard shortest-path classroom examples. | Directed links and zero/negative weights are out of scope. |
| ADR-006 | Model Distance Vector as synchronous rounds | Makes information exchange and convergence observable deterministically. | Not a timer-driven production RIP simulation. |
| ADR-007 | Model Link State as LSA flooding plus per-router Dijkstra | Makes the information-distribution stage distinct from shortest-path computation. | Not a full OSPF implementation. |
| ADR-008 | Rerun from initialization after topology changes | Avoids implying timed protocol recovery that is not modelled. | UI must identify old results as stale. |
| ADR-009 | Use LocalStorage first | Initial project data is small and single-user. | Persistence abstraction required for later migration. |
| ADR-010 | Keep metrics algorithm-specific | Model events are not comparable as raw speed measures. | Comparison UI must label metric definitions. |

## Assumptions

- The project is demonstrated as an educational browser application.
- The initial target is a small topology (2–20 routers recommended).
- A student laptop and a modern browser are the primary runtime environment.
- Local save/load is sufficient for the first release.
- No real network capture or live router integration is required by the selected mini-project brief.
- The selected mini-project topic is Dynamic Routing Simulation, with Distance Vector and Link State as the compared algorithms.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Algorithms mixed into UI components | Difficult to test and explain | Independent engine package with pure inputs/outputs. |
| Animation appears correct but route is wrong | Core academic credibility lost | Animate only from a tested algorithm result. |
| Comparison implies false performance claims | Misleading educational output | Separate metrics and document what each counter means. |
| Topology edits leave old results visible | User sees inconsistent state | Tag runs with topology revision and mark stale on edit. |
| Disconnected networks mishandled | Incorrect unreachable state | Include disconnected components in fixtures and tests. |
| Equal-cost paths yield inconsistent UI | Confusing route changes | Use deterministic tie-breaking and test it. |
| Too many features delay algorithm quality | Project becomes superficial | Essential-first scope; no user accounts/cloud for initial release. |
| Small-screen canvas becomes unusable | Poor presentation on some devices | Responsive panel drawers and a desktop-first canvas layout. |
| LocalStorage data becomes incompatible | Projects fail to reopen | Version the schema and validate on load. |

## Open questions to resolve during implementation

These are intentionally deferred because they depend on the first usable topology editor:

- Whether the canvas should support auto-layout or only manual positioning initially.
- Whether project export/import as JSON is required for the final academic demo.
- Whether the Packet Explorer should use the source router's stored path or reconstruct from per-router next-hop tables for each algorithm (the engine contract should retain enough data to do either safely).
- Whether the app should store multiple historical runs or only the latest run per algorithm.

Do not let these questions block Phase 1. Record the decision when the relevant implementation need becomes concrete.
