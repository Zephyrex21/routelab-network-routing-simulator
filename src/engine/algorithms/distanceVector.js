import { normalizeNetwork } from '../graph/normalizeNetwork.js';
import {
  cloneTables,
  compareRouterIds,
  createEventEmitter,
  createRunMetadata,
  finalizeEnvelope,
  makeSnapshot,
  toRouteEntry,
} from './shared.js';

/** Run the synchronous, educational Distance Vector model. */
export function runDistanceVector(project, options = {}) {
  const network = normalizeNetwork(project);
  const metadata = createRunMetadata(project, 'distance-vector', options);
  const emitter = createEventEmitter();
  const snapshots = [];
  const maxRounds = Math.max(1, network.routerCount - 1);

  let tables = initializeDistanceVectorTables(network);
  let roundsExecuted = 0;
  let roundsWithChanges = 0;
  let vectorMessages = 0;
  let converged = false;

  const initializedEvent = emitter.emit('distance-vector.initialized', 'All routers initialized their distance-vector tables.', {
    details: { routerCount: network.routerCount, activeLinkCount: network.activeLinkCount },
  });
  snapshots.push(makeSnapshot(initializedEvent.sequence, 'initialization', 'Initial routing tables', { tables: buildFinalTables(network.routerIds, tables) }));

  for (let round = 1; round <= maxRounds; round += 1) {
    roundsExecuted += 1;
    const previousTables = cloneTables(tables);
    emitter.emit('distance-vector.round.started', `Distance Vector round ${round} started.`, {
      details: { round, maxRounds },
    });

    for (const senderRouterId of network.routerIds) {
      for (const neighbour of network.adjacency[senderRouterId]) {
        vectorMessages += 1;
        emitter.emit('distance-vector.vector.sent', `${senderRouterId} advertised its vector to ${neighbour.routerId}.`, {
          actorRouterId: senderRouterId,
          affectedRouterIds: [senderRouterId, neighbour.routerId],
          details: { round, fromRouterId: senderRouterId, toRouterId: neighbour.routerId },
        });
      }
    }

    const nextTables = {};
    const changedEntries = [];

    for (const routerId of network.routerIds) {
      nextTables[routerId] = [];
      for (const destinationRouterId of network.routerIds) {
        if (routerId === destinationRouterId) {
          nextTables[routerId].push(toRouteEntry(destinationRouterId, 0, null, [routerId]));
          continue;
        }

        let best = null;
        for (const neighbour of network.adjacency[routerId]) {
          const neighbourRoute = previousTables[neighbour.routerId]
            .find((entry) => entry.destinationRouterId === destinationRouterId);
          if (!neighbourRoute || neighbourRoute.status !== 'reachable') continue;

          const candidateCost = neighbour.cost + neighbourRoute.cost;
          const candidate = {
            cost: candidateCost,
            nextHopRouterId: neighbour.routerId,
          };
          if (!best
            || candidate.cost < best.cost
            || (candidate.cost === best.cost && compareRouterIds(candidate.nextHopRouterId, best.nextHopRouterId) < 0)) {
            best = candidate;
          }
        }

        nextTables[routerId].push(best
          ? toRouteEntry(destinationRouterId, best.cost, best.nextHopRouterId)
          : toRouteEntry(destinationRouterId, Number.POSITIVE_INFINITY, null));
      }

      const previousByDestination = new Map(previousTables[routerId].map((entry) => [entry.destinationRouterId, entry]));
      for (const nextEntry of nextTables[routerId]) {
        const previousEntry = previousByDestination.get(nextEntry.destinationRouterId);
        if (!sameRoute(previousEntry, nextEntry)) {
          changedEntries.push({
            routerId,
            destinationRouterId: nextEntry.destinationRouterId,
            previous: publicRoute(previousEntry),
            current: publicRoute(nextEntry),
          });
        }
      }
    }

    // Commit every router's table only after all routers read the previous round.
    tables = nextTables;
    const changed = changedEntries.length > 0;
    if (changed) roundsWithChanges += 1;

    for (const change of changedEntries) {
      emitter.emit('distance-vector.route.updated', `${change.routerId} updated its route to ${change.destinationRouterId}.`, {
        actorRouterId: change.routerId,
        affectedRouterIds: [change.routerId, change.destinationRouterId],
        details: { round, ...change },
      });
    }

    const roundCompletedEvent = emitter.emit('distance-vector.round.completed', `Distance Vector round ${round} completed${changed ? ' with table changes' : ' with no changes'}.`, {
      details: { round, changedEntryCount: changedEntries.length, stable: !changed },
    });
    snapshots.push(makeSnapshot(roundCompletedEvent.sequence, 'round', `After round ${round}`, {
      round,
      changed,
      changedEntries,
      tables: buildFinalTables(network.routerIds, tables),
    }));

    if (!changed) {
      converged = true;
      emitter.emit('distance-vector.converged', `All routing tables stabilized after ${round} executed rounds.`, {
        details: { roundsExecuted, roundsWithChanges },
      });
      break;
    }
  }

  if (!converged) {
    const error = new Error(`Distance Vector did not converge within the safety bound of ${maxRounds} rounds.`);
    error.name = 'RoutingConvergenceError';
    error.code = 'DISTANCE_VECTOR_DID_NOT_CONVERGE';
    throw error;
  }

  const finalTables = buildFinalTables(network.routerIds, tables);
  emitter.emit('distance-vector.completed', 'Distance Vector calculation completed successfully.', {
    details: { roundsExecuted, roundsWithChanges, vectorMessages },
  });

  return finalizeEnvelope(metadata, emitter, finalTables, {
    routerCount: network.routerCount,
    activeLinkCount: network.activeLinkCount,
    disabledLinkCount: network.disabledLinks.length,
    roundsExecuted,
    roundsWithChanges,
    vectorMessages,
  }, snapshots);
}

