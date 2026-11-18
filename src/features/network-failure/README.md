# Network Failure Lab — Phase 5

The Network Failure Lab creates temporary, revision-incremented variants of a valid saved topology. It recalculates the selected routing algorithm against both the original project and the modified variant, then compares the source-to-destination forwarding result.

## Behaviour

- Supports disabling a link, enabling a disabled link, or changing a link cost from 1 to 999.
- Rejects unknown links, unsupported operations, invalid costs and no-op changes.
- Does not mutate or overwrite the baseline saved project during analysis.
- Runs the selected algorithm from initialization on the baseline and modified topology.
- Derives both routes through the shared Packet Explorer forwarding validator.
- Classifies outcomes such as unchanged, route changed, cost changed, equal-cost alternative, became unreachable, became reachable and still unreachable.
- Shows before/after topology views and source-to-destination route summaries.
- Can save the experiment as a separate new project; the original saved topology remains preserved.

## Boundaries

- This is a fresh-run topology experiment, not live protocol failure recovery.
- It does not model production router timers, triggered updates, packet loss, convergence time or asynchronous recovery.
- It compares one selected routing algorithm at a time. Cross-algorithm comparison is Phase 6.

## Files

- `NetworkFailureLabPage.jsx` — experiment configuration, before/after run orchestration and result presentation.
- `model/failureExperiment.js` — pure topology variant creation and route-outcome classification.
- `network-failure.css` — responsive experiment workspace styling.
