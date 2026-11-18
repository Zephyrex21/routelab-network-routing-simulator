# 10 — Phase 0 Sign-off Checklist

Phase 0 is the specification and foundation checkpoint. This checklist is included so that the project can be reviewed before Phase 1 begins.

| Area | Phase 0 output | Status |
|---|---|---|
| Product | Project charter, user types, learning outcomes and scope boundaries | Complete |
| Requirements | Functional/non-functional requirements and user stories | Complete |
| UX | Main navigation, screen map and six primary user flows | Complete |
| Visual design | Light/dark tokens, typography, layout, motion and accessibility rules | Complete |
| Architecture | Layer boundaries, data flow, state and persistence decisions | Complete |
| Algorithms | Distance Vector and Link State educational models, deterministic behaviour and metrics | Complete |
| Data contracts | Versioned project model and simulation-run envelope schemas | Complete |
| QA | Topology validation, deterministic cases, algorithm assertions and manual demo plan | Complete |
| Risks | Decisions, assumptions, exclusions and implementation risks | Complete |
| Phase 1 | UI shell backlog with acceptance criteria and non-goals | Complete |
| Runnable foundation | Vite/React project shell and Phase 0 visual preview | Prepared; install dependencies locally |

## Assumptions to keep visible

- This ZIP is a clean RouteLab starter because no pre-existing RouteLab source archive was attached or available in the project library at the time of this foundation pass.
- The first release is a single-user browser app with local persistence.
- The initial algorithm model is educational and deterministic, not a complete standard protocol implementation.
- The topology is undirected, with positive integer costs, and targets small classroom networks.

## Gate to Phase 1

The Phase 0 foundation is ready for Phase 1 implementation. Before Phase 2 algorithm work begins, the topology contracts and test cases should be converted into executable validation/unit tests. Before Phase 3 is accepted, both algorithms must pass the deterministic test matrix.
