# Phase 4 — Simulation Studio

Phase 4 connects the tested Distance Vector and Link State engines to an interactive, replayable learning workspace. The simulation page loads the latest saved topology, executes the chosen model once, and replays the engine's recorded event stream and snapshots.

## Deliverables

1. Algorithm selector for Distance Vector and Link State.
2. Run, play, pause, replay, previous, next and reset controls.
3. Playback-speed selection that affects display timing only.
4. Event timeline with bounded recent-event rendering and full-stream seeking.
5. Read-only topology visualization with router, link, path and Dijkstra-settled highlighting.
6. Routing-table inspection by source router and selected destination.
7. Distance Vector snapshot-based table updates.
8. Link State Dijkstra progress reconstructed only from events visible at the current cursor.
9. Algorithm-specific metrics and explicit educational-model notes.
10. Run invalidation when a different saved project or topology revision is detected.

## Read next

- [`01-implementation-notes.md`](01-implementation-notes.md)
- [`02-automated-and-manual-qa.md`](02-automated-and-manual-qa.md)
- [`03-phase-4-signoff.md`](03-phase-4-signoff.md)
