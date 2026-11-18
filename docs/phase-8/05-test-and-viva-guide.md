# RouteLab — Testing Checklist and Viva Preparation

## 1. Local release verification

Run these commands from the repository root:

```powershell
npm ci
npm test
npm run build
npm audit --audit-level=high
```

Record the actual command output in the project report. If `npm audit` reports vulnerabilities, inspect each advisory and dependency path. Do not run `npm audit fix --force` blindly.

## 2. Manual demonstration sequence

1. Open the public homepage at `/`. Explain that this is the product introduction and does not show the lab sidebar.
2. Select **Go to the lab**. Explain the dedicated lab workspace and collapsible desktop sidebar.
3. Open Network Studio. Load the Diamond Topology preset.
4. Select a router and a link. Explain stable router IDs, link endpoints, integer costs and up/down status.
5. Save the topology.
6. Open Simulation Studio. Run Distance Vector. Step through a round and inspect the previous/candidate route costs.
7. Reset and run Link State. Identify LSA origination/flooding and the Dijkstra settlement/relaxation events.
8. Open Packet Explorer. Select a reachable source/destination and inspect every forwarding hop.
9. Open Network Failure Lab. Disable a link and compare the modified route against the baseline.
10. Open Comparison Lab. Explain route-cost agreement and why algorithm-specific work counters are not a common speed score.

## 3. Viva questions and answers

### Q1. What is RouteLab?

RouteLab is a browser-based educational simulator for understanding Distance Vector and Link State routing. It lets users build a small weighted topology, inspect routing events and tables, trace a conceptual packet, test link changes and compare route outcomes.

### Q2. What is a router?

A router is a network-layer device that forwards packets between networks using routing and forwarding information.

### Q3. What is a routing table?

A routing table stores information used to reach destinations, such as destination, next hop, route cost and reachability.

### Q4. What is a next hop?

The next hop is the immediate router to which a packet should be forwarded on its way to the destination.

### Q5. What is a link cost?

A link cost is a numeric weight associated with a connection. The shortest path is the path with the lowest sum of link costs in this model.

### Q6. What is Distance Vector routing?

It is a routing approach in which routers learn path-cost information from directly connected neighbours and update their route estimates iteratively.

### Q7. Which recurrence does Distance Vector use?

The Bellman-Ford recurrence:

[
D_x(y)=min_{vin N(x)}[c(x,v)+D_v(y)]
]

### Q8. Why does RouteLab use synchronous updates?

Every router reads the same previous-round snapshot, then all next tables are committed simultaneously. This creates deterministic, easy-to-inspect classroom rounds.

### Q9. Is this a complete RIP implementation?

No. It is a synchronous educational Distance Vector model. It does not implement RIP timers, packet formats, split horizon, poisoned reverse or other production behaviours.

### Q10. What is Link State routing?

Routers distribute information about their directly connected links. Each router builds a link-state database and computes routes using a shortest-path algorithm.

### Q11. What is an LSA?

A Link State Advertisement describes a router's active directly connected neighbours and link costs in the RouteLab model.

### Q12. What is LSA flooding?

It is the process of propagating link-state advertisements through active links. RouteLab uses deterministic first-reception forwarding and suppresses duplicates.

### Q13. What is Dijkstra's algorithm?

Dijkstra's algorithm computes shortest paths from one source in a graph with non-negative edge weights by repeatedly settling the closest unsettled vertex and relaxing its neighbours.

### Q14. Why does every router run Dijkstra?

Each router needs its own routing table. Running Dijkstra from each router produces a source-specific table for every router.

### Q15. What happens when a link is disabled?

The link remains represented in the editor as down, but it is excluded from the normalized graph used by the routing algorithms. A fresh run calculates routes using the modified topology.

### Q16. What happens when a destination is unreachable?

The route is explicitly marked unreachable. The model does not invent a next hop or serialize JavaScript Infinity as a numeric route cost.

### Q17. How are equal-cost routes handled?

The model applies deterministic tie-breaking using router IDs and, where needed, a predecessor fallback. This makes repeated runs reproducible.

### Q18. Does Packet Explorer send real packets?

No. It animates a conceptual packet along a route derived from the calculated forwarding tables. It does not capture or transmit operating-system network traffic.

### Q19. How does RouteLab protect packet-path correctness?

At every hop, it reads the current router's forwarding-table entry, verifies that the next hop exists and that the link is active, and checks that the remaining route cost decreases by the current link cost.

### Q20. What is the purpose of Network Failure Lab?

It creates an isolated modified topology, reruns the selected algorithm and compares the resulting route outcomes with the baseline. The saved baseline is not silently overwritten.

### Q21. How do you compare the algorithms fairly?

Compare reachability and minimum route cost on the same topology revision. Keep Distance Vector rounds/vector messages separate from Link State LSA/Dijkstra counts because those metrics measure different kinds of work.

### Q22. What is the time complexity of Dijkstra in the current simple implementation?

With a linear search for the minimum unsettled vertex, one run is approximately (O(V^2+E)). RouteLab runs it per source router.

### Q23. Why is the routing engine independent from React?

It makes graph and algorithm logic independently testable. The UI consumes structured results rather than implementing or modifying routing calculations.

### Q24. Where are projects stored?

In the browser's LocalStorage. Users can also export/import schema-versioned JSON project files. The current version has no cloud backend or account system.

### Q25. What are the main limitations?

The model uses undirected links, small topologies, synchronous Distance Vector rounds and simplified LSA flooding. It is educational and does not claim full RIP/OSPF protocol compliance.

## 4. Screenshot and evidence checklist

- [ ] Public homepage.
- [ ] Network Studio with at least four routers and weighted links.
- [ ] Distance Vector event details and routing table.
- [ ] Link State LSA flooding and Dijkstra event details.
- [ ] Packet Explorer showing source, destination and route.
- [ ] Network Failure Lab baseline and modified topology.
- [ ] Comparison Lab route and algorithm metric sections.
- [ ] Expanded and collapsed desktop sidebar.
- [ ] Mobile lab navigation.
- [ ] Passing `npm test` output.
- [ ] Successful `npm run build` output.
- [ ] `npm audit` result and any accepted/remaining advisory notes.
- [ ] Public deployment URL and direct-route refresh test.
