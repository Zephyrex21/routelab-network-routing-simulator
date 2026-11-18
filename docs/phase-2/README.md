# Phase 2 — Interactive Network Topology Builder

Phase 2 turns the Network Studio shell into a working topology editor. It adds editable router nodes, weighted undirected links, topology presets, validation, local project persistence and JSON import/export.

## Included

- Add up to 20 routers with stable `R<number>` IDs.
- Move routers on a React Flow canvas; saved positions are part of the project.
- Connect router handles to create undirected links with a default cost of 5.
- Select and rename routers without changing their stable IDs.
- Select links to edit cost (integer 1–999), enable/disable, or delete.
- Remove a router and its connected links together.
- Load three documented topology presets.
- Create a new one-router project, save/open projects in local storage, and delete saved copies.
- Import/export schema-versioned JSON projects.
- Validate projects before save, import, and export.

## Run

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

The tests use Node's built-in test runner and exercise the pure project model, strict validation, presets, storage behaviour and compatibility with the canonical Phase 0 example.

See [`04-phase-2-signoff.md`](04-phase-2-signoff.md) for the implementation and verification record.

## Scope boundary

Phase 2 does not execute Distance Vector or Link State algorithms, animate packets, or claim to simulate live routing-protocol failure recovery. Those behaviours remain assigned to later phases.
