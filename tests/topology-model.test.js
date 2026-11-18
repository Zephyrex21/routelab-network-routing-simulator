import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProject, flowToProject, nextLinkId, nextRouterId, projectToFlow,
  validateConnection, validateProject,
} from '../src/features/topology/model/projectModel.js';
import { createTopologyPreset, topologyPresetOptions } from '../src/shared/data/presets/topologyPresets.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('all shipped topology presets satisfy the Phase 0 project contract', () => {
  assert.equal(topologyPresetOptions.length, 3);
  for (const preset of topologyPresetOptions) {
    const project = createTopologyPreset(preset.id);
    const validation = validateProject(project);
    assert.equal(validation.valid, true, `${preset.id}: ${validation.errors.join('; ')}`);
  }
});

test('a new project begins with one valid router and stable project metadata', () => {
  const project = createProject('Fresh network');
  assert.equal(project.routers.length, 1);
  assert.equal(project.routers[0].id, 'R1');
  assert.equal(project.name, 'Fresh network');
  assert.equal(validateProject(project).valid, true);
});

test('router and link identifiers choose the first unused numeric suffix', () => {
  assert.equal(nextRouterId([{ id: 'R1' }, { id: 'R3' }]), 'R2');
  assert.equal(nextLinkId([{ id: 'L1' }, { id: 'L3' }]), 'L2');
});

test('connections reject self-links and duplicate undirected pairs', () => {
  const edges = [{ id: 'L1', source: 'R1', target: 'R2' }];
  assert.equal(validateConnection({ source: 'R1', target: 'R1' }, edges).valid, false);
  assert.equal(validateConnection({ source: 'R2', target: 'R1' }, edges).valid, false);
  assert.equal(validateConnection({ source: 'R1', target: 'R3' }, edges).valid, true);
});

test('project validation rejects duplicate routers and invalid link costs', () => {
  const duplicateRouter = clone(createTopologyPreset('starter'));
  duplicateRouter.routers.push({ ...duplicateRouter.routers[0] });
  assert.equal(validateProject(duplicateRouter).valid, false);

  const invalidCost = clone(createTopologyPreset('starter'));
  invalidCost.links[0].cost = 0;
  assert.equal(validateProject(invalidCost).valid, false);
});

test('project validation rejects missing endpoints, self-links and duplicate undirected edges', () => {
  const missingEndpoint = clone(createTopologyPreset('starter'));
  missingEndpoint.links[0].targetRouterId = 'R99';
  assert.equal(validateProject(missingEndpoint).valid, false);

  const selfLink = clone(createTopologyPreset('starter'));
  selfLink.links[0].targetRouterId = selfLink.links[0].sourceRouterId;
  assert.equal(validateProject(selfLink).valid, false);

  const duplicateEdge = clone(createTopologyPreset('starter'));
  duplicateEdge.links.push({
    id: 'L99',
    sourceRouterId: duplicateEdge.links[0].targetRouterId,
    targetRouterId: duplicateEdge.links[0].sourceRouterId,
    cost: 7,
    status: 'up',
  });
  assert.equal(validateProject(duplicateEdge).valid, false);
});

test('flow conversion preserves router positions and link cost/status', () => {
  const source = createTopologyPreset('starter');
  const flow = projectToFlow(source);
  const roundTrip = flowToProject({ project: source, nodes: flow.nodes, edges: flow.edges });
  assert.equal(roundTrip.routers.length, source.routers.length);
  assert.equal(roundTrip.links.length, source.links.length);
  assert.deepEqual(roundTrip.routers[0].position, source.routers[0].position);
  assert.equal(roundTrip.links[0].cost, source.links[0].cost);
  assert.equal(roundTrip.links[0].status, source.links[0].status);
  assert.equal(validateProject(roundTrip).valid, true);
});

test('position/name-only edits do not require topology revision increments', () => {
  const project = createTopologyPreset('starter');
  const flow = projectToFlow(project);
  const moved = flow.nodes.map((node) => node.id === 'R1'
    ? { ...node, position: { x: 240, y: 340 } }
    : node);
  const updated = flowToProject({ project, nodes: moved, edges: flow.edges, name: 'Renamed network' });
  assert.equal(updated.topologyRevision, project.topologyRevision);
  assert.equal(updated.name, 'Renamed network');
  assert.deepEqual(updated.routers[0].position, { x: 240, y: 340 });
});

test('topology-changing edits can increment the revision', () => {
  const project = createTopologyPreset('starter');
  const flow = projectToFlow(project);
  const updated = flowToProject({ project, nodes: flow.nodes, edges: flow.edges.slice(0, -1), incrementRevision: true });
  assert.equal(updated.topologyRevision, project.topologyRevision + 1);
});

test('project validation rejects unexpected properties to match the strict JSON contract', () => {
  const project = clone(createTopologyPreset('starter'));
  project.debugMode = true;
  assert.equal(validateProject(project).valid, false);

  const routerProject = clone(createTopologyPreset('starter'));
  routerProject.routers[0].temporary = true;
  assert.equal(validateProject(routerProject).valid, false);
});

