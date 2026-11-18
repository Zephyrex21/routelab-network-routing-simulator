# RouteLab Data Contracts

The domain network model is intentionally separate from the React Flow view model. React Flow nodes/edges are an editor representation; the network project below is the source of truth for routing calculations.

## Network project

See [`network-project.schema.json`](network-project.schema.json) and [`example-network-project.json`](example-network-project.json).

Top-level fields:

- `schemaVersion`: persisted format version.
- `projectId`, `name`, timestamps.
- `topologyRevision`: incremented on algorithm-relevant topology edits. Canvas-only moves do not change this revision.
- `routers`: stable router IDs and canvas positions.
- `links`: undirected connection endpoints, positive integer cost and status.

## Simulation run

See [`simulation-run.schema.json`](simulation-run.schema.json) for the common run envelope. Phase 3 returns the algorithm identifier (`distance-vector` or `link-state`), event stream, final routing tables, metrics and replay snapshots. Snapshots reference the event sequence after which they are valid. Phase 4 consumes the envelope as immutable playback input. Phase 5 Packet Explorer consumes `finalTables` as forwarding entries at each hop; it verifies the next-hop link and cost before showing a conceptual packet journey.

## Serialization rules

- Never serialize JavaScript `Infinity` or `NaN` into JSON.
- Use `cost: null` with `status: "unreachable"` to represent an unreachable route.
- Use `nextHopRouterId: null` for both self and unreachable entries; distinguish them using `destinationRouterId` and `status`.
- IDs are stable strings; do not use array positions as identity.
- Timestamps are ISO-8601 UTC strings.
- Reject unsupported schema versions with a clear message; do not silently reinterpret them.
