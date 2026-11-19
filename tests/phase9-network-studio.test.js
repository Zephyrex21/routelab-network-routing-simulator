import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readText = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Network Studio reads the explicitly active project instead of the latest saved project', async () => {
  const source = await readText('../src/features/topology/NetworkStudioPage.jsx');
  assert.match(source, /getActiveProject/);
  assert.doesNotMatch(source, /getLastProject/);
});

test('canvas tools enforce distinct select, connect and pan interactions', async () => {
  const source = await readText('../src/features/topology/NetworkStudioPage.jsx');
  assert.match(source, /nodesDraggable=\{toolMode === 'select'\}/);
  assert.match(source, /nodesConnectable=\{toolMode === 'connect'\}/);
  assert.match(source, /panOnDrag=\{toolMode === 'pan'\}/);
  assert.match(source, /role="toolbar" aria-label="Network canvas tools"/);
});

test('Phase 9.2 Network Studio stylesheet loads after the design foundation', async () => {
  const index = await readText('../src/styles/index.css');
  assert.match(index, /phase9-foundation\.css/);
  assert.match(index, /phase9-network-studio\.css/);
  assert.ok(index.indexOf('phase9-network-studio.css') > index.indexOf('phase9-foundation.css'));
});

test('Network Studio refinement keeps responsive and reduced-motion rules scoped to the editor', async () => {
  const styles = await readText('../src/styles/phase9-network-studio.css');
  assert.match(styles, /\.studio-page \.phase2-studio-layout/);
  assert.match(styles, /\.phase2-inspector-content \.text-input/);
  assert.match(styles, /@media \(max-width: 960px\)/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(max-width: 460px\)/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});
