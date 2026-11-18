# Phase 2 implementation notes

## Architecture

- `src/features/topology/NetworkStudioPage.jsx` composes the editor workspace and interactions.
- `src/features/topology/components/RouterNode.jsx` renders the custom router node and connection handles.
- `src/features/topology/model/projectModel.js` owns project creation, React Flow conversion, ID helpers, connection checks and validation.
- `src/features/topology/model/projectStore.js` owns versioned browser-local project-library persistence.
- `src/shared/data/presets/topologyPresets.js` provides three reproducible educational topologies.
- `src/styles/global.css` contains the Phase 2 canvas, node, inspector, dialogs and responsive styling.

The editor's React Flow state is the interactive representation. Before save/export/validation it is normalized into the Phase 0 `RouteLab Network Project` contract.

## Data contract preserved

A project retains:

- `schemaVersion: 1`
- `projectId`, `name`, `createdAt`, `updatedAt`
- `topologyRevision`
- `routers`: `{ id, label, position: { x, y } }`
- `links`: `{ id, sourceRouterId, targetRouterId, cost, status }`

Link endpoints are represented with `source` and `target` only for graph-canvas rendering. The persisted project model calls them `sourceRouterId` and `targetRouterId` and treats the connection as undirected.

## Validation rules enforced in the editor

- One to twenty routers per project.
- Router IDs follow the project contract's safe identifier pattern.
- Router labels contain 1–40 characters.
- Router coordinates must be finite numbers.
- Link IDs are unique.
- Both link endpoints must exist.
- Self-links are rejected.
- Duplicate undirected endpoint pairs are rejected even if the endpoint order is reversed.
- Link cost must be an integer in the range 1–999. Re-committing an unchanged valid cost is a no-op and does not mark the project dirty.
- Link status must be `up` or `down`.
- A project must retain at least one router.
- Unsupported schema versions and invalid timestamps are rejected.

## Interaction notes

- Select mode: select items, inspect them and drag routers.
- Connect mode: drag from a blue source handle to a target handle on another router.
- Connect mode: node dragging is disabled while link creation is active, reducing accidental movement.
- Pan mode: drag the canvas without moving nodes.
- Add router: inserts the next available numeric router ID near the current viewport center.
- Edge labels show the configured cost. Disabled links remain visible with a dashed danger treatment so their existence is clear, but the Phase 3 graph builder will omit them from algorithm input.
- Editing router labels and moving routers does not increment the topology revision. Adding/removing routers or links, or changing link cost/status, does.

## Persistence and recovery

The browser stores a bounded library (up to 30 projects) under `routelab-project-library-v1`. Save is explicit; movement and edits mark the project dirty but are not silently written. Exported JSON is the portable backup. Imported projects are validated and receive a new local project ID to avoid accidental overwrite of an existing saved project.

Browser storage may be unavailable or full. In that case the editor reports a message and leaves the current in-memory project intact. The user can export JSON as a backup. Replacing a dirty project through New Project, preset loading, import or saved-project opening requires an explicit discard confirmation.

## Known boundaries

- This is a client-side editor; there is no account, sync service or server database.
- Links are undirected; directed links and zero/negative costs are unsupported.
- Link handles indicate how to draw a connection in the UI; the stored model treats the connection as undirected.
- Router placement is presentation data and never affects routing cost.
- A topology change invalidates any future simulation result and requires a fresh run in the later simulation phases.
