import test from 'node:test';
import assert from 'node:assert/strict';
import { runRoutingAlgorithm } from '../src/engine/algorithms/index.js';
import { createTopologyPreset } from '../src/shared/data/presets/topologyPresets.js';
import { createProject } from '../src/features/topology/model/projectModel.js';
import { createPacketRoute } from '../src/features/packet-explorer/model/packetRouting.js';

function run(project, algorithm = 'distance-vector') {
  return runRoutingAlgorithm(project, algorithm, {
    runId: `test-${algorithm}`,
    startedAt: '2026-11-18T12:00:00.000Z',
    clock: () => new Date('2026-11-18T12:00:01.000Z'),
  });
}

for (const algorithm of ['distance-vector', 'link-state']) {
  test(`${algorithm}: packet journey follows the current router's forwarding-table next hop`, () => {
    const project = createTopologyPreset('starter');
    const result = run(project, algorithm);
    const route = createPacketRoute(project, result, 'R1', 'R5');

    assert.equal(route.status, 'reachable');
    assert.deepEqual(route.path, ['R1', 'R2', 'R3', 'R5']);
    assert.equal(route.hopCount, 3);
    assert.equal(route.totalCost, 8);
    assert.deepEqual(route.forwardingDecisions.map((step) => [step.fromRouterId, step.toRouterId]), [
      ['R1', 'R2'], ['R2', 'R3'], ['R3', 'R5'],
    ]);
    assert.ok(route.forwardingDecisions.every((step) => step.linkCost > 0));
  });
}

test('direct packet route contains one forwarding decision', () => {
  const project = createTopologyPreset('starter');
  const route = createPacketRoute(project, run(project), 'R1', 'R2');
  assert.equal(route.status, 'reachable');
  assert.deepEqual(route.path, ['R1', 'R2']);
  assert.equal(route.hopCount, 1);
  assert.equal(route.totalCost, 3);
});

test('source equals destination is delivered with zero hops and zero cost', () => {
  const project = createTopologyPreset('starter');
  const route = createPacketRoute(project, run(project), 'R3', 'R3');
  assert.equal(route.status, 'reachable');
  assert.deepEqual(route.path, ['R3']);
  assert.deepEqual(route.forwardingDecisions, []);
  assert.equal(route.hopCount, 0);
  assert.equal(route.totalCost, 0);
});

test('unreachable destination returns no path and no forwarding decisions', () => {
  const project = createTopologyPreset('disconnected');
  const route = createPacketRoute(project, run(project), 'R1', 'R5');
  assert.equal(route.status, 'unreachable');
  assert.deepEqual(route.path, []);
  assert.deepEqual(route.forwardingDecisions, []);
  assert.match(route.reason, /unreachable/i);
});

test('stale routing results cannot be used to animate packet forwarding', () => {
  const project = createTopologyPreset('starter');
  const result = run(project);
  const changed = { ...project, topologyRevision: project.topologyRevision + 1 };
  const route = createPacketRoute(changed, result, 'R1', 'R5');
  assert.equal(route.status, 'invalid');
  assert.equal(route.code, 'stale-run');
});

test('missing algorithm result and invalid endpoints are rejected', () => {
  const project = createTopologyPreset('starter');
  assert.equal(createPacketRoute(project, null, 'R1', 'R5').code, 'missing-run');
  assert.equal(createPacketRoute(project, run(project), 'R1', 'R99').code, 'invalid-endpoint');
});

test('forwarding refuses to traverse a disabled link even if a malformed result suggests it', () => {
  const project = createTopologyPreset('starter');
  const result = run(project);
  // Keep the run identity/revision equal deliberately to exercise the defensive
  // active-link check instead of the earlier stale-revision guard.
  const disabledProject = {
    ...project,
    links: project.links.map((link) => link.id === 'L1' ? { ...link, status: 'down' } : link),
  };
  const route = createPacketRoute(disabledProject, result, 'R1', 'R5');
  assert.equal(route.status, 'invalid');
  assert.equal(route.code, 'invalid-link');
});

