# Phase 3 automated and manual QA

## Automated suite

Run `npm test`. The Phase 3 suite covers:

- graph normalization and disabled-link exclusion;
- malformed project rejection before algorithm execution;
- Distance Vector shortest path, stable check round, vector message counts, tie-breaking, disabled links, disconnected components, self-routes and one-router topology;
- 20-router chain convergence at the safety bound;
- Link State shortest path, equal-cost selection, LSDB component boundaries, isolated router, LSA duplicate suppression and all metrics;
- Dijkstra settled ordering, tie-breaks, invalid graph inputs and path reconstruction;
- agreement of both algorithms on every pair in all shipped topology presets;
- agreement on 12 deterministic generated positive-weight graphs;
- deterministic event/snapshot output when run metadata is fixed;
- run-envelope project identity, topology revision, date-time and event-sequence behaviour.

## Manual local QA

1. Run `npm install`, then `npm test`.
2. Run `npm run build` to confirm the Vite application still bundles after the engine additions.
3. Run `npm run dev`; confirm the existing dashboard and Network Studio still render unchanged.
4. Open the browser console and confirm there are no module-loading or runtime errors.
5. Do not expect a new simulation control in the UI yet. Phase 3 is the tested engine layer; Phase 4 connects its results to the Simulation page.

## Suggested manual data checks

- Starter Network: compare all source/destination costs in both engines.
- Diamond Topology: confirm R1 chooses R2 for the equal-cost route to R4.
- Disconnected Components: confirm R5 is unreachable from R1 but has a zero-cost self-route.
- In Network Studio, disable one link and save/export the topology; a fresh engine run must omit that link.
- Change only a router's canvas position; topology revision should remain unchanged. Change a link cost or status; the new run envelope should carry the updated revision.

## Verification boundary

Pure engine and model tests run under Node. A passing `npm test` does not establish a successful browser build. The production bundle and visible application need the local manual checks above.