export function initializeDistanceVectorTables(network) {
  const tables = {};
  for (const routerId of network.routerIds) {
    const directNeighbours = new Map(network.adjacency[routerId].map((item) => [item.routerId, item.cost]));
    tables[routerId] = network.routerIds.map((destinationRouterId) => {
      if (destinationRouterId === routerId) return toRouteEntry(destinationRouterId, 0, null, [routerId]);
      if (directNeighbours.has(destinationRouterId)) {
        return toRouteEntry(destinationRouterId, directNeighbours.get(destinationRouterId), destinationRouterId);
      }
      return toRouteEntry(destinationRouterId, Number.POSITIVE_INFINITY, null);
    });
  }
  return tables;
}

function sameRoute(left, right) {
  return left.status === right.status
    && left.cost === right.cost
    && left.nextHopRouterId === right.nextHopRouterId;
}

function publicRoute(entry) {
  return {
    destinationRouterId: entry.destinationRouterId,
    nextHopRouterId: entry.nextHopRouterId,
    cost: entry.cost,
    status: entry.status,
  };
}

function buildFinalTables(routerIds, rawTables) {
  const nextHops = Object.fromEntries(routerIds.map((routerId) => [
    routerId,
    new Map(rawTables[routerId].map((entry) => [entry.destinationRouterId, entry])),
  ]));

  return Object.fromEntries(routerIds.map((sourceRouterId) => [sourceRouterId, routerIds.map((destinationRouterId) => {
    const route = nextHops[sourceRouterId].get(destinationRouterId);
    if (route.status !== 'reachable') return toRouteEntry(destinationRouterId, Number.POSITIVE_INFINITY, null);
    if (sourceRouterId === destinationRouterId) return toRouteEntry(destinationRouterId, 0, null, [sourceRouterId]);

    const path = [sourceRouterId];
    const visited = new Set(path);
    let currentRouterId = sourceRouterId;
    while (currentRouterId !== destinationRouterId) {
      const currentRoute = nextHops[currentRouterId].get(destinationRouterId);
      const nextHop = currentRoute?.nextHopRouterId;
      if (!nextHop || visited.has(nextHop)) {
        const error = new Error(`A next-hop loop was detected while reconstructing ${sourceRouterId} → ${destinationRouterId}.`);
        error.name = 'RoutingInvariantError';
        error.code = 'DISTANCE_VECTOR_PATH_LOOP';
        throw error;
      }
      path.push(nextHop);
      visited.add(nextHop);
      currentRouterId = nextHop;
    }
    return toRouteEntry(destinationRouterId, route.cost, route.nextHopRouterId, path);
  })]));
}
