import { memo } from 'react';
import { Router } from 'lucide-react';

function SimulationRouterNode({ data }) {
  const classes = [
    'simulation-router-node',
    data.isActive ? 'is-active' : '',
    data.isAffected ? 'is-affected' : '',
    data.isSettled ? 'is-settled' : '',
    data.isSource ? 'is-source' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-label={`${data.label}, ${data.routerId}`}>
      <span className="simulation-router-icon"><Router size={17} strokeWidth={1.8} /></span>
      <span className="simulation-router-label">{data.label}</span>
      <span className="simulation-router-id">{data.routerId}</span>
      {data.isSettled && <span className="simulation-router-state">SETTLED</span>}
      {data.isActive && <span className="simulation-router-pulse" aria-hidden="true" />}
    </div>
  );
}

export default memo(SimulationRouterNode);
