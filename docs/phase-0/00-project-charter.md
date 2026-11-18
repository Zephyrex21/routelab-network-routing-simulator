# 00 — Project Charter and Scope

**Product:** RouteLab  
**Project type:** Computer Networks educational mini-project  
**Version:** 0.1 / Phase 0  
**Status:** Foundation specification

## 1. Product statement

RouteLab is a browser-based learning laboratory for exploring how routers exchange routing information and select paths through a network. Learners will create or load a topology, select Distance Vector or Link State routing, inspect the calculation step by step, explore routing tables, and run controlled network-change experiments.

## 2. Problem being addressed

Routing algorithms are often taught through equations, static diagrams and final routing tables. Those representations can hide the sequence of neighbour updates, topology knowledge and next-hop decisions that produce the final route. RouteLab makes those intermediate decisions observable.

## 3. Target users

- Primary: undergraduate Computer Networks students.
- Secondary: instructors or learners who want a small, repeatable routing demonstration.

The application is educational, not a network operations product.

## 4. Learning outcomes

After using the initial release, a learner should be able to:

1. Construct and interpret a weighted router topology.
2. Explain how Distance Vector routers update estimates using neighbour information.
3. Explain how Link State routers distribute link-state information and use Dijkstra's algorithm.
4. Read a routing table and identify destination, next hop and path cost.
5. Explain why a link-cost change or failure can change the selected path.
6. Compare the algorithms without treating unlike internal event counts as equivalent measures of real-world speed.

## 5. First-release scope

### Included

- Router and link topology editor.
- Undirected links with positive integer costs.
- Predefined example topologies and local project saving.
- Distance Vector educational simulation.
- Link State educational simulation with LSA flooding and per-router Dijkstra.
- Inspectable steps, event history and routing tables.
- Source-to-destination packet-path visualization based on calculated routes.
- Link disable/enable and link-cost editing, followed by a fresh run.
- Side-by-side algorithm results and explicitly labelled model metrics.
- Responsive light/dark interface.

### Excluded from the first release

- Live capture of operating-system network traffic.
- Real router configuration or device integration.
- Full standards-compliant RIP or OSPF protocol implementations.
- Authentication, accounts, cloud synchronization or collaboration.
- Real-time distributed execution across independent machines.
- Packet loss, congestion, transport-layer retransmission, or physical-layer modelling.
- Dynamic protocol recovery semantics such as split horizon, poisoned reverse, hold-down timers and triggered updates.

## 6. Modelling constraints

- Links are bidirectional in the first release.
- Link costs are positive integers in the supported range 1–999.
- A link can be `up` or `down`; down links are ignored by both algorithms.
- A router may be isolated or in a disconnected component.
- The initial editor should target small classroom topologies (recommended range: 2–20 routers). This is a usability target, not a claim about algorithmic capacity.
- A change to topology or link cost invalidates the previous run and starts a new simulation from initialization.
- Algorithms are deterministic: the same normalized input must produce the same result and event sequence.

## 7. Definition of done

The first release is complete when a user can build or load a network; run both supported algorithms; inspect intermediate events and routing tables; select a source and destination; see the packet path derived from a routing result; change a link or cost and rerun; compare results; and understand all displayed metrics through the interface and documentation.

## 8. Product principle

**Every visual claim must be backed by the simulation model.** The UI must never invent a shortest path, route update, packet hop or convergence result for the sake of animation.
