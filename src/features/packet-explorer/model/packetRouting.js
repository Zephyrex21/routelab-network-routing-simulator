/**
 * Build a packet forwarding journey from a completed routing-engine result.
 * Every hop is selected from the current router's own final forwarding table.
 * This is a conceptual packet simulation; it does not emit real network traffic.
 */
export function createPacketRoute(project, run, sourceRouterId, destinationRouterId) {
  if (!project || !Array.isArray(project.routers) || !Array.isArray(project.links)) {
    return failure('invalid-input', 'A valid saved network project is required.');
  }
  if (!run || run.status !== 'completed' || !run.finalTables) {
    return failure('missing-run', 'Run a routing algorithm before exploring a packet journey.');
  }
  if (run.projectId !== project.projectId || run.topologyRevision !== project.topologyRevision) {
    return failure('stale-run', 'The routing result belongs to a different topology revision. Run the algorithm again.');
  }

  const routerIds = new Set(project.routers.map((router) => router.id));
  if (!routerIds.has(sourceRouterId) || !routerIds.has(destinationRouterId)) {
    return failure('invalid-endpoint', 'Choose source and destination routers that exist in this topology.');
  }

  const sourceEntry = findRouteEntry(run.finalTables[sourceRouterId], destinationRouterId);
  if (!sourceEntry || sourceEntry.status !== 'reachable' || !Number.isFinite(sourceEntry.cost)) {
    return unreachable(sourceRouterId, destinationRouterId);
  }

  if (sourceRouterId === destinationRouterId) {
    return {
      status: 'reachable',
      sourceRouterId,
      destinationRouterId,
      path: [sourceRouterId],
      forwardingDecisions: [],
      hopCount: 0,
      totalCost: 0,
      algorithm: run.algorithm,
      runId: run.runId,
      projectId: project.projectId,
      topologyRevision: project.topologyRevision,
    };
  }

  const path = [sourceRouterId];
  const forwardingDecisions = [];
  const visited = new Set(path);
  let currentRouterId = sourceRouterId;
  let cumulativeCost = 0;

  // A valid simple route in a 20-router topology cannot need more than 19 hops.
  for (let hopIndex = 0; hopIndex < project.routers.length; hopIndex += 1) {
    if (currentRouterId === destinationRouterId) break;

    const currentEntry = findRouteEntry(run.finalTables[currentRouterId], destinationRouterId);
    if (!currentEntry || currentEntry.status !== 'reachable' || !Number.isFinite(currentEntry.cost)) {
      return failure('inconsistent-route', `Router ${currentRouterId} has no reachable forwarding entry for ${destinationRouterId}.`);
    }

    const nextRouterId = currentEntry.nextHopRouterId;
    if (!nextRouterId || !routerIds.has(nextRouterId)) {
      return failure('inconsistent-route', `Router ${currentRouterId} has no valid next hop for ${destinationRouterId}.`);
    }
    if (visited.has(nextRouterId)) {
      return failure('routing-loop', `A forwarding loop was detected at router ${nextRouterId}. No packet animation was started.`);
    }

    const link = project.links.find((candidate) => isSameUndirectedLink(candidate, currentRouterId, nextRouterId));
    if (!link || link.status !== 'up') {
      return failure('invalid-link', `The next hop ${currentRouterId} → ${nextRouterId} does not use an active link. No packet animation was started.`);
    }

    const nextEntry = findRouteEntry(run.finalTables[nextRouterId], destinationRouterId);
    if (!nextEntry || nextEntry.status !== 'reachable' || !Number.isFinite(nextEntry.cost)) {
      return failure('inconsistent-route', `The next router ${nextRouterId} has no valid forwarding entry for ${destinationRouterId}.`);
    }

    const expectedRemainingCost = currentEntry.cost - link.cost;
    if (expectedRemainingCost !== nextEntry.cost || expectedRemainingCost < 0) {
      return failure('inconsistent-route', `Forwarding costs do not agree between ${currentRouterId} and ${nextRouterId}. No packet animation was started.`);
    }

    cumulativeCost += link.cost;
    forwardingDecisions.push({
      stepNumber: hopIndex + 1,
      fromRouterId: currentRouterId,
      toRouterId: nextRouterId,
      linkId: link.id,
      linkCost: link.cost,
      remainingCostBefore: currentEntry.cost,
      remainingCostAfter: nextEntry.cost,
      cumulativeCost,
    });
    path.push(nextRouterId);
    visited.add(nextRouterId);
    currentRouterId = nextRouterId;
  }

  if (currentRouterId !== destinationRouterId) {
    return failure('routing-loop', 'The forwarding path exceeded the topology router limit. No packet animation was started.');
  }
  if (cumulativeCost !== sourceEntry.cost) {
    return failure('inconsistent-route', 'The hop-by-hop link costs do not match the source routing-table cost. No packet animation was started.');
  }
  if (Array.isArray(sourceEntry.path) && sourceEntry.path.length && sourceEntry.path.join('::') !== path.join('::')) {
    return failure('inconsistent-route', 'The forwarding decisions do not match the source router path. No packet animation was started.');
  }

  return {
    status: 'reachable',
    sourceRouterId,
    destinationRouterId,
    path,
    forwardingDecisions,
    hopCount: forwardingDecisions.length,
    totalCost: cumulativeCost,
    algorithm: run.algorithm,
    runId: run.runId,
    projectId: project.projectId,
    topologyRevision: project.topologyRevision,
  };
}

function findRouteEntry(table, destinationRouterId) {
  return Array.isArray(table)
    ? table.find((entry) => entry.destinationRouterId === destinationRouterId) || null
    : null;
}

function isSameUndirectedLink(link, leftRouterId, rightRouterId) {
  return (link.sourceRouterId === leftRouterId && link.targetRouterId === rightRouterId)
    || (link.sourceRouterId === rightRouterId && link.targetRouterId === leftRouterId);
}

function unreachable(sourceRouterId, destinationRouterId) {
  return {
    status: 'unreachable',
    sourceRouterId,
    destinationRouterId,
    path: [],
    forwardingDecisions: [],
    hopCount: null,
    totalCost: null,
    reason: `${destinationRouterId} is unreachable from ${sourceRouterId} in the selected routing result.`,
  };
}

function failure(code, message) {
  return { status: 'invalid', code, message, path: [], forwardingDecisions: [], hopCount: null, totalCost: null };
}
