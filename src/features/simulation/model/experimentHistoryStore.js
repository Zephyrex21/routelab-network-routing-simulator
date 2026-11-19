import { validateProject } from '../../topology/model/projectModel.js';
const STORAGE_KEY = 'routelab-experiment-history-v1';
const STORAGE_VERSION = 1;
export const MAX_EXPERIMENT_HISTORY = 20;
const emptyHistory = () => ({ version: STORAGE_VERSION, experiments: [] });

function readHistoryState() {
  if (typeof window === 'undefined') return { ok: false, raw: null, message: 'Browser storage is unavailable in this session.' };
  let raw;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { ok: true, history: emptyHistory(), raw: null };
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return { ok: false, raw, message: 'Experiment history data is damaged. Existing data was preserved.' }; }
    if (parsed?.version !== STORAGE_VERSION || !Array.isArray(parsed.experiments)) {
      return { ok: false, raw, message: 'Experiment history uses an unsupported storage version. Existing data was preserved.' };
    }
    return { ok: true, history: parsed, raw };
  } catch {
    return { ok: false, raw: null, message: 'Browser storage is unavailable in this session.' };
  }
}

const isDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const validMetrics = (metrics) => Boolean(metrics && typeof metrics === 'object' && !Array.isArray(metrics)
  && Object.values(metrics).every((value) => typeof value === 'number' && Number.isFinite(value)));

function isValidExperiment(record) {
  return Boolean(record
    && typeof record.id === 'string' && record.id.length > 0
    && typeof record.runId === 'string' && record.runId.length > 0
    && ['distance-vector', 'link-state'].includes(record.algorithm)
    && typeof record.projectId === 'string' && record.projectId.length > 0
    && typeof record.projectName === 'string'
    && Number.isInteger(record.topologyRevision) && record.topologyRevision > 0
    && validateProject(record.projectSnapshot).valid
    && record.projectSnapshot.projectId === record.projectId
    && record.projectSnapshot.topologyRevision === record.topologyRevision
    && isDate(record.startedAt) && isDate(record.completedAt)
    && Number.isInteger(record.eventCount) && record.eventCount >= 0
    && validMetrics(record.metrics) && typeof record.summary === 'string');
}

function listExperiments(history) {
  return history.experiments.filter(isValidExperiment)
    .sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt));
}

function announceHistoryChanged() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try { window.dispatchEvent(new CustomEvent('routelab:experiment-history-changed')); }
  catch { /* Persistence does not depend on same-tab notifications. */ }
}

function writeHistory(history) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    announceHistoryChanged();
    return { ok: true, message: '' };
  } catch (error) {
    return {
      ok: false,
      message: error?.name === 'QuotaExceededError'
        ? 'Browser storage is full. Delete older experiments before saving another run.'
        : 'Browser storage is unavailable. This simulation remains available until you leave the page.',
    };
  }
}

function createExperimentId() {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `experiment-${uuid}` : `experiment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSummary(algorithm, metrics, eventCount) {
  return algorithm === 'distance-vector'
    ? `${metrics.roundsExecuted ?? 0} rounds · ${metrics.vectorMessages ?? 0} vector messages · ${eventCount} events`
    : `${metrics.dijkstraRuns ?? 0} Dijkstra runs · ${metrics.lsaTransmissions ?? 0} LSA transmissions · ${eventCount} events`;
}

export function getExperimentHistoryStatus() {
  const state = readHistoryState();
  return state.ok ? { ok: true, status: 'available', message: '' }
    : { ok: false, status: 'recovery-required', message: state.message };
}

export function getExperimentHistory() {
  const state = readHistoryState();
  return state.ok ? listExperiments(state.history) : [];
}

export function saveExperiment({ run, project } = {}) {
  if (!run || !Array.isArray(run.events) || !validMetrics(run.metrics)
    || !['distance-vector', 'link-state'].includes(run.algorithm)
    || !isDate(run.startedAt) || !isDate(run.completedAt)
    || typeof run.runId !== 'string' || !run.runId) {
    return { ok: false, message: 'This simulation result is incomplete and cannot be added to experiment history.' };
  }
  if (!project || !validateProject(project).valid || run.projectId !== project.projectId
    || run.topologyRevision !== project.topologyRevision) {
    return { ok: false, message: 'The saved topology snapshot does not match this simulation result.' };
  }
  const state = readHistoryState();
  if (!state.ok) return { ok: false, message: state.message };

  const metrics = Object.fromEntries(Object.entries(run.metrics).filter(([, value]) => (
    typeof value === 'number' && Number.isFinite(value)
  )));
  const record = {
    id: createExperimentId(),
    runId: run.runId,
    algorithm: run.algorithm,
    projectId: project.projectId,
    projectName: project.name,
    topologyRevision: project.topologyRevision,
    projectSnapshot: JSON.parse(JSON.stringify(project)),
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    eventCount: run.events.length,
    metrics,
    summary: createSummary(run.algorithm, metrics, run.events.length),
  };

  // Preserve malformed legacy entries while bounding valid records to the newest twenty.
  let retainedValid = 0;
  const experiments = [record];
  for (const entry of state.history.experiments) {
    if (entry?.runId === record.runId) continue;
    if (isValidExperiment(entry)) {
      if (retainedValid >= MAX_EXPERIMENT_HISTORY - 1) continue;
      retainedValid += 1;
    }
    experiments.push(entry);
  }
  const result = writeHistory({ ...state.history, version: STORAGE_VERSION, experiments });
  return result.ok ? { ...result, record } : result;
}

export function deleteExperiment(experimentId) {
  if (typeof experimentId !== 'string' || !experimentId) return { ok: false, message: 'Choose a valid experiment to delete.' };
  const state = readHistoryState();
  if (!state.ok) return { ok: false, message: state.message };
  const experiments = state.history.experiments.filter((entry) => entry?.id !== experimentId);
  if (experiments.length === state.history.experiments.length) return { ok: false, message: 'This experiment is no longer in history.' };
  return writeHistory({ ...state.history, experiments });
}

export function clearExperimentHistory() {
  const state = readHistoryState();
  if (!state.ok) return { ok: false, message: state.message };
  return writeHistory(emptyHistory());
}
