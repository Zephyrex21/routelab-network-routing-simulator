# Topology feature

Phase 2 interactive topology editor lives here.

- `NetworkStudioPage.jsx` — editor page and canvas interactions.
- `components/RouterNode.jsx` — custom React Flow node.
- `model/projectModel.js` — pure project/flow conversion and validation.
- `model/projectStore.js` — browser-local saved project library.

Algorithm execution is intentionally kept outside this feature. The Phase 3 engine consumes the normalized saved project model, and the Phase 4 Simulation Studio reads the latest saved revision.