test('disabled links are valid project records and retain their status', () => {
  const project = clone(createTopologyPreset('starter'));
  project.links[0].status = 'down';
  assert.equal(validateProject(project).valid, true);
  const flow = projectToFlow(project);
  const roundTrip = flowToProject({ project, nodes: flow.nodes, edges: flow.edges });
  assert.equal(roundTrip.links[0].status, 'down');
});

test('projects enforce the twenty-router editor limit', () => {
  const project = clone(createProject('Too many routers'));
  project.routers = Array.from({ length: 21 }, (_, index) => ({
    id: `R${index + 1}`,
    label: `Router ${index + 1}`,
    position: { x: index * 10, y: index * 10 },
  }));
  assert.equal(validateProject(project).valid, false);
});

test('local project library saves, lists, restores and deletes valid projects', async () => {
  const { saveProject, getSavedProjects, getLastProject, deleteSavedProject } = await import('../src/features/topology/model/projectStore.js');
  const previousWindow = globalThis.window;
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  } };
  try {
    const project = createTopologyPreset('diamond');
    assert.equal(saveProject(project).ok, true);
    assert.equal(getSavedProjects().length, 1);
    assert.equal(getLastProject().projectId, project.projectId);
    assert.equal(deleteSavedProject(project.projectId).ok, true);
    assert.equal(getSavedProjects().length, 0);
    assert.equal(getLastProject(), null);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('local project library refuses invalid projects', async () => {
  const { saveProject } = await import('../src/features/topology/model/projectStore.js');
  const previousWindow = globalThis.window;
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  } };
  try {
    const invalid = clone(createTopologyPreset('starter'));
    invalid.links[0].cost = -5;
    const result = saveProject(invalid);
    assert.equal(result.ok, false);
    assert.equal(values.size, 0);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('project validation rejects non-finite coordinates and malformed timestamps', () => {
  const invalidPosition = clone(createTopologyPreset('starter'));
  invalidPosition.routers[0].position.x = Number.POSITIVE_INFINITY;
  assert.equal(validateProject(invalidPosition).valid, false);

  const invalidTimestamp = clone(createTopologyPreset('starter'));
  invalidTimestamp.updatedAt = 'not-a-date';
  assert.equal(validateProject(invalidTimestamp).valid, false);
});

test('saved-project listing ignores malformed records without breaking valid projects', async () => {
  const { getSavedProjects } = await import('../src/features/topology/model/projectStore.js');
  const previousWindow = globalThis.window;
  const valid = createTopologyPreset('starter');
  globalThis.window = { localStorage: {
    getItem: () => JSON.stringify({ version: 1, projects: [valid, { projectId: 'broken' }], lastProjectId: valid.projectId }),
  } };
  try {
    const saved = getSavedProjects();
    assert.equal(saved.length, 1);
    assert.equal(saved[0].projectId, valid.projectId);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('saved-project deletion reports browser storage write failures', async () => {
  const { deleteSavedProject } = await import('../src/features/topology/model/projectStore.js');
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: {
    getItem: () => JSON.stringify({ version: 1, projects: [], lastProjectId: null }),
    setItem: () => { const error = new Error('Storage denied'); error.name = 'SecurityError'; throw error; },
  } };
  try {
    const result = deleteSavedProject('project-does-not-matter');
    assert.equal(result.ok, false);
    assert.match(result.message, /storage is unavailable/i);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('the Phase 0 example project remains compatible with the Phase 2 validator', async () => {
  const fs = await import('node:fs/promises');
  const example = JSON.parse(await fs.readFile(new URL('../docs/contracts/example-network-project.json', import.meta.url), 'utf8'));
  assert.equal(validateProject(example).valid, true);
});

test('link validation enforces integer cost boundaries and known statuses', () => {
  for (const cost of [0, -1, 1.5, 1000, Number.NaN]) {
    const project = clone(createTopologyPreset('starter'));
    project.links[0].cost = cost;
    assert.equal(validateProject(project).valid, false, `cost ${String(cost)} must be rejected`);
  }
  const invalidStatus = clone(createTopologyPreset('starter'));
  invalidStatus.links[0].status = 'paused';
  assert.equal(validateProject(invalidStatus).valid, false);
});

test('saving a valid project announces the saved revision for same-tab consumers', async () => {
  const { saveProject } = await import('../src/features/topology/model/projectStore.js');
  const previousWindow = globalThis.window;
  const values = new Map();
  const events = [];
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, value),
    },
    dispatchEvent: (event) => { events.push(event); return true; },
  };
  try {
    const project = createTopologyPreset('starter');
    assert.equal(saveProject(project).ok, true);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'routelab:project-saved');
    assert.deepEqual(events[0].detail, {
      projectId: project.projectId,
      topologyRevision: project.topologyRevision,
    });
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