test('forwarding loop detection stops an inconsistent next-hop chain', () => {
  const project = createTopologyPreset('starter');
  const result = run(project);
  const loopedTables = structuredClone(result.finalTables);
  loopedTables.R2.find((entry) => entry.destinationRouterId === 'R5').nextHopRouterId = 'R1';
  const loopedRun = { ...result, finalTables: loopedTables };
  const route = createPacketRoute(project, loopedRun, 'R1', 'R5');
  assert.equal(route.status, 'invalid');
  assert.equal(route.code, 'routing-loop');
});

test('forwarding rejects inconsistent remaining costs between adjacent routers', () => {
  const project = createTopologyPreset('starter');
  const result = run(project);
  const invalidTables = structuredClone(result.finalTables);
  invalidTables.R2.find((entry) => entry.destinationRouterId === 'R5').cost += 1;
  const invalidRun = { ...result, finalTables: invalidTables };
  const route = createPacketRoute(project, invalidRun, 'R1', 'R5');
  assert.equal(route.status, 'invalid');
  assert.equal(route.code, 'inconsistent-route');
});

test('packet route metadata records the source run and topology revision', () => {
  const project = createTopologyPreset('starter');
  const result = run(project, 'link-state');
  const route = createPacketRoute(project, result, 'R1', 'R5');
  assert.equal(route.runId, result.runId);
  assert.equal(route.projectId, project.projectId);
  assert.equal(route.topologyRevision, project.topologyRevision);
  assert.equal(route.algorithm, 'link-state');
});


test('packet forwarding safely traverses the maximum supported 19-hop chain', () => {
  const routers = Array.from({ length: 20 }, (_, index) => ({
    id: `R${index + 1}`,
    label: `Router ${index + 1}`,
    position: { x: (index % 5) * 120, y: Math.floor(index / 5) * 100 },
  }));
  const links = Array.from({ length: 19 }, (_, index) => ({
    id: `L${index + 1}`,
    sourceRouterId: `R${index + 1}`,
    targetRouterId: `R${index + 2}`,
    cost: 1,
    status: 'up',
  }));
  const project = createProject('Maximum chain', { routers, links });
  for (const algorithm of ['distance-vector', 'link-state']) {
    const route = createPacketRoute(project, run(project, algorithm), 'R1', 'R20');
    assert.equal(route.status, 'reachable');
    assert.equal(route.hopCount, 19);
    assert.equal(route.totalCost, 19);
    assert.equal(route.path[0], 'R1');
    assert.equal(route.path.at(-1), 'R20');
  }
});


test('Link State packet forwarding remains consistent when equal-cost Dijkstra suffixes differ by router', () => {
  const project = createProject('Equal-cost suffix forwarding', {
    routers: [
      { id: 'R1', label: 'R1', position: { x: 0, y: 0 } },
      { id: 'R2', label: 'R2', position: { x: 100, y: 0 } },
      { id: 'R3', label: 'R3', position: { x: 200, y: 0 } },
      { id: 'R4', label: 'R4', position: { x: 200, y: 100 } },
      { id: 'R5', label: 'R5', position: { x: 100, y: 100 } },
    ],
    links: [
      { id: 'L1', sourceRouterId: 'R1', targetRouterId: 'R2', cost: 9, status: 'up' },
      { id: 'L2', sourceRouterId: 'R2', targetRouterId: 'R3', cost: 1, status: 'up' },
      { id: 'L3', sourceRouterId: 'R3', targetRouterId: 'R4', cost: 6, status: 'up' },
      { id: 'L4', sourceRouterId: 'R4', targetRouterId: 'R5', cost: 4, status: 'up' },
      { id: 'L5', sourceRouterId: 'R1', targetRouterId: 'R4', cost: 3, status: 'up' },
      { id: 'L6', sourceRouterId: 'R2', targetRouterId: 'R5', cost: 1, status: 'up' },
      { id: 'L7', sourceRouterId: 'R3', targetRouterId: 'R5', cost: 11, status: 'up' },
    ],
  });
  const result = run(project, 'link-state');
  const route = createPacketRoute(project, result, 'R1', 'R3');
  assert.equal(route.status, 'reachable');
  assert.deepEqual(route.path, ['R1', 'R4', 'R3']);
  assert.equal(route.totalCost, 9);
});
