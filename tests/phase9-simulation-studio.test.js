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


test('Simulation Studio renders an accessible event-by-event learning explanation', async () => {
  const source = await readText('../src/features/simulation/SimulationPage.jsx');
  assert.ok(source.includes('getEventExplanation'));
  assert.ok(source.includes('aria-label="Algorithm explanation"'));
  assert.ok(source.includes('UNDERSTAND THIS STEP'));
  assert.ok(source.includes('currentEventExplanation.takeaway'));
  const styles = await readText('../src/styles/phase9-simulation-studio.css');
  assert.ok(styles.includes('.simulation-learning-note'));
});


test('Simulation Studio practice mode offers answer selection, feedback and event reveal', async () => {
  const source = await readText('../src/features/simulation/SimulationPage.jsx');
  for (const snippet of [
    'Start practice',
    'Predict the next decision',
    'Answer options',
    'aria-pressed={selectedOptionId === choice.id}',
    'Check answer',
    'role="status"',
    'Reveal step & continue',
    'getNextLearningChallenge(run, cursor)',
  ]) assert.ok(source.includes(snippet), `Missing practice-mode interaction: ${snippet}`);
  const styles = await readText('../src/styles/phase9-simulation-studio.css');
  assert.ok(styles.includes('.simulation-practice-panel'));
  assert.ok(styles.includes('@media (max-width: 760px)'));
});


test('Simulation Studio exposes experiment history, replay, deletion and clear controls', async () => {
  const source = await readText('../src/features/simulation/SimulationPage.jsx');
  for (const snippet of [
    'Experiment history',
    'YOUR LEARNING RECORD',
    'Replay',
    'Delete',
    'Clear history',
    'History replay',
    'Return to active project',
    'saveExperiment({ run: result, project })',
    'runRoutingAlgorithm(replayProject, experiment.algorithm',
  ]) assert.ok(source.includes(snippet), `Missing experiment-history behavior: ${snippet}`);
  const styles = await readText('../src/styles/phase9-simulation-studio.css');
  assert.ok(styles.includes('.simulation-history-panel'));
  assert.ok(styles.includes('@media (max-width: 760px)'));
});
