import { runRoutingAlgorithm } from '../../../engine/algorithms/index.js';
import { validateProject } from '../../topology/model/projectModel.js';
import { createPacketRoute } from '../../packet-explorer/model/packetRouting.js';
import { comparePacketRoutes, createLinkExperiment } from '../../network-failure/model/failureExperiment.js';

export const COMPARISON_ALGORITHMS = Object.freeze([
  { id: 'distance-vector', label: 'Distance Vector' },
  { id: 'link-state', label: 'Link State' },
]);

/**
 * Execute both routing algorithms against one immutable saved topology.
 * Model-work counters remain grouped by algorithm; they are intentionally not
 * normalized into a shared speed score because they count different operations.
 */
export function runAlgorithmComparison(project, options = {}) {
  assertValidProject(project);
  const runs = runBothAlgorithms(project, options, 'comparison');
  const pairs = buildAllRoutePairs(project, runs);
  const summary = summarizeAllPairs(pairs, project.routers.map((router) => router.id));

  return {
    projectId: project.projectId,
    topologyRevision: project.topologyRevision,
    topology: {
      name: project.name,
      routerCount: project.routers.length,
      linkCount: project.links.length,
      activeLinkCount: project.links.filter((link) => link.status === 'up').length,
      disabledLinkCount: project.links.filter((link) => link.status === 'down').length,
    },
    runs,
    pairs,
    summary,
    workProfiles: {
      'distance-vector': buildDistanceVectorWorkProfile(runs['distance-vector']),
      'link-state': buildLinkStateWorkProfile(runs['link-state']),
    },
  };
}

/** Return the selected ordered source → destination result from a comparison. */
export function getPairComparison(comparison, sourceRouterId, destinationRouterId) {
  if (!comparison || !comparison.pairs?.[sourceRouterId]?.[destinationRouterId]) return null;
  return comparison.pairs[sourceRouterId][destinationRouterId];
}

/** Build a source router's destination table with both algorithms side by side. */
export function getRoutingTableComparison(comparison, sourceRouterId) {
  if (!comparison?.pairs?.[sourceRouterId]) return [];
  return Object.entries(comparison.pairs[sourceRouterId]).map(([destinationRouterId, pair]) => ({
    destinationRouterId,
    distanceVector: toTableRoute(pair.distanceVector),
    linkState: toTableRoute(pair.linkState),
    agreement: pair.agreement,
  }));
}

/**
 * Run both algorithms on the baseline and on an isolated one-link variant.
 * This is a fresh-run sensitivity experiment, not live protocol recovery.
 */
export function runFailureScenarioComparison(project, scenario, options = {}) {
  assertValidProject(project);
  const { linkId, operation, nextCost, sourceRouterId, destinationRouterId } = scenario || {};
  if (!project.routers.some((router) => router.id === sourceRouterId)) {
    return { ok: false, message: 'Choose a source router that exists in the saved topology.' };
  }
  if (!project.routers.some((router) => router.id === destinationRouterId)) {
    return { ok: false, message: 'Choose a destination router that exists in the saved topology.' };
  }

  const experiment = createLinkExperiment(project, linkId, operation, nextCost, {
    clock: options.clock || (() => new Date(options.completedAt || options.startedAt || Date.now())),
  });
  if (!experiment.ok) return experiment;

  const beforeRuns = runBothAlgorithms(project, options, 'failure-baseline');
  const afterRuns = runBothAlgorithms(experiment.project, options, 'failure-variant');
  const algorithms = {};

  for (const algorithm of COMPARISON_ALGORITHMS) {
    const beforeRoute = createPacketRoute(project, beforeRuns[algorithm.id], sourceRouterId, destinationRouterId);
    const afterRoute = createPacketRoute(experiment.project, afterRuns[algorithm.id], sourceRouterId, destinationRouterId);
    if (beforeRoute.status === 'invalid' || afterRoute.status === 'invalid') {
      return {
        ok: false,
        message: beforeRoute.message || afterRoute.message || 'A route could not be validated for this experiment.',
      };
    }
    algorithms[algorithm.id] = {
      beforeRoute,
      afterRoute,
      routeChange: comparePacketRoutes(beforeRoute, afterRoute),
      beforeMetrics: { ...beforeRuns[algorithm.id].metrics },
      afterMetrics: { ...afterRuns[algorithm.id].metrics },
    };
  }

  return {
    ok: true,
    projectId: project.projectId,
    topologyRevision: project.topologyRevision,
    experimentProject: experiment.project,
    linkChange: { before: experiment.before, after: experiment.after, operation },
    sourceRouterId,
    destinationRouterId,
    algorithms,
  };
}

function runBothAlgorithms(project, options, runPrefix) {
  const startedAt = options.startedAt || new Date().toISOString();
  const completedAt = options.completedAt || startedAt;
  const clock = options.clock || (() => new Date(completedAt));
  return Object.fromEntries(COMPARISON_ALGORITHMS.map(({ id }) => [
    id,
    runRoutingAlgorithm(project, id, {
      runId: options.runIdPrefix ? `${options.runIdPrefix}-${runPrefix}-${id}` : undefined,
      startedAt,
      clock,
    }),
  ]));
}

function buildAllRoutePairs(project, runs) {
  const pairs = {};
  for (const source of project.routers) {
    pairs[source.id] = {};
    for (const destination of project.routers) {
      const distanceVector = createPacketRoute(project, runs['distance-vector'], source.id, destination.id);
      const linkState = createPacketRoute(project, runs['link-state'], source.id, destination.id);
      if (distanceVector.status === 'invalid' || linkState.status === 'invalid') {
        throw new Error(distanceVector.message || linkState.message || `Unable to validate ${source.id} → ${destination.id}.`);
      }
      pairs[source.id][destination.id] = compareRoutePair(distanceVector, linkState);
    }
  }
  return pairs;
}

