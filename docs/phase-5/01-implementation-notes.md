# Phase 5 implementation notes

## Packet Explorer route derivation

Packet Explorer uses the saved topology and a completed run from `runRoutingAlgorithm(project, algorithm)`. The run must match both the selected project's `projectId` and `topologyRevision`.

The route is not invented by the page and is not recalculated using a second shortest-path algorithm. The pure `createPacketRoute` model starts at the selected source. At each router it reads that router's own final routing-table entry for the destination, obtains its `nextHopRouterId`, and verifies that the router is connected to that next hop by an enabled topology link. The next router's remaining cost must equal the current router's remaining cost minus the traversed link cost.

The model tracks visited routers to detect loops, limits traversal to the topology router count, verifies that accumulated link cost equals the source table cost, and verifies that the derived hop path agrees with the source entry's stored path. Any failed invariant returns an invalid route result and prevents packet animation.

A destination in a disconnected component returns an explicit `unreachable` result with no path and no forwarding decisions. Source-equals-destination is a valid zero-hop, zero-cost route.

## Packet presentation

`PacketExplorerPage.jsx` runs the selected algorithm once when the user requests a forwarding route. Playback advances a cursor over the already derived hop sequence. Play, pause, previous, next, reset and playback speed affect presentation only. The SVG topology is a view of the saved project's router positions and links; route highlighting comes from the validated forwarding path. The packet marker is a conceptual marker and does not represent an actual IP packet emitted on a network.

When a saved project event announces a different project ID or topology revision, the current run is discarded and the user is prompted to generate a new one.

## Network Failure Lab

`createLinkExperiment` creates an isolated copy of the baseline project. It can change one link's status (`up`/`down`) or cost (integer 1–999), increments the variant's topology revision, and validates the variant before returning it. The original project object and its saved copy are not modified.

On analysis, the selected algorithm is run from initialization against both the baseline and modified variant. Both run results are passed through the same Packet Explorer route validator. `comparePacketRoutes` classifies reachability, path and cost outcomes for the selected source/destination pair.

An experiment may optionally be saved as a separate project with a new project ID. It never silently overwrites the baseline. Saving makes the new variant the latest workspace project through the existing project-store contract.

## Educational boundaries

This phase models a fresh algorithm run after a topology edit. It must not be described as live RIP/OSPF failure recovery or timed convergence. Packet movement is conceptual; no IP packet bytes, packet loss, delay, queues, retransmission or real router forwarding are simulated. Phase 6 remains responsible for cross-algorithm comparison.


## Equal-cost Link State forwarding suffixes

When independent routers have multiple equal-cost shortest paths, a downstream router can choose a different shortest-path suffix than the one in the source router's Dijkstra predecessor tree. The Link State engine therefore publishes `finalTables[*].path` as the validated next-hop chain across the routers' own final forwarding tables, with a strict decreasing-cost check. The per-source Dijkstra snapshots remain unchanged for teaching how that source's Dijkstra run settled vertices and selected predecessors. Packet Explorer continues to reject any inconsistent forwarding chain.
