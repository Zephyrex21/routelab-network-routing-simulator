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


/**
 * Turn a low-level routing event into a concise, student-facing explanation.
 * The explanation is derived only from the event currently visible in playback.
 */
export function getEventExplanation(event) {
  if (!event) {
    return {
      title: 'Your guided walkthrough starts here',
      explanation: 'Run Distance Vector or Link State, then step through the timeline. Each step will explain the decision made at that moment.',
      takeaway: 'Use Next and Previous to connect each algorithm action with the routing table changes.',
    };
  }

  const details = event.details || {};
  const router = details.routerId || event.actorRouterId || 'This router';
  const destination = details.destinationRouterId || details.toRouterId || 'the destination';
  const from = details.fromRouterId || event.actorRouterId || 'the sender';
  const to = details.toRouterId || 'the neighbour';
  const cost = (value) => value === null || value === undefined ? '∞' : String(value);

  switch (event.type) {
    case 'distance-vector.initialized':
      return {
        title: 'Start with local knowledge',
        explanation: 'Each router begins by knowing the cost to itself and the cost of its directly connected neighbours. Routes beyond those neighbours are not known yet.',
        takeaway: 'Distance Vector learns remote destinations gradually by exchanging routing tables.',
      };
    case 'distance-vector.round.started':
      return {
        title: `Round ${details.round ?? ''}: exchange begins`.trim(),
        explanation: 'Routers are beginning another update round. They use the latest vectors received from neighbours to reconsider the cheapest known route to each destination.',
        takeaway: 'A round is one cycle of neighbour information being used to improve local route estimates.',
      };
    case 'distance-vector.vector.sent':
      return {
        title: `${from} advertises its distance vector to ${to}`,
        explanation: 'The sender shares its current destination costs with a directly connected neighbour. The receiver can combine those advertised costs with the cost of the link to the sender.',
        takeaway: 'A router learns about remote paths through information advertised by its neighbours.',
      };
    case 'distance-vector.route.updated':
      return {
        title: `${router} changes its route to ${destination}`,
        explanation: `The recorded route cost changes from ${cost(details.previous?.cost)} to ${cost(details.current?.cost)}. The selected next hop is ${details.current?.nextHopRouterId || 'not available'}.`,
        takeaway: 'A route is updated when the newly calculated candidate is preferred to the previous entry.',
      };
    case 'distance-vector.round.completed':
      return {
        title: `Round ${details.round ?? ''} is complete`.trim(),
        explanation: `${details.changedEntryCount ?? 'Some'} routing entries changed during this round. ${details.stable ? 'No entries changed, so the tables are stable.' : 'Another round may propagate these changes farther through the network.'}`,
        takeaway: 'Convergence is reached when another update round produces no further route changes.',
      };
    case 'distance-vector.converged':
      return {
        title: 'Distance Vector has converged',
        explanation: `The routers reached stable routing tables after ${details.roundsExecuted ?? 'multiple'} update rounds. No additional neighbour exchange is improving the recorded routes.`,
        takeaway: 'At convergence, every router has finished learning the best routes available under the current topology.',
      };
    case 'distance-vector.completed':
      return {
        title: 'Distance Vector run completed',
        explanation: 'The algorithm has finished processing its update events and the final routing tables are ready to inspect.',
        takeaway: 'Select a router in the routing-table explorer to inspect its destination costs and next hops.',
      };
    case 'link-state.lsa.originated':
      return {
        title: `${details.lsa?.originRouterId || router} creates a link-state advertisement`,
        explanation: 'The router describes its directly connected links and their costs in an LSA. This information is the building block of the network-wide link-state database.',
        takeaway: 'Unlike Distance Vector, Link State distributes local link information so routers can build a broader topology view.',
      };
    case 'link-state.lsa.transmitted':
    case 'link-state.lsa.accepted':
      return {
        title: `Link-state information travels from ${from} to ${to}`,
        explanation: `An LSA from ${details.originRouterId || 'its origin router'} is being ${event.type.endsWith('accepted') ? 'accepted' : 'forwarded'} by the network. Sequence numbers help routers recognise newer information.`,
        takeaway: 'Flooding distributes topology information beyond the router that originally advertised it.',
      };
    case 'link-state.lsa.duplicate-suppressed':
      return {
        title: 'A duplicate LSA is suppressed',
        explanation: 'This router has already seen the same LSA sequence, so it does not need to process and forward that copy again.',
        takeaway: 'Duplicate suppression prevents repeated copies from circulating indefinitely.',
      };
    case 'link-state.flooding.completed':
      return {
        title: 'LSA flooding is complete',
        explanation: 'The topology advertisements have finished spreading through the reachable network. Routers can now use their collected link-state information for shortest-path calculations.',
        takeaway: 'The next major Link State task is running Dijkstra from each router.',
      };
    case 'link-state.dijkstra.started':
      return {
        title: `Dijkstra starts at ${details.sourceRouterId || router}`,
        explanation: 'The selected router is the source. Its distance to itself is zero; other route estimates begin unknown until paths are discovered through the link-state database.',
        takeaway: 'Dijkstra repeatedly settles the nearest unsettled router, then checks whether its neighbours can be reached more cheaply through it.',
      };
    case 'link-state.dijkstra.vertex.settled':
      return {
        title: `${details.routerId || router} is settled`,
        explanation: `The shortest known distance from the source to this router is now final at cost ${cost(details.cost)}. Dijkstra can safely use this settled distance while examining outgoing links.`,
        takeaway: 'With non-negative link costs, the lowest tentative distance is safe to finalise.',
      };
    case 'link-state.dijkstra.relaxation.updated':
      return {
        title: `A better route to ${details.toRouterId || destination} is found`,
        explanation: `The path through ${details.fromRouterId || from} gives a candidate cost of ${cost(details.candidateCost)}, improving the previous estimate of ${cost(details.previousCost)}. The route now points to next hop ${details.nextHopRouterId || 'not available'}.`,
        takeaway: 'Relaxation compares the current estimate with distance(source, current) + link cost(current, neighbour). Keep the lower valid cost.',
      };
    case 'link-state.dijkstra.relaxation.checked':
      return {
        title: `A route candidate to ${details.toRouterId || destination} is checked`,
        explanation: `The candidate cost is ${cost(details.candidateCost)} while the current estimate is ${cost(details.currentCost)}. ${details.reason === 'already-settled' ? 'The destination is already settled, so this candidate is skipped.' : 'The existing estimate remains preferred, so no update is needed.'}`,
        takeaway: 'Not every examined edge improves a route; unchanged estimates are a normal part of Dijkstra.',
      };
    case 'link-state.dijkstra.completed':
      return {
        title: `Shortest-path tree from ${details.sourceRouterId || router} is complete`,
        explanation: `Dijkstra has settled ${details.settledVertices ?? 'all reachable'} vertices after ${details.relaxationAttempts ?? 'multiple'} relaxation checks. The source router now has its final shortest-path routes.`,
        takeaway: 'The resulting shortest-path tree determines the next hop and total cost for each reachable destination.',
      };
    case 'link-state.completed':
      return {
        title: 'Link State run completed',
        explanation: 'All routers have completed their shortest-path calculations using the flooded topology information.',
        takeaway: 'Compare the final routing tables and algorithm work metrics with Distance Vector in the Comparison Lab.',
      };
    default:
      return {
        title: getEventLabel(event.type),
        explanation: event.message || 'The algorithm has advanced to the next recorded event.',
        takeaway: 'Inspect the current routing table and neighbouring timeline events to see how this step affects the network.',
      };
  }
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

