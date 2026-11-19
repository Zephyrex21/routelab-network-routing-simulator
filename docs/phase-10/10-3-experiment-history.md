# Phase 10.3 — Experiment History

## Purpose

Give learners a durable local record of routing experiments so they can revisit the topology and algorithm that produced a result, even after the active project changes.

## Stored record

Each successful run creates a compact history entry containing:
- Experiment and engine run IDs.
- Selected algorithm and project identity/name.
- A validated, immutable topology snapshot and topology revision.
- Run start/completion timestamps, event count and numeric algorithm metrics.
- A short algorithm-specific summary.

The full event array, snapshots and final routing tables are not duplicated in local storage. Replaying an entry runs the existing deterministic engine against its saved topology snapshot and original run ID/start time, reconstructing its timeline and tables.

## Learner controls

- Successful simulations are saved automatically.
- History displays algorithm, project, date, topology revision, event count and summary metrics.
- Replay restores the saved topology into Simulation Studio without changing the active project stored in Network Studio.
- A History replay indicator and Return to active project action distinguish a saved experiment snapshot from the current active topology.
- Entries can be deleted individually or cleared together.
- The latest 20 valid experiments are retained.

## Storage and safety

History uses the separate versioned `routelab-experiment-history-v1` local-storage key. The topology project library format is unchanged. Records are validated before use; damaged or unsupported history is preserved instead of silently reset. Storage quota/write failures do not discard the current in-memory simulation.

## Validation

Node tests cover valid storage, snapshot isolation, deterministic replay, invalid records, corruption preservation, write failures, retention, deletion and clearing. Chromium smoke tests cover auto-save, replay, return to active project, individual delete and clear-all.

Run the full release gate with `npm run check:release`.
