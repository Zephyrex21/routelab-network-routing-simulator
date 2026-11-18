import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readText = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

function relativeLuminance(hex) {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function getTokenBlock(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(match, `Missing token block for ${selector}`);
  return match[1];
}

function getCssToken(block, token) {
  const match = block.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `Missing ${token} in CSS token block`);
  return match[1];
}

test('Vite development and preview servers bind only to loopback', async () => {
  const config = await readText('../vite.config.js');
  assert.match(config, /server:\s*\{[\s\S]*?host:\s*['"]127\.0\.0\.1['"]/);
  assert.match(config, /preview:\s*\{[\s\S]*?host:\s*['"]127\.0\.0\.1['"]/);
  assert.doesNotMatch(config, /0\.0\.0\.0|--host/);
  assert.match(config, /allowedHosts:\s*\[['"]localhost['"],\s*['"]127\.0\.0\.1['"]\]/);
  assert.match(config, /fs:\s*\{\s*strict:\s*true\s*\}/);
});

test('Vite is pinned to the patched 7.3.8 release and Node engine is documented', async () => {
  const pkg = await readJson('../package.json');
  assert.equal(pkg.devDependencies.vite, '7.3.8');
  assert.equal(pkg.engines.node, '>=20.19.0');
  assert.equal(pkg.devDependencies['@vitejs/plugin-react'], '5.1.4');
});

test('unused Recharts dependency has been removed from the project', async () => {
  const pkg = await readJson('../package.json');
  assert.equal(pkg.dependencies.recharts, undefined);
  const comparison = await readText('../src/features/comparison/ComparePage.jsx');
  assert.doesNotMatch(comparison, /from\s+['"]recharts['"]/);
});

test('mobile navigation behaves as a modal surface with background inertness and escape support', async () => {
  const shell = await readText('../src/components/layout/AppShell.jsx');
  const sidebar = await readText('../src/components/layout/Sidebar.jsx');
  assert.match(shell, /mainColumn\.inert\s*=\s*true/);
  assert.match(shell, /mainColumn\.inert\s*=\s*previousMainInert/);
  assert.match(shell, /event\.key === 'Escape'/);
  assert.match(shell, /event\.key !== 'Tab'/);
  assert.match(sidebar, /role=\{mobileOpen \? 'dialog' : undefined\}/);
  assert.match(sidebar, /aria-modal=\{mobileOpen \? 'true' : undefined\}/);
  assert.match(sidebar, /label=\"Close navigation\"/);
});

test('dialogs announce their descriptions, trap focus, make the app inert and restore scroll/focus', async () => {
  const source = await readText('../src/components/ui/Dialog.jsx');
  assert.match(source, /aria-modal=\"true\"/);
  assert.match(source, /aria-describedby=\{description \? descriptionId : undefined\}/);
  assert.match(source, /appFrame\.inert\s*=\s*true/);
  assert.match(source, /appFrame\.inert\s*=\s*previousInert/);
  assert.match(source, /document\.body\.style\.overflow\s*=\s*'hidden'/);
  assert.match(source, /previousActiveElement\.focus/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /event\.key !== 'Tab'/);
});

test('field controls generate unique ids and connect hints and errors to their controls', async () => {
  const source = await readText('../src/components/ui/Field.jsx');
  assert.equal((source.match(/useId\(\)/g) || []).length, 2);
  assert.match(source, /aria-describedby=\{describedBy\}/);
  assert.match(source, /aria-describedby=\{hint \? hintId : undefined\}/);
  assert.match(source, /role=\"alert\"/);
});

test('all small tertiary text tokens meet WCAG AA contrast against their primary surfaces', async () => {
  const source = await readText('../src/styles/tokens.css');
  const light = getTokenBlock(source, ':root,\n:root[data-theme="light"]');
  const dark = getTokenBlock(source, ':root[data-theme="dark"]');
  const lightText = getCssToken(light, '--text-tertiary');
  const lightSurface = getCssToken(light, '--surface');
  const lightPage = getCssToken(light, '--page');
  const darkText = getCssToken(dark, '--text-tertiary');
  const darkSurface = getCssToken(dark, '--surface');
  const darkPage = getCssToken(dark, '--page');
  assert.ok(contrastRatio(lightText, lightSurface) >= 4.5, 'Light tertiary text must meet 4.5:1 on cards');
  assert.ok(contrastRatio(lightText, lightPage) >= 4.5, 'Light tertiary text must meet 4.5:1 on the page');
  assert.ok(contrastRatio(darkText, darkSurface) >= 4.5, 'Dark tertiary text must meet 4.5:1 on cards');
  assert.ok(contrastRatio(darkText, darkPage) >= 4.5, 'Dark tertiary text must meet 4.5:1 on the page');
});

test('reduced-motion support, responsive layouts and visible keyboard focus remain present', async () => {
  const css = await readText('../src/styles/global.css');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /max-width:\s*760px/);
  assert.match(css, /max-width:\s*460px/);
  assert.match(css, /max-width:\s*360px/);
});

test('project import remains bounded to 1 MB and validates data before accepting it', async () => {
  const source = await readText('../src/features/topology/NetworkStudioPage.jsx');
  assert.match(source, /file\.size\s*>\s*1024\s*\*\s*1024/);
  assert.match(source, /JSON\.parse\(await file\.text\(\)\)/);
  assert.match(source, /const validation = validateProject\(parsed\)/);
});

test('Phase 7 hardening remains recorded and current Phase 8 release metadata is consistent', async () => {
  const pkg = await readJson('../package.json');
  const changelog = await readText('../CHANGELOG.md');
  const sidebar = await readText('../src/components/layout/Sidebar.jsx');
  const topbar = await readText('../src/components/layout/Topbar.jsx');
  const overview = await readText('../src/features/dashboard/OverviewPage.jsx');
  assert.equal(pkg.version, '0.9.1');
  assert.match(changelog, /0\.8\.0 — Phase 7/);
  assert.match(changelog, /0\.9\.0 — Phase 8: Public Home/);
  assert.match(changelog, /0\.9\.1 — Phase 8: Release Preparation/);
  assert.match(sidebar, /v0\.9\.1 · Phase 8/);
  assert.match(topbar, /Phase 8 · final release preparation/);
  assert.match(overview, /Phase 8 · final release preparation/);
});

test('IconButton defaults to a non-submitting button type', async () => {
  const source = await readText('../src/components/ui/IconButton.jsx');
  assert.match(source, /type\s*=\s*'button'/);
  assert.match(source, /type=\{type\}/);
});


test('toast notifications announce errors assertively and other messages politely', async () => {
  const source = await readText('../src/components/ui/ToastProvider.jsx');
  assert.match(source, /role=\{toast\.tone === 'error' \? 'alert' : 'status'\}/);
  assert.match(source, /aria-atomic="true"/);
  assert.doesNotMatch(source, /className="toast-region"[^>]*aria-live=/);
});

test('direct dependencies are pinned to explicit versions for a stable first lockfile', async () => {
  const pkg = await readJson('../package.json');
  assert.equal(pkg.dependencies['@xyflow/react'], '12.12.1');
  assert.equal(pkg.dependencies['lucide-react'], '0.468.0');
  assert.equal(pkg.dependencies.react, '19.3.1');
  assert.equal(pkg.dependencies['react-dom'], '19.3.1');
  assert.equal(pkg.dependencies['react-router-dom'], '7.18.5');
  assert.equal(pkg.devDependencies['@tailwindcss/vite'], '4.3.5');
  assert.equal(pkg.devDependencies['@vitejs/plugin-react'], '5.1.4');
  assert.equal(pkg.devDependencies.tailwindcss, '4.3.5');
  assert.equal(pkg.devDependencies.vite, '7.3.8');
  const allVersions = [...Object.values(pkg.dependencies), ...Object.values(pkg.devDependencies)];
  assert.ok(allVersions.every((version) => /^\d+\.\d+\.\d+$/.test(version)), 'All direct dependencies must use exact versions');
});
