export default function NetworkIllustration({ compact = false }) {
  const nodes = [
    { x: 92, y: 82, label: 'R1', active: true },
    { x: 246, y: 48, label: 'R2' },
    { x: 410, y: 95, label: 'R3' },
    { x: 338, y: 218, label: 'R4' },
    { x: 132, y: 218, label: 'R5' },
  ];
  return (
    <svg className={`network-illustration ${compact ? 'network-illustration-compact' : ''}`} viewBox="0 0 500 270" role="img" aria-labelledby="network-illustration-title network-illustration-desc">
      <title id="network-illustration-title">Illustrative network topology</title>
      <desc id="network-illustration-desc">Five router nodes connected by weighted links. This is a visual concept preview, not an editable network.</desc>
      <defs>
        <linearGradient id="routeLinePhase1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--line-strong)"/><stop offset="1" stopColor="var(--accent)"/></linearGradient>
        <filter id="routerGlowPhase1" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <g className="illustration-links" fill="none" stroke="url(#routeLinePhase1)" strokeWidth="1.8">
        <path d="M92 82 246 48 410 95 338 218 132 218 92 82" />
        <path d="M92 82 338 218M246 48 132 218M246 48 338 218" strokeDasharray="4 7" opacity=".52" />
      </g>
      <g className="illustration-link-labels">
        <text x="160" y="47">04</text><text x="331" y="55">03</text><text x="378" y="171">05</text><text x="75" y="160">07</text>
      </g>
      {nodes.map((node) => (
        <g key={node.label} className={`illustration-node ${node.active ? 'illustration-node-active' : ''}`} transform={`translate(${node.x} ${node.y})`}>
          <circle className="illustration-node-glow" r="23" />
          <circle className="illustration-node-ring" r="14" />
          <circle className="illustration-node-core" r="4" />
          {node.active && <circle className="illustration-node-pulse" r="28" />}
          <text className="illustration-node-label" x="0" y="39" textAnchor="middle">{node.label}</text>
        </g>
      ))}
      <g className="illustration-packet" transform="translate(178 117)" filter="url(#routerGlowPhase1)"><circle r="4"/><circle r="10" className="packet-orbit" /></g>
    </svg>
  );
}
