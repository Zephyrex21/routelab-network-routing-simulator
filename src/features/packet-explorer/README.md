# Packet Explorer — Phase 5

Packet Explorer consumes a completed Phase 3 routing result and builds a hop-by-hop forwarding journey from each router's own final routing-table entry for the selected destination.

## Behaviour

- Uses the latest saved project and requires a routing run tied to the same `projectId` and `topologyRevision`.
- Supports both `distance-vector` and `link-state` final results.
- Resolves each next hop from `finalTables[currentRouterId]`, not from a guessed path or a separate shortest-path calculation in the UI.
- Confirms that every next hop is a known router connected by an enabled link.
- Checks for forwarding loops, inconsistent remaining costs and disagreement with the source table's reconstructed path.
- Returns an explicit unreachable result and never animates an unreachable destination.
- Supports source-equals-destination as a successful zero-hop, zero-cost delivery.
- Animates a conceptual packet marker using discrete hop progression. Playback speed changes presentation only.
- Invalidates a displayed run when a different saved project or topology revision is announced.

## Boundaries

- The animation is conceptual. No real IP packet is emitted, and no packet bytes, queues, delay, loss, retransmission or transport-layer delivery are modelled.
- The engine result is generated once when the user requests a route. Playback does not rerun an algorithm.
- Every forwarding decision must correspond to an active undirected topology link and to the current router's own destination entry.

## Files

- `PacketExplorerPage.jsx` — endpoint selection, engine execution and playback controls.
- `components/PacketTopologyView.jsx` — SVG topology/path/packet visualization shared with the Failure Lab.
- `model/packetRouting.js` — pure next-hop-by-next-hop forwarding validation and route construction.
- `packet-explorer.css` — responsive workspace and motion styling.
