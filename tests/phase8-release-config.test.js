import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readText = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

test('Vercel config provides the SPA rewrite needed by BrowserRouter deep links', async () => {
  const config = await readJson('../vercel.json');
  assert.deepEqual(config.rewrites, [{ source: '/(.*)', destination: '/index.html' }]);
});

test('Vercel config includes baseline browser security headers', async () => {
  const config = await readJson('../vercel.json');
  const headers = config.headers?.find((entry) => entry.source === '/(.*)')?.headers || [];
  const values = Object.fromEntries(headers.map(({ key, value }) => [key, value]));
  assert.equal(values['X-Content-Type-Options'], 'nosniff');
  assert.equal(values['X-Frame-Options'], 'DENY');
  assert.equal(values['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(values['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()');
});

test('GitHub Actions CI installs the lockfile, tests, builds and audits high severity findings', async () => {
  const workflow = await readText('../.github/workflows/ci.yml');
  assert.match(workflow, /pull_request:s*
s*branches:s*[main]/);
  assert.match(workflow, /push:s*
s*branches:s*[main]/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.match(workflow, /permissions:s*
s*contents:s*read/);
});

test('Dependabot checks npm packages and GitHub Actions on a weekly schedule', async () => {
  const config = await readText('../.github/dependabot.yml');
  assert.match(config, /package-ecosystem: npm/);
  assert.match(config, /package-ecosystem: github-actions/);
  assert.equal((config.match(/interval: weekly/g) || []).length, 2);
});

test('release metadata and lockfile root version remain aligned', async () => {
  const pkg = await readJson('../package.json');
  const lock = await readJson('../package-lock.json');
  assert.equal(pkg.version, '0.9.1');
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
});

test('academic report, algorithm diagrams and viva guide are linked from the README', async () => {
  const readme = await readText('../README.md');
  for (const path of [
    'docs/phase-8/03-final-academic-report.md',
    'docs/phase-8/04-algorithm-flowcharts.md',
    'docs/phase-8/05-test-and-viva-guide.md',
    'docs/phase-8/06-deployment-and-final-release.md'
  ]) {
    assert.ok(readme.includes(path), `Missing README link: ${path}`);
    const content = await readText(`../${path}`);
    assert.ok(content.length > 1000, `Expected substantive documentation at ${path}`);
  }
});

test('security policy avoids inventing a public contact address', async () => {
  const policy = await readText('../SECURITY.md');
  assert.match(policy, /Please do not publish/);
  assert.match(policy, /Report a vulnerability/);
});
