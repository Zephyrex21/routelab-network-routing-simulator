import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from '../src/features/topology/model/projectModel.js';
import { createTopologyPreset } from '../src/shared/data/presets/topologyPresets.js';
import { normalizeNetwork, getConnectedComponents } from '../src/engine/graph/normalizeNetwork.js';
import { runDistanceVector } from '../src/engine/algorithms/distanceVector.js';
import { runDijkstra } from '../src/engine/algorithms/dijkstra.js';
import { runLinkState } from '../src/engine/algorithms/linkState.js';
import { runRoutingAlgorithm } from '../src/engine/algorithms/index.js';

const FIXED_OPTIONS = {
  runId: 'run-test-fixed',
  startedAt: '2026-01-01T00:00:00.000Z',
  clock: () => new Date('2026-01-01T00:00:01.000Z'),
};

function makeProject(routerIds, links, name = 'Routing test') {
  return createProject(name, {
    routers: routerIds.map((id, index) => ({
      id,
      label: id,
      position: { x: index * 100, y: 100 },
    })),
    links: links.map((link, index) => ({
      id: link.id || `L${index + 1}`,
      sourceRouterId: link.from,
      targetRouterId: link.to,
      cost: link.cost,
      status: link.status || 'up',
    })),
  });
}

function route(result, source, destination) {
  return result.finalTables[source].find((entry) => entry.destinationRouterId === destination);
}

function assertTablesHaveAllDestinations(result, routerIds) {
  assert.deepEqual(Object.keys(result.finalTables).sort(), [...routerIds].sort());
  for (const routerId of routerIds) {
    assert.equal(result.finalTables[routerId].length, routerIds.length);
    assert.deepEqual(
      result.finalTables[routerId].map((entry) => entry.destinationRouterId),
      [...routerIds].sort(),
    );
  }
}

function assertRoutePathsUseActiveLinks(project, result) {
  const activePairs = new Set(project.links
    .filter((link) => link.status === 'up')
    .map((link) => [link.sourceRouterId, link.targetRouterId].sort().join('::')));
  for (const [source, entries] of Object.entries(result.finalTables)) {
    for (const entry of entries) {
      if (entry.status === 'unreachable') {
        assert.equal(entry.cost, null);
        assert.equal(entry.nextHopRouterId, null);
        assert.deepEqual(entry.path, []);
        continue;
      }
      assert.equal(entry.path[0], source);
      assert.equal(entry.path.at(-1), entry.destinationRouterId);
      for (let index = 0; index < entry.path.length - 1; index += 1) {
        const pair = [entry.path[index], entry.path[index + 1]].sort().join('::');
        assert.ok(activePairs.has(pair), `Path uses inactive or unknown link ${pair}`);
      }
    }
  }
}

test('normalizer excludes down links and builds deterministically ordered undirected adjacency', () => {
  const project = makeProject(['R3', 'R1', 'R2'], [
    { from: 'R3', to: 'R2', cost: 4 },
    { from: 'R1', to: 'R2', cost: 2, status: 'down' },
  ]);
  const network = normalizeNetwork(project);
  assert.deepEqual(network.routerIds, ['R1', 'R2', 'R3']);
  assert.equal(network.activeLinkCount, 1);
  assert.equal(network.disabledLinks.length, 1);
  assert.deepEqual(network.adjacency.R2.map((edge) => edge.routerId), ['R3']);
  assert.deepEqual(getConnectedComponents(network), [['R1'], ['R2', 'R3']]);
});

test('normalizer rejects a malformed persisted project before algorithm execution', () => {
  const project = makeProject(['R1', 'R2'], [{ from: 'R1', to: 'R2', cost: 3 }]);
  const malformed = { ...project, links: [{ ...project.links[0], cost: 0 }] };
  assert.throws(() => normalizeNetwork(malformed), { code: 'INVALID_NETWORK_PROJECT' });
  assert.throws(() => runDistanceVector(malformed), { code: 'INVALID_NETWORK_PROJECT' });
});

