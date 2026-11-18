# RouteLab — Algorithm Flowcharts

These diagrams describe the educational models implemented by RouteLab. They are not intended to represent every timer, packet format or failure-recovery rule of production RIP or OSPF.

## 1. Distance Vector — synchronous Bellman-Ford model

```mermaid
flowchart TD
    A([Start]) --> B[Validate and normalize topology]
    B --> C[Initialize each router table]
    C --> D[Freeze previous-round tables]
    D --> E[Model vector messages over active directed neighbour relationships]
    E --> F[For each router and destination, calculate neighbour candidates]
    F --> G{Any candidate improves cost or tie-break?}
    G -->|Yes| H[Write candidate into next-round table]
    G -->|No| I[Keep previous entry]
    H --> J[Finish all routers using previous snapshot]
    I --> J
    J --> K[Commit all next tables simultaneously]
    K --> L[Emit round and route-change events]
    L --> M{Any table changed?}
    M -->|Yes| N{Safety bound reached?}
    N -->|No| D
    N -->|Yes| O[Return explicit convergence-bound result]
    M -->|No| P[Return final routing tables and metrics]
    O --> Q([End])
    P --> Q
```

### Key points

- All routers calculate from the same previous-round snapshot.
- A router evaluates only active neighbours.
- Candidate cost equals local link cost plus the neighbour's previous known cost to the destination.
- Equal-cost routes use the specified deterministic next-hop tie-break.
- Tables are committed simultaneously.
- The stable check round is included in the documented round metric.

### Core recurrence

[
D_x(y)=min_{vin N(x)} {c(x,v)+D_v(y)}
]

## 2. Link State — LSA flooding and Dijkstra

```mermaid
flowchart TD
    A([Start]) --> B[Validate and normalize topology]
    B --> C[Each router originates one LSA]
    C --> D[Enqueue LSA transmissions to active neighbours]
    D --> E{Flooding queue empty?}
    E -->|No| F[Dequeue next transmission deterministically]
    F --> G{Receiver has accepted this LSA?}
    G -->|No| H[Accept LSA into local LSDB]
    H --> I[Forward to active neighbours except incoming neighbour]
    I --> E
    G -->|Yes| J[Suppress duplicate reception and record event]
    J --> E
    E -->|Yes| K[For each router, initialize Dijkstra]
    K --> L[Select unsettled router with minimum tentative distance]
    L --> M{Any reachable unsettled router remains?}
    M -->|Yes| N[Settle selected router]
    N --> O[Relax known active neighbours]
    O --> L
    M -->|No| P[Build routes and mark unreachable destinations]
    P --> Q[Validate published next-hop path consistency]
    Q --> R[Return routing tables, events and metrics]
    R --> S([End])
```

### Key points

- Each router originates one advertisement for the run.
- Flooding is deterministic and uses first-reception forwarding.
- Duplicate receptions are suppressed.
- Each router runs Dijkstra using its local link-state database.
- Unreachable destinations remain explicit.
- Published forwarding paths follow the routers' actual next-hop table decisions.

## 3. Packet Explorer — forwarding path

```mermaid
flowchart TD
    A([Select source and destination]) --> B[Load completed routing result for current topology revision]
    B --> C{Destination reachable?}
    C -->|No| D[Show unreachable result]
    C -->|Yes| E[Start at source router]
    E --> F[Read current router's route entry for destination]
    F --> G{Valid next hop and active link?}
    G -->|No| H[Stop and report invalid forwarding chain]
    G -->|Yes| I[Verify cost decreases by active link cost]
    I --> J{Destination reached?}
    J -->|No| K[Move to next hop]
    K --> F
    J -->|Yes| L[Animate validated conceptual packet path]
    D --> M([End])
    H --> M
    L --> M
```

## 4. Network failure experiment lifecycle

```mermaid
flowchart TD
    A([Choose saved baseline topology]) --> B[Create isolated experiment copy]
    B --> C[Disable/enable link or change a link cost]
    C --> D[Validate modified topology]
    D --> E[Run selected routing model from initialization]
    E --> F[Compare baseline and modified route outcomes]
    F --> G{User chooses to save experiment?}
    G -->|No| H[Discard experiment copy when leaving]
    G -->|Yes| I[Save as a separate project]
    H --> J([End])
    I --> J
```

## 5. Algorithm comparison interpretation

The directly comparable results are reachability and minimum route cost for the same source/destination and topology revision. Distance Vector rounds/vector messages and Link State LSA/Dijkstra counters must remain separately labelled because they count different types of model work. They are not elapsed-time measurements.
