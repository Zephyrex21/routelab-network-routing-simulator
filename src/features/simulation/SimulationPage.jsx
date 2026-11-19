import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, CheckCircle2, Clock3, FastForward, GitBranch,
  Pause, Play, Radio, RotateCcw, SkipBack, SkipForward, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Background, BackgroundVariant, Controls, ReactFlow,
} from '@xyflow/react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { runRoutingAlgorithm } from '../../engine/algorithms/index.js';
import { getActiveProject, getSavedProjects } from '../topology/model/projectStore.js';
import SimulationRouterNode from './components/SimulationRouterNode.jsx';
import {
  buildLinkStateReplayIndex, getCurrentActivity, getCurrentSnapshotLabel,
  getDistanceVectorTable, getEventFacts, getEventLabel, getLinkStateTableAt,
  getVisibleEvents,
} from './model/simulationViewModel.js';
import {
  clampEventCursor, getPlaybackDelay, getPlaybackProgress, PLAYBACK_SPEEDS,
} from './model/simulationController.js';
import './simulation.css';

const nodeTypes = { simulationRouter: SimulationRouterNode };
const ALGORITHM_OPTIONS = [
  { value: 'distance-vector', label: 'Distance Vector' },
  { value: 'link-state', label: 'Link State' },
];
const EVENT_LIMIT = 42;

function formatCount(value) {
  return Number.isFinite(value) ? new Intl.NumberFormat().format(value) : '—';
}

function formatTime(value) {
  if (!value) return 'Not run yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function getEventTone(event) {
  if (!event) return 'neutral';
  if (event.type.includes('converged') || event.type.includes('completed')) return 'success';
  if (event.type.includes('updated') || event.type.includes('settled') || event.type.includes('accepted')) return 'info';
  if (event.type.includes('duplicate')) return 'warning';
  return 'neutral';
}

