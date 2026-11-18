export const PROJECT_SCHEMA_VERSION = 1;

const GENERAL_ROUTER_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,15}$/;
const MAX_ROUTERS = 20;
const MIN_LINK_COST = 1;
const MAX_LINK_COST = 999;

export function validateProject(project) {
  const errors = [];
  const warnings = [];
  if (!project || typeof project !== 'object' || Array.isArray(project)) {
    return { valid: false, errors: ['The imported file must contain a project object.'], warnings };
  }
  checkOnlyKeys(project, ['schemaVersion', 'projectId', 'name', 'createdAt', 'updatedAt', 'topologyRevision', 'routers', 'links'], 'Project', errors);
  if (project.schemaVersion !== PROJECT_SCHEMA_VERSION) errors.push(`Unsupported schema version. Expected ${PROJECT_SCHEMA_VERSION}.`);
  if (typeof project.projectId !== 'string' || !project.projectId.trim()) errors.push('Project ID is missing.');
  if (typeof project.name !== 'string' || !project.name.trim() || project.name.length > 80) errors.push('Project name must contain 1–80 characters.');
  if (!isDateTime(project.createdAt)) errors.push('Project createdAt must be a valid ISO date-time.');
  if (!isDateTime(project.updatedAt)) errors.push('Project updatedAt must be a valid ISO date-time.');
  if (!Number.isInteger(project.topologyRevision) || project.topologyRevision < 1) errors.push('Topology revision must be a positive integer.');
  if (!Array.isArray(project.routers) || project.routers.length < 1 || project.routers.length > MAX_ROUTERS) {
    errors.push(`A project must contain between 1 and ${MAX_ROUTERS} routers.`);
  }
  if (!Array.isArray(project.links)) errors.push('Links must be an array.');

  const routerIds = new Set();
  for (const [index, router] of (Array.isArray(project.routers) ? project.routers : []).entries()) {
    const prefix = `Router ${index + 1}`;
    if (!router || typeof router !== 'object' || Array.isArray(router)) { errors.push(`${prefix} is invalid.`); continue; }
    checkOnlyKeys(router, ['id', 'label', 'position'], prefix, errors);
    if (typeof router.id !== 'string' || !GENERAL_ROUTER_ID_PATTERN.test(router.id)) errors.push(`${prefix} has an invalid ID.`);
    else if (routerIds.has(router.id)) errors.push(`Duplicate router ID: ${router.id}.`);
    else routerIds.add(router.id);
    if (typeof router.label !== 'string' || !router.label.trim() || router.label.length > 40) errors.push(`${prefix} label must contain 1–40 characters.`);
    if (!router.position || typeof router.position !== 'object' || Array.isArray(router.position) || !Number.isFinite(router.position.x) || !Number.isFinite(router.position.y)) errors.push(`${prefix} position must contain finite x and y coordinates.`);
    else checkOnlyKeys(router.position, ['x', 'y'], `${prefix} position`, errors);
  }

  const linkIds = new Set();
  const endpointPairs = new Set();
  for (const [index, link] of (Array.isArray(project.links) ? project.links : []).entries()) {
    const prefix = `Link ${index + 1}`;
    if (!link || typeof link !== 'object' || Array.isArray(link)) { errors.push(`${prefix} is invalid.`); continue; }
    checkOnlyKeys(link, ['id', 'sourceRouterId', 'targetRouterId', 'cost', 'status'], prefix, errors);
    if (typeof link.id !== 'string' || !link.id.trim()) errors.push(`${prefix} ID is missing.`);
    else if (linkIds.has(link.id)) errors.push(`Duplicate link ID: ${link.id}.`);
    else linkIds.add(link.id);
    if (!routerIds.has(link.sourceRouterId) || !routerIds.has(link.targetRouterId)) errors.push(`${prefix} references a router that does not exist.`);
    if (link.sourceRouterId === link.targetRouterId) errors.push(`${prefix} cannot connect a router to itself.`);
    if (Number.isFinite(link.cost) && (!Number.isInteger(link.cost) || link.cost < MIN_LINK_COST || link.cost > MAX_LINK_COST)) errors.push(`${prefix} cost must be an integer from ${MIN_LINK_COST} to ${MAX_LINK_COST}.`);
    else if (!Number.isFinite(link.cost)) errors.push(`${prefix} cost must be a number.`);
    if (!['up', 'down'].includes(link.status)) errors.push(`${prefix} status must be up or down.`);
    if (typeof link.sourceRouterId === 'string' && typeof link.targetRouterId === 'string') {
      const pair = [link.sourceRouterId, link.targetRouterId].sort().join('::');
      if (endpointPairs.has(pair)) errors.push(`${prefix} duplicates an existing undirected connection.`);
      endpointPairs.add(pair);
    }
  }

  if (Array.isArray(project.routers) && project.routers.length === 1) warnings.push('A single-router topology is valid, but routing experiments need at least two routers.');
  if (Array.isArray(project.links) && project.links.length === 0 && project.routers?.length > 1) warnings.push('No links are configured, so every router is isolated.');
  else if (Array.isArray(project.links) && project.links.length > 0 && project.links.every((link) => link.status === 'down')) warnings.push('All links are disabled. The topology contains isolated routers.');
  return { valid: errors.length === 0, errors, warnings };
}

function checkOnlyKeys(value, allowed, label, errors) {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) errors.push(`${label} contains unsupported field(s): ${unexpected.join(', ')}.`);
}

function isDateTime(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
}