test('Distance Vector computes the cheaper multi-hop path and includes the stable check round', () => {
  const project = makeProject(['R1', 'R2', 'R3'], [
    { from: 'R1', to: 'R2', cost: 4 },
    { from: 'R2', to: 'R3', cost: 3 },
    { from: 'R1', to: 'R3', cost: 10 },
  ]);
  const result = runDistanceVector(project, FIXED_OPTIONS);
  assert.equal(route(result, 'R1', 'R3').cost, 7);
  assert.equal(route(result, 'R1', 'R3').nextHopRouterId, 'R2');
  assert.deepEqual(route(result, 'R1', 'R3').path, ['R1', 'R2', 'R3']);
  assert.equal(result.metrics.roundsExecuted, 2);
  assert.equal(result.metrics.roundsWithChanges, 1);
  assert.equal(result.metrics.vectorMessages, 12);
  const initialR1ToR2 = result.snapshots[0].data.tables.R1.find((entry) => entry.destinationRouterId === 'R2');
  assert.deepEqual(initialR1ToR2.path, ['R1', 'R2']);
  assert.equal(result.status, 'completed');
  assert.equal(result.events.at(-1).type, 'distance-vector.completed');
});

test('Distance Vector respects disabled links and selects the remaining direct route', () => {
  const project = makeProject(['R1', 'R2', 'R3'], [
    { from: 'R1', to: 'R2', cost: 4 },
    { from: 'R2', to: 'R3', cost: 3, status: 'down' },
    { from: 'R1', to: 'R3', cost: 10 },
  ]);
  const result = runDistanceVector(project, FIXED_OPTIONS);
  assert.equal(route(result, 'R1', 'R3').cost, 10);
  assert.deepEqual(route(result, 'R1', 'R3').path, ['R1', 'R3']);
  assert.equal(result.metrics.disabledLinkCount, 1);
  assertRoutePathsUseActiveLinks(project, result);
});

test('Distance Vector chooses the lexicographically smallest first hop for equal-cost alternatives', () => {
  const project = makeProject(['R1', 'R2', 'R3', 'R4'], [
    { from: 'R1', to: 'R2', cost: 2 },
    { from: 'R2', to: 'R4', cost: 4 },
    { from: 'R1', to: 'R3', cost: 3 },
    { from: 'R3', to: 'R4', cost: 3 },
  ]);
  const result = runDistanceVector(project, FIXED_OPTIONS);
  assert.equal(route(result, 'R1', 'R4').cost, 6);
  assert.equal(route(result, 'R1', 'R4').nextHopRouterId, 'R2');
  assert.deepEqual(route(result, 'R1', 'R4').path, ['R1', 'R2', 'R4']);
});

test('Distance Vector handles isolated routers, disconnected components and self routes', () => {
  const project = makeProject(['R1', 'R2', 'R3'], [{ from: 'R1', to: 'R2', cost: 5 }]);
  const result = runDistanceVector(project, FIXED_OPTIONS);
  assert.equal(route(result, 'R1', 'R3').status, 'unreachable');
  assert.deepEqual(route(result, 'R1', 'R3').path, []);
  assert.equal(route(result, 'R3', 'R3').cost, 0);
  assert.deepEqual(route(result, 'R3', 'R3').path, ['R3']);
  assert.equal(result.metrics.roundsExecuted, 1);
  assertRoutePathsUseActiveLinks(project, result);
});

test('Distance Vector handles a one-router topology with one stable check round', () => {
  const project = makeProject(['R1'], []);
  const result = runDistanceVector(project, FIXED_OPTIONS);
  assert.equal(result.metrics.roundsExecuted, 1);
  assert.equal(result.metrics.roundsWithChanges, 0);
  assert.equal(result.metrics.vectorMessages, 0);
  assert.deepEqual(route(result, 'R1', 'R1').path, ['R1']);
});

test('Link State chooses the cheaper multi-hop route and produces path details', () => {
  const project = makeProject(['R1', 'R2', 'R3'], [
    { from: 'R1', to: 'R2', cost: 4 },
    { from: 'R2', to: 'R3', cost: 3 },
    { from: 'R1', to: 'R3', cost: 10 },
  ]);
  const result = runLinkState(project, FIXED_OPTIONS);
  assert.equal(route(result, 'R1', 'R3').cost, 7);
  assert.equal(route(result, 'R1', 'R3').nextHopRouterId, 'R2');
  assert.deepEqual(route(result, 'R1', 'R3').path, ['R1', 'R2', 'R3']);
  assert.equal(result.metrics.lsaOriginations, 3);
  assert.equal(result.metrics.dijkstraRuns, 3);
  assert.ok(result.metrics.lsaTransmissions > 0);
  assert.ok(result.metrics.lsaAcceptances > 0);
  assertRoutePathsUseActiveLinks(project, result);
});

