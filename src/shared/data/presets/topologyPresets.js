import { createProject } from '../../../features/topology/model/projectModel.js';

const PRESETS = {
  starter: {
    name: 'Starter network',
    description: 'A compact five-router network with multiple route choices.',
    routers: [
      { id: 'R1', label: 'R1 · North', position: { x: 80, y: 180 } },
      { id: 'R2', label: 'R2 · West', position: { x: 300, y: 70 } },
      { id: 'R3', label: 'R3 · Core', position: { x: 315, y: 290 } },
      { id: 'R4', label: 'R4 · East', position: { x: 560, y: 100 } },
      { id: 'R5', label: 'R5 · South', position: { x: 570, y: 320 } },
    ],
    links: [
      { id: 'L1', sourceRouterId: 'R1', targetRouterId: 'R2', cost: 3, status: 'up' },
      { id: 'L2', sourceRouterId: 'R1', targetRouterId: 'R3', cost: 7, status: 'up' },
      { id: 'L3', sourceRouterId: 'R2', targetRouterId: 'R3', cost: 2, status: 'up' },
      { id: 'L4', sourceRouterId: 'R2', targetRouterId: 'R4', cost: 5, status: 'up' },
      { id: 'L5', sourceRouterId: 'R3', targetRouterId: 'R5', cost: 3, status: 'up' },
      { id: 'L6', sourceRouterId: 'R4', targetRouterId: 'R5', cost: 2, status: 'up' },
    ],
  },
  diamond: {
    name: 'Diamond topology',
    description: 'Two equal-cost alternatives make tie-breaking easy to inspect.',
    routers: [
      { id: 'R1', label: 'R1 · Source', position: { x: 90, y: 210 } },
      { id: 'R2', label: 'R2 · Upper', position: { x: 310, y: 70 } },
      { id: 'R3', label: 'R3 · Lower', position: { x: 310, y: 350 } },
      { id: 'R4', label: 'R4 · Target', position: { x: 560, y: 210 } },
    ],
    links: [
      { id: 'L1', sourceRouterId: 'R1', targetRouterId: 'R2', cost: 4, status: 'up' },
      { id: 'L2', sourceRouterId: 'R1', targetRouterId: 'R3', cost: 4, status: 'up' },
      { id: 'L3', sourceRouterId: 'R2', targetRouterId: 'R4', cost: 4, status: 'up' },
      { id: 'L4', sourceRouterId: 'R3', targetRouterId: 'R4', cost: 4, status: 'up' },
      { id: 'L5', sourceRouterId: 'R2', targetRouterId: 'R3', cost: 6, status: 'up' },
    ],
  },
  disconnected: {
    name: 'Disconnected components',
    description: 'Two connected groups and one isolated router for reachability experiments.',
    routers: [
      { id: 'R1', label: 'R1 · Group A', position: { x: 70, y: 100 } },
      { id: 'R2', label: 'R2 · Group A', position: { x: 290, y: 100 } },
      { id: 'R3', label: 'R3 · Group A', position: { x: 510, y: 100 } },
      { id: 'R4', label: 'R4 · Group B', position: { x: 180, y: 340 } },
      { id: 'R5', label: 'R5 · Isolated', position: { x: 510, y: 340 } },
    ],
    links: [
      { id: 'L1', sourceRouterId: 'R1', targetRouterId: 'R2', cost: 2, status: 'up' },
      { id: 'L2', sourceRouterId: 'R2', targetRouterId: 'R3', cost: 2, status: 'up' },
      { id: 'L3', sourceRouterId: 'R1', targetRouterId: 'R3', cost: 6, status: 'up' },
    ],
  },
};

export const topologyPresetOptions = Object.entries(PRESETS).map(([id, preset]) => ({
  id,
  name: preset.name,
  description: preset.description,
  routerCount: preset.routers.length,
  linkCount: preset.links.length,
}));

export function createTopologyPreset(presetId = 'starter') {
  const preset = PRESETS[presetId] || PRESETS.starter;
  return createProject(preset.name, { routers: preset.routers, links: preset.links });
}

export function getTopologyPreset(presetId = 'starter') {
  const preset = PRESETS[presetId] || PRESETS.starter;
  return {
    ...preset,
    routers: preset.routers.map((router) => ({ ...router, position: { ...router.position } })),
    links: preset.links.map((link) => ({ ...link })),
  };
}
