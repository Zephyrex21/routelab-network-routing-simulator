# Algorithm comparison model

`runAlgorithmComparison(project)` runs Distance Vector and Link State against the same validated project and builds route comparisons for every ordered source/destination pair. It returns the two original engine envelopes, per-algorithm work profiles, the selected-source route table data, and global agreement counts.

The direct, fair comparison is reachability, minimum route cost, selected path, next hop and hop count on the same topology. Equal-cost alternative paths are recorded separately from cost disagreement.

Distance Vector rounds/vector messages and Link State LSA/Dijkstra counters remain in separate work profiles. They are different categories of educational model work, not wall-clock performance or one shared speed score.

`runFailureScenarioComparison` creates an isolated one-link topology variant, reruns both algorithms from initialization on baseline and variant, and compares the chosen source/destination route for each algorithm. It does not modify or save the original project.
