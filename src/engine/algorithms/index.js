import { runDistanceVector } from './distanceVector.js';
import { runLinkState } from './linkState.js';

export { runDistanceVector, initializeDistanceVectorTables } from './distanceVector.js';
export { runDijkstra } from './dijkstra.js';
export { runLinkState, originateLsas, buildAdjacencyFromDatabase } from './linkState.js';
export { normalizeNetwork, getConnectedComponents } from '../graph/normalizeNetwork.js';

export function runRoutingAlgorithm(project, algorithm, options = {}) {
  if (algorithm === 'distance-vector') return runDistanceVector(project, options);
  if (algorithm === 'link-state') return runLinkState(project, options);
  throw new Error(`Unsupported routing algorithm "${algorithm}". Expected "distance-vector" or "link-state".`);
}
