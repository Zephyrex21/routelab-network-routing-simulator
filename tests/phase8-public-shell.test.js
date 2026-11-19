import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readText = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('the public home route is separate from the lab application shell', async () => {
  const app = await readText('../src/app/App.jsx');
  assert.ok(app.includes('<Route path="/" element={<PublicHomePage />} />'));
  assert.ok(app.includes('<Route path="/lab" element={<AppShell />}>'));
  assert.ok(app.includes('<Route index element={<Navigate to="studio" replace />} />'));
});

test('legacy workspace URLs redirect into the new lab route namespace', async () => {
  const app = await readText('../src/app/App.jsx');
  const aliases = ['overview', 'studio', 'simulation', 'packets', 'failures', 'compare'];
  for (const path of aliases) {
    assert.ok(app.includes(`<Route path="/${path}" element={<Navigate to="/lab/${path}" replace />} />`), `Missing redirect for /${path}`);
  }
});

test('the lab sidebar can collapse, persists its preference and preserves the mobile drawer', async () => {
  const shell = await readText('../src/components/layout/AppShell.jsx');
  const sidebar = await readText('../src/components/layout/Sidebar.jsx');
  const topbar = await readText('../src/components/layout/Topbar.jsx');
  assert.match(shell, /routelab-sidebar-collapsed-v1/);
  assert.match(shell, /app-frame-sidebar-collapsed/);
  assert.match(shell, /sidebarCollapsed=\{sidebarCollapsed\}/);
  assert.match(shell, /compactSidebar = sidebarCollapsed && !mobileOpen/);
  assert.match(topbar, /Collapse sidebar/);
  assert.match(topbar, /Expand sidebar/);
  assert.match(sidebar, /sidebar-collapsed/);
  assert.match(sidebar, /title=\{collapsed \? item\.label : undefined\}/);
  assert.match(sidebar, /role=\{mobileOpen \? 'dialog' : undefined\}/);
  assert.match(sidebar, /aria-modal=\{mobileOpen \? 'true' : undefined\}/);
});

test('the public homepage introduces the product and links to each lab workspace', async () => {
  const page = await readText('../src/features/dashboard/PublicHomePage.jsx');
  for (const phrase of ['See how networks', 'Go to the lab', 'Distance Vector', 'Link State', 'Build.', 'Understand.']) {
    assert.ok(page.includes(phrase), `Expected public homepage content: ${phrase}`);
  }
  for (const path of ['/lab/studio', '/lab/simulation', '/lab/packets', '/lab/failures', '/lab/compare']) {
    assert.ok(page.includes(path), `Expected public homepage link to ${path}`);
  }
});

test('Phase 8 visual styles provide a typography scale, desktop collapsed rail and mobile expanded drawer', async () => {
  const styles = await readText('../src/styles/phase8-shell.css');
  const index = await readText('../src/styles/index.css');
  assert.match(index, /phase8-shell\.css/);
  assert.match(styles, /--type-body:\s*15px/);
  assert.match(styles, /--type-caption:\s*11px/);
  assert.match(styles, /\.sidebar-collapsed \.sidebar-link-label/);
  assert.match(styles, /\.app-frame-sidebar-collapsed \.main-column/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /\.public-hero/);
  assert.match(styles, /prefers-reduced-motion/);
});

test('lab overview and workspace navigation use the new Phase 8 routes and status', async () => {
  const sidebar = await readText('../src/components/layout/Sidebar.jsx');
  const overview = await readText('../src/features/dashboard/OverviewPage.jsx');
  const topbar = await readText('../src/components/layout/Topbar.jsx');
  assert.match(sidebar, /\/lab\/overview/);
  assert.match(overview, /Phase 10\.4/);
  assert.match(topbar, /Phase 10\.4 · Exportable learning reports/);
});
