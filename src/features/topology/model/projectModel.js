import { PROJECT_SCHEMA_VERSION, validateProject } from '../../../shared/validation/projectValidation.js';

const MAX_ROUTERS = 20;

export { PROJECT_SCHEMA_VERSION, validateProject };
export const MAX_ROUTERS_PER_PROJECT = MAX_ROUTERS;

export function createId(prefix = 'item') {
  const randomPart = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${randomPart}`;
}

export function nextRouterId(routers = []) {
  const used = new Set(routers.map((router) => router.id));
  let index = 1;
  while (used.has(`R${index}`)) index += 1;
  return `R${index}`;
}

export function nextLinkId(links = []) {
  const used = new Set(links.map((link) => link.id));
  let index = 1;
  while (used.has(`L${index}`)) index += 1;
  return `L${index}`;
}

export function createRouter({ id, label, position } = {}) {
  return {
    id: id || 'R1',
    label: label || id || 'R1',
    position: {
      x: Number.isFinite(position?.x) ? position.x : 120,
      y: Number.isFinite(position?.y) ? position.y : 120,
    },
  };
}

export function createProject(name = 'Untitled network', seed = {}) {
  const now = new Date().toISOString();
  const routers = Array.isArray(seed.routers) ? seed.routers.map((router) => createRouter(router)) : [createRouter()];
  const links = Array.isArray(seed.links) ? seed.links.map((link, index) => ({
    id: link.id || `L${index + 1}`,
    sourceRouterId: link.sourceRouterId,
    targetRouterId: link.targetRouterId,
    cost: link.cost ?? 5,
    status: link.status || 'up',
  })) : [];

  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    projectId: createId('project'),
    name: String(name).trim().slice(0, 80) || 'Untitled network',
    createdAt: now,
    updatedAt: now,
    topologyRevision: 1,
    routers,
    links,
  };
}

export function projectToFlow(project) {
  return {
    nodes: project.routers.map((router) => ({
      id: router.id,
      type: 'router',
      position: { ...router.position },
      data: { label: router.label, routerId: router.id },
    })),
    edges: project.links.map((link) => ({
      id: link.id,
      source: link.sourceRouterId,
      target: link.targetRouterId,
      type: 'smoothstep',
      label: String(link.cost),
      data: { cost: link.cost, status: link.status },
      style: edgeStyle(link.status),
      labelStyle: { fill: 'var(--text-secondary)', fontWeight: 650, fontSize: 12 },
      labelBgStyle: { fill: 'var(--surface)', fillOpacity: 0.96 },
      labelBgPadding: [7, 4],
      labelBgBorderRadius: 5,
    })),
  };
}

export function edgeStyle(status = 'up') {
  return {
    stroke: status === 'down' ? 'var(--danger)' : 'var(--line-strong)',
    strokeWidth: status === 'down' ? 1.7 : 2,
    strokeDasharray: status === 'down' ? '6 5' : undefined,
  };
}

export function flowToProject({ project, nodes, edges, name = project.name, incrementRevision = false }) {
  const now = new Date().toISOString();
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    projectId: project.projectId,
    name: String(name).trim().slice(0, 80) || 'Untitled network',
    createdAt: project.createdAt,
    updatedAt: now,
    topologyRevision: project.topologyRevision + (incrementRevision ? 1 : 0),
    routers: nodes.map((node) => ({
      id: node.id,
      label: String(node.data?.label || node.id).trim().slice(0, 40) || node.id,
      position: {
        x: Number.isFinite(node.position?.x) ? node.position.x : 0,
        y: Number.isFinite(node.position?.y) ? node.position.y : 0,
      },
    })),
    links: edges.map((edge, index) => ({
      id: edge.id || `L${index + 1}`,
      sourceRouterId: edge.source,
      targetRouterId: edge.target,
      cost: Number(edge.data?.cost ?? edge.label ?? 5),
      status: edge.data?.status === 'down' ? 'down' : 'up',
    })),
  };
}

export function validateConnection(connection, edges) {
  const { source, target } = connection || {};
  if (!source || !target) return { valid: false, message: 'Choose two routers to connect.' };
  if (source === target) return { valid: false, message: 'A router cannot connect to itself.' };
  const key = [source, target].sort().join('::');
  const exists = edges.some((edge) => [edge.source, edge.target].sort().join('::') === key);
  if (exists) return { valid: false, message: 'These routers are already connected.' };
  return { valid: true, message: '' };
}
