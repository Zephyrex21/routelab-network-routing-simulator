# Phase 4 automated and manual QA

## Automated coverage

Run `npm test`. The Phase 4 view-model tests cover:

- Latest-snapshot lookup at, before and after snapshot boundaries.
- Distance Vector initial and converged routing-table selection.
- Link State Dijkstra table progress without revealing future results.
- Link State source-table completion only at the matching `dijkstra.completed` event.
- Persistence of a completed source table after subsequent routers start Dijkstra.
- Current actor/affected-router and link-pair highlighting.
- Event labels and bounded timeline windows.
- Playback cursor clamping, speed delays and progress calculations.

The existing topology and routing-engine suites remain part of the same run.

## Manual browser QA

1. Open Network Studio, load a preset or create a topology, and save it.
2. Open Simulation Studio. Confirm the saved project name, router count, active-link count and topology revision are shown.
3. Select Distance Vector and run. Confirm the first event appears, playback advances, and the active router/link highlights change with the event.
4. Pause. Wait several seconds and confirm the cursor does not move.
5. Press Next and Previous. Confirm one event is traversed per action and the event highlight/table state follows the cursor.
6. Drag the timeline range slider to the beginning, middle and end. Confirm seeking pauses playback and the current event is selected.
7. Change speed. Confirm only playback rate changes; event count, routing results and metrics remain identical.
8. Inspect Distance Vector tables at initialization and after round-completed events. Confirm the table changes at snapshot boundaries, not during the middle of an advertisement round.
9. Reset, replay and reach the final event. Confirm Replay starts again from the beginning.
10. Change to Link State and run. Confirm LSA originations/transmissions/acceptances appear before the flooding-completed event and Dijkstra begins afterward.
11. Select each router as the routing-table source. Confirm its table begins showing tentative costs only after that router's Dijkstra starts and is marked complete only at its own completion event.
12. Select a destination. Confirm its known source-to-destination path highlights active topology links. Select an unreachable destination in a disconnected topology and confirm no path is highlighted.
13. In Network Studio, change a link cost/status and save. Return to Simulation Studio (or save from another tab) and confirm the old run is invalidated when topology revision changes.
14. Save only a router label/position change. Confirm topology revision does not change and route results are not unnecessarily invalidated.
15. Test light/dark mode, smaller viewport, reduced-motion preference, keyboard focus and scroll behaviour.

## Known boundaries

- Runs execute synchronously before playback. The playback controls replay the generated stream; they do not execute the routing algorithm incrementally.
- Local unsaved topology edits are not passed to Simulation Studio. Save the project first.
- Actual packet transmission animation remains Phase 5.
- A production Vite build and browser smoke test must be run in the local environment after `npm install`.
