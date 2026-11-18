import { normalizeNetwork, compareIds } from '../graph/normalizeNetwork.js';
import { runDijkstra } from './dijkstra.js';
import {
  compareRouterIds,
  createEventEmitter,
  createRunMetadata,
  finalizeEnvelope,
  makeSnapshot,
  toRouteEntry,
} from './shared.js';

/** Run the educational LSA flooding + per-router Dijkstra Link State model. */
export function runLinkState(project, options = {}) {
  const network = normalizeNetwork(project);
  const metadata = createRunMetadata(project, 'link-state', options);
  const emitter = createEventEmitter();
  const snapshots = [];
  const lsas = originateLsas(network);
  const databases = Object.fromEntries(network.routerIds.map((routerId) => [routerId, new Map()]));

  let lsaTransmissions = 0;
  let lsaAcceptances = 0;
  let lsaDuplicatesSuppressed = 0;

  for (const routerId of network.routerIds) {
    const lsa = lsas[routerId];
    databases[routerId].set(routerId, lsa);
    emitter.emit('link-state.lsa.originated', `${routerId} originated an LSA with ${lsa.links.length} active neighbour link(s).`, {
      actorRouterId: routerId,
      affectedRouterIds: [routerId, ...lsa.links.map((link) => link.neighborRouterId)],
      details: { lsa },
    });
  }

  const queue = new MinHeap(compareMessages);
  let insertionOrder = 0;
  for (const originRouterId of network.routerIds) {
    for (const neighbour of network.adjacency[originRouterId]) {
      queue.push({
        originRouterId,
        fromRouterId: originRouterId,
        toRouterId: neighbour.routerId,
        insertionOrder: insertionOrder++,
      });
    }
  }

  // A router forwards each origin's LSA only on first acceptance. Duplicate
  // copies are still counted as transmissions and explicitly suppressed.
  while (queue.size > 0) {
    const message = queue.pop();
    const lsa = lsas[message.originRouterId];
    lsaTransmissions += 1;
    emitter.emit('link-state.lsa.transmitted', `${message.fromRouterId} forwarded ${message.originRouterId}'s LSA to ${message.toRouterId}.`, {
      actorRouterId: message.fromRouterId,
      affectedRouterIds: [message.fromRouterId, message.toRouterId],
      details: { ...message, sequenceNumber: lsa.sequenceNumber },
    });

    const receiverDatabase = databases[message.toRouterId];
    if (receiverDatabase.has(message.originRouterId)) {
      lsaDuplicatesSuppressed += 1;
      emitter.emit('link-state.lsa.duplicate-suppressed', `${message.toRouterId} suppressed a duplicate LSA from ${message.originRouterId}.`, {
        actorRouterId: message.toRouterId,
        affectedRouterIds: [message.toRouterId, message.originRouterId],
        details: { ...message, originRouterId: message.originRouterId },
      });
      continue;
    }

    receiverDatabase.set(message.originRouterId, lsa);
    lsaAcceptances += 1;
    emitter.emit('link-state.lsa.accepted', `${message.toRouterId} accepted ${message.originRouterId}'s LSA.`, {
      actorRouterId: message.toRouterId,
      affectedRouterIds: [message.toRouterId, message.originRouterId],
      details: { ...message, sequenceNumber: lsa.sequenceNumber, knownLsaCount: receiverDatabase.size },
    });

    for (const neighbour of network.adjacency[message.toRouterId]) {
      if (neighbour.routerId === message.fromRouterId) continue;
      queue.push({
        originRouterId: message.originRouterId,
        fromRouterId: message.toRouterId,
        toRouterId: neighbour.routerId,
        insertionOrder: insertionOrder++,
      });
    }
  }

  const databaseSummary = Object.fromEntries(network.routerIds.map((routerId) => [
    routerId,
    {
      lsaCount: databases[routerId].size,
      receivedOriginRouterIds: [...databases[routerId].keys()].sort(compareIds),
    },
  ]));
  const floodingCompletedEvent = emitter.emit('link-state.flooding.completed', 'LSA flooding completed across all reachable network components.', {
    details: { lsaTransmissions, lsaAcceptances, lsaDuplicatesSuppressed, databases: databaseSummary },
  });
  snapshots.push(makeSnapshot(floodingCompletedEvent.sequence, 'lsa-flooding', 'Link-state databases after flooding', { databases: databaseSummary }));

  let dijkstraRuns = 0;
  let dijkstraSettledVertices = 0;
  let dijkstraRelaxationAttempts = 0;
  const rawTables = {};

  for (const sourceRouterId of network.routerIds) {
    const localDatabase = databases[sourceRouterId];
    const localRouterIds = [...localDatabase.keys()].sort(compareIds);
    const localAdjacency = buildAdjacencyFromDatabase(localDatabase);
    let dijkstraCompletedEventSequence = null;
    const dijkstra = runDijkstra({
      routerIds: localRouterIds,
      adjacency: localAdjacency,
      sourceRouterId,
      onEvent: (type, message, fields) => {
        const event = emitter.emit(`link-state.${type}`, message, fields);
        if (type === 'dijkstra.completed') dijkstraCompletedEventSequence = event.sequence;
      },
    });

    dijkstraRuns += 1;
    dijkstraSettledVertices += dijkstra.settledVertices;
    dijkstraRelaxationAttempts += dijkstra.relaxationAttempts;

    rawTables[sourceRouterId] = network.routerIds.map((destinationRouterId) => {
      if (!localDatabase.has(destinationRouterId) || !Number.isFinite(dijkstra.distances[destinationRouterId])) {
        return toRouteEntry(destinationRouterId, Number.POSITIVE_INFINITY, null);
      }
      if (sourceRouterId === destinationRouterId) return toRouteEntry(destinationRouterId, 0, null, [sourceRouterId]);
      return toRouteEntry(
        destinationRouterId,
        dijkstra.distances[destinationRouterId],
        dijkstra.firstHops[destinationRouterId],
        dijkstra.paths[destinationRouterId],
      );
    });

    snapshots.push(makeSnapshot(dijkstraCompletedEventSequence, 'dijkstra', `Shortest-path tree from ${sourceRouterId}`, {
      sourceRouterId,
      distances: { ...dijkstra.distances },
      previous: { ...dijkstra.previous },
      firstHops: { ...dijkstra.firstHops },
      paths: { ...dijkstra.paths },
    }));
  }

  // Each router has an independently calculated shortest-path tree. In an
  // equal-cost topology, a downstream router may select a different valid
  // equal-cost suffix than the source router's Dijkstra predecessor tree.
  // The final forwarding-table path therefore follows each router's own
  // next-hop entry, verifying strictly decreasing remaining costs at every hop.
  const finalTables = buildForwardingPathTables(network.routerIds, network.adjacency, rawTables);

  emitter.emit('link-state.completed', 'Link State calculation completed successfully.', {
    details: { dijkstraRuns, dijkstraSettledVertices, dijkstraRelaxationAttempts },
  });

  return finalizeEnvelope(metadata, emitter, finalTables, {
    routerCount: network.routerCount,
    activeLinkCount: network.activeLinkCount,
    disabledLinkCount: network.disabledLinks.length,
    lsaOriginations: network.routerCount,
    lsaTransmissions,
    lsaAcceptances,
    lsaDuplicatesSuppressed,
    dijkstraRuns,
    dijkstraSettledVertices,
    dijkstraRelaxationAttempts,
  }, snapshots);
}

