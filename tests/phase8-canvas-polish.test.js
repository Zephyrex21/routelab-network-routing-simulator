import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readText = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Network Studio removes the minimap and assigns canvas movement to Pan mode', async () => {
  const source = await readText('../src/features/topology/NetworkStudioPage.jsx');
  assert.ok(!source.includes('MiniMap'), 'The minimap component and import should be removed');
  assert.ok(source.includes("panOnDrag={toolMode === 'pan'}"), 'Primary-button canvas panning should be exclusive to Pan mode');
  assert.ok(source.includes('selectionOnDrag={false}'), 'Canvas drag should pan instead of drawing a selection box');
  assert.ok(source.includes("nodesDraggable={toolMode === 'select'}"), 'Router repositioning should remain available in Select mode');
  assert.ok(source.includes("nodesConnectable={toolMode === 'connect'}"), 'Link creation should remain isolated to Connect mode');
});

test('Network Studio explains the distinct Select and Pan gestures', async () => {
  const source = await readText('../src/features/topology/NetworkStudioPage.jsx');
  assert.ok(source.includes('Select: drag routers · Pan: drag the empty canvas'));
});

test('public homepage uses a wider centered desktop gutter with responsive mobile gutters', async () => {
  const source = await readText('../src/styles/phase8-polish.css');
  assert.match(source, /width:\s*min\(1380px, calc\(100% - 120px\)\)/);
  assert.match(source, /@media \(max-width: 1180px\)/);
  assert.match(source, /width:\s*calc\(100% - 88px\)/);
  assert.match(source, /@media \(max-width: 760px\)/);
  assert.match(source, /width:\s*calc\(100% - 40px\)/);
});

test('homepage network preview is level instead of tilted', async () => {
  const source = await readText('../src/styles/phase8-polish.css');
  assert.match(source, /\.public-visual-window\s*\{\s*transform:\s*none;/);
});

test('homepage has viewport reveals, staggered cards and restrained motion', async () => {
  const page = await readText('../src/features/dashboard/PublicHomePage.jsx');
  const source = await readText('../src/styles/phase8-polish.css');
  assert.match(page, /new IntersectionObserver/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /reveal-on-view/);
  assert.match(source, /\.public-site \.reveal-on-view\.is-visible/);
  assert.match(source, /routelab-router-pulse/);
  assert.match(source, /routelab-link-flow/);
  assert.match(source, /routelab-float/);
  assert.match(source, /prefers-reduced-motion: reduce/);
});

test('network illustration animates the packet along the topology unless reduced motion is enabled', async () => {
  const illustration = await readText('../src/features/dashboard/NetworkIllustration.jsx');
  assert.match(illustration, /prefers-reduced-motion: reduce/);
  assert.match(illustration, /setReducedMotion/);
  assert.match(illustration, /!reducedMotion && <animateMotion/);
  assert.match(illustration, /repeatCount="indefinite"/);
});

test('Phase 8 polish stylesheet is loaded after the base styles', async () => {
  const index = await readText('../src/styles/index.css');
  assert.match(index, /@import "\.\/phase8-polish\.css";/);
});

test('simulation visualization no longer renders the obstructive minimap overlay', async () => {
  const source = await readText('../src/features/simulation/SimulationPage.jsx');
  assert.ok(!source.includes('MiniMap'), 'Simulation workspace should not render the minimap overlay');
  assert.match(source, /<Controls showInteractive=\{false\}/);
});

test('canvas zoom controls remain available after minimap removal', async () => {
  const source = await readText('../src/features/topology/NetworkStudioPage.jsx');
  assert.match(source, /<Controls showInteractive=\{false\} position="bottom-right" \/>/);
  assert.match(source, /Zoom in/);
  assert.match(source, /Zoom out/);
  assert.match(source, /Fit view/);
});
