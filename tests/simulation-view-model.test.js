import test from 'node:test';
import assert from 'node:assert/strict';
import { runDistanceVector, runLinkState } from '../src/engine/algorithms/index.js';
import { createTopologyPreset } from '../src/shared/data/presets/topologyPresets.js';
import { createProject } from '../src/features/topology/model/projectModel.js';
import {
  getCurrentActivity,
  getCurrentSnapshotLabel,
  getDistanceVectorTable,
  getEventFacts,
  getEventLabel,
  getLinkStateTableAt,
  getSnapshotAtOrBefore,
  getVisibleEvents,
} from '../src/features/simulation/model/simulationViewModel.js';
import {
  clampEventCursor,
  getPlaybackDelay,
  getPlaybackProgress,
  PLAYBACK_SPEEDS,
} from '../src/features/simulation/model/simulationController.js';

const project = createTopologyPreset('starter');

test('snapshot lookup selects the latest snapshot not later than the event', () => {
  const run = runDistanceVector(project);
  const first = run.snapshots[0];
  const next = run.snapshots[1];
  assert.equal(getSnapshotAtOrBefore(run, first.sequence)?.sequence, first.sequence);
  assert.equal(getSnapshotAtOrBefore(run, next.sequence - 1)?.sequence, first.sequence);
  assert.equal(getSnapshotAtOrBefore(run, next.sequence)?.sequence, next.sequence);
  assert.equal(getSnapshotAtOrBefore(run, -1), null);
});

test('Distance Vector table view shows initialized routes before later rounds', () => {
  const run = runDistanceVector(project);
  const row = getDistanceVectorTable(run, run.events[0].sequence, 'R1')?.find((item) => item.destinationRouterId === 'R2');
  assert.equal(row.status, 'reachable');
  assert.equal(row.cost, 3);
  assert.equal(row.nextHopRouterId, 'R2');
  assert.deepEqual(row.path, ['R1', 'R2']);
});

test('Distance Vector table view reflects a later converged snapshot', () => {
  const run = runDistanceVector(project);
  const lastSnapshot = run.snapshots.at(-1);
  const row = getDistanceVectorTable(run, lastSnapshot.sequence, 'R1')?.find((item) => item.destinationRouterId === 'R4');
  assert.equal(row.status, 'reachable');
  assert.ok(row.cost > 0);
  assert.equal(row.path[0], 'R1');
  assert.equal(row.path.at(-1), 'R4');
});

test('Link State table view replays Dijkstra relaxations without revealing future results', () => {
  const run = runLinkState(project);
  const start = run.events.find((event) => event.type === 'link-state.dijkstra.started' && event.details.sourceRouterId === 'R1');
  const firstRelaxation = run.events.find((event) => event.type === 'link-state.dijkstra.relaxation.updated' && event.details.fromRouterId === 'R1');
  const before = getLinkStateTableAt(run, start.sequence, 'R1', project.routers.map((router) => router.id));
  assert.equal(before.status, 'running');
  assert.equal(before.rows.find((row) => row.destinationRouterId === 'R2').status, 'pending');
  const after = getLinkStateTableAt(run, firstRelaxation.sequence, 'R1', project.routers.map((router) => router.id));
  const updated = after.rows.find((row) => row.destinationRouterId === firstRelaxation.details.toRouterId);
  assert.equal(updated.cost, firstRelaxation.details.candidateCost);
  assert.equal(updated.nextHopRouterId, firstRelaxation.details.nextHopRouterId);
  assert.equal(after.status, 'running');
});

test('Link State table view only marks a source complete after its completion event', () => {
  const run = runLinkState(project);
  const completion = run.events.find((event) => event.type === 'link-state.dijkstra.completed' && event.details.sourceRouterId === 'R1');
  const mid = getLinkStateTableAt(run, completion.sequence - 1, 'R1', project.routers.map((router) => router.id));
  const done = getLinkStateTableAt(run, completion.sequence, 'R1', project.routers.map((router) => router.id));
  assert.equal(mid.status, 'running');
  assert.equal(done.status, 'completed');
  const route = done.rows.find((row) => row.destinationRouterId === 'R4');
  assert.deepEqual(route.path, run.finalTables.R1.find((row) => row.destinationRouterId === 'R4').path);
});

test('Link State reports a destination unreachable only after the source Dijkstra run completes', () => {
  const isolatedProject = createProject('Disconnected test', {
    routers: [
      { id: 'R1', label: 'Router 1', position: { x: 80, y: 80 } },
      { id: 'R2', label: 'Router 2', position: { x: 260, y: 80 } },
      { id: 'R3', label: 'Router 3', position: { x: 440, y: 80 } },
    ],
    links: [{ id: 'L1', sourceRouterId: 'R1', targetRouterId: 'R2', cost: 4, status: 'up' }],
  });
  const run = runLinkState(isolatedProject);
  const complete = run.events.find((event) => event.type === 'link-state.dijkstra.completed' && event.details.sourceRouterId === 'R1');
  const during = getLinkStateTableAt(run, complete.sequence - 1, 'R1', ['R1', 'R2', 'R3']);
  const after = getLinkStateTableAt(run, complete.sequence, 'R1', ['R1', 'R2', 'R3']);
  assert.equal(during.rows.find((row) => row.destinationRouterId === 'R3').status, 'pending');
  assert.equal(after.rows.find((row) => row.destinationRouterId === 'R3').status, 'unreachable');
});

