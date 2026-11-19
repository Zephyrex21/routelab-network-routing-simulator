import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readText = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('the Phase 9 foundation stylesheet loads after existing visual layers', async () => {
  const index = await readText('../src/styles/index.css');
  assert.match(index, /phase8-shell\.css/);
  assert.match(index, /phase8-polish\.css/);
  assert.match(index, /phase9-foundation\.css/);
  assert.ok(index.indexOf('phase9-foundation.css') > index.indexOf('phase8-polish.css'));
});

test('design tokens define typography, spacing, shape, layout and motion scales', async () => {
  const tokens = await readText('../src/styles/tokens.css');
  for (const token of [
    '--font-sans', '--font-mono', '--type-caption', '--type-body', '--type-section-title',
    '--space-1', '--space-4', '--space-8', '--radius-sm', '--radius-xl',
    '--content-max', '--page-gutter', '--motion-fast', '--motion-slow',
  ]) assert.ok(tokens.includes(token), `Missing design token: ${token}`);
  assert.match(tokens, /:root\[data-theme="dark"\]/);
  assert.match(tokens, /--page:\s*#f6f7f9/);
  assert.match(tokens, /--page:\s*#101319/);
});

test('Inter and IBM Plex Mono have system fallbacks and a swap font-loading strategy', async () => {
  const html = await readText('../index.html');
  const tokens = await readText('../src/styles/tokens.css');
  assert.match(html, /fonts\.googleapis\.com/);
  assert.match(html, /display=swap/);
  assert.match(tokens, /"Inter".*sans-serif/);
  assert.match(tokens, /"IBM Plex Mono".*monospace/);
});

test('Phase 9 foundation establishes a readable hierarchy and responsive gutters', async () => {
  const styles = await readText('../src/styles/phase9-foundation.css');
  assert.match(styles, /font-size:\s*var\(--type-body\)/);
  assert.match(styles, /\.page-header h1/);
  assert.match(styles, /\.sidebar-link/);
  assert.match(styles, /\.card-heading h2/);
  assert.match(styles, /\.comparison-table/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /prefers-reduced-motion/);
});

test('release version, lockfile and Phase 9.2 labels remain aligned', async () => {
  const pkg = JSON.parse(await readText('../package.json'));
  const lock = JSON.parse(await readText('../package-lock.json'));
  const sidebar = await readText('../src/components/layout/Sidebar.jsx');
  const topbar = await readText('../src/components/layout/Topbar.jsx');
  const overview = await readText('../src/features/dashboard/OverviewPage.jsx');
  assert.equal(pkg.version, '0.9.6');
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.match(sidebar, /v0\.9\.6 · Phase 9\.1/);
  assert.match(topbar, /Phase 9\.1 · Network Studio refinement/);
  assert.match(overview, /Phase 9\.1 · Network Studio refinement/);
});
