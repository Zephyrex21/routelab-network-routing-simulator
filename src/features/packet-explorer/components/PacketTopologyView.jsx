import { useMemo } from 'react';

const VIEW_WIDTH = 920;
const VIEW_HEIGHT = 500;
const PADDING_X = 86;
const PADDING_Y = 72;

export default function PacketTopologyView({ project, route, cursor = 0, variant = 'packet', showPacket = false }) {
  const graph = useMemo(() => {
    if (!project?.routers?.length) return { positions: {}, links: [] };
    const xs = project.routers.map((router) => router.position.x);
    const ys = project.routers.map((router) => router.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const usableWidth = VIEW_WIDTH - PADDING_X * 2;
    const usableHeight = VIEW_HEIGHT - PADDING_Y * 2;
    const scaleX = maxX === minX ? 1 : usableWidth / (maxX - minX);
    const scaleY = maxY === minY ? 1 : usableHeight / (maxY - minY);
    const scale = Math.min(scaleX, scaleY, 1.25);
    const drawnWidth = (maxX - minX) * scale;
    const drawnHeight = (maxY - minY) * scale;
    const offsetX = (VIEW_WIDTH - drawnWidth) / 2;
    const offsetY = (VIEW_HEIGHT - drawnHeight) / 2;
    const positions = Object.fromEntries(project.routers.map((router) => [router.id, {
      x: offsetX + (router.position.x - minX) * scale,
      y: offsetY + (router.position.y - minY) * scale,
    }]));
    return { positions, links: project.links };
  }, [project]);

  const pathEdgeKeys = useMemo(() => new Set((route?.path || []).slice(1).map((routerId, index) => edgeKey(route.path[index], routerId))), [route]);
  const currentEdgeKey = route?.path?.length > 1 && cursor > 0 ? edgeKey(route.path[cursor - 1], route.path[cursor]) : null;
  const currentRouterId = route?.path?.length ? route.path[Math.max(0, Math.min(cursor, route.path.length - 1))] : null;
  const completedEdgeKeys = new Set((route?.path || []).slice(1, Math.max(1, cursor + 1)).map((routerId, index) => edgeKey(route.path[index], routerId)));
  const packetPosition = currentRouterId ? graph.positions[currentRouterId] : null;

  return (
    <div className={`packet-topology-view packet-topology-${variant}`}>
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label="Saved network topology with the selected packet path highlighted">
        <defs>
          <pattern id={`packet-grid-${variant}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--line-strong)" opacity=".55" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={VIEW_WIDTH} height={VIEW_HEIGHT} fill={`url(#packet-grid-${variant})`} />
        {graph.links.map((link) => {
          const from = graph.positions[link.sourceRouterId];
          const to = graph.positions[link.targetRouterId];
          if (!from || !to) return null;
          const key = edgeKey(link.sourceRouterId, link.targetRouterId);
          const inPath = pathEdgeKeys.has(key);
          const completed = completedEdgeKeys.has(key);
          const active = currentEdgeKey === key;
          return (
            <g key={link.id}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                className={`packet-graph-link ${link.status === 'down' ? 'link-down' : inPath ? completed ? 'link-completed' : 'link-route' : ''} ${active ? 'link-current' : ''}`}
              />
              <g className="packet-cost-label" transform={`translate(${(from.x + to.x) / 2} ${(from.y + to.y) / 2})`}>
                <rect x="-15" y="-11" width="30" height="22" rx="7" />
                <text textAnchor="middle" dominantBaseline="central">{link.cost}</text>
              </g>
            </g>
          );
        })}
        {project.routers.map((router) => {
          const point = graph.positions[router.id];
          const isCurrent = currentRouterId === router.id;
          const isSource = route?.sourceRouterId === router.id;
          const isDestination = route?.destinationRouterId === router.id;
          const isVisited = route?.path?.slice(0, cursor + 1).includes(router.id);
          return (
            <g key={router.id} transform={`translate(${point.x} ${point.y})`} className={`packet-graph-router ${isCurrent ? 'router-current' : ''} ${isVisited ? 'router-visited' : ''}`}>
              {(isSource || isDestination) && <circle r="28" className="packet-router-halo" />}
              <circle r="20" className="packet-router-shell" />
              <circle r="7" className="packet-router-core" />
              <text y="38" textAnchor="middle" className="packet-router-label">{router.id}</text>
              {isSource && <text y="-34" textAnchor="middle" className="packet-router-tag">SOURCE</text>}
              {isDestination && <text y="-34" textAnchor="middle" className="packet-router-tag">DESTINATION</text>}
            </g>
          );
        })}
        {showPacket && route?.status === 'reachable' && packetPosition && (
          <g className="packet-graph-token" transform={`translate(${packetPosition.x} ${packetPosition.y})`}>
            <circle r="15" className="packet-token-glow" />
            <circle r="7" className="packet-token-core" />
            <circle r="3" className="packet-token-center" />
          </g>
        )}
      </svg>
      <div className="packet-map-legend">
        <span><i className="packet-legend-router" /> Router</span>
        <span><i className="packet-legend-route" /> Selected route</span>
        <span><i className="packet-legend-down" /> Disabled link</span>
        {showPacket && <span><i className="packet-legend-token" /> Packet marker</span>}
      </div>
    </div>
  );
}

function edgeKey(left, right) {
  return [left, right].sort().join('::');
}
