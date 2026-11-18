# Phase 6 implementation notes

## Comparison input and run lifecycle

The Comparison Lab reads the latest saved project from the existing local project library. It executes Distance Vector and Link State against the same `projectId` and `topologyRevision`. Each algorithm is run from initialization through the existing `runRoutingAlgorithm` facade; the comparison feature does not reimplement either algorithm.

The comparison result is bound to the project ID and topology revision. A saved topology change invalidates previous comparison output and asks the learner to run again. Position/name-only updates with an unchanged topology revision do not invalidate routing results.

## Directly comparable route outcomes

`algorithmComparison.js` derives each ordered source/destination route through the Phase 5 `createPacketRoute` validator. This reuses strict forwarding-table next-hop validation, active-link checks, remaining-cost invariants, loop detection and route-path consistency checks.

For every ordered source/destination pair, including self-routes, it compares:

- Reachability.
- Minimum route cost when both algorithms reach the destination.
- Selected path and first hop.
- Equal-cost alternate paths, which are distinguished from cost disagreements.

The selected-source routing table lists every destination with each algorithm's next hop, cost, path and agreement classification. The route-cost chart places both algorithms on one shared scale because minimum path cost is the same unit and can be compared directly.

## Algorithm-specific work profiles

The work profiles intentionally remain separate:

### Distance Vector

- `roundsExecuted`: includes the final stable-check round.
- `roundsWithChanges`: rounds that changed at least one route entry.
- `vectorMessages`: full-vector transmissions for active directed neighbour relationships.
- `routeUpdates`: count of `distance-vector.route.updated` events.

### Link State

- `lsaOriginations`: locally originated LSAs.
- `lsaTransmissions`: actual deterministic flooding sends, including copies later received as duplicates.
- `lsaAcceptances`: first-time remote LSA receipts.
- `lsaDuplicatesSuppressed`: duplicate receptions ignored.
- `dijkstraRuns`: one per router.
- `dijkstraSettledVertices`: total finite-distance vertices settled across runs.
- `dijkstraRelaxationAttempts`: adjacency entries examined across runs.

These values count different categories of educational model work. The interface does not combine them into one speed index and does not claim they represent wall-clock convergence time or physical network traffic.

## Link-change sensitivity experiment

The comparison page reuses `createLinkExperiment` to create an isolated one-link variant. It runs both algorithms from initialization on both the baseline and the variant, then uses `createPacketRoute` and `comparePacketRoutes` to classify the source/destination outcome for each algorithm.

The baseline project is not mutated or saved by this action. A result is retained only for the currently selected saved project ID and topology revision. The experiment is not live protocol failure recovery; it is a fresh-run sensitivity analysis after a topology change.

## UI structure

- Saved topology facts and source/destination selection.
- Run-both-algorithms action.
- All-pairs agreement summary.
- Selected route cards for both algorithms.
- Shared-scale minimum-cost chart for the selected source.
- Full selected-source routing-table comparison.
- Separate algorithm-specific work profiles with metric definitions.
- One-link baseline/modified experiment with before/after route outcomes.

The screen uses the existing RouteLab design tokens and remains responsive. All chart elements are rendered with DOM/CSS bars so the visualization stays lightweight and uses no additional chart dependency.


## Regression discovered during generated-network validation

Generated positive-weight graphs exposed an equal-cost Link State case where a source's Dijkstra predecessor suffix differed from the next-hop choices in downstream routers' own final tables. The source cost and first hop were valid, but the Phase 5 packet validator correctly rejected the mismatched stored path. The Link State engine was tightened so published final-table paths follow per-router next hops and verify exact remaining-cost reduction at every hop. Source-specific Dijkstra snapshots are preserved for the simulation's algorithm-step visualization. The comparison tests now include this topology as a regression case.
