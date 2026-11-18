# Comparison Lab — Phase 6

The live Comparison Lab runs the Phase 3 Distance Vector and Link State engines against the same saved project ID and topology revision. It calculates all ordered source/destination pairs, compares reachability, minimum route cost and selected forwarding path, and exposes a selected-source routing-table comparison.

The chart plots one shared quantity—minimum route cost—on one common scale. Algorithm-specific work counters are shown in separate profiles. Distance Vector update rounds, vector messages, Link State LSA transmissions/acceptances, and Dijkstra operations are different categories of educational model work; they are not combined into a speed score and do not represent wall-clock time.

The one-link failure comparison creates an isolated revision-incremented variant, reruns both algorithms from initialization on baseline and modified projects, and compares the selected source/destination route. The saved baseline is not mutated or overwritten. This is a fresh-run sensitivity experiment, not live RIP/OSPF failure recovery.
