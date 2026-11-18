export function createRunMetadata(project, algorithm, options = {}) {
  const clock = typeof options.clock === 'function' ? options.clock : () => new Date();
  const startedAtValue = options.startedAt ?? clock();
  const startedAt = toIsoString(startedAtValue, 'startedAt');
  const runId = options.runId || createRunId();
  return {
    runId,
    projectId: project.projectId,
    topologyRevision: project.topologyRevision,
    algorithm,
    status: 'completed',
    startedAt,
    clock,
  };
}

function toIsoString(value, label) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError(`Routing run ${label} must be a valid date-time.`);
  return date.toISOString();
}

export function createRunId() {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `run-${uuid}`;
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEventEmitter() {
  const events = [];
  return {
    emit(type, message, fields = {}) {
      const event = {
        sequence: events.length,
        type,
        actorRouterId: fields.actorRouterId ?? null,
        message,
        affectedRouterIds: fields.affectedRouterIds || [],
        details: fields.details || {},
      };
      events.push(event);
      return event;
    },
    getEvents() {
      return events;
    },
  };
}

export function cloneTables(tables) {
  return Object.fromEntries(Object.entries(tables).map(([routerId, entries]) => [
    routerId,
    entries.map((entry) => ({ ...entry, path: entry.path ? [...entry.path] : undefined })),
  ]));
}

export function toRouteEntry(destinationRouterId, cost, nextHopRouterId, path = []) {
  const reachable = Number.isFinite(cost);
  return {
    destinationRouterId,
    nextHopRouterId: reachable ? nextHopRouterId : null,
    cost: reachable ? cost : null,
    status: reachable ? 'reachable' : 'unreachable',
    path: reachable ? [...path] : [],
  };
}

export function compareRouterIds(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function finalizeEnvelope(metadata, emitter, finalTables, metrics, snapshots = []) {
  return {
    runId: metadata.runId,
    projectId: metadata.projectId,
    topologyRevision: metadata.topologyRevision,
    algorithm: metadata.algorithm,
    status: metadata.status,
    startedAt: metadata.startedAt,
    completedAt: toIsoString(metadata.clock(), 'completedAt'),
    events: emitter.getEvents(),
    finalTables,
    metrics,
    snapshots,
  };
}

export function makeSnapshot(eventSequence, stage, label, data) {
  return { sequence: eventSequence, stage, label, data };
}
