# Phase 5 QA plan

## Automated coverage

- Packet route follows the current router's final next-hop entry under Distance Vector.
- Packet route follows the current router's final next-hop entry under Link State.
- Direct routes contain one forwarding decision.
- Self-routes complete with zero hops and zero cost.
- Unreachable destinations return no path and no decisions.
- Stale project/revision run results are rejected.
- Invalid endpoints and missing runs are rejected.
- Route metadata retains run ID, algorithm, project ID and topology revision.
- Every hop uses an enabled direct topology link, and the sum of link costs equals the source table cost.
- Disabling/enabling a link creates a separate revisioned experiment and does not mutate the baseline.
- Cost changes enforce whole-number bounds 1–999.
- Unknown links, unsupported operations and no-op experiments are rejected.
- Equal-cost alternate path, became-unreachable, changed-cost and unchanged outcomes are classified correctly.
- Modified project outputs pass the shared strict project validator.

## Manual acceptance checks

1. Load the Starter Network preset in Network Studio and save it.
2. Open Packet Explorer, choose R1 → R5 and run Distance Vector.
3. Confirm the displayed path is R1 → R2 → R3 → R5 and its total cost is 8.
4. Step forward, play, pause, reset and replay. Confirm the marker visits only those routers and active links.
5. Repeat with Link State and confirm its forwarding path is derived from its result.
6. Choose a disconnected source/destination pair. Confirm an unreachable message appears and no packet marker moves.
7. Choose the same source and destination. Confirm zero-hop delivery.
8. Open Network Failure Lab. Disable L3 in the Diamond topology, analyze R1 → R4, and confirm the equal-cost alternative route is shown.
9. Change a link cost and confirm before/after route costs update from fresh algorithm runs.
10. Save an experiment as a new project and confirm the original project remains in the library.
11. Save a different topology revision in Network Studio and confirm open Packet Explorer/Failure Lab sessions discard stale analyses.
12. Check light/dark themes, reduced-motion preference, mobile layout and keyboard-operable controls.

## Build and runtime checks

Run `npm test`, `npm run build`, then manually exercise the acceptance checks in a browser. Test the packet marker with reduced motion enabled; nonessential movement must be disabled while step/progress state remains understandable.

## Latest automated results

The current Phase 5 release passes **84 automated tests** via `node --test`. The packet and failure feature suites can also be run independently:

```bash
npm run test:packet
npm run test:failure
```

Static validation for this release found no JS/JSX parser errors, unresolved relative imports or CSS stylesheet syntax errors. The production build and browser acceptance checks remain local verification tasks as documented in the Phase 5 sign-off.