function buildForwardingPathTables(routerIds, adjacency, rawTables) {
  const tables = {};
  for (const sourceRouterId of routerIds) {
    tables[sourceRouterId] = rawTables[sourceRouterId].map((sourceEntry) => {
      if (sourceEntry.status !== 'reachable') {
        return toRouteEntry(sourceEntry.destinationRouterId, Number.POSITIVE_INFINITY, null);
      }
      if (sourceRouterId === sourceEntry.destinationRouterId) {
        return toRouteEntry(sourceEntry.destinationRouterId, 0, null, [sourceRouterId]);
      }

      const destinationRouterId = sourceEntry.destinationRouterId;
      const path = [sourceRouterId];
      const visited = new Set(path);
      let currentRouterId = sourceRouterId;
      let accumulatedCost = 0;

      while (currentRouterId !== destinationRouterId) {
        const currentEntry = rawTables[currentRouterId]?.find((entry) => entry.destinationRouterId === destinationRouterId);
        const nextRouterId = currentEntry?.nextHopRouterId;
        if (!currentEntry || currentEntry.status !== 'reachable' || !nextRouterId || visited.has(nextRouterId)) {
          const error = new Error(`A forwarding-path invariant failed while reconstructing ${sourceRouterId} → ${destinationRouterId}.`);
          error.name = 'RoutingInvariantError';
          error.code = 'LINK_STATE_FORWARDING_PATH_INVALID';
          throw error;
        }

        const edge = adjacency[currentRouterId]?.find((candidate) => candidate.routerId === nextRouterId);
        const nextEntry = rawTables[nextRouterId]?.find((entry) => entry.destinationRouterId === destinationRouterId);
        if (!edge || !nextEntry || nextEntry.status !== 'reachable'
          || currentEntry.cost !== edge.cost + nextEntry.cost) {
          const error = new Error(`Forwarding costs are inconsistent from ${currentRouterId} to ${destinationRouterId}.`);
          error.name = 'RoutingInvariantError';
          error.code = 'LINK_STATE_FORWARDING_COST_INVALID';
          throw error;
        }

        accumulatedCost += edge.cost;
        path.push(nextRouterId);
        visited.add(nextRouterId);
        currentRouterId = nextRouterId;
        if (path.length > routerIds.length) {
          const error = new Error(`A forwarding loop was detected while reconstructing ${sourceRouterId} → ${destinationRouterId}.`);
          error.name = 'RoutingInvariantError';
          error.code = 'LINK_STATE_FORWARDING_LOOP';
          throw error;
        }
      }

      if (accumulatedCost !== sourceEntry.cost) {
        const error = new Error(`The forwarding path cost does not match the shortest-path cost for ${sourceRouterId} → ${destinationRouterId}.`);
        error.name = 'RoutingInvariantError';
        error.code = 'LINK_STATE_FORWARDING_PATH_COST_MISMATCH';
        throw error;
      }
      return toRouteEntry(destinationRouterId, sourceEntry.cost, sourceEntry.nextHopRouterId, path);
    });
  }
  return tables;
}

