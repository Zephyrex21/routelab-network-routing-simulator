import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(resolve(root, path), 'utf8');

test('Comparison Lab is registered at the expected application route', async () => {
  const app = await read('src/app/App.jsx');
  assert.match(app, /import ComparePage from ['"]\.\.\/features\/comparison\/ComparePage\.jsx['"]/);
  assert.match(app, /<Route path="compare" element={<ComparePage \/>} \/>/);
});

test('Comparison page imports every icon component it renders', async () => {
  const page = await read('src/features/comparison/ComparePage.jsx');
  const importEnd = page.indexOf("} from 'lucide-react'");
  assert.ok(importEnd >= 0, 'lucide-react icon import should exist');
  const importStart = page.lastIndexOf('import {', importEnd);
  const importedText = page.slice(importStart + 'import {'.length, importEnd);
  const imported = new Set(importedText.split(',').map((name) => name.trim()).filter(Boolean));
  for (const icon of imported) assert.ok(page.includes(`<${icon} `) || page.includes(`={${icon}}`), `Imported icon ${icon} is not rendered or was renamed`);
});

test('Comparison UI includes narrow-screen layout rules and separated work profiles', async () => {
  const css = await read('src/features/comparison/comparison.css');
  const page = await read('src/features/comparison/ComparePage.jsx');
  assert.match(css, /@media\s*\(max-width:\s*520px\)/);
  assert.match(page, /ALGORITHM-SPECIFIC METRICS/);
  assert.match(page, /No speed ranking/);
});

test('Comparison model reuses the canonical engine and packet route validator', async () => {
  const model = await read('src/features/comparison/model/algorithmComparison.js');
  assert.match(model, /runRoutingAlgorithm/);
  assert.match(model, /createPacketRoute/);
  assert.match(model, /createLinkExperiment/);
  assert.match(model, /comparePacketRoutes/);
});


test('Comparison Lab exposes a printable report for current algorithm results', async () => {
  const page = await read('src/features/comparison/ComparePage.jsx');
  assert.ok(page.includes('createComparisonReportHtml'));
  assert.ok(page.includes('Export comparison report'));
  assert.ok(page.includes('failureResult: failureIsCurrent ? failureResult : null'));
  const report = await read('src/shared/utils/learningReports.js');
  for (const snippet of ['createComparisonReportHtml', 'Routing-table comparison', 'Work profiles', 'reachabilityDifferences']) {
    assert.ok(report.includes(snippet), `Missing comparison report content: ${snippet}`);
  }
});
