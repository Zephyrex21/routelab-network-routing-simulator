import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

function getLucideImports(source) {
  const match = source.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/s);
  assert.ok(match, 'Expected a named lucide-react import');
  return match[1]
    .split(',')
    .map((name) => name.trim().split(/\s+as\s+/)[0])
    .filter(Boolean);
}

test('overview dashboard imports every icon referenced by its module-level data and JSX', async () => {
  const source = await readSource('../src/features/dashboard/OverviewPage.jsx');
  const imported = getLucideImports(source);
  assert.ok(imported.includes('Boxes'), 'Boxes is used in the steps data and must be imported');
  assert.ok(imported.includes('Route'), 'Route is rendered in the scenario cards and must be imported');
});

test('dialog imports the close icon used by its rendered close control', async () => {
  const source = await readSource('../src/components/ui/Dialog.jsx');
  const imported = getLucideImports(source);
  assert.ok(imported.includes('X'), 'X is used by the dialog close button and must be imported');
});


test('HTML includes a visible diagnostic fallback before the React app mounts', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="root"[\s\S]*class="boot-fallback"/);
  assert.match(html, /browser console \(F12\)/);
});
