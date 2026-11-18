# Simulation Studio

Phase 4 connects the Phase 3 routing engine to a replayable interface. It reads the latest saved project from the local project library, runs the selected algorithm once, and presents the generated events and snapshots without recalculating routing as playback advances.

## Behaviour

- Supports `distance-vector` and `link-state` using the shared `runRoutingAlgorithm` facade.
- Starts only from a valid saved topology. Unsaved changes in Network Studio must be saved before they can be simulated.
- Stores the project ID and topology revision with the run. A saved project identity or topology-revision change invalidates the run and requires a rerun.
- Uses event sequence numbers as the playback cursor. Play, pause, replay, previous/next and timeline seek only move through the already generated event array.
- Playback speed changes presentation delay only; it never changes algorithm output or model metrics.
- Distance Vector routing tables are selected from the most recent snapshot at or before the current event.
- Link State routing tables are replayed from the selected router's Dijkstra event stream up to the current event. The UI does not reveal the final table before that router's `dijkstra.completed` event.
- The topology graph highlights the current actor/affected routers, active message or relaxation link, settled Dijkstra vertices and selected source-to-destination path.
- The timeline renders a bounded window of 42 events to avoid excessive DOM nodes for dense 20-router topologies. The range control can seek across the complete event stream.

## Boundaries

- The algorithm engine remains UI-independent in `src/engine/algorithms`.
- No algorithm computation occurs in a playback timer.
- This phase does not animate end-to-end user packets; that is Phase 5.
- Metrics are the completed run's model counters, not elapsed playback time.
- Production RIP/OSPF timers, packet loss, asynchronous protocol timers and wire-format messages are not simulated.

## Files

- `SimulationPage.jsx` — feature composition and playback state.
- `components/SimulationRouterNode.jsx` — read-only visual router node.
- `model/simulationViewModel.js` — event/snapshot-to-view state mapping.
- `model/simulationController.js` — pure playback cursor and speed helpers.
- `simulation.css` — responsive simulation workspace styling.