test('Link State tie-breaks equal-cost paths using the lexicographically smaller first hop', () => {
  const project = makeProject(['R1', 'R2', 'R3', 'R4'], [
    { from: 'R1', to: 'R2', cost: 2 },
    { from: 'R2', to: 'R4', cost: 4 },
    { from: 'R1', to: 'R3', cost: 3 },
    { from: 'R3', to: 'R4', cost: 3 },
  ]);
  const result = runLinkState(project, FIXED_OPTIONS);
  assert.equal(route(result, 'R1', 'R4').cost, 6);
  assert.equal(route(result, 'R1', 'R4').nextHopRouterId, 'R2');
  assert.deepEqual(route(result, 'R1', 'R4').path, ['R1', 'R2', 'R4']);
});

test('Link State isolates LSDB flooding inside connected components', () => {
  const project = makeProject(['R1', 'R2', 'R3'], [{ from: 'R1', to: 'R2', cost: 5 }]);
  const result = runLinkState(project, FIXED_OPTIONS);
  assert.equal(route(result, 'R1', 'R3').status, 'unreachable');
  assert.equal(route(result, 'R3', 'R3').cost, 0);
  assert.deepEqual(result.snapshots[0].data.databases.R1.receivedOriginRouterIds, ['R1', 'R2']);
  assert.deepEqual(result.snapshots[0].data.databases.R3.receivedOriginRouterIds, ['R3']);
  assertRoutePathsUseActiveLinks(project, result);
});

test('Link State handles a single isolated router with a self-route', () => {
  const project = makeProject(['R1'], []);
  const result = runLinkState(project, FIXED_OPTIONS);
  assert.equal(result.metrics.lsaOriginations, 1);
  assert.equal(result.metrics.lsaTransmissions, 0);
  assert.equal(result.metrics.lsaAcceptances, 0);
  assert.equal(result.metrics.dijkstraRuns, 1);
  assert.deepEqual(route(result, 'R1', 'R1').path, ['R1']);
});

test('Link State counts transmitted duplicate advertisements separately from acceptances', () => {
  const project = makeProject(['R1', 'R2', 'R3'], [
    { from: 'R1', to: 'R2', cost: 1 },
    { from: 'R2', to: 'R3', cost: 1 },
    { from: 'R1', to: 'R3', cost: 1 },
  ]);
  const result = runLinkState(project, FIXED_OPTIONS);
  assert.ok(result.metrics.lsaDuplicatesSuppressed > 0);
  assert.equal(result.metrics.lsaTransmissions,
    result.events.filter((event) => event.type === 'link-state.lsa.transmitted').length);
  assert.equal(result.metrics.lsaDuplicatesSuppressed,
    result.events.filter((event) => event.type === 'link-state.lsa.duplicate-suppressed').length);
});

test('Dijkstra selects the lowest-distance vertex and applies deterministic tie-breaks', () => {
  const events = [];
  const result = runDijkstra({
    routerIds: ['R1', 'R2', 'R3', 'R4'],
    sourceRouterId: 'R1',
    adjacency: {
      R1: [{ routerId: 'R2', cost: 2 }, { routerId: 'R3', cost: 3 }],
      R2: [{ routerId: 'R1', cost: 2 }, { routerId: 'R4', cost: 4 }],
      R3: [{ routerId: 'R1', cost: 3 }, { routerId: 'R4', cost: 3 }],
      R4: [{ routerId: 'R2', cost: 4 }, { routerId: 'R3', cost: 3 }],
    },
    onEvent: (type) => events.push(type),
  });
  assert.equal(result.distances.R4, 6);
  assert.equal(result.firstHops.R4, 'R2');
  assert.deepEqual(result.paths.R4, ['R1', 'R2', 'R4']);
  assert.ok(events.includes('dijkstra.vertex.settled'));
  assert.ok(events.includes('dijkstra.completed'));
});