export function originateLsas(network) {
  return Object.fromEntries(network.routerIds.map((originRouterId) => [
    originRouterId,
    {
      originRouterId,
      sequenceNumber: 1,
      links: network.adjacency[originRouterId]
        .map((link) => ({ neighborRouterId: link.routerId, cost: link.cost }))
        .sort((a, b) => compareIds(a.neighborRouterId, b.neighborRouterId)),
    },
  ]));
}

export function buildAdjacencyFromDatabase(database) {
  const adjacency = {};
  for (const [originRouterId, lsa] of database.entries()) {
    adjacency[originRouterId] = lsa.links.map((link) => ({
      routerId: link.neighborRouterId,
      cost: link.cost,
    })).sort((a, b) => compareIds(a.routerId, b.routerId));
  }
  return adjacency;
}

function compareMessages(left, right) {
  return compareRouterIds(left.originRouterId, right.originRouterId)
    || compareRouterIds(left.fromRouterId, right.fromRouterId)
    || compareRouterIds(left.toRouterId, right.toRouterId)
    || left.insertionOrder - right.insertionOrder;
}

class MinHeap {
  #items = [];
  #compare;

  constructor(compare) {
    this.#compare = compare;
  }

  get size() {
    return this.#items.length;
  }

  push(value) {
    const items = this.#items;
    items.push(value);
    let index = items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.#compare(items[parent], value) <= 0) break;
      items[index] = items[parent];
      index = parent;
    }
    items[index] = value;
  }

  pop() {
    const items = this.#items;
    if (items.length === 0) return undefined;
    const first = items[0];
    const last = items.pop();
    if (items.length > 0) {
      let index = 0;
      while (true) {
        const left = index * 2 + 1;
        const right = left + 1;
        if (left >= items.length) break;
        let child = left;
        if (right < items.length && this.#compare(items[right], items[left]) < 0) child = right;
        if (this.#compare(last, items[child]) <= 0) break;
        items[index] = items[child];
        index = child;
      }
      items[index] = last;
    }
    return first;
  }
}
