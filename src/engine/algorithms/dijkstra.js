import { compareIds } from '../graph/normalizeNetwork.js';
import { compareRouterIds } from './shared.js';

/** Deterministic Dijkstra using linear minimum selection (O(V² + E)). */
export function runDijkstra({ routerIds, adjacency, sourceRouterId, onEvent = () => {} }) {
  if (!Array.isArray(routerIds) || !routerIds.includes(sourceRouterId)) {
    throw new Error(`Dijkstra source router "${sourceRouterId}" is not present in the supplied graph.`);
  }

  if (new Set(routerIds).size !== routerIds.length || routerIds.some((id) => typeof id !== 'string' || !id.trim())) {
    throw new TypeError('Dijkstra router IDs must be unique, non-empty strings.');
  }
  for (const [fromRouterId, edges] of Object.entries(adjacency || {})) {
    if (!routerIds.includes(fromRouterId) || !Array.isArray(edges)) {
      throw new TypeError(`Dijkstra adjacency for ${fromRouterId} is invalid.`);
    }
    for (const edge of edges) {
      if (!edge || !routerIds.includes(edge.routerId) || !Number.isInteger(edge.cost) || edge.cost < 1) {
        throw new TypeError(`Dijkstra received an invalid edge from ${fromRouterId}. Costs must be positive integers.`);
      }
    }
  }

  const orderedRouterIds = [...routerIds].sort(compareIds);
  const distances = Object.fromEntries(orderedRouterIds.map((id) => [id, Number.POSITIVE_INFINITY]));
  const previous = Object.fromEntries(orderedRouterIds.map((id) => [id, null]));
  const firstHops = Object.fromEntries(orderedRouterIds.map((id) => [id, null]));
  const settled = new Set();
  let settledVertices = 0;
  let relaxationAttempts = 0;

  distances[sourceRouterId] = 0;
  onEvent('dijkstra.started', `Dijkstra started at ${sourceRouterId}.`, {
    actorRouterId: sourceRouterId,
    details: { sourceRouterId, routerCount: orderedRouterIds.length },
  });

  while (settled.size < orderedRouterIds.length) {
    let currentRouterId = null;
    let currentDistance = Number.POSITIVE_INFINITY;

    for (const candidateRouterId of orderedRouterIds) {
      if (settled.has(candidateRouterId)) continue;
      const candidateDistance = distances[candidateRouterId];
      if (candidateDistance < currentDistance
        || (candidateDistance === currentDistance
          && Number.isFinite(candidateDistance)
          && currentRouterId !== null
          && compareRouterIds(candidateRouterId, currentRouterId) < 0)) {
        currentRouterId = candidateRouterId;
        currentDistance = candidateDistance;
      }
    }

    if (currentRouterId === null || !Number.isFinite(currentDistance)) break;
    settled.add(currentRouterId);
    settledVertices += 1;
    onEvent('dijkstra.vertex.settled', `${currentRouterId} was settled at cost ${currentDistance}.`, {
      actorRouterId: currentRouterId,
      details: { routerId: currentRouterId, cost: currentDistance, settledCount: settledVertices },
    });

    const neighbours = [...(adjacency[currentRouterId] || [])].sort((a, b) => compareIds(a.routerId, b.routerId));
    for (const neighbour of neighbours) {
      relaxationAttempts += 1;
      const neighbourId = neighbour.routerId;
      if (settled.has(neighbourId)) {
        onEvent('dijkstra.relaxation.checked', `Skipped ${currentRouterId} → ${neighbourId}; destination was already settled.`, {
          actorRouterId: currentRouterId,
          affectedRouterIds: [currentRouterId, neighbourId],
          details: { fromRouterId: currentRouterId, toRouterId: neighbourId, reason: 'already-settled' },
        });
        continue;
      }

      const candidateCost = currentDistance + neighbour.cost;
      const candidateFirstHop = currentRouterId === sourceRouterId ? neighbourId : firstHops[currentRouterId];
      const currentFirstHop = firstHops[neighbourId];
      const candidatePredecessor = currentRouterId;
      const currentPredecessor = previous[neighbourId];
      const lowerCost = candidateCost < distances[neighbourId];
      const equalCostBetterFirstHop = candidateCost === distances[neighbourId]
        && candidateFirstHop !== null
        && (currentFirstHop === null || compareRouterIds(candidateFirstHop, currentFirstHop) < 0);
      const equalCostSameFirstHopBetterPredecessor = candidateCost === distances[neighbourId]
        && candidateFirstHop !== null
        && candidateFirstHop === currentFirstHop
        && currentPredecessor !== null
        && compareRouterIds(candidatePredecessor, currentPredecessor) < 0;

      if (lowerCost || equalCostBetterFirstHop || equalCostSameFirstHopBetterPredecessor) {
        const previousCost = Number.isFinite(distances[neighbourId]) ? distances[neighbourId] : null;
        distances[neighbourId] = candidateCost;
        previous[neighbourId] = candidatePredecessor;
        firstHops[neighbourId] = candidateFirstHop;
        onEvent('dijkstra.relaxation.updated', `Updated the best known route from ${sourceRouterId} to ${neighbourId}.`, {
          actorRouterId: currentRouterId,
          affectedRouterIds: [currentRouterId, neighbourId],
          details: {
            fromRouterId: currentRouterId,
            toRouterId: neighbourId,
            previousCost,
            candidateCost,
            nextHopRouterId: candidateFirstHop,
            tieBreak: !lowerCost,
          },
        });
      } else {
        onEvent('dijkstra.relaxation.checked', `Kept the existing route to ${neighbourId}.`, {
          actorRouterId: currentRouterId,
          affectedRouterIds: [currentRouterId, neighbourId],
          details: { fromRouterId: currentRouterId, toRouterId: neighbourId, candidateCost, currentCost: Number.isFinite(distances[neighbourId]) ? distances[neighbourId] : null },
        });
      }
    }
  }

  const paths = {};
  for (const destinationRouterId of orderedRouterIds) {
    if (!Number.isFinite(distances[destinationRouterId])) {
      paths[destinationRouterId] = [];
      continue;
    }
    const reversePath = [destinationRouterId];
    const visited = new Set(reversePath);
    let current = destinationRouterId;
    while (current !== sourceRouterId) {
      current = previous[current];
      if (!current || visited.has(current)) {
        throw new Error(`Dijkstra predecessor chain is invalid for ${sourceRouterId} → ${destinationRouterId}.`);
      }
      reversePath.push(current);
      visited.add(current);
    }
    paths[destinationRouterId] = reversePath.reverse();
  }

  onEvent('dijkstra.completed', `Dijkstra completed at ${sourceRouterId}.`, {
    actorRouterId: sourceRouterId,
    details: { sourceRouterId, settledVertices, relaxationAttempts },
  });

  return {
    sourceRouterId,
    distances,
    previous,
    firstHops,
    paths,
    settledVertices,
    relaxationAttempts,
  };
}
