import { validateProject } from '../../topology/model/projectModel.js';

export const LINK_COST_MIN = 1;
export const LINK_COST_MAX = 999;

/** Create an isolated, revision-incremented topology variant for a failure experiment. */
export function createLinkExperiment(project, linkId, operation, nextCost, options = {}) {
  const validation = validateProject(project);
  if (!validation.valid) return invalid(validation.errors.join(' '));

  const linkIndex = project.links.findIndex((link) => link.id === linkId);
  if (linkIndex < 0) return invalid('Choose a link that exists in the saved topology.');

  const currentLink = project.links[linkIndex];
  let updatedLink;
  if (operation === 'down' || operation === 'up') {
    const status = operation;
    if (currentLink.status === status) return invalid(`This link is already ${status === 'up' ? 'enabled' : 'disabled'}.`);
    updatedLink = { ...currentLink, status };
  } else if (operation === 'cost') {
    const cost = Number(nextCost);
    if (!Number.isInteger(cost) || cost < LINK_COST_MIN || cost > LINK_COST_MAX) {
      return invalid(`Link cost must be a whole number between ${LINK_COST_MIN} and ${LINK_COST_MAX}.`);
    }
    if (cost === currentLink.cost) return invalid('Enter a different cost to create a meaningful experiment.');
    updatedLink = { ...currentLink, cost };
  } else {
    return invalid('Choose a supported experiment: disable, enable or change cost.');
  }

  const clockValue = options.clock ? options.clock() : new Date();
  const clockDate = clockValue instanceof Date ? clockValue : new Date(clockValue);
  if (!Number.isFinite(clockDate.getTime())) return invalid('The experiment timestamp must be a valid date-time.');
  const now = clockDate.toISOString();
  const links = project.links.map((link, index) => index === linkIndex ? updatedLink : { ...link });
  const experimentProject = {
    ...project,
    name: fitProjectName(project.name, ' · Experiment'),
    updatedAt: now,
    topologyRevision: project.topologyRevision + 1,
    routers: project.routers.map((router) => ({ ...router, position: { ...router.position } })),
    links,
  };
  const nextValidation = validateProject(experimentProject);
  if (!nextValidation.valid) return invalid(nextValidation.errors.join(' '));

  return {
    ok: true,
    operation,
    linkId,
    before: { ...currentLink },
    after: { ...updatedLink },
    project: experimentProject,
  };
}

export function comparePacketRoutes(beforeRoute, afterRoute) {
  const beforeReachable = beforeRoute?.status === 'reachable';
  const afterReachable = afterRoute?.status === 'reachable';
  const beforePath = beforeReachable ? beforeRoute.path.join(' → ') : 'Unreachable';
  const afterPath = afterReachable ? afterRoute.path.join(' → ') : 'Unreachable';
  const samePath = beforeReachable && afterReachable && beforeRoute.path.join('::') === afterRoute.path.join('::');
  const sameCost = beforeReachable && afterReachable && beforeRoute.totalCost === afterRoute.totalCost;
  const unchanged = beforeReachable === afterReachable && samePath && sameCost;

  let outcome = 'changed';
  let explanation = 'The network change altered the selected source-to-destination forwarding result.';
  if (!beforeReachable && !afterReachable) {
    outcome = 'still-unreachable';
    explanation = 'The destination was unreachable before and remains unreachable after the experiment.';
  } else if (beforeReachable && !afterReachable) {
    outcome = 'became-unreachable';
    explanation = 'The network change removed every usable route to the destination.';
  } else if (!beforeReachable && afterReachable) {
    outcome = 'became-reachable';
    explanation = 'The network change created a usable route to the destination.';
  } else if (unchanged) {
    outcome = 'unchanged';
    explanation = 'The selected route and total cost remained unchanged after the experiment.';
  } else if (samePath && !sameCost) {
    outcome = 'cost-changed';
    explanation = 'The selected router sequence stayed the same, but its total path cost changed.';
  } else if (!samePath && sameCost) {
    outcome = 'alternate-equal-cost';
    explanation = 'The selected route changed, while the total path cost remained equal.';
  }

  return {
    outcome,
    explanation,
    before: { reachable: beforeReachable, path: beforePath, cost: beforeReachable ? beforeRoute.totalCost : null, hopCount: beforeReachable ? beforeRoute.hopCount : null },
    after: { reachable: afterReachable, path: afterPath, cost: afterReachable ? afterRoute.totalCost : null, hopCount: afterReachable ? afterRoute.hopCount : null },
  };
}

function fitProjectName(baseName, suffix) {
  return `${String(baseName).slice(0, 80 - suffix.length)}${suffix}`;
}

function invalid(message) {
  return { ok: false, message };
}