function Metric({ label, value, detail }) {
  return (
    <div className="simulation-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function EmptySimulation({ hasSavedProjects }) {
  return (
    <div className="simulation-empty-state">
      <div className="simulation-empty-icon"><GitBranch size={22} /></div>
      <span className="eyebrow muted">NO SAVED TOPOLOGY</span>
      <h2>Give the algorithms a network to explore.</h2>
      <p>Simulation runs use the latest saved topology. Create a network in Network Studio and save it before starting an algorithm.</p>
      <Link to="/studio" className="simulation-empty-link">Open Network Studio <ArrowRight size={15} /></Link>
      {hasSavedProjects && <small>Your project library is available in Network Studio.</small>}
    </div>
  );
}

function SimulationCanvas({ project, event, activity, highlightedPath, settledRouterIds, sourceRouterId }) {
  const pathEdgeKeys = useMemo(() => new Set(highlightedPath.slice(1).map((routerId, index) => [highlightedPath[index], routerId].sort().join('::'))), [highlightedPath]);
  const nodes = useMemo(() => project.routers.map((router) => ({
    id: router.id,
    type: 'simulationRouter',
    position: { ...router.position },
    draggable: false,
    selectable: false,
    data: {
      label: router.label,
      routerId: router.id,
      isActive: event?.actorRouterId === router.id,
      isAffected: activity.routerIds.includes(router.id),
      isSettled: settledRouterIds.includes(router.id),
      isSource: sourceRouterId === router.id,
    },
  })), [project.routers, event, activity.routerIds, settledRouterIds, sourceRouterId]);
  const edges = useMemo(() => project.links.map((link) => {
    const key = [link.sourceRouterId, link.targetRouterId].sort().join('::');
    const inPath = pathEdgeKeys.has(key) && link.status === 'up';
    const isActive = activity.edgeKey === key && link.status === 'up';
    const isDown = link.status === 'down';
    return {
      id: link.id,
      source: link.sourceRouterId,
      target: link.targetRouterId,
      type: 'smoothstep',
      label: String(link.cost),
      animated: isActive || inPath,
      selectable: false,
      style: {
        stroke: isDown ? 'var(--danger)' : isActive || inPath ? 'var(--accent)' : 'var(--line-strong)',
        strokeWidth: isActive ? 3.4 : inPath ? 3 : 1.8,
        strokeDasharray: isDown ? '6 5' : undefined,
        opacity: isDown ? 0.72 : 1,
      },
      labelStyle: { fill: 'var(--text-secondary)', fontWeight: 700, fontSize: 11 },
      labelBgStyle: { fill: 'var(--surface)', fillOpacity: 0.96 },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 5,
    };
  }), [project.links, activity.edgeKey, pathEdgeKeys]);

  return (
    <div className="simulation-flow-wrap">
      {project.routers.length > 0 ? (
        <ReactFlow
          key={`${project.projectId}-${project.topologyRevision}`}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.22, minZoom: 0.35, maxZoom: 1.35 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={19} size={1} color="var(--line-strong)" />
          <Controls showInteractive={false} />

        </ReactFlow>
      ) : <div className="simulation-flow-empty">No routers in this saved topology.</div>}
      <div className="simulation-canvas-legend">
        <span><i className="legend-active-node" /> Active router</span>
        <span><i className="legend-settled-node" /> Settled</span>
        <span><i className="legend-active-link" /> Active link / selected path</span>
        <span><i className="legend-down-link" /> Disabled link</span>
      </div>
    </div>
  );
}

function RoutingTable({ algorithm, rows, routerId, setRouterId, destinationId, setDestinationId, routerIds, tableStatus, snapshotLabel }) {
  const selectedRoute = rows?.find((row) => row.destinationRouterId === destinationId) || null;
  return (
    <Card className="simulation-table-card" padding="none">
      <div className="simulation-card-heading">
        <div><span className="eyebrow muted">ROUTING EXPLORER</span><h2>Routing table</h2></div>
        <Badge tone={tableStatus === 'completed' ? 'success' : tableStatus === 'running' ? 'info' : 'subtle'}>{tableStatus === 'completed' ? 'Available' : tableStatus === 'running' ? 'Updating' : 'Waiting'}</Badge>
      </div>
      <div className="simulation-table-controls">
        <Select label="View table for" value={routerId} onChange={(event) => setRouterId(event.target.value)} options={routerIds.map((id) => ({ value: id, label: id }))} />
        <Select label="Highlight destination" value={destinationId} onChange={(event) => setDestinationId(event.target.value)} options={routerIds.map((id) => ({ value: id, label: id }))} />
      </div>
      {rows?.length ? (
        <>
          <div className="simulation-table-scroll">
            <table className="simulation-route-table" aria-label={`Routing table for ${routerId}`}>
              <thead><tr><th>Destination</th><th>Next hop</th><th>Cost</th><th>State</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.destinationRouterId} className={row.destinationRouterId === destinationId ? 'route-row-selected' : ''}>
                    <td><strong>{row.destinationRouterId}</strong></td>
                    <td>{row.nextHopRouterId || '—'}</td>
                    <td className="route-cost">{row.status === 'reachable' ? row.cost : row.status === 'pending' ? '—' : '∞'}</td>
                    <td><Badge tone={row.status === 'reachable' ? 'success' : row.status === 'pending' ? 'info' : 'subtle'}>{row.status === 'reachable' ? 'Reachable' : row.status === 'pending' ? 'Pending' : 'Unreachable'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedRoute && (
            <div className="simulation-selected-route">
              <div><span className="eyebrow muted">SELECTED ROUTE</span><strong>{routerId} → {destinationId}</strong></div>
              <div className="selected-route-summary">
                <span>Cost <b>{selectedRoute.status === 'reachable' ? selectedRoute.cost : selectedRoute.status === 'pending' ? 'Pending' : 'Unreachable'}</b></span>
                <span>Next hop <b>{selectedRoute.nextHopRouterId || '—'}</b></span>
              </div>
              <div className="simulation-route-path">
                {selectedRoute.path?.length ? selectedRoute.path.map((id, index) => <span key={`${id}-${index}`}>{index > 0 && <ArrowRight size={12} />}{id}</span>) : <span className="muted-path">{selectedRoute.status === 'pending' ? 'Not reached yet' : 'No available path'}</span>}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="simulation-table-empty">
          <Activity size={18} />
          <strong>{tableStatus === 'running' ? 'Routing calculation in progress' : 'No routing table yet'}</strong>
          <p>{algorithm === 'link-state' ? 'A router table becomes available as its Dijkstra run completes. During a run, estimates update as vertices are settled.' : 'The initial routing table appears at the first simulation event.'}</p>
          <small>{snapshotLabel}</small>
        </div>
      )}
    </Card>
  );
}

function EventTimeline({ run, cursor, onSeek, currentEvent, isPlaying }) {
  const visibleEvents = getVisibleEvents(run, currentEvent?.sequence, EVENT_LIMIT);
  const canSeek = Boolean(run && run.events.length);
  return (
    <Card className="simulation-timeline-card" padding="none">
      <div className="simulation-card-heading">
        <div><span className="eyebrow muted">EXECUTION HISTORY</span><h2>Event timeline</h2></div>
        <div className="simulation-timeline-meta"><Badge tone={isPlaying ? 'info' : 'subtle'} dot>{isPlaying ? 'Playing' : 'Paused'}</Badge><span>{run ? `${formatCount(cursor + 1)} / ${formatCount(run.events.length)} events` : 'No run yet'}</span></div>
      </div>
      <div className="simulation-timeline-scrubber">
        <input
          type="range"
          min="-1"
          max={Math.max(0, (run?.events.length || 1) - 1)}
          value={run ? cursor : -1}
          disabled={!canSeek}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Simulation event position"
          aria-valuetext={run ? cursor < 0 ? 'Before the first event' : `Event ${cursor + 1} of ${run.events.length}` : 'No simulation events'}
        />
        <div><span>Start</span><span>{run ? `${run.events.length.toLocaleString()} total events` : 'Run an algorithm to create a timeline'}</span><span>End</span></div>
      </div>
      <div className="simulation-event-list" role="group" aria-label="Simulation events">
        {visibleEvents.length ? visibleEvents.map((event) => (
          <button type="button" key={event.sequence} className={`simulation-event-row ${event.sequence === currentEvent?.sequence ? 'event-current' : ''}`} aria-current={event.sequence === currentEvent?.sequence ? 'step' : undefined} onClick={() => onSeek(event.sequence)}>
            <span className="simulation-event-sequence">{String(event.sequence + 1).padStart(3, '0')}</span>
            <span className="simulation-event-content"><strong>{getEventLabel(event.type)}</strong><small>{event.message}</small></span>
            <Badge tone={getEventTone(event)}>{event.actorRouterId || 'System'}</Badge>
          </button>
        )) : (
          <div className="simulation-event-empty"><Clock3 size={18} /><span>{run && cursor < 0 ? 'Run reset. Press Play or Next to replay the recorded events.' : 'Events will appear here as the algorithm executes.'}</span></div>
        )}
      </div>
      <div className="simulation-timeline-footer">Showing the latest {EVENT_LIMIT} events up to the current position. Select an event to jump to that exact step.</div>
    </Card>
  );
}

export default function SimulationPage() {
  const { notify } = useToast();
  const [project, setProject] = useState(getActiveProject);
  const [algorithm, setAlgorithm] = useState('distance-vector');
  const [run, setRun] = useState(null);
  const [cursor, setCursor] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedRouterId, setSelectedRouterId] = useState(project?.routers?.[0]?.id || '');
  const [selectedDestinationId, setSelectedDestinationId] = useState(project?.routers?.[1]?.id || project?.routers?.[0]?.id || '');
  const [runError, setRunError] = useState('');

  const hasProject = Boolean(project);
  const routerIds = useMemo(() => project?.routers.map((router) => router.id) || [], [project]);
  const linkStateReplayIndex = useMemo(() => buildLinkStateReplayIndex(run), [run]);
  const currentEvent = run && cursor >= 0 ? run.events[cursor] || null : null;
  const activity = useMemo(() => getCurrentActivity(currentEvent), [currentEvent]);
  const currentEventFacts = useMemo(() => getEventFacts(currentEvent), [currentEvent]);
  const currentSequence = currentEvent?.sequence ?? -1;
  const snapshotLabel = run && currentSequence >= 0 ? getCurrentSnapshotLabel(run, currentSequence) : 'Waiting for first snapshot';

  const tableView = useMemo(() => {
    if (!run || currentSequence < 0 || !selectedRouterId) return { status: 'waiting', rows: [] };
    if (algorithm === 'distance-vector') {
      const rows = getDistanceVectorTable(run, currentSequence, selectedRouterId);
      return { status: rows ? 'completed' : 'waiting', rows: rows || [] };
    }
    return getLinkStateTableAt(run, currentSequence, selectedRouterId, routerIds, linkStateReplayIndex);
  }, [run, currentSequence, selectedRouterId, algorithm, routerIds, linkStateReplayIndex]);

  const settledRouterIds = algorithm === 'link-state' ? (tableView.settledRouterIds || []) : [];
  const selectedRoute = tableView.rows?.find((row) => row.destinationRouterId === selectedDestinationId);
  const highlightedPath = selectedRoute?.status === 'reachable' ? selectedRoute.path || [] : [];
  const eventProgress = run ? getPlaybackProgress(cursor, run.events.length) : 0;
  const currentMetrics = run?.metrics || {};
  const isAtEnd = Boolean(run && cursor >= run.events.length - 1);

  useEffect(() => {
    if (!isPlaying || !run) return undefined;
    if (cursor >= run.events.length - 1) {
      setIsPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setCursor((current) => clampEventCursor(current + 1, run.events.length));
    }, getPlaybackDelay(speed));
    return () => window.clearTimeout(timer);
  }, [isPlaying, run, cursor, speed]);

  useEffect(() => {
    const syncProject = () => {
      const nextProject = getActiveProject();
      if (!nextProject) {
        setProject(null);
        setRun(null);
        setCursor(-1);
        setIsPlaying(false);
        return;
      }
      const changedIdentity = nextProject.projectId !== project?.projectId;
      const changedTopology = nextProject.topologyRevision !== project?.topologyRevision;
      setProject(nextProject);
      if (changedIdentity || changedTopology) {
        setRun(null);
        setCursor(-1);
        setIsPlaying(false);
        setSelectedRouterId(nextProject.routers[0]?.id || '');
        setSelectedDestinationId(nextProject.routers[1]?.id || nextProject.routers[0]?.id || '');
        setRunError('');
        if (run) notify('The saved topology changed. Run the algorithm again to create a fresh simulation.', 'info');
      }
    };
    window.addEventListener('routelab:project-saved', syncProject);
    window.addEventListener('storage', syncProject);
    return () => {
      window.removeEventListener('routelab:project-saved', syncProject);
      window.removeEventListener('storage', syncProject);
    };
  }, [project?.projectId, project?.topologyRevision, run, notify]);

  useEffect(() => {
    if (!routerIds.length) return;
    if (!routerIds.includes(selectedRouterId)) setSelectedRouterId(routerIds[0]);
    if (!routerIds.includes(selectedDestinationId)) setSelectedDestinationId(routerIds[1] || routerIds[0]);
  }, [routerIds, selectedRouterId, selectedDestinationId]);

  const handleRun = useCallback(() => {
    if (!project) {
      notify('Create and save a topology in Network Studio first.', 'error');
      return;
    }
    setIsPlaying(false);
    setRunError('');
    try {
      const result = runRoutingAlgorithm(project, algorithm);
      if (result.projectId !== project.projectId || result.topologyRevision !== project.topologyRevision) {
        throw new Error('The routing engine returned a result for a different topology revision.');
      }
      setRun(result);
      setCursor(0);
      setIsPlaying(result.events.length > 1);
      setSelectedRouterId(project.routers[0]?.id || '');
      setSelectedDestinationId(project.routers[1]?.id || project.routers[0]?.id || '');
      notify(`${algorithm === 'distance-vector' ? 'Distance Vector' : 'Link State'} simulation generated.`, 'success');
    } catch (error) {
      setRun(null);
      setCursor(-1);
      setRunError(error instanceof Error ? error.message : 'The routing simulation could not be generated.');
      notify('Simulation could not be generated. Check the saved topology.', 'error');
    }
  }, [project, algorithm, notify]);

  const handleAlgorithmChange = (nextAlgorithm) => {
    if (nextAlgorithm === algorithm) return;
    setAlgorithm(nextAlgorithm);
    setRun(null);
    setCursor(-1);
    setIsPlaying(false);
    setRunError('');
  };

  const handlePlayPause = useCallback(() => {
    if (!run) {
      handleRun();
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (isAtEnd || cursor < 0) setCursor(0);
    setIsPlaying(run.events.length > 1);
  }, [run, isAtEnd, cursor, handleRun]);

  const handleStep = useCallback((direction) => {
    if (!run) return;
    setIsPlaying(false);
    setCursor((current) => clampEventCursor(current + direction, run.events.length));
  }, [run]);

  const handleSeek = useCallback((sequence) => {
    if (!run) return;
    setIsPlaying(false);
    if (sequence < 0) {
      setCursor(-1);
      return;
    }
    const eventIndex = run.events.findIndex((event) => event.sequence === sequence);
    if (eventIndex >= 0) setCursor(eventIndex);
  }, [run]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCursor(-1);
  }, []);

  useEffect(() => {
    const handlePlaybackShortcut = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.isContentEditable || target?.closest('input, textarea, select, button, a, [role="button"], [role="slider"], [contenteditable="true"], [role="textbox"], [role="dialog"]')) return;

      if ((event.key === ' ' || event.key === 'Spacebar') && project) {
        event.preventDefault();
        handlePlayPause();
      } else if (event.key === 'ArrowLeft' && run) {
        event.preventDefault();
        handleStep(-1);
      } else if (event.key === 'ArrowRight' && run) {
        event.preventDefault();
        handleStep(1);
      } else if (event.key === 'Home' && run?.events.length) {
        event.preventDefault();
        handleSeek(run.events[0].sequence);
      } else if (event.key === 'End' && run?.events.length) {
        event.preventDefault();
        handleSeek(run.events[run.events.length - 1].sequence);
      } else if (event.key.toLowerCase() === 'r' && run) {
        event.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handlePlaybackShortcut);
    return () => window.removeEventListener('keydown', handlePlaybackShortcut);
  }, [handlePlayPause, handleStep, handleSeek, handleReset, run, project]);

  if (!hasProject) {
    return (
      <div className="page simulation-page">
        <PageHeader eyebrow="WORKSPACE / ALGORITHM EXECUTION" title="Simulation Studio" description="Run the routing algorithms against a saved topology. Follow each event, inspect routing tables and replay the process." actions={<Badge tone="info">Phase 4 · Interactive</Badge>} />
        <EmptySimulation hasSavedProjects={getSavedProjects().length > 0} />
      </div>
    );
  }

  const algorithmDescription = algorithm === 'distance-vector'
    ? 'Routers exchange their previous-round vectors with neighbours. Updated tables commit together, round by round, until a stable check confirms convergence.'
    : 'Routers originate and flood LSAs, build local link-state databases, then run Dijkstra independently to construct shortest-path trees.';

  return (
    <div className="page simulation-page">
      <PageHeader
        eyebrow="WORKSPACE / ALGORITHM EXECUTION"
        title="Simulation Studio"
        description="Slow the routing process down. Inspect each update, understand why a route changes, and replay the sequence."
        actions={<Badge tone="success" dot>Interactive · Phase 4</Badge>}
      />

      <div className="simulation-project-strip">
        <div className="simulation-project-identity">
          <span className="simulation-project-icon"><Activity size={17} /></span>
          <div><span className="eyebrow muted">SAVED TOPOLOGY</span><strong>{project.name}</strong><small>{project.routers.length} routers · {project.links.filter((link) => link.status === 'up').length} active links · Revision {project.topologyRevision}</small></div>
        </div>
        <div className="simulation-project-actions"><Badge tone="success" dot>Saved snapshot</Badge><Link to="/studio" className="simulation-studio-link">Edit topology <ArrowRight size={13} /></Link></div>
      </div>

      <div className="simulation-control-bar">
        <div className="simulation-algorithm-control">
          <Select label="Routing algorithm" value={algorithm} onChange={(event) => handleAlgorithmChange(event.target.value)} options={ALGORITHM_OPTIONS} />
          <div className="simulation-algorithm-summary"><strong>{algorithm === 'distance-vector' ? 'Bellman-Ford based model' : 'LSA flooding + Dijkstra'}</strong><span>{algorithm === 'distance-vector' ? 'Synchronous neighbour-table updates' : 'Distributed topology knowledge, local shortest paths'}</span></div>
        </div>
        <div className="simulation-playback-controls">
          {!run ? (
            <Button icon={Play} onClick={handleRun}>Run simulation</Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" icon={SkipBack} disabled={cursor <= 0} onClick={() => handleStep(-1)} aria-label="Previous event">Previous</Button>
              <Button size="sm" icon={isPlaying ? Pause : Play} onClick={handlePlayPause}>{isPlaying ? 'Pause' : isAtEnd ? 'Replay' : 'Play'}</Button>
              <Button size="sm" variant="secondary" icon={SkipForward} disabled={isAtEnd} onClick={() => handleStep(1)} aria-label="Next event">Next</Button>
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={handleReset}>Reset</Button>
              <Button size="sm" variant="secondary" icon={FastForward} onClick={handleRun}>Rerun</Button>
            </>
          )}
          <Select aria-label="Playback speed" value={String(speed)} onChange={(event) => setSpeed(Number(event.target.value))} options={PLAYBACK_SPEEDS.map((item) => ({ value: String(item.value), label: item.label }))} />
        </div>
      </div>

      <div className="simulation-shortcuts" aria-label="Keyboard shortcuts">
        <span className="simulation-shortcuts-title">KEYBOARD SHORTCUTS</span>
        <span><kbd>Space</kbd> Play / pause</span>
        <span><kbd>←</kbd><kbd>→</kbd> Step</span>
        <span><kbd>Home</kbd><kbd>End</kbd> First / last event</span>
        <span><kbd>R</kbd> Reset</span>
      </div>

      <div className="simulation-description-strip"><Sparkles size={14} /><p>{algorithmDescription}</p></div>

      {runError && <div className="simulation-error-banner" role="alert"><strong>Simulation error</strong><span>{runError}</span></div>}

      <div className="simulation-workspace-grid">
        <Card className="simulation-canvas-card" padding="none">
          <div className="simulation-card-heading">
            <div><span className="eyebrow muted">LIVE NETWORK VIEW</span><h2>Algorithm activity</h2></div>
            <Badge tone={isPlaying ? 'info' : run ? 'success' : 'subtle'} dot>{isPlaying ? 'Playing' : run ? (isAtEnd ? 'Completed' : 'Paused') : 'Ready'}</Badge>
          </div>
          <SimulationCanvas
            project={project}
            event={currentEvent}
            activity={activity}
            highlightedPath={highlightedPath}
            settledRouterIds={settledRouterIds}
            sourceRouterId={selectedRouterId}
          />
          <div className="simulation-activity-callout">
            <span className="simulation-activity-indicator"><Radio size={15} /></span>
            <div><span className="eyebrow muted">CURRENT EVENT · {currentEvent ? `#${String(currentEvent.sequence + 1).padStart(3, '0')}` : 'NOT STARTED'}</span><strong>{activity.title}</strong><p>{activity.description}</p>
              {currentEventFacts.length > 0 && <div className="simulation-event-facts">{currentEventFacts.map((fact) => <span key={`${fact.label}-${fact.value}`}><small>{fact.label}</small><b>{fact.value}</b></span>)}</div>}
            </div>
          </div>
          <div className="simulation-progress-row"><div><span>Execution progress</span><strong>{run ? `${Math.max(0, cursor + 1).toLocaleString()} / ${run.events.length.toLocaleString()}` : '— / —'}</strong></div><div className="simulation-progress-track" role="progressbar" aria-label="Simulation execution progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(eventProgress)}><span style={{ width: `${eventProgress}%` }} /></div></div>
        </Card>

        <RoutingTable
          algorithm={algorithm}
          rows={tableView.rows}
          routerId={selectedRouterId}
          setRouterId={setSelectedRouterId}
          destinationId={selectedDestinationId}
          setDestinationId={setSelectedDestinationId}
          routerIds={routerIds}
          tableStatus={tableView.status}
          snapshotLabel={snapshotLabel}
        />
      </div>

      <section className="simulation-metrics-block" aria-label="Algorithm run totals">
        <div className="simulation-metrics-intro"><span className="eyebrow muted">RUN TOTALS</span><small>Final model counters for the complete generated run. These are not playback elapsed-time measurements.</small></div>
        <div className="simulation-metrics-grid">
          {algorithm === 'distance-vector' ? (
            <>
              <Metric label="Executed rounds" value={formatCount(currentMetrics.roundsExecuted)} detail="Includes final stable check" />
              <Metric label="Rounds with changes" value={formatCount(currentMetrics.roundsWithChanges)} detail="Tables updated in the round" />
              <Metric label="Vector messages" value={formatCount(currentMetrics.vectorMessages)} detail="Directed full-vector transmissions" />
              <Metric label="Routers" value={formatCount(currentMetrics.routerCount)} detail="Vertices in this topology" />
              <Metric label="Active links" value={formatCount(currentMetrics.activeLinkCount)} detail="Used by the routing graph" />
              <Metric label="Disabled links" value={formatCount(currentMetrics.disabledLinkCount)} detail="Excluded from calculations" />
            </>
          ) : (
            <>
              <Metric label="LSAs originated" value={formatCount(currentMetrics.lsaOriginations)} detail="One origin per router" />
              <Metric label="LSA transmissions" value={formatCount(currentMetrics.lsaTransmissions)} detail="Flooding message sends" />
              <Metric label="First-time accepts" value={formatCount(currentMetrics.lsaAcceptances)} detail="Remote LSAs stored in a database" />
              <Metric label="Duplicates suppressed" value={formatCount(currentMetrics.lsaDuplicatesSuppressed)} detail="Repeat LSA receptions" />
              <Metric label="Dijkstra runs" value={formatCount(currentMetrics.dijkstraRuns)} detail="One shortest-path tree per router" />
              <Metric label="Vertices settled" value={formatCount(currentMetrics.dijkstraSettledVertices)} detail="Across all Dijkstra runs" />
              <Metric label="Relaxation attempts" value={formatCount(currentMetrics.dijkstraRelaxationAttempts)} detail="Adjacency entries examined" />
            </>
          )}
        </div>
      </section>

      <EventTimeline run={run} cursor={cursor} onSeek={handleSeek} currentEvent={currentEvent} isPlaying={isPlaying} />

      <div className="simulation-method-note"><CheckCircle2 size={14} /><p><strong>Learning model:</strong> RouteLab visualizes educational Distance Vector and Link State models. Its event counts describe simulated algorithm work, not real network time, packet bytes or full production RIP/OSPF protocol behaviour. <span>Run generated: {formatTime(run?.startedAt)}</span></p></div>
    </div>
  );
}
