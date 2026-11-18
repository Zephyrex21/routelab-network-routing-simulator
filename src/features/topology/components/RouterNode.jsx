import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Router } from 'lucide-react';

function RouterNode({ data, selected }) {
  return (
    <div className={`router-node ${selected ? 'router-node-selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="in-left" className="router-handle" />
      <Handle type="source" position={Position.Right} id="out-right" className="router-handle" />
      <Handle type="target" position={Position.Top} id="in-top" className="router-handle" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" className="router-handle" />
      <span className="router-node-icon"><Router size={19} strokeWidth={1.8} /></span>
      <span className="router-node-label">{data.label}</span>
      <span className="router-node-id">{data.routerId}</span>
    </div>
  );
}

export default memo(RouterNode);
