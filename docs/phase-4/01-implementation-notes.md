# Phase 4 implementation notes

## Data source and run lifecycle

The Simulation Studio reads `getLastProject()` from the existing local project library, with the most recently saved valid project as a fallback. The simulator does not read unsaved React Flow state from Network Studio. Users must explicitly save their topology before running an algorithm.

On Run, the page calls `runRoutingAlgorithm(project, algorithm)` exactly once and retains the returned run envelope. Playback traverses the already generated `events` array; no algorithm is rerun by the timer, step buttons or range slider.

Each run is tied to `projectId` and `topologyRevision`. `saveProject` dispatches a same-tab `routelab:project-saved` event after a successful write; the simulation page also listens for browser `storage` events. A different project ID or topology revision clears the current run and asks the user to rerun. Name or canvas-position edits do not increment topology revision under the existing Phase 0 contract and do not invalidate routing results.

## Playback model

- The event cursor is an array index, matching the engine's contiguous `event.sequence` values.
- `-1` represents the reset / not-yet-started position.
- Run starts at event 0 and auto-plays. Pause stops cursor movement; Resume continues from the current cursor.
- Replay after the final event returns to the first event.
- Previous/Next stop playback before moving exactly one event.
- Timeline seeking stops playback and jumps to the chosen event sequence.
- Reset preserves the run envelope and moves the cursor to `-1`.
- Speed changes alter only the UI timer delay (0.5×, 1×, 2×, 4×, 8×). Run results and metrics remain unchanged.

## Snapshot and table mapping

### Distance Vector

The visible table for a selected router is taken from the latest `run.snapshots` item with `snapshot.sequence <= currentEvent.sequence`. The engine emits an initialization snapshot and a snapshot after each completed round, so table changes appear only at the defined round boundaries, after the simultaneous commit.

### Link State

The event stream contains detailed Dijkstra progress for each source. The table view replays only events from that selected source's `dijkstra.started` through the current event. It initializes source cost to zero, applies `vertex.settled` and `relaxation.updated` events, and marks the table complete only after that source's `dijkstra.completed` event. It must not show the final table early.

The latest fully available LSA/route snapshots remain inspectable through the engine envelope. Current phase UI emphasizes the active Dijkstra table and flooding activity rather than displaying unbounded raw LSDB objects.

## Topology visualization

The canvas is read-only in this phase. Router positions and link statuses/costs come from the saved project. Current event actor/affected routers are highlighted. Events with `fromRouterId` and `toRouterId` highlight the matching undirected link. Dijkstra-settled routers receive a distinct settled state. A selected route in the routing table highlights its path across active links only. Disabled links remain visible with a dashed danger treatment and cannot be highlighted as active traffic.

## Event timeline and performance

The full event stream is retained in memory as produced by the engine. Only the latest 42 events up to the current cursor are mounted in the event list. The range control can seek the complete stream. Event sequence numbers are contiguous and correspond to event-array indices, allowing direct indexing instead of scanning the whole event stream on each animation frame.

For dense supported topologies, Link State can emit many detailed relaxation events. The bounded timeline prevents rendering tens of thousands of rows simultaneously. Playback remains deliberately step-based; users can seek quickly using the range control or choose 4×/8× speed.

## Metrics and educational boundaries

Distance Vector metrics are shown as executed rounds, rounds with changes, directed full-vector transmissions and active/disabled link counts. Link State metrics are shown as LSA originations, LSA transmissions, duplicate suppressions and Dijkstra runs/settled vertices. These counts are different categories of simulated work and are not presented as interchangeable measures of elapsed time.

The UI describes the algorithms as educational models inspired by RIP-style Distance Vector and OSPF-style Link State. It does not claim to implement complete production protocols or actual network packets.