function compareRoutePair(distanceVector, linkState) {
  const bothReachable = distanceVector.status === 'reachable' && linkState.status === 'reachable';
  const sameReachability = distanceVector.status === linkState.status;
  const sameCost = bothReachable && distanceVector.totalCost === linkState.totalCost;
  const samePath = bothReachable && distanceVector.path.join('::') === linkState.path.join('::');
  let status = 'match';

  if (!sameReachability) status = 'reachability-difference';
  else if (bothReachable && !sameCost) status = 'cost-difference';
  else if (bothReachable && sameCost && !samePath) status = 'equal-cost-alternative';
  else if (!bothReachable) status = 'both-unreachable';

  return {
    distanceVector,
    linkState,
    agreement: {
      status,
      sameReachability,
      sameCost,
      samePath,
      bothReachable,
    },
  };
}

function summarizeAllPairs(pairs, routerIds) {
  let pairsCompared = 0;
  let reachabilityAgreements = 0;
  let reachableCostComparisons = 0;
  let reachableCostAgreements = 0;
  let pathAgreements = 0;
  let equalCostAlternatives = 0;
  let costDifferences = 0;
  let reachabilityDifferences = 0;
  let mutuallyUnreachable = 0;

  for (const sourceRouterId of routerIds) {
    for (const destinationRouterId of routerIds) {
      const agreement = pairs[sourceRouterId][destinationRouterId].agreement;
      pairsCompared += 1;
      if (agreement.sameReachability) reachabilityAgreements += 1;
      else reachabilityDifferences += 1;
      if (agreement.bothReachable) {
        reachableCostComparisons += 1;
        if (agreement.sameCost) reachableCostAgreements += 1;
        else costDifferences += 1;
        if (agreement.samePath) pathAgreements += 1;
        else if (agreement.sameCost) equalCostAlternatives += 1;
      } else if (agreement.sameReachability) {
        mutuallyUnreachable += 1;
      }
    }
  }

  return {
    pairsCompared,
    reachabilityAgreements,
    reachabilityDifferences,
    reachableCostComparisons,
    reachableCostAgreements,
    costDifferences,
    pathAgreements,
    equalCostAlternatives,
    mutuallyUnreachable,
  };
}

function buildDistanceVectorWorkProfile(run) {
  const metrics = run.metrics;
  return {
    title: 'Distance Vector',
    algorithm: run.algorithm,
    eventCount: run.events.length,
    items: [
      { key: 'roundsExecuted', label: 'Update rounds executed', value: metrics.roundsExecuted, definition: 'Includes the final stable-check round.' },
      { key: 'roundsWithChanges', label: 'Rounds with changes', value: metrics.roundsWithChanges, definition: 'Rounds that changed at least one routing-table entry.' },
      { key: 'vectorMessages', label: 'Vector messages', value: metrics.vectorMessages, definition: 'One full-vector transmission per active directed neighbour relationship per executed round.' },
      { key: 'routeUpdates', label: 'Route-entry updates', value: countEvents(run, 'distance-vector.route.updated'), definition: 'Individual destination entries changed during the run.' },
    ],
  };
}

function buildLinkStateWorkProfile(run) {
  const metrics = run.metrics;
  return {
    title: 'Link State',
    algorithm: run.algorithm,
    eventCount: run.events.length,
    items: [
      { key: 'lsaOriginations', label: 'LSA originations', value: metrics.lsaOriginations, definition: 'One locally originated LSA per router.' },
      { key: 'lsaTransmissions', label: 'LSA transmissions', value: metrics.lsaTransmissions, definition: 'Actual sends in the deterministic flooding queue, including copies later suppressed.' },
      { key: 'lsaAcceptances', label: 'LSA acceptances', value: metrics.lsaAcceptances, definition: 'First-time remote LSA receipts; local originations are excluded.' },
      { key: 'lsaDuplicatesSuppressed', label: 'Duplicate LSAs suppressed', value: metrics.lsaDuplicatesSuppressed, definition: 'Duplicate receptions ignored and not forwarded again.' },
      { key: 'dijkstraRuns', label: "Dijkstra's runs", value: metrics.dijkstraRuns, definition: 'One independent shortest-path-tree calculation per router.' },
      { key: 'dijkstraSettledVertices', label: 'Settled vertices', value: metrics.dijkstraSettledVertices, definition: 'Total reachable vertices settled across all router runs.' },
      { key: 'dijkstraRelaxationAttempts', label: 'Relaxation attempts', value: metrics.dijkstraRelaxationAttempts, definition: 'Adjacency entries examined across all Dijkstra runs.' },
    ],
  };
}

function countEvents(run, eventType) {
  return run.events.reduce((count, event) => count + (event.type === eventType ? 1 : 0), 0);
}

function toTableRoute(route) {
  return {
    status: route.status,
    nextHopRouterId: route.path.length > 1 ? route.path[1] : null,
    cost: route.totalCost,
    path: [...route.path],
    hopCount: route.hopCount,
  };
}

function assertValidProject(project) {
  if (!project) throw new TypeError('Save a valid topology before comparing routing algorithms.');
  const validation = validateProject(project);
  if (!validation.valid) throw new TypeError(`The saved topology is invalid: ${validation.errors.join(' ')}`);
}
