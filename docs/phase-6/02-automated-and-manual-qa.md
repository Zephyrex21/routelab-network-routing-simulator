# Phase 6 automated and manual QA

## Automated coverage

`tests/algorithm-comparison.test.js` covers:

1. Both algorithms receive the same project identity and topology revision.
2. All ordered pair costs agree on the Starter, Diamond and Disconnected presets.
3. Equal-cost path handling is distinguished from a cost mismatch.
4. Selected-source routing table rows contain next hop, cost and path for every destination.
5. Mutually unreachable pairs remain explicit and are not counted as reachable cost comparisons.
6. Work-profile values match the source engine metrics and event stream.
7. Comparison does not mutate the saved topology.
8. Invalid/missing projects and unknown endpoints are rejected safely.
9. Link-disable experiments show equal-cost alternatives and unreachable transitions correctly.
10. Cost-change experiments recalculate both algorithms.
11. A one-router self-route compares as zero cost and zero hops.

The suite is run with `npm run test:comparison`; the full repository suite is run with `npm test`.

## Manual browser QA checklist

- [ ] Save a Starter Network project in Network Studio, then open Compare algorithms.
- [ ] Confirm the selected project name, revision, router count and active/disabled link counts are correct.
- [ ] Run both algorithms and confirm the selected route cards and all-pairs summary appear.
- [ ] Change source router and confirm the route-cost chart and routing table update without rerunning the algorithms.
- [ ] Change destination router and confirm the selected route cards update.
- [ ] Load the Diamond topology and confirm equal-cost path behaviour is explained accurately.
- [ ] Load Disconnected Components and confirm unreachable destinations show no next hop or finite cost.
- [ ] Read the separate Distance Vector and Link State metric definitions; confirm no mixed speed score is shown.
- [ ] Disable a link in the sensitivity experiment and run both algorithms; confirm baseline and modified routes are shown for both.
- [ ] Change a link cost and confirm route costs are recalculated.
- [ ] Confirm the original saved project remains unchanged after a sensitivity experiment.
- [ ] Save a new topology revision from Network Studio and return to Compare; confirm stale results are cleared.
- [ ] Check light theme, dark theme, narrow viewport and horizontal table overflow.

## Build verification

Run `npm test` and `npm run build` locally after installing dependencies. A clean test suite does not substitute for a Vite build or browser interaction check.
