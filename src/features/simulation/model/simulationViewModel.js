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


/**
 * Build a prediction exercise from the next unseen, decision-bearing event.
 * The target event is withheld from the learner until they submit an answer.
 */
export function getNextLearningChallenge(run, eventSequence = -1) {
  if (!run || !Array.isArray(run.events)) return null;

  const formatCost = (value) => value === null || value === undefined ? '∞' : String(value);
  const makeChallenge = (event, question, choices, correctOptionId, explanation, takeaway) => ({
    eventSequence: event.sequence,
    question,
    choices,
    correctOptionId,
    explanation,
    takeaway,
  });

  for (const event of run.events) {
    if (!Number.isInteger(event.sequence) || event.sequence <= eventSequence) continue;
    const details = event.details || {};

    switch (event.type) {
      case 'distance-vector.vector.sent':
        return makeChallenge(
          event,
          `${details.toRouterId || 'The receiving router'} gets a distance vector from ${details.fromRouterId || 'a neighbour'}. How should it use that information?`,
          [
            { id: 'replace-all', label: 'Copy the neighbour’s entire table and replace its own routes.' },
            { id: 'compare-via-neighbour', label: 'Add the link cost to the neighbour’s advertised costs, then compare candidate routes.' },
            { id: 'ignore-remote', label: 'Ignore destinations that are not directly connected.' },
          ],
          'compare-via-neighbour',
          'Distance Vector uses the neighbour’s advertised distance plus the cost of the link to that neighbour. The receiver compares this candidate with its existing route and keeps the preferred entry.',
          'A neighbour’s vector is a set of candidate paths, not a replacement for the receiver’s own routing table.',
        );
      case 'distance-vector.route.updated': {
        const previousCost = details.previous?.cost;
        const nextCost = details.current?.cost;
        const isTieBreak = previousCost !== null && previousCost !== undefined
          && nextCost !== null && nextCost !== undefined
          && Number(previousCost) === Number(nextCost);
        const correctOptionId = isTieBreak ? 'prefer-next-hop' : 'accept-lower-cost';
        return makeChallenge(
          event,
          `${details.routerId || event.actorRouterId || 'The router'} has a new candidate for ${details.destinationRouterId || 'a destination'}: cost ${formatCost(nextCost)} instead of ${formatCost(previousCost)}. What should happen?`,
          [
            { id: 'keep-old', label: 'Always keep the previous route once it has been learned.' },
            { id: 'accept-lower-cost', label: 'Replace the old route because the new candidate has a lower cost.' },
            { id: 'prefer-next-hop', label: 'Keep the same total cost but apply the deterministic next-hop tie-break.' },
          ],
          correctOptionId,
          isTieBreak
            ? 'The total cost is unchanged, but the model applies its deterministic tie-break to choose a preferred next hop. The route changes without claiming a lower total cost.'
            : 'The new candidate has a lower total cost than the previous entry, so the router records the improved route and its next hop.',
          'Distance Vector compares candidate costs first; deterministic tie-breaking keeps equal-cost results reproducible.',
        );
      }
      case 'distance-vector.round.completed':
        return makeChallenge(
          event,
          `Round ${details.round ?? ''} has finished. ${details.changedEntryCount ?? 0} routing entries changed. What should the algorithm do next?`.trim(),
          [
            { id: 'stop', label: 'Stop: the tables are stable and another round cannot improve them.' },
            { id: 'continue', label: 'Continue: another round is needed to propagate the changes.' },
            { id: 'clear', label: 'Clear all learned routes and restart from direct neighbours.' },
          ],
          details.stable ? 'stop' : 'continue',
          details.stable
            ? 'No routing entries changed in this round, so the stability check confirms convergence.'
            : 'At least one entry changed. Another synchronous round allows the new information to propagate to other routers.',
          'Distance Vector converges after a complete round produces no routing-table changes.',
        );
      case 'distance-vector.converged':
        return makeChallenge(
          event,
          'What does convergence mean in this Distance Vector run?',
          [
            { id: 'one-router', label: 'The first router has finished calculating its own table.' },
            { id: 'stable-tables', label: 'All routers have stable tables and another update round produces no changes.' },
            { id: 'direct-only', label: 'Every router can reach only its directly connected neighbours.' },
          ],
          'stable-tables',
          'Convergence means the distributed update process has stabilised. Every router’s table is stable for the current topology.',
          'Convergence is a network-wide stability condition, not simply the completion of one router’s work.',
        );
      case 'link-state.lsa.duplicate-suppressed':
        return makeChallenge(
          event,
          'A router receives an LSA sequence it has already processed. What is the correct response?',
          [
            { id: 'forward-again', label: 'Forward it to every neighbour again.' },
            { id: 'discard-duplicate', label: 'Suppress the duplicate instead of processing and flooding it again.' },
            { id: 'delete-database', label: 'Delete its link-state database and request a full restart.' },
          ],
          'discard-duplicate',
          'The receiver recognises that this LSA sequence has already been seen. Suppressing it prevents duplicate copies from being repeatedly flooded.',
          'Sequence-aware duplicate suppression keeps LSA flooding bounded.',
        );
      case 'link-state.flooding.completed':
        return makeChallenge(
          event,
          'The LSAs have finished flooding through the reachable network. What is the next major calculation?',
          [
            { id: 'exchange-vectors', label: 'Start synchronous distance-vector table exchanges.' },
            { id: 'run-dijkstra', label: 'Build each router’s shortest-path tree with Dijkstra.' },
            { id: 'stop', label: 'Stop: flooding itself has calculated every forwarding route.' },
          ],
          'run-dijkstra',
          'Flooding distributes topology information. Each router then uses its local link-state database to run Dijkstra and calculate shortest paths.',
          'LSA flooding builds topology knowledge; Dijkstra turns that knowledge into routes.',
        );
      case 'link-state.dijkstra.started':
        return makeChallenge(
          event,
          `Dijkstra starts at source ${details.sourceRouterId || 'router S'}. Which distance should be known initially?`,
          [
            { id: 'source-zero', label: 'The source has distance 0; other routers begin with unknown (infinite) estimates.' },
            { id: 'all-one', label: 'Every router starts with distance 1 from the source.' },
            { id: 'all-final', label: 'Every router’s final shortest-path distance is already known.' },
          ],
          'source-zero',
          'Dijkstra initialises the source distance to zero. Other vertices start at infinity until a path to them is discovered.',
          'The algorithm grows shortest paths outward from one source using tentative distance estimates.',
        );
      case 'link-state.dijkstra.vertex.settled':
        return makeChallenge(
          event,
          `${details.routerId || 'A router'} is selected with tentative cost ${formatCost(details.cost)}. What does settling it mean?`,
          [
            { id: 'final-distance', label: 'Its shortest distance from the source is now final.' },
            { id: 'temporary-only', label: 'Its cost is only a guess and must always be increased later.' },
            { id: 'remove-router', label: 'The router is removed from the topology.' },
          ],
          'final-distance',
          'With non-negative link costs, Dijkstra can safely finalise the unsettled vertex with the smallest tentative distance.',
          'A settled distance is final for that source; later relaxations do not change it.',
        );
      case 'link-state.dijkstra.relaxation.updated': {
        const previousCost = details.previousCost;
        const candidateCost = details.candidateCost;
        const tieBreak = Boolean(details.tieBreak);
        return makeChallenge(
          event,
          tieBreak
            ? `Two paths to ${details.toRouterId || 'a router'} have the same total cost. What does the deterministic tie-break change?`
            : `A path through ${details.fromRouterId || 'the current router'} reaches ${details.toRouterId || 'a neighbour'} with cost ${formatCost(candidateCost)}, versus the previous estimate ${formatCost(previousCost)}. What should Dijkstra do?`,
          [
            { id: 'keep-old', label: 'Keep the old route regardless of the candidate.' },
            { id: 'update', label: tieBreak ? 'Keep the equal total cost but select the preferred first hop/predecessor.' : 'Update the tentative distance and record the new best path.' },
            { id: 'settle-now', label: 'Settle the destination immediately, even if another vertex is closer.' },
          ],
          'update',
          tieBreak
            ? 'The numeric distance is equal, but the deterministic tie-break selects a reproducible first hop or predecessor.'
            : 'Relaxation compares the current estimate with distance(source, current) + link cost(current, neighbour). A lower candidate replaces the existing estimate.',
          'Relaxation updates tentative paths; settling is a separate step performed when the smallest estimate is selected.',
        );
      }
      case 'link-state.dijkstra.relaxation.checked':
        return makeChallenge(
          event,
          details.reason === 'already-settled'
            ? `The edge ${details.fromRouterId || 'u'} → ${details.toRouterId || 'v'} points to an already settled router. What should happen?`
            : `A candidate cost of ${formatCost(details.candidateCost)} is checked against the current estimate ${formatCost(details.currentCost)}. What should Dijkstra do when the candidate is not better?`,
          [
            { id: 'force-update', label: 'Always replace the current route with the newly examined edge.' },
            { id: 'keep-or-skip', label: details.reason === 'already-settled' ? 'Skip it: a settled destination is already final.' : 'Keep the existing estimate because the candidate is not better.' },
            { id: 'restart', label: 'Restart Dijkstra from the same source.' },
          ],
          'keep-or-skip',
          details.reason === 'already-settled'
            ? 'The destination has already been settled, so its shortest distance is final and this edge is skipped.'
            : 'The candidate does not improve the stored estimate, so the existing best-known distance remains unchanged.',
          'Dijkstra examines edges, but only a better valid candidate changes a tentative route.',
        );
      default:
        break;
    }
  }
  return null;
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

