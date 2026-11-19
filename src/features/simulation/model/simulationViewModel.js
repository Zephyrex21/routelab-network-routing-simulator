const EVENT_LABELS = {
  'distance-vector.initialized': 'Routing tables initialized',
  'distance-vector.round.started': 'Update round started',
  'distance-vector.vector.sent': 'Distance vector sent',
  'distance-vector.route.updated': 'Route updated',
  'distance-vector.round.completed': 'Update round completed',
  'distance-vector.converged': 'Network converged',
  'distance-vector.completed': 'Algorithm completed',
  'link-state.lsa.originated': 'LSA originated',
  'link-state.lsa.transmitted': 'LSA transmitted',
  'link-state.lsa.accepted': 'LSA accepted',
  'link-state.lsa.duplicate-suppressed': 'Duplicate LSA suppressed',
  'link-state.flooding.completed': 'LSA flooding completed',
  'link-state.dijkstra.started': 'Dijkstra started',
  'link-state.dijkstra.vertex.settled': 'Router settled',
  'link-state.dijkstra.relaxation.updated': 'Route estimate improved',
  'link-state.dijkstra.relaxation.checked': 'Route candidate checked',
  'link-state.dijkstra.completed': 'Shortest-path tree completed',
  'link-state.completed': 'Algorithm completed',
};

export function getEventLabel(type = '') {
  return EVENT_LABELS[type] || type.split('.').slice(-1)[0]?.replaceAll('-', ' ') || 'Simulation event';
}


function displayCost(value) {
  return value === null || value === undefined ? 'Unreachable' : String(value);
}

export function getEventFacts(event) {
  if (!event) return [];
  const details = event.details || {};
  const facts = [];
  const add = (label, value) => {
    if (value !== undefined && value !== null && value !== '') facts.push({ label, value: String(value) });
  };

  switch (event.type) {
    case 'distance-vector.round.started':
      add('Update round', `${details.round} of ${details.maxRounds}`);
      break;
    case 'distance-vector.vector.sent':
      add('Advertisement', `${details.fromRouterId} → ${details.toRouterId}`);
      add('Round', details.round);
      add('Payload', 'Full routing vector');
      break;
    case 'distance-vector.route.updated':
      add('Router', details.routerId);
      add('Destination', details.destinationRouterId);
      add('Previous cost', displayCost(details.previous?.cost));
      add('New cost', displayCost(details.current?.cost));
      add('Next hop', details.current?.nextHopRouterId || '—');
      add('Round', details.round);
      break;
    case 'distance-vector.round.completed':
      add('Round', details.round);
      add('Changed entries', details.changedEntryCount);
      add('State', details.stable ? 'Stable check · no changes' : 'Tables changed');
      break;
    case 'distance-vector.converged':
      add('Executed rounds', details.roundsExecuted);
      add('Rounds with changes', details.roundsWithChanges);
      break;
    case 'link-state.lsa.originated': {
      const lsa = details.lsa;
      add('LSA origin', lsa?.originRouterId);
      add('Sequence', lsa?.sequenceNumber);
      add('Advertised links', lsa?.links?.length ?? 0);
      if (lsa?.links?.length) add('Link costs', lsa.links.slice(0, 4).map((link) => `${link.neighborRouterId} (${link.cost})`).join(' · '));
      break;
    }
    case 'link-state.lsa.transmitted':
    case 'link-state.lsa.accepted':
    case 'link-state.lsa.duplicate-suppressed':
      add('LSA origin', details.originRouterId);
      add('Message', `${details.fromRouterId} → ${details.toRouterId}`);
      add('Sequence', details.sequenceNumber);
      add('Known LSAs', details.knownLsaCount);
      break;
    case 'link-state.flooding.completed':
      add('Transmissions', details.lsaTransmissions);
      add('First-time accepts', details.lsaAcceptances);
      add('Duplicates suppressed', details.lsaDuplicatesSuppressed);
      break;
    case 'link-state.dijkstra.started':
      add('Source router', details.sourceRouterId);
      add('Known routers', details.routerCount);
      break;
    case 'link-state.dijkstra.vertex.settled':
      add('Settled router', details.routerId);
      add('Final cost from source', details.cost);
      add('Settled so far', details.settledCount);
      break;
    case 'link-state.dijkstra.relaxation.updated':
      add('Edge examined', `${details.fromRouterId} → ${details.toRouterId}`);
      add('Previous estimate', displayCost(details.previousCost));
      add('Candidate cost', details.candidateCost);
      add('Next hop from source', details.nextHopRouterId);
      add('Tie-break', details.tieBreak ? 'Equal-cost route preference' : 'Lower-cost route');
      break;
    case 'link-state.dijkstra.relaxation.checked':
      add('Edge examined', `${details.fromRouterId} → ${details.toRouterId}`);
      add('Candidate cost', details.candidateCost);
      add('Current cost', displayCost(details.currentCost));
      add('Decision', details.reason === 'already-settled' ? 'Skipped · destination already settled' : 'Existing estimate retained');
      break;
    case 'link-state.dijkstra.completed':
      add('Source router', details.sourceRouterId);
      add('Vertices settled', details.settledVertices);
      add('Relaxation attempts', details.relaxationAttempts);
      break;
    default:
      break;
  }
  return facts;
}

export function getSnapshotAtOrBefore(run, eventSequence) {
  if (!run || !Array.isArray(run.snapshots) || !Number.isInteger(eventSequence)) return null;
  let match = null;
  for (const snapshot of run.snapshots) {
    if (snapshot.sequence <= eventSequence && (!match || snapshot.sequence >= match.sequence)) match = snapshot;
  }
  return match;
}

