import test from 'node:test';
import assert from 'node:assert/strict';
import { runRoutingAlgorithm } from '../src/engine/algorithms/index.js';
import { createTopologyPreset } from '../src/shared/data/presets/topologyPresets.js';
import { createPacketRoute } from '../src/features/packet-explorer/model/packetRouting.js';
import { comparePacketRoutes, createLinkExperiment } from '../src/features/network-failure/model/failureExperiment.js';

function run(project, algorithm = 'distance-vector') {
  return runRoutingAlgorithm(project, algorithm, {
    runId: `failure-${algorithm}`,
    startedAt: '2026-11-18T12:00:00.000Z',
    clock: () => new Date('2026-11-18T12:00:01.000Z'),
  });
}

test('disabling a link creates a new revision without mutating the baseline project', () => {
  const project = createTopologyPreset('diamond');
  const originalRevision = project.topologyRevision;
  const result = createLinkExperiment(project, 'L1', 'down');
  assert.equal(result.ok, true);
  assert.equal(result.project.topologyRevision, originalRevision + 1);
  assert.equal(result.project.links.find((link) => link.id === 'L1').status, 'down');
  assert.equal(project.links.find((link) => link.id === 'L1').status, 'up');
});

test('re-enabling a disabled link creates an enabled experiment variant', () => {
  const project = createTopologyPreset('starter');
  project.links[0].status = 'down';
  const result = createLinkExperiment(project, 'L1', 'up');
  assert.equal(result.ok, true);
  assert.equal(result.project.links[0].status, 'up');
});

test('cost experiment enforces integer bounds and changes only the selected link', () => {
  const project = createTopologyPreset('starter');
  const result = createLinkExperiment(project, 'L1', 'cost', '15');
  assert.equal(result.ok, true);
  assert.equal(result.project.links.find((link) => link.id === 'L1').cost, 15);
  assert.equal(result.project.links.find((link) => link.id === 'L2').cost, 7);
  assert.equal(createLinkExperiment(project, 'L1', 'cost', '0').ok, false);
  assert.equal(createLinkExperiment(project, 'L1', 'cost', '1000').ok, false);
  assert.equal(createLinkExperiment(project, 'L1', 'cost', '2.5').ok, false);
});

test('unknown links, unsupported actions and no-op experiments are rejected', () => {
  const project = createTopologyPreset('starter');
  assert.equal(createLinkExperiment(project, 'missing', 'down').ok, false);
  assert.equal(createLinkExperiment(project, 'L1', 'remove').ok, false);
  assert.equal(createLinkExperiment(project, 'L1', 'down').ok, true);
  const disabled = createLinkExperiment(project, 'L1', 'down').project;
  assert.match(createLinkExperiment(disabled, 'L1', 'down').message, /already disabled/i);
  assert.match(createLinkExperiment(project, 'L1', 'cost', String(project.links[0].cost)).message, /different cost/i);
});

test('disabling the equal-cost upper path selects the remaining equal-cost route', () => {
  const project = createTopologyPreset('diamond');
  const changed = createLinkExperiment(project, 'L1', 'down');
  assert.equal(changed.ok, true);
  const beforeRoute = createPacketRoute(project, run(project), 'R1', 'R4');
  const afterRoute = createPacketRoute(changed.project, run(changed.project), 'R1', 'R4');
  assert.deepEqual(beforeRoute.path, ['R1', 'R2', 'R4']);
  assert.deepEqual(afterRoute.path, ['R1', 'R3', 'R4']);
  assert.equal(beforeRoute.totalCost, 8);
  assert.equal(afterRoute.totalCost, 8);
  assert.equal(comparePacketRoutes(beforeRoute, afterRoute).outcome, 'alternate-equal-cost');
});

test('disabling a cut link can make a previously reachable destination unreachable', () => {
  const project = createTopologyPreset('starter');
  const changed = createLinkExperiment(project, 'L1', 'down');
  // On this topology, an alternate path remains available; disconnect every route
  // in a small two-router network to test the unreachable transition.
  const twoRouter = {
    ...project,
    routers: project.routers.slice(0, 2),
    links: [{ id: 'ONLY', sourceRouterId: 'R1', targetRouterId: 'R2', cost: 5, status: 'up' }],
  };
  const disabled = createLinkExperiment(twoRouter, 'ONLY', 'down');
  const before = createPacketRoute(twoRouter, run(twoRouter), 'R1', 'R2');
  const after = createPacketRoute(disabled.project, run(disabled.project), 'R1', 'R2');
  assert.equal(changed.ok, true);
  assert.equal(disabled.ok, true);
  assert.equal(before.status, 'reachable');
  assert.equal(after.status, 'unreachable');
  assert.equal(comparePacketRoutes(before, after).outcome, 'became-unreachable');
});

test('lowering the cost of an alternate path can change route selection', () => {
  const project = createTopologyPreset('starter');
  const changed = createLinkExperiment(project, 'L2', 'cost', 1);
  const before = createPacketRoute(project, run(project, 'link-state'), 'R1', 'R5');
  const after = createPacketRoute(changed.project, run(changed.project, 'link-state'), 'R1', 'R5');
  assert.notDeepEqual(before.path, after.path);
  assert.ok(after.totalCost < before.totalCost);
  assert.equal(comparePacketRoutes(before, after).outcome, 'changed');
});

test('comparison identifies no change when route and cost remain the same', () => {
  const project = createTopologyPreset('starter');
  const runResult = run(project);
  const before = createPacketRoute(project, runResult, 'R1', 'R5');
  const after = createPacketRoute(project, runResult, 'R1', 'R5');
  assert.equal(comparePacketRoutes(before, after).outcome, 'unchanged');
});


test('changing the cost on the selected route reports a cost-only change when the path stays the same', () => {
  const project = createTopologyPreset('starter');
  const changed = createLinkExperiment(project, 'L1', 'cost', 4);
  const before = createPacketRoute(project, run(project), 'R1', 'R2');
  const after = createPacketRoute(changed.project, run(changed.project), 'R1', 'R2');
  assert.deepEqual(after.path, before.path);
  assert.equal(after.totalCost, 4);
  assert.equal(comparePacketRoutes(before, after).outcome, 'cost-changed');
});

test('experiment helper rejects an invalid clock value', () => {
  const project = createTopologyPreset('starter');
  const result = createLinkExperiment(project, 'L1', 'down', undefined, { clock: () => 'not-a-date' });
  assert.equal(result.ok, false);
  assert.match(result.message, /timestamp/i);
});


test('long project names remain valid in the experiment variant', () => {
  const project = createTopologyPreset('starter');
  project.name = 'N'.repeat(80);
  const result = createLinkExperiment(project, 'L1', 'down');
  assert.equal(result.ok, true);
  assert.ok(result.project.name.length <= 80);
  assert.match(result.project.name, /Experiment$/);
});
