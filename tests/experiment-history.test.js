import test from 'node:test';
import assert from 'node:assert/strict';
import { createTopologyPreset } from '../src/shared/data/presets/topologyPresets.js';
import { runRoutingAlgorithm } from '../src/engine/algorithms/index.js';
import {
  clearExperimentHistory, deleteExperiment, getExperimentHistory,
  getExperimentHistoryStatus, MAX_EXPERIMENT_HISTORY, saveExperiment,
} from '../src/features/simulation/model/experimentHistoryStore.js';

const STORAGE_KEY = 'routelab-experiment-history-v1';
const STARTED_AT = '2026-01-02T03:04:05.000Z';

function attachStorage(initialEntries = []) {
  const previousWindow = globalThis.window;
  const values = new Map(initialEntries);
  globalThis.window = { localStorage: {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  } };
  return {
    values,
    restore() {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    },
  };
}

function makeRun(project, algorithm = 'distance-vector', runId = 'run-history-test', startedAt = STARTED_AT) {
  return runRoutingAlgorithm(project, algorithm, { runId, startedAt });
}

test('successful runs save compact experiment records with isolated topology snapshots', () => {
  const storage = attachStorage();
  try {
    const project = createTopologyPreset('starter');
    const run = makeRun(project);
    const result = saveExperiment({ run, project });
    assert.equal(result.ok, true);
    assert.equal(result.record.algorithm, 'distance-vector');
    assert.equal(result.record.eventCount, run.events.length);
    assert.ok(result.record.summary.includes('vector messages'));
    assert.deepEqual(getExperimentHistory()[0].projectSnapshot, project);
    const raw = JSON.parse(storage.values.get(STORAGE_KEY));
    assert.equal(raw.version, 1);
    assert.equal(Object.hasOwn(raw.experiments[0], 'events'), false);
    assert.equal(Object.hasOwn(raw.experiments[0], 'finalTables'), false);
    project.routers[0].label = 'Changed after save';
    assert.equal(getExperimentHistory()[0].projectSnapshot.routers[0].label, 'R1');
  } finally { storage.restore(); }
});

test('Link State records replay deterministically from their saved run ID and topology', () => {
  const storage = attachStorage();
  try {
    const project = createTopologyPreset('diamond');
    const run = makeRun(project, 'link-state', 'run-link-state');
    const saved = saveExperiment({ run, project });
    assert.equal(saved.ok, true);
    assert.equal(saved.record.metrics.dijkstraRuns, project.routers.length);
    const replay = runRoutingAlgorithm(saved.record.projectSnapshot, saved.record.algorithm, {
      runId: saved.record.runId, startedAt: saved.record.startedAt,
    });
    assert.deepEqual(replay.events, run.events);
    assert.deepEqual(replay.finalTables, run.finalTables);
    assert.deepEqual(replay.metrics, run.metrics);
  } finally { storage.restore(); }
});

test('history sorts newest first and supports individual deletion and clearing', () => {
  const storage = attachStorage();
  try {
    const project = createTopologyPreset('starter');
    const older = makeRun(project, 'distance-vector', 'run-older', '2026-01-01T00:00:00.000Z');
    const newer = makeRun(project, 'link-state', 'run-newer', '2026-01-03T00:00:00.000Z');
    const olderSave = saveExperiment({ run: older, project });
    const newerSave = saveExperiment({ run: newer, project });
    assert.equal(getExperimentHistory().length, 2);
    assert.equal(getExperimentHistory()[0].id, newerSave.record.id);
    assert.equal(deleteExperiment(olderSave.record.id).ok, true);
    assert.deepEqual(getExperimentHistory().map((item) => item.id), [newerSave.record.id]);
    assert.equal(clearExperimentHistory().ok, true);
    assert.deepEqual(getExperimentHistory(), []);
    assert.equal(deleteExperiment('missing-experiment').ok, false);
  } finally { storage.restore(); }
});

test('history retains only the latest twenty valid experiments', () => {
  const storage = attachStorage();
  try {
    const project = createTopologyPreset('starter');
    for (let index = 0; index < MAX_EXPERIMENT_HISTORY + 3; index += 1) {
      const startedAt = new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString();
      assert.equal(saveExperiment({ run: makeRun(project, 'distance-vector', `run-${index}`, startedAt), project }).ok, true);
    }
    const history = getExperimentHistory();
    assert.equal(history.length, MAX_EXPERIMENT_HISTORY);
    assert.equal(history[0].runId, 'run-22');
    assert.equal(history.at(-1).runId, 'run-3');
  } finally { storage.restore(); }
});

test('invalid runs and mismatched topology snapshots are not stored', () => {
  const storage = attachStorage();
  try {
    const project = createTopologyPreset('starter');
    const run = makeRun(project);
    assert.equal(saveExperiment({ run: null, project }).ok, false);
    assert.equal(saveExperiment({ run, project: createTopologyPreset('diamond') }).ok, false);
    assert.deepEqual(getExperimentHistory(), []);
    assert.equal(storage.values.has(STORAGE_KEY), false);
  } finally { storage.restore(); }
});

test('damaged history JSON is preserved and cannot be overwritten or cleared', () => {
  const original = '{ recoverable but invalid history';
  const storage = attachStorage([[STORAGE_KEY, original]]);
  try {
    assert.equal(getExperimentHistoryStatus().status, 'recovery-required');
    const project = createTopologyPreset('starter');
    assert.equal(saveExperiment({ run: makeRun(project), project }).ok, false);
    assert.equal(clearExperimentHistory().ok, false);
    assert.equal(storage.values.get(STORAGE_KEY), original);
  } finally { storage.restore(); }
});

test('unsupported history versions are preserved instead of reset', () => {
  const original = JSON.stringify({ version: 9, experiments: [] });
  const storage = attachStorage([[STORAGE_KEY, original]]);
  try {
    assert.equal(getExperimentHistoryStatus().ok, false);
    assert.equal(clearExperimentHistory().ok, false);
    assert.equal(storage.values.get(STORAGE_KEY), original);
  } finally { storage.restore(); }
});

test('storage write failures report a recoverable message without claiming a save', () => {
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: {
    getItem: () => null,
    setItem: () => { const error = new Error('Storage denied'); error.name = 'QuotaExceededError'; throw error; },
  } };
  try {
    const project = createTopologyPreset('starter');
    const result = saveExperiment({ run: makeRun(project), project });
    assert.equal(result.ok, false);
    assert.match(result.message, /storage is full/i);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