export function getDistanceVectorTable(run, eventSequence, routerId) {
  const snapshot = getSnapshotAtOrBefore(run, eventSequence);
  if (!snapshot || !snapshot.data?.tables) return null;
  return snapshot.data.tables[routerId] || null;
}

function reconstructPath(sourceRouterId, destinationRouterId, previous) {
  if (sourceRouterId === destinationRouterId) return [sourceRouterId];
  const path = [destinationRouterId];
  const visited = new Set(path);
  let current = destinationRouterId;
  while (current !== sourceRouterId) {
    current = previous[current];
    if (!current || visited.has(current)) return [];
    path.push(current);
    visited.add(current);
  }
  return path.reverse();
}

/** Build a linear-time index of each router's Dijkstra event range. */
export function buildLinkStateReplayIndex(run) {
  const ranges = {};
  if (!run || !Array.isArray(run.events)) return { ranges };
  for (let index = 0; index < run.events.length; index += 1) {
    const event = run.events[index];
    if (event?.type === 'link-state.dijkstra.started') {
      const routerId = event.details?.sourceRouterId;
      if (routerId) ranges[routerId] = { startIndex: index, endIndex: run.events.length - 1 };
    } else if (event?.type === 'link-state.dijkstra.completed') {
      const routerId = event.details?.sourceRouterId;
      if (routerId && ranges[routerId]) ranges[routerId].endIndex = index;
    }
  }
  return { ranges };
}

/** Replay only the selected router's Dijkstra range, not the complete event prefix. */
export function getLinkStateTableAt(run, eventSequence, routerId, routerIds, replayIndex = null) {
  if (!run || !Number.isInteger(eventSequence) || !routerId) {
    return { status: 'waiting', rows: [], sourceRouterId: routerId };
  }
  const index = replayIndex || buildLinkStateReplayIndex(run);
  const range = index.ranges?.[routerId];
  const lastAvailableIndex = Math.min(eventSequence, run.events.length - 1);
  if (!range || range.startIndex > lastAvailableIndex) {
    return { status: 'waiting', rows: [], sourceRouterId: routerId };
  }

  const startedAt = range.startIndex;
  const startedEvent = run.events[startedAt];
  const distances = Object.fromEntries(routerIds.map((id) => [id, Number.POSITIVE_INFINITY]));
  const nextHops = Object.fromEntries(routerIds.map((id) => [id, null]));
  const previous = Object.fromEntries(routerIds.map((id) => [id, null]));
  const settled = new Set();
  distances[routerId] = 0;
  let completed = false;
  const replayEnd = Math.min(lastAvailableIndex, range.endIndex);

  for (let eventIndex = startedAt + 1; eventIndex <= replayEnd; eventIndex += 1) {
    const event = run.events[eventIndex];
    if (event.type === 'link-state.dijkstra.vertex.settled') {
      const target = event.details?.routerId;
      if (target && Object.hasOwn(distances, target)) {
        distances[target] = event.details.cost;
        settled.add(target);
      }
    }
    if (event.type === 'link-state.dijkstra.relaxation.updated') {
      const { toRouterId, fromRouterId, candidateCost, nextHopRouterId } = event.details || {};
      if (toRouterId && Object.hasOwn(distances, toRouterId)) {
        distances[toRouterId] = candidateCost;
        nextHops[toRouterId] = nextHopRouterId;
        previous[toRouterId] = fromRouterId;
      }
    }
    if (event.type === 'link-state.dijkstra.completed' && event.details?.sourceRouterId === routerId) {
      completed = true;
      break;
    }
  }

  const rows = routerIds.map((destinationRouterId) => {
    const cost = distances[destinationRouterId];
    const reachable = Number.isFinite(cost);
    return {
      destinationRouterId,
      nextHopRouterId: destinationRouterId === routerId ? null : nextHops[destinationRouterId],
      cost: reachable ? cost : null,
      status: reachable ? 'reachable' : completed ? 'unreachable' : 'pending',
      path: reachable ? reconstructPath(routerId, destinationRouterId, previous) : [],
      settled: settled.has(destinationRouterId),
    };
  });

  return {
    status: completed ? 'completed' : 'running',
    sourceRouterId: routerId,
    rows,
    settledRouterIds: [...settled],
    startedSequence: startedEvent.sequence,
  };
}

export function getVisibleEvents(run, eventSequence, limit = 40) {
  if (!run || !Number.isInteger(eventSequence) || !Array.isArray(run.events)) return [];
  // Run event sequence numbers are contiguous and are assigned from array indices
  // by the engine emitter. Use the sequence directly to keep large-run playback cheap.
  const end = Math.min(eventSequence, run.events.length - 1);
  if (end < 0 || run.events[end]?.sequence !== eventSequence) return [];
  return run.events.slice(Math.max(0, end - limit + 1), end + 1);
}

export function getCurrentSnapshotLabel(run, eventSequence) {
  return getSnapshotAtOrBefore(run, eventSequence)?.label || 'Waiting for first snapshot';
}

export function getCurrentActivity(event) {
  if (!event) return { routerIds: [], edgeKey: null, title: 'Ready to simulate', description: 'Run an algorithm to inspect its decisions.' };
  const details = event.details || {};
  const from = details.fromRouterId || event.actorRouterId;
  const to = details.toRouterId || details.current?.nextHopRouterId;
  const edgeKey = from && to ? [from, to].sort().join('::') : null;
  const routerIds = [...new Set([
    event.actorRouterId,
    ...(event.affectedRouterIds || []),
    from,
    to,
    details.routerId,
  ].filter(Boolean))];
  return {
    routerIds,
    edgeKey,
    title: getEventLabel(event.type),
    description: event.message,
  };
}

