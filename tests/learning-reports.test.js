import test from 'node:test';
import assert from 'node:assert/strict';
import { createTopologyPreset } from '../src/shared/data/presets/topologyPresets.js';
import { runRoutingAlgorithm } from '../src/engine/algorithms/index.js';
import { runAlgorithmComparison } from '../src/features/comparison/model/algorithmComparison.js';
import {
  createComparisonReportHtml,
  createSimulationReportHtml,
  openPrintableReport,
} from '../src/shared/utils/learningReports.js';

const STARTED_AT = '2026-11-18T12:00:00.000Z';
const COMPLETED_AT = '2026-11-18T12:00:01.000Z';
const generatedAt = new Date('2026-11-19T08:00:00.000Z');

function createRun(project, algorithm) {
  return runRoutingAlgorithm(project, algorithm, {
    runId: `report-${algorithm}`,
    startedAt: STARTED_AT,
    clock: () => new Date(COMPLETED_AT),
  });
}

test('simulation report includes topology SVG, metrics, every final routing table and learning explanations', () => {
  const project = createTopologyPreset('starter');
  const run = createRun(project, 'distance-vector');
  const html = createSimulationReportHtml({ project, run, generatedAt });

  assert.match(html, /Simulation learning report/);
  assert.match(html, /topology-diagram/);
  assert.match(html, /Topology overview/);
  assert.match(html, /Final routing tables/);
  assert.match(html, /Router R1/);
  assert.match(html, /Router R5/);
  assert.match(html, /Vector Messages/);
  assert.match(html, /Learning highlights/);
  assert.match(html, /Key idea:/);
  assert.match(html, /Print \/ Save as PDF/);
  assert.match(html, /2026/);
});

test('Link State simulation reports include Dijkstra metrics and route-learning highlights', () => {
  const project = createTopologyPreset('diamond');
  const run = createRun(project, 'link-state');
  const html = createSimulationReportHtml({ project, run, generatedAt });

  assert.match(html, /Link State results/);
  assert.match(html, /Dijkstra Runs/);
  assert.match(html, /Vertices Settled/);
  assert.match(html, /relaxation|settled|flooding/i);
});

test('simulation report rejects a topology with a different identity or revision', () => {
  const project = createTopologyPreset('starter');
  const run = createRun(project, 'distance-vector');
  const changed = structuredClone(project);
  changed.topologyRevision += 1;
  assert.throws(() => createSimulationReportHtml({ project: changed, run }), /does not match/);
});

test('report HTML escapes router labels and network names rather than interpreting markup', () => {
  const project = createTopologyPreset('starter');
  project.name = 'Network <img src=x onerror=alert(1)>';
  project.routers[0].label = '<script>alert(1)</script>';
  const run = createRun(project, 'distance-vector');
  const html = createSimulationReportHtml({ project, run, generatedAt });

  assert.match(html, /Network &lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(html, /<img src=x onerror=/);
});

test('comparison report includes agreement summary, selected source routes and both work profiles', () => {
  const project = createTopologyPreset('starter');
  const comparison = runAlgorithmComparison(project, {
    startedAt: STARTED_AT,
    completedAt: COMPLETED_AT,
    runIdPrefix: 'report-comparison',
  });
  const html = createComparisonReportHtml({
    project,
    comparison,
    sourceRouterId: 'R1',
    destinationRouterId: 'R5',
    generatedAt,
  });

  assert.match(html, /Routing algorithms comparison report/);
  assert.match(html, /Ordered pairs/);
  assert.match(html, /Reachability agreement/);
  assert.match(html, /Routing-table comparison · source R1/);
  assert.match(html, /Distance Vector/);
  assert.match(html, /Link State/);
  assert.match(html, /Work profiles/);
  assert.match(html, /same topology/);
  assert.match(html, /topology-diagram/);
});

test('comparison report rejects stale topology revisions', () => {
  const project = createTopologyPreset('starter');
  const comparison = runAlgorithmComparison(project, { startedAt: STARTED_AT, completedAt: COMPLETED_AT });
  const stale = structuredClone(project);
  stale.topologyRevision += 1;
  assert.throws(() => createComparisonReportHtml({ project: stale, comparison, sourceRouterId: 'R1', destinationRouterId: 'R2' }), /matching topology/);
});

test('printable report opener returns clear feedback when the browser blocks a popup', () => {
  const previousWindow = globalThis.window;
  globalThis.window = { open: () => null };
  try {
    const result = openPrintableReport('<!doctype html><title>Report</title>');
    assert.equal(result.ok, false);
    assert.match(result.message, /pop-ups/);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('printable report opener writes a self-contained document into its new tab', () => {
  const previousWindow = globalThis.window;
  const writes = [];
  let opened = 0;
  globalThis.window = {
    open: () => {
      opened += 1;
      return { document: {
        open: () => writes.push('open'),
        write: (value) => writes.push(value),
        close: () => writes.push('close'),
      } };
    },
  };
  try {
    const html = '<!doctype html><title>RouteLab test report</title>';
    const result = openPrintableReport(html);
    assert.equal(result.ok, true);
    assert.equal(opened, 1);
    assert.deepEqual(writes, ['open', html, 'close']);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