test('both algorithms agree on final costs for every router pair in all shipped presets', () => {
  for (const presetId of ['starter', 'diamond', 'disconnected']) {
    const project = createTopologyPreset(presetId);
    const dv = runDistanceVector(project, FIXED_OPTIONS);
    const ls = runLinkState(project, FIXED_OPTIONS);
    const ids = project.routers.map((router) => router.id).sort();
    assertTablesHaveAllDestinations(dv, ids);
    assertTablesHaveAllDestinations(ls, ids);
    for (const source of ids) {
      for (const destination of ids) {
        assert.equal(route(dv, source, destination).cost, route(ls, source, destination).cost,
          `${presetId}: cost mismatch from ${source} to ${destination}`);
        assert.equal(route(dv, source, destination).status, route(ls, source, destination).status,
          `${presetId}: reachability mismatch from ${source} to ${destination}`);
      }
    }
  }
});

test('the routing facade dispatches supported algorithms and rejects unknown names', () => {
  const project = createProject('Facade test');
  assert.equal(runRoutingAlgorithm(project, 'distance-vector', FIXED_OPTIONS).algorithm, 'distance-vector');
  assert.equal(runRoutingAlgorithm(project, 'link-state', FIXED_OPTIONS).algorithm, 'link-state');
  assert.throws(() => runRoutingAlgorithm(project, 'rip'), /Unsupported routing algorithm/);
});

test('run envelopes preserve the topology revision and use consecutive event sequences', () => {
  const project = makeProject(['R1', 'R2'], [{ from: 'R1', to: 'R2', cost: 2 }]);
  const result = runLinkState(project, FIXED_OPTIONS);
  assert.equal(result.projectId, project.projectId);
  assert.equal(result.topologyRevision, project.topologyRevision);
  assert.equal(result.startedAt, FIXED_OPTIONS.startedAt);
  assert.equal(result.completedAt, '2026-01-01T00:00:01.000Z');
  assert.deepEqual(result.events.map((event) => event.sequence), result.events.map((_, index) => index));
  assert.ok(result.snapshots.length >= 2);
  for (const snapshot of result.snapshots) {
    assert.equal(result.events[snapshot.sequence]?.sequence, snapshot.sequence);
  }
  assert.equal(result.status, 'completed');
});

test('Distance Vector reaches a 19-hop path and confirms stability within the 20-router safety bound', () => {
  const routerIds = Array.from({ length: 20 }, (_, index) => `R${index + 1}`);
  const links = routerIds.slice(0, -1).map((id, index) => ({
    from: id,
    to: routerIds[index + 1],
    cost: 1,
  }));
  const project = makeProject(routerIds, links, 'Maximum-length chain');
  const result = runDistanceVector(project, FIXED_OPTIONS);
  assert.equal(route(result, 'R1', 'R20').cost, 19);
  assert.equal(route(result, 'R1', 'R20').path.length, 20);
  assert.equal(result.metrics.roundsExecuted, 19);
  assert.equal(result.metrics.roundsWithChanges, 18);
});

test('both algorithms agree across deterministic generated positive-weight networks', () => {
  for (let seed = 1; seed <= 12; seed += 1) {
    let state = seed;
    const random = () => {
      state = (state * 48271) % 2147483647;
      return state / 2147483647;
    };
    const routerIds = Array.from({ length: 6 }, (_, index) => `R${index + 1}`);
    const links = routerIds.slice(0, -1).map((id, index) => ({
      from: id,
      to: routerIds[index + 1],
      cost: 1 + Math.floor(random() * 9),
    }));
    for (let left = 0; left < routerIds.length; left += 1) {
      for (let right = left + 2; right < routerIds.length; right += 1) {
        if (random() < 0.36) {
          links.push({ from: routerIds[left], to: routerIds[right], cost: 1 + Math.floor(random() * 9) });
        }
      }
    }
    const project = makeProject(routerIds, links, `Generated graph ${seed}`);
    const dv = runDistanceVector(project, FIXED_OPTIONS);
    const ls = runLinkState(project, FIXED_OPTIONS);
    for (const source of routerIds) {
      for (const destination of routerIds) {
        const dvRoute = route(dv, source, destination);
        const lsRoute = route(ls, source, destination);
        assert.equal(dvRoute.cost, lsRoute.cost, `seed ${seed}: ${source} → ${destination}`);
        assert.equal(dvRoute.nextHopRouterId, lsRoute.nextHopRouterId, `seed ${seed}: next hop ${source} → ${destination}`);
        const pathCost = (entry) => entry.path.slice(0, -1).reduce((sum, from, index) => {
          const to = entry.path[index + 1];
          const link = project.links.find((candidate) => candidate.status === 'up'
            && [candidate.sourceRouterId, candidate.targetRouterId].includes(from)
            && [candidate.sourceRouterId, candidate.targetRouterId].includes(to));
          assert.ok(link, `seed ${seed}: missing path link ${from} — ${to}`);
          return sum + link.cost;
        }, 0);
        if (dvRoute.status === 'reachable') {
          assert.equal(pathCost(dvRoute), dvRoute.cost, `seed ${seed}: DV path cost ${source} → ${destination}`);
          assert.equal(pathCost(lsRoute), lsRoute.cost, `seed ${seed}: LS path cost ${source} → ${destination}`);
        }
      }
    }
  }
});

