import test from 'node:test';
import assert from 'node:assert/strict';
import { createTopologyPreset } from '../src/shared/data/presets/topologyPresets.js';
import { createProject } from '../src/features/topology/model/projectModel.js';
import {
  getPairComparison,
  getRoutingTableComparison,
  runAlgorithmComparison,
  runFailureScenarioComparison,
} from '../src/features/comparison/model/algorithmComparison.js';

const FIXED_TIME = '2026-11-18T12:00:00.000Z';
const FIXED_END = '2026-11-18T12:00:01.000Z';
const options = {
  startedAt: FIXED_TIME,
  completedAt: FIXED_END,
  runIdPrefix: 'phase6-test',
};

test('both algorithms run against the same saved project identity and revision', () => {
  const project = createTopologyPreset('starter');
  const result = runAlgorithmComparison(project, options);
  assert.equal(result.projectId, project.projectId);
  assert.equal(result.topologyRevision, project.topologyRevision);
  assert.equal(result.runs['distance-vector'].projectId, project.projectId);
  assert.equal(result.runs['link-state'].projectId, project.projectId);
  assert.equal(result.runs['distance-vector'].topologyRevision, project.topologyRevision);
  assert.equal(result.runs['link-state'].topologyRevision, project.topologyRevision);
});

for (const preset of ['starter', 'diamond', 'disconnected']) {
  test(`all ordered route costs agree between algorithms for the ${preset} preset`, () => {
    const project = createTopologyPreset(preset);
    const result = runAlgorithmComparison(project, options);
    assert.equal(result.summary.reachabilityDifferences, 0);
    assert.equal(result.summary.costDifferences, 0);
    assert.equal(result.summary.reachableCostAgreements, result.summary.reachableCostComparisons);
    assert.equal(result.summary.pairsCompared, project.routers.length ** 2);
  });
}

test('pair comparison distinguishes an equal-cost alternate path from a cost disagreement', () => {
  const project = createTopologyPreset('diamond');
  const result = runAlgorithmComparison(project, options);
  const pair = getPairComparison(result, 'R1', 'R4');
  assert.equal(pair.distanceVector.status, 'reachable');
  assert.equal(pair.linkState.status, 'reachable');
  assert.equal(pair.distanceVector.totalCost, 8);
  assert.equal(pair.linkState.totalCost, 8);
  assert.equal(pair.agreement.sameCost, true);
  assert.equal(pair.agreement.status, 'match');
});

test('routing table comparison returns one row per destination with next hop and path', () => {
  const project = createTopologyPreset('starter');
  const result = runAlgorithmComparison(project, options);
  const rows = getRoutingTableComparison(result, 'R1');
  assert.equal(rows.length, project.routers.length);
  const toR5 = rows.find((row) => row.destinationRouterId === 'R5');
  assert.equal(toR5.distanceVector.cost, 8);
  assert.equal(toR5.linkState.cost, 8);
  assert.deepEqual(toR5.distanceVector.path, ['R1', 'R2', 'R3', 'R5']);
  assert.deepEqual(toR5.linkState.path, ['R1', 'R2', 'R3', 'R5']);
});

test('disconnected routes agree as unreachable without being counted as reachable cost comparisons', () => {
  const project = createTopologyPreset('disconnected');
  const result = runAlgorithmComparison(project, options);
  const pair = getPairComparison(result, 'R1', 'R5');
  assert.equal(pair.distanceVector.status, 'unreachable');
  assert.equal(pair.linkState.status, 'unreachable');
  assert.equal(pair.agreement.status, 'both-unreachable');
  assert.ok(result.summary.mutuallyUnreachable > 0);
});

test('algorithm-specific work metrics match the engine event stream', () => {
  const project = createTopologyPreset('starter');
  const result = runAlgorithmComparison(project, options);
  const dv = result.workProfiles['distance-vector'];
  const ls = result.workProfiles['link-state'];
  const dvUpdates = result.runs['distance-vector'].events.filter((event) => event.type === 'distance-vector.route.updated').length;
  const findMetric = (profile, key) => profile.items.find((item) => item.key === key)?.value;
  assert.equal(findMetric(dv, 'routeUpdates'), dvUpdates);
  assert.equal(findMetric(dv, 'vectorMessages'), result.runs['distance-vector'].metrics.vectorMessages);
  assert.equal(findMetric(ls, 'lsaTransmissions'), result.runs['link-state'].metrics.lsaTransmissions);
  assert.equal(findMetric(ls, 'dijkstraRuns'), project.routers.length);
  assert.notEqual(dv.items.some((item) => item.key === 'lsaTransmissions'), true);
  assert.notEqual(ls.items.some((item) => item.key === 'vectorMessages'), true);
});

test('comparison does not mutate the saved project or its topology records', () => {
  const project = createTopologyPreset('starter');
  const before = structuredClone(project);
  runAlgorithmComparison(project, options);
  assert.deepEqual(project, before);
});

test('invalid or absent projects are rejected with a useful validation error', () => {
  assert.throws(() => runAlgorithmComparison(null, options), /Save a valid topology/);
  const invalid = createTopologyPreset('starter');
  invalid.links[0].cost = 0;
  assert.throws(() => runAlgorithmComparison(invalid, options), /topology is invalid/i);
});

test('unknown source and destination produce no selected pair or table', () => {
  const result = runAlgorithmComparison(createTopologyPreset('starter'), options);
  assert.equal(getPairComparison(result, 'R99', 'R1'), null);
  assert.deepEqual(getRoutingTableComparison(result, 'R99'), []);
});

