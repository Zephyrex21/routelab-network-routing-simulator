# Expected Results Fixtures

These cases should become automated tests when the engine is implemented.

## Case A — Shortest path and alternate path

Undirected links:

- R1–R2: 4
- R2–R3: 3
- R1–R3: 10

Expected R1→R3: cost `7`, route `R1 → R2 → R3`.

After disabling R2–R3, expected R1→R3: cost `10`, route `R1 → R3`.

## Case B — Equal-cost alternatives

Undirected links:

- R1–R2: 2
- R2–R4: 4
- R1–R3: 3
- R3–R4: 3

Expected R1→R4 minimum cost: `6`. Two routes exist. Under the specified next-hop tie-break, a router selects the lexicographically smaller first-hop ID when the total costs are equal; with IDs R2 and R3, R2 wins for R1.

## Case C — Disconnected component

Undirected links:

- R1–R2: 5
- R3 is isolated.

Expected R1→R3: unreachable. Expected R3→R3: cost `0`.

## Case D — Source equals destination

For any valid topology, selecting source and destination as the same router produces a one-router path, cost `0`, and zero link traversals.

## Test implementation note

Use the fixtures to assert final costs, reachability, next hop, path validity and determinism. Do not assert event ordering until the event ordering specification in `05-algorithm-specification.md` has been implemented exactly.