test('repeated runs with fixed metadata produce identical algorithm events and snapshots', () => {
  const project = createTopologyPreset('starter');
  const firstDv = runDistanceVector(project, FIXED_OPTIONS);
  const secondDv = runDistanceVector(project, FIXED_OPTIONS);
  assert.deepEqual(firstDv, secondDv);
  const firstLs = runLinkState(project, FIXED_OPTIONS);
  const secondLs = runLinkState(project, FIXED_OPTIONS);
  assert.deepEqual(firstLs, secondLs);
});


test('Dijkstra rejects invalid costs and unknown adjacency endpoints when called directly', () => {
  assert.throws(() => runDijkstra({
    routerIds: ['R1', 'R2'], sourceRouterId: 'R1',
    adjacency: { R1: [{ routerId: 'R2', cost: 0 }], R2: [] },
  }), /positive integers/);
  assert.throws(() => runDijkstra({
    routerIds: ['R1'], sourceRouterId: 'R1',
    adjacency: { R1: [{ routerId: 'R9', cost: 1 }] },
  }), /invalid edge/);
});

test('algorithm run options reject invalid timestamps rather than emitting invalid envelopes', () => {
  const project = createTopologyPreset('starter');
  assert.throws(() => runDistanceVector(project, { startedAt: 'not-a-date' }), /valid date-time/);
});

test('Link State ignores disabled links when originating advertisements and calculating routes', () => {
  const project = makeProject(['R1', 'R2', 'R3'], [
    { from: 'R1', to: 'R2', cost: 4 },
    { from: 'R2', to: 'R3', cost: 3, status: 'down' },
    { from: 'R1', to: 'R3', cost: 10 },
  ]);
  const result = runLinkState(project, FIXED_OPTIONS);
  assert.equal(route(result, 'R1', 'R3').cost, 10);
  assert.deepEqual(route(result, 'R1', 'R3').path, ['R1', 'R3']);
  assert.equal(result.metrics.disabledLinkCount, 1);
  assertRoutePathsUseActiveLinks(project, result);
});

test('routing algorithms do not mutate the persisted project input', () => {
  const project = createTopologyPreset('starter');
  const before = structuredClone(project);
  runDistanceVector(project, FIXED_OPTIONS);
  runLinkState(project, FIXED_OPTIONS);
  assert.deepEqual(project, before);
});

test('run envelope root keys conform to the shared simulation-run JSON contract', async () => {
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const { dirname, resolve } = await import('node:path');
  const here = dirname(fileURLToPath(import.meta.url));
  const schema = JSON.parse(await readFile(resolve(here, '../docs/contracts/simulation-run.schema.json'), 'utf8'));
  const result = runDistanceVector(createTopologyPreset('diamond'), FIXED_OPTIONS);
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required.every((field) => Object.hasOwn(result, field)), true);
  for (const key of Object.keys(result)) assert.ok(Object.hasOwn(schema.properties, key), `Unexpected run envelope key: ${key}`);
  for (const event of result.events) {
    assert.ok(Number.isInteger(event.sequence));
    assert.equal(typeof event.type, 'string');
    assert.equal(typeof event.message, 'string');
  }
});