test('Link State table remains complete when the playback cursor moves beyond another router run', () => {
  const run = runLinkState(project);
  const finalEvent = run.events.at(-1);
  const table = getLinkStateTableAt(run, finalEvent.sequence, 'R1', project.routers.map((router) => router.id));
  assert.equal(table.status, 'completed');
  assert.equal(table.rows.length, project.routers.length);
});

test('activity view highlights event actors, affected routers and a directed link pair', () => {
  const run = runLinkState(project);
  const event = run.events.find((item) => item.type === 'link-state.lsa.transmitted');
  const activity = getCurrentActivity(event);
  assert.ok(activity.routerIds.includes(event.details.fromRouterId));
  assert.ok(activity.routerIds.includes(event.details.toRouterId));
  assert.equal(activity.edgeKey, [event.details.fromRouterId, event.details.toRouterId].sort().join('::'));
});

test('Distance Vector route updates highlight the selected next-hop link', () => {
  const run = runDistanceVector(project);
  const event = run.events.find((item) => item.type === 'distance-vector.route.updated' && item.details.current?.nextHopRouterId);
  assert.ok(event);
  const activity = getCurrentActivity(event);
  assert.equal(activity.edgeKey, [event.actorRouterId, event.details.current.nextHopRouterId].sort().join('::'));
});

test('event facts expose meaningful routing values for Distance Vector changes and Dijkstra relaxations', () => {
  const distanceVectorRun = runDistanceVector(project);
  const update = distanceVectorRun.events.find((event) => event.type === 'distance-vector.route.updated' && event.details.current?.nextHopRouterId);
  const updateFacts = getEventFacts(update);
  assert.ok(updateFacts.some((fact) => fact.label === 'New cost'));
  assert.ok(updateFacts.some((fact) => fact.label === 'Next hop'));

  const linkStateRun = runLinkState(project);
  const relaxation = linkStateRun.events.find((event) => event.type === 'link-state.dijkstra.relaxation.updated');
  const relaxationFacts = getEventFacts(relaxation);
  assert.ok(relaxationFacts.some((fact) => fact.label === 'Candidate cost'));
  assert.ok(relaxationFacts.some((fact) => fact.label === 'Edge examined'));
  assert.deepEqual(getEventFacts(null), []);
});

test('event labels and timeline window are stable and bounded', () => {
  const run = runDistanceVector(project);
  assert.equal(getEventLabel('distance-vector.vector.sent'), 'Distance vector sent');
  assert.equal(getCurrentSnapshotLabel(run, run.snapshots[0].sequence), run.snapshots[0].label);
  const end = run.events.at(-1).sequence;
  const visible = getVisibleEvents(run, end, 5);
  assert.equal(visible.length, 5);
  assert.equal(visible.at(-1).sequence, end);
  assert.equal(getVisibleEvents(run, -1).length, 0);
});

test('dense 20-router Link State run keeps the timeline window bounded and its source table replayable', () => {
  const routers = Array.from({ length: 20 }, (_, index) => ({
    id: `R${index + 1}`,
    label: `Router ${index + 1}`,
    position: { x: (index % 5) * 140, y: Math.floor(index / 5) * 120 },
  }));
  const links = [];
  let counter = 1;
  for (let left = 0; left < routers.length; left += 1) {
    for (let right = left + 1; right < routers.length; right += 1) {
      links.push({ id: `L${counter++}`, sourceRouterId: routers[left].id, targetRouterId: routers[right].id, cost: 1 + ((left + right) % 9), status: 'up' });
    }
  }
  const denseProject = createProject('Dense simulation QA', { routers, links });
  const run = runLinkState(denseProject);
  const lastSequence = run.events.at(-1).sequence;
  assert.equal(run.events.length, 22502);
  assert.equal(getVisibleEvents(run, lastSequence, 42).length, 42);
  const table = getLinkStateTableAt(run, lastSequence, 'R1', routers.map((router) => router.id));
  assert.equal(table.status, 'completed');
  assert.equal(table.rows.length, 20);
});

test('playback cursor clamps safely for empty, negative and oversized inputs', () => {
  assert.equal(clampEventCursor(1, 0), -1);
  assert.equal(clampEventCursor(-9, 5), -1);
  assert.equal(clampEventCursor(99, 5), 4);
  assert.equal(clampEventCursor(2, 5), 2);
});

test('playback speed presets map to deterministic delays and progress', () => {
  assert.equal(getPlaybackDelay(1), 800);
  assert.equal(getPlaybackDelay(8), 80);
  assert.equal(getPlaybackDelay(3), 800);
  assert.equal(getPlaybackProgress(-1, 10), 0);
  assert.equal(getPlaybackProgress(4, 10), 50);
  assert.equal(getPlaybackProgress(20, 10), 100);
  assert.deepEqual(PLAYBACK_SPEEDS.map((item) => item.value), [0.5, 1, 2, 4, 8]);
});
