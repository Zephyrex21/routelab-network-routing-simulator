# 02 — User Flows and Screen Map

## Primary navigation

1. **Overview** — recent projects, quick start and learning context.
2. **Network Studio** — create/edit topology and configure an experiment.
3. **Simulation** — inspect algorithm steps, events and routing tables.
4. **Packet Explorer** — choose endpoints and inspect a calculated route.
5. **Compare** — review both algorithms on one topology.

A router/table inspector and event log may appear as contextual panels inside Network Studio and Simulation rather than separate top-level pages.

## Flow A — First-time user

1. Open Overview.
2. Read the one-sentence description and choose **Start with a sample network** or **Create network**.
3. If creating, name the network and enter Network Studio.
4. Add routers and links or load a preset.
5. Validate the topology.
6. Choose Distance Vector or Link State and start a run.
7. Inspect events, routing tables and final result.

**Success:** the learner reaches a correct final routing table without needing to understand every editor control first.

## Flow B — Build a custom network

1. Open Network Studio.
2. Add routers from the toolbar; each receives a unique ID.
3. Connect two routers; a link inspector opens.
4. Set cost (integer 1–999) and status (up/down).
5. Repeat until the topology is ready.
6. Validate; the app reports isolated routers as valid but identifies them clearly.
7. Save locally.

**Validation errors:** missing endpoint, duplicate link, self-link, duplicate ID, non-integer/zero/negative cost, or unsupported router count.

## Flow C — Run and inspect Distance Vector

1. Select Distance Vector.
2. Start the simulation.
3. Initial state shows self cost 0, directly connected active neighbours and all other destinations unreachable.
4. Step through synchronous neighbour-table exchange rounds.
5. Highlight routers whose entries changed in the current round.
6. Stop when a round makes no table changes; expose the final table for every router.

## Flow D — Run and inspect Link State

1. Select Link State.
2. Start the simulation.
3. Show each router originating an LSA describing its active directly connected links.
4. Show LSAs being flooded through active links; duplicate LSAs are ignored after first acceptance.
5. Show each router's resulting link-state database.
6. Run Dijkstra from each router and reveal its final routing table.

## Flow E — Packet route exploration

1. Open Packet Explorer.
2. Select source and destination routers.
3. Select which algorithm's final result to use (or choose the latest successful run).
4. If the destination is unreachable, show this state and do not animate a route.
5. Otherwise show the ordered hop list, total cost and hop count.
6. Play a restrained packet marker animation along those exact links.

The animation represents a conceptual packet path; it is not a real packet emitted onto a network.

## Flow F — Network change experiment

1. Return to Network Studio.
2. Disable/enable a link or adjust its cost.
3. Mark the previous simulation as stale.
4. Ask the user to rerun the selected algorithm or both algorithms.
5. Run from initialization with the updated topology.
6. Compare old and new path/table results when both are available.

## Screen responsibilities

| Screen | Primary job | Key elements |
|---|---|---|
| Overview | Orient and start | Project cards, presets, recent activity, brief learning prompts |
| Network Studio | Edit topology | Canvas, tool palette, properties inspector, validation, save |
| Simulation | Understand algorithm | Canvas highlights, step controls, event list, algorithm state |
| Routing Explorer | Inspect router decisions | Router selector, destination table, changed-entry indicators |
| Packet Explorer | Follow a path | Source/destination, route summary, hop list, packet animation |
| Compare | Contrast models | Final cost/path, DV rounds/messages, LSA transmissions, Dijkstra statistics |

## Navigation and state rules

- The active project is always visible in the workspace header.
- Switching algorithms does not mutate the topology.
- Editing a topology marks prior runs as stale; stale results must not be presented as current.
- Changing only canvas zoom or router positions does not invalidate algorithm results.
- A failed validation does not discard the user's edits.
- Resetting a run does not delete the saved topology.
