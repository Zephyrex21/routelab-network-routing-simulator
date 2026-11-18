import { validateProject } from '../../shared/validation/projectValidation.js';

/**
 * Normalize a persisted RouteLab project into a deterministic graph model.
 * UI node positions and labels are intentionally excluded from algorithm input.
 */
export function normalizeNetwork(project) {
  const validation = validateProject(project);
  if (!validation.valid) {
    const error = new Error(`Invalid network project: ${validation.errors.join(' ')}`);
    error.name = 'RoutingInputError';
    error.code = 'INVALID_NETWORK_PROJECT';
    error.validationErrors = validation.errors;
    throw error;
  }

  const routerIds = project.routers.map(({ id }) => id).sort(compareIds);
  const adjacency = Object.fromEntries(routerIds.map((id) => [id, []]));
  const activeLinks = [];
  const disabledLinks = [];

  for (const link of project.links) {
    if (link.status === 'down') {
      disabledLinks.push({ ...link });
      continue;
    }

    const normalized = {
      id: link.id,
      sourceRouterId: link.sourceRouterId,
      targetRouterId: link.targetRouterId,
      cost: link.cost,
    };
    activeLinks.push(normalized);
    adjacency[link.sourceRouterId].push({ routerId: link.targetRouterId, cost: link.cost, linkId: link.id });
    adjacency[link.targetRouterId].push({ routerId: link.sourceRouterId, cost: link.cost, linkId: link.id });
  }

  for (const routerId of routerIds) {
    adjacency[routerId].sort((a, b) => compareIds(a.routerId, b.routerId));
  }

  activeLinks.sort((a, b) => compareIds(a.id, b.id));
  disabledLinks.sort((a, b) => compareIds(a.id, b.id));

  return {
    projectId: project.projectId,
    topologyRevision: project.topologyRevision,
    projectName: project.name,
    routerIds,
    activeLinks,
    disabledLinks,
    adjacency,
    routerCount: routerIds.length,
    activeLinkCount: activeLinks.length,
  };
}

export function compareIds(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function getConnectedComponents(network) {
  const visited = new Set();
  const components = [];

  for (const startId of network.routerIds) {
    if (visited.has(startId)) continue;
    const queue = [startId];
    const component = [];
    visited.add(startId);

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const currentId = queue[cursor];
      component.push(currentId);
      for (const neighbour of network.adjacency[currentId]) {
        if (!visited.has(neighbour.routerId)) {
          visited.add(neighbour.routerId);
          queue.push(neighbour.routerId);
        }
      }
    }

    component.sort(compareIds);
    components.push(component);
  }

  return components;
}