test('failure comparison runs both algorithms on baseline and isolated variant', () => {
  const project = createTopologyPreset('diamond');
  const before = structuredClone(project);
  const result = runFailureScenarioComparison(project, {
    linkId: 'L1', operation: 'down', sourceRouterId: 'R1', destinationRouterId: 'R4',
  }, options);
  assert.equal(result.ok, true);
  assert.equal(result.experimentProject.topologyRevision, project.topologyRevision + 1);
  for (const algorithm of ['distance-vector', 'link-state']) {
    assert.deepEqual(result.algorithms[algorithm].beforeRoute.path, ['R1', 'R2', 'R4']);
    assert.deepEqual(result.algorithms[algorithm].afterRoute.path, ['R1', 'R3', 'R4']);
    assert.equal(result.algorithms[algorithm].routeChange.outcome, 'alternate-equal-cost');
    assert.equal(result.algorithms[algorithm].beforeRoute.totalCost, 8);
    assert.equal(result.algorithms[algorithm].afterRoute.totalCost, 8);
  }
  assert.deepEqual(project, before);
});

test('failure comparison identifies a new unreachable route for both algorithms', () => {
  const project = createProject('Two router cut', {
    routers: [
      { id: 'R1', label: 'R1', position: { x: 0, y: 0 } },
      { id: 'R2', label: 'R2', position: { x: 100, y: 0 } },
    ],
    links: [{ id: 'L1', sourceRouterId: 'R1', targetRouterId: 'R2', cost: 5, status: 'up' }],
  });
  const result = runFailureScenarioComparison(project, {
    linkId: 'L1', operation: 'down', sourceRouterId: 'R1', destinationRouterId: 'R2',
  }, options);
  assert.equal(result.ok, true);
  for (const algorithm of ['distance-vector', 'link-state']) {
    assert.equal(result.algorithms[algorithm].beforeRoute.status, 'reachable');
    assert.equal(result.algorithms[algorithm].afterRoute.status, 'unreachable');
    assert.equal(result.algorithms[algorithm].routeChange.outcome, 'became-unreachable');
  }
});

test('invalid failure operation, missing link and invalid endpoints are rejected', () => {
  const project = createTopologyPreset('starter');
  assert.equal(runFailureScenarioComparison(project, {
    linkId: 'missing', operation: 'down', sourceRouterId: 'R1', destinationRouterId: 'R5',
  }, options).ok, false);
  assert.equal(runFailureScenarioComparison(project, {
    linkId: 'L1', operation: 'down', sourceRouterId: 'R99', destinationRouterId: 'R5',
  }, options).ok, false);
  assert.equal(runFailureScenarioComparison(project, {
    linkId: 'L1', operation: 'explode', sourceRouterId: 'R1', destinationRouterId: 'R5',
  }, options).ok, false);
});

test('failure comparison accepts link-cost experiments and reports the selected route cost', () => {
  const project = createTopologyPreset('starter');
  const result = runFailureScenarioComparison(project, {
    linkId: 'L2', operation: 'cost', nextCost: 1, sourceRouterId: 'R1', destinationRouterId: 'R5',
  }, options);
  assert.equal(result.ok, true);
  for (const algorithm of ['distance-vector', 'link-state']) {
    assert.ok(result.algorithms[algorithm].afterRoute.totalCost < result.algorithms[algorithm].beforeRoute.totalCost);
  }
});

test('one-router topology compares its self-route correctly', () => {
  const project = createProject('One router');
  const result = runAlgorithmComparison(project, options);
  const pair = getPairComparison(result, 'R1', 'R1');
  assert.equal(pair.distanceVector.totalCost, 0);
  assert.equal(pair.linkState.totalCost, 0);
  assert.equal(pair.agreement.samePath, true);
});


function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

for (let seed = 1; seed <= 12; seed += 1) {
  test(`both algorithms agree on all route costs in generated positive graph ${seed}`, () => {
    const random = seededRandom(seed * 97);
    const count = 4 + Math.floor(random() * 5);
    const routers = Array.from({ length: count }, (_, index) => ({
      id: `R${index + 1}`, label: `Router ${index + 1}`,
      position: { x: (index % 4) * 120, y: Math.floor(index / 4) * 100 },
    }));
    const links = [];
    const connected = new Set();
    const addLink = (left, right) => {
      const key = [left, right].sort().join('::');
      if (connected.has(key)) return;
      connected.add(key);
      links.push({ id: `L${links.length + 1}`, sourceRouterId: left, targetRouterId: right, cost: 1 + Math.floor(random() * 12), status: 'up' });
    };
    // A chain ensures all routers are connected before random chords are added.
    for (let index = 0; index < count - 1; index += 1) addLink(`R${index + 1}`, `R${index + 2}`);
    for (let left = 1; left <= count; left += 1) {
      for (let right = left + 2; right <= count; right += 1) {
        if (random() > 0.62) addLink(`R${left}`, `R${right}`);
      }
    }
    const project = createProject(`Generated comparison ${seed}`, { routers, links });
    const comparison = runAlgorithmComparison(project, options);
    assert.equal(comparison.summary.reachabilityDifferences, 0);
    assert.equal(comparison.summary.costDifferences, 0);
    assert.equal(comparison.summary.reachableCostAgreements, comparison.summary.reachableCostComparisons);
  });
}


test('equal-cost Link State suffixes remain consistent with each router forwarding table', () => {
  const project = createProject('Equal-cost forwarding suffix', {
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
  const comparison = runAlgorithmComparison(project, options);
  const pair = getPairComparison(comparison, 'R1', 'R3');
  assert.equal(pair.linkState.status, 'reachable');
  assert.equal(pair.linkState.totalCost, 9);
  assert.deepEqual(pair.linkState.path, ['R1', 'R4', 'R3']);
  assert.equal(pair.agreement.sameCost, true);
});
