import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const baseUrl = 'http://127.0.0.1:4173';
const storageKey = 'routelab-project-library-v1';

function locatePlaywrightEntry() {
  for (const binDirectory of (process.env.PATH || '').split(path.delimiter)) {
    const binary = path.join(binDirectory, process.platform === 'win32' ? 'playwright.cmd' : 'playwright');
    if (!existsSync(binary)) continue;
    const entry = path.join(path.resolve(binDirectory, '..', 'playwright'), 'index.mjs');
    if (existsSync(entry)) return entry;
  }
  throw new Error('The pinned Playwright package was not found in the npm exec environment. Run npm run test:e2e.');
}

function startProcess(command, args) {
  return spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
}

async function ensureProductionBuild() {
  if (existsSync(path.join(root, 'dist', 'index.html'))) return;
  assert.ok(existsSync(viteCli), 'Vite is missing. Run npm ci before browser smoke tests.');
  await new Promise((resolve, reject) => {
    const child = startProcess(process.execPath, [viteCli, 'build']);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`Vite build exited with code ${code}.`)));
  });
}

async function waitForPreview(server, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (server.exitCode !== null) throw new Error(`Vite preview stopped early (exit ${server.exitCode}).`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The preview server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Vite preview did not become ready within 30 seconds.');
}

const createdAt = '2026-01-01T00:00:00.000Z';
const project = {
  schemaVersion: 1,
  projectId: 'phase-9-4-browser-smoke',
  name: 'Phase 9.4 Browser QA Network',
  createdAt,
  updatedAt: createdAt,
  topologyRevision: 1,
  routers: [
    { id: 'R1', label: 'Gateway', position: { x: 90, y: 150 } },
    { id: 'R2', label: 'Distribution', position: { x: 310, y: 90 } },
    { id: 'R3', label: 'Destination', position: { x: 530, y: 150 } },
  ],
  links: [
    { id: 'L1', sourceRouterId: 'R1', targetRouterId: 'R2', cost: 3, status: 'up' },
    { id: 'L2', sourceRouterId: 'R2', targetRouterId: 'R3', cost: 4, status: 'up' },
    { id: 'L3', sourceRouterId: 'R1', targetRouterId: 'R3', cost: 10, status: 'up' },
  ],
};

const routes = [
  ['/', 'public homepage'],
  ['/lab/overview', 'lab overview'],
  ['/lab/studio', 'Network Studio'],
  ['/lab/simulation', 'Simulation Studio'],
  ['/lab/packets', 'Packet Explorer'],
  ['/lab/failures', 'Network Failure Lab'],
  ['/lab/compare', 'Comparison Lab'],
];

let previewServer;
let browser;
let previewOutput = '';
const runtimeErrors = [];
const passed = [];

try {
  await ensureProductionBuild();
  const { chromium } = await import(pathToFileURL(locatePlaywrightEntry()).href);
  previewServer = startProcess(process.execPath, [
    viteCli, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort',
  ]);
  previewServer.stdout.on('data', (chunk) => { previewOutput += chunk.toString(); });
  previewServer.stderr.on('data', (chunk) => { previewOutput += chunk.toString(); });
  await waitForPreview(previewServer);

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await context.addInitScript(({ key, fixture }) => {
    localStorage.setItem(key, JSON.stringify({
      version: 1,
      projects: [fixture],
      lastProjectId: fixture.projectId,
    }));
  }, { key: storageKey, fixture: project });

  const page = await context.newPage();
  page.on('pageerror', (error) => runtimeErrors.push(`${page.url()}: ${error.message}`));

  for (const [route, description] of routes) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
    assert.ok(response?.ok(), `${description} returned HTTP ${response?.status()}`);
    const heading = page.locator('h1:visible').first();
    await heading.waitFor({ state: 'visible', timeout: 15000 });
    assert.ok((await heading.innerText()).trim().length > 0, `${description} rendered an empty heading`);
    assert.equal(await page.locator('.boot-fallback').count(), 0, `${description} left the boot fallback visible`);
    passed.push(`route ${route}`);
  }

  await page.goto(`${baseUrl}/lab/studio`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('toolbar', { name: 'Network canvas tools' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Select tool' }).waitFor({ state: 'visible' });
  passed.push('Network Studio canvas tools');

  await page.goto(`${baseUrl}/lab/simulation`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Run simulation' }).click();
  await page.getByRole('heading', { name: 'Event timeline' }).waitFor({ state: 'visible', timeout: 15000 });
  assert.ok(await page.locator('.simulation-event-row').count() > 0, 'Simulation Studio should render run events');
  await page.getByRole('button', { name: 'Start practice' }).click();
  await page.getByRole('heading', { name: 'Predict the next decision' }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.simulation-practice-option').count(), 3, 'Practice mode should offer three answer options');
  await page.locator('.simulation-practice-option').first().click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.locator('.simulation-practice-feedback[role="status"]').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Reveal step & continue' }).click();
  await page.getByRole('button', { name: 'Rerun' }).click();
  await page.locator('.simulation-history-row').nth(1).waitFor({ state: 'visible' });
  const historyRows = page.locator('.simulation-history-row');
  assert.equal(await historyRows.count(), 2, 'Each successful run should create a history entry');
  await historyRows.first().getByRole('button', { name: 'Replay' }).click();
  await page.getByText('History replay', { exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Return to active project' }).click();
  await historyRows.first().getByRole('button', { name: /Delete/ }).click();
  assert.equal(await historyRows.count(), 1, 'Deleting one experiment should retain the other');
  await page.getByRole('button', { name: 'Clear history' }).click();
  await page.getByText('No experiments saved yet').waitFor({ state: 'visible' });
  passed.push('Simulation Studio experiment auto-save, replay, delete and clear');
  passed.push('Simulation Studio prediction practice and answer feedback');
  passed.push('Simulation Studio run and event timeline');

  await page.goto(`${baseUrl}/lab/packets`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Calculate forwarding route' }).click();
  await page.locator('.packet-result-heading').waitFor({ state: 'visible', timeout: 15000 });
  passed.push('Packet Explorer forwarding calculation');

  await page.goto(`${baseUrl}/lab/failures`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Run before / after analysis' }).click();
  await page.getByText('APPLIED EXPERIMENT').waitFor({ state: 'visible', timeout: 15000 });
  passed.push('Network Failure Lab analysis');

  await page.goto(`${baseUrl}/lab/compare`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Run both algorithms' }).click();
  await page.getByRole('heading', { name: 'Routing-table comparison' }).waitFor({ state: 'visible', timeout: 15000 });
  passed.push('Comparison Lab dual-algorithm run');

  await page.goto(`${baseUrl}/lab/overview`, { waitUntil: 'domcontentloaded' });
  await page.locator('.sidebar-nav').getByRole('link', { name: 'Simulation Studio' }).click();
  await page.waitForURL('**/lab/simulation');
  passed.push('workspace sidebar navigation');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/lab/simulation`, { waitUntil: 'domcontentloaded' });
  await page.locator('#main-content h1').waitFor({ state: 'visible' });
  const mobileSize = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll('body *')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const className = typeof element.className === 'string' ? element.className : element.className?.baseVal || '';
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || '',
          className: className.slice(0, 100),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          position: style.position,
          overflowX: style.overflowX,
          parent: element.parentElement?.tagName.toLowerCase(),
          parentClass: typeof element.parentElement?.className === 'string' ? element.parentElement.className.slice(0, 80) : '',
        };
      })
      .filter((element) => element.width > 0 && element.right > viewport + 2
        && element.position !== 'fixed' && element.position !== 'absolute')
      .sort((left, right) => right.right - left.right)
      .slice(0, 18);
    return {
      viewport,
      document: document.documentElement.scrollWidth,
      offenders,
    };
  });
  assert.ok(
    mobileSize.document <= mobileSize.viewport + 2,
    `Simulation Studio overflows at 390px (${mobileSize.document}px document / ${mobileSize.viewport}px viewport). Offenders: ${JSON.stringify(mobileSize.offenders)}`,
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  passed.push('390px mobile layout and reduced-motion preference');

  await page.goto(`${baseUrl}/not-a-real-route`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: "This route hasn't been mapped." }).waitFor({ state: 'visible' });
  passed.push('not-found route');

  assert.deepEqual(runtimeErrors, [], `Browser runtime errors:\n${runtimeErrors.join('\n')}`);
  console.log(`\nBrowser smoke checks passed (${passed.length}):`);
  for (const item of passed) console.log(`  ✓ ${item}`);
} catch (error) {
  console.error(error);
  if (previewOutput) console.error(`\nVite preview output:\n${previewOutput}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  previewServer?.kill('SIGTERM');
}
