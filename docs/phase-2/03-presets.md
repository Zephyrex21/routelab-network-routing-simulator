# Topology presets

Presets are instructional starting points. Their node positions are for layout only; only active link costs define the graph's routing weights.

| Preset | Routers | Links | Teaching purpose |
|---|---:|---:|---|
| Starter Network | 5 | 6 | Several alternative routes with varied link costs. |
| Diamond Topology | 4 | 5 | Equal-cost alternative paths and deterministic tie-breaking. |
| Disconnected Components | 5 | 3 | Two connected components plus one isolated router. |

All presets use positive integer costs and undirected links, and are validated against the Phase 0 project contract in automated tests.
