# Simulation execution and playback

The Phase 3 algorithm engine returns deterministic run envelopes containing contiguous event sequence numbers, snapshots, final tables and algorithm-specific metrics. Phase 4 consumes those outputs without changing the algorithm modules.

Playback is a presentation concern. A cursor selects an event; snapshots and event reducers map the visible cursor to router/table state. Timers may advance the cursor, but must never recompute the graph or call `runRoutingAlgorithm`.
