import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readText = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Simulation Studio provides keyboard playback shortcuts without hijacking interactive controls', async () => {
  const source = await readText('../src/features/simulation/SimulationPage.jsx');
  for (const snippet of [
    "event.key === ' ' || event.key === 'Spacebar'",
    "event.key === 'ArrowLeft'",
    "event.key === 'ArrowRight'",
    "event.key === 'Home'",
    "event.key === 'End'",
    "event.key.toLowerCase() === 'r'",
    "target?.closest('input, textarea, select, button, a,",
    "window.addEventListener('keydown', handlePlaybackShortcut)",
  ]) assert.ok(source.includes(snippet), `Missing playback shortcut behavior: ${snippet}`);
});

test('Simulation Studio exposes playback progress and event selection with accessible state', async () => {
  const source = await readText('../src/features/simulation/SimulationPage.jsx');
  for (const snippet of [
    'role="progressbar"',
    'aria-valuenow={Math.round(eventProgress)}',
    'aria-valuetext={run ? cursor < 0 ? \'Before the first event\' : `Event',
    'role="group" aria-label="Simulation events"',
    "aria-current={event.sequence === currentEvent?.sequence ? 'step' : undefined}",
  ]) assert.ok(source.includes(snippet), `Missing accessible playback state: ${snippet}`);
  assert.ok(!source.includes('simulation-event-list" aria-live='), 'The changing event list should not be announced on every playback tick');
});

test('Simulation Studio provides visible keyboard shortcut guidance', async () => {
  const source = await readText('../src/features/simulation/SimulationPage.jsx');
  for (const shortcut of ['Play / pause', 'Step', 'First / last event', 'Reset']) assert.ok(source.includes(shortcut));
});

test('Phase 9.3 simulation workspace styling loads after the existing design foundations', async () => {
  const index = await readText('../src/styles/index.css');
  assert.ok(index.includes('phase9-foundation.css'));
  assert.ok(index.includes('phase9-network-studio.css'));
  assert.ok(index.includes('phase9-simulation-studio.css'));
  assert.ok(index.indexOf('phase9-simulation-studio.css') > index.indexOf('phase9-network-studio.css'));
});

test('Phase 9.3 simulation styles are scoped and responsive, with reduced-motion support', async () => {
  const styles = await readText('../src/styles/phase9-simulation-studio.css');
  for (const snippet of ['.simulation-page', '@media (max-width: 1180px)', '@media (max-width: 760px)', '@media (max-width: 460px)', 'prefers-reduced-motion: reduce']) {
    assert.ok(styles.includes(snippet), `Missing simulation responsive rule: ${snippet}`);
  }
});
