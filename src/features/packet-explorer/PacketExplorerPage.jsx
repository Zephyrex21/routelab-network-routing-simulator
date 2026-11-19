import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDown, ArrowRight, CheckCircle2, CircleDot,
  Pause, Play, RefreshCw, RotateCcw, Route, Send, ShieldAlert, SkipBack,
  SkipForward, Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { runRoutingAlgorithm } from '../../engine/algorithms/index.js';
import { getLastProject, getSavedProjects } from '../topology/model/projectStore.js';
import { createPacketRoute } from './model/packetRouting.js';
import PacketTopologyView from './components/PacketTopologyView.jsx';
import './packet-explorer.css';

const ALGORITHM_OPTIONS = [
  { value: 'distance-vector', label: 'Distance Vector' },
  { value: 'link-state', label: 'Link State' },
];
const SPEED_OPTIONS = [
  { value: '0.7', label: '0.7× · Slow' },
  { value: '1', label: '1× · Normal' },
  { value: '1.5', label: '1.5× · Fast' },
  { value: '2', label: '2× · Faster' },
];

function getActiveProject() {
  return getLastProject();
}

function PacketEmptyState({ hasSavedProjects }) {
  return (
    <Card className="packet-empty-state">
      <div className="packet-empty-icon"><Route size={23} /></div>
      <span className="eyebrow muted">NO SAVED TOPOLOGY</span>
      <h2>Build a network before sending a packet.</h2>
      <p>Packet journeys use a completed routing result from a saved topology. Open Network Studio, create or load a network, and save it first.</p>
      <Link to="/studio" className="button button-primary"><Workflow size={16} /> Open Network Studio <ArrowRight size={15} /></Link>
      {hasSavedProjects && <small>Your saved project library is available inside Network Studio.</small>}
    </Card>
  );
}

function PacketMetric({ label, value, note }) {
  return <div className="packet-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

export default function PacketExplorerPage() {
  const { notify } = useToast();
  const [project, setProject] = useState(getActiveProject);
  const projectRef = useRef(project);
  const [algorithm, setAlgorithm] = useState('distance-vector');
  const [sourceRouterId, setSourceRouterId] = useState(project?.routers?.[0]?.id || '');
  const [destinationRouterId, setDestinationRouterId] = useState(project?.routers?.[1]?.id || project?.routers?.[0]?.id || '');
  const [run, setRun] = useState(null);
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  const [runError, setRunError] = useState('');

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) return undefined;
    const handleChange = (event) => {
      setReducedMotion(event.matches);
      if (event.matches) setIsPlaying(false);
    };
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  useEffect(() => {
    const refreshProject = () => {
      const nextProject = getActiveProject();
      const current = projectRef.current;
      if (current?.projectId === nextProject?.projectId && current?.topologyRevision === nextProject?.topologyRevision) {
        projectRef.current = nextProject;
        setProject(nextProject); // Name/position-only saves refresh presentation without invalidating the route.
        return;
      }
      projectRef.current = nextProject;
      setProject(nextProject);
      setRun(null);
      setCursor(0);
      setIsPlaying(false);
      setRunError('The saved topology changed. Generate a new routing result before exploring a packet.');
    };
    window.addEventListener('routelab:project-saved', refreshProject);
    window.addEventListener('storage', refreshProject);
    return () => {
      window.removeEventListener('routelab:project-saved', refreshProject);
      window.removeEventListener('storage', refreshProject);
    };
  }, []);

  useEffect(() => {
    if (!project?.routers?.length) {
      setSourceRouterId('');
      setDestinationRouterId('');
      return;
    }
    const ids = project.routers.map((router) => router.id);
    if (!ids.includes(sourceRouterId)) setSourceRouterId(ids[0]);
    if (!ids.includes(destinationRouterId)) setDestinationRouterId(ids[1] || ids[0]);
  }, [project, sourceRouterId, destinationRouterId]);

  const route = useMemo(
    () => createPacketRoute(project, run, sourceRouterId, destinationRouterId),
    [project, run, sourceRouterId, destinationRouterId],
  );
  const isReachable = route.status === 'reachable';
  const hopCount = isReachable ? route.hopCount : 0;
  const currentRouterId = isReachable && route.path.length ? route.path[Math.min(cursor, route.path.length - 1)] : null;
  const isAtEnd = isReachable && cursor >= hopCount;
  const progress = isReachable && hopCount > 0 ? Math.min(100, (cursor / hopCount) * 100) : isAtEnd ? 100 : 0;

  useEffect(() => {
    if (!isPlaying || !isReachable || isAtEnd) {
      if (isPlaying && isAtEnd) setIsPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setCursor((value) => Math.min(hopCount, value + 1)), 900 / speed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, isReachable, isAtEnd, cursor, hopCount, speed]);

  const handleGenerate = useCallback(() => {
    if (!project) return;
    setIsPlaying(false);
    setRunError('');
    try {
      const result = runRoutingAlgorithm(project, algorithm);
      setRun(result);
      setCursor(0);
      const nextRoute = createPacketRoute(project, result, sourceRouterId, destinationRouterId);
      if (nextRoute.status === 'reachable') {
        notify(`A ${algorithm === 'distance-vector' ? 'Distance Vector' : 'Link State'} forwarding route is ready.`, 'success');
      } else if (nextRoute.status === 'unreachable') {
        notify('The destination is unreachable. No packet journey was created.', 'warning');
      } else {
        notify('The routing result could not produce a safe forwarding path.', 'error');
      }
    } catch (error) {
      setRun(null);
      setRunError(error instanceof Error ? error.message : 'The routing result could not be generated.');
      notify('Could not generate a routing result.', 'error');
    }
  }, [project, algorithm, sourceRouterId, destinationRouterId, notify]);

  const updateAlgorithm = (value) => {
    setAlgorithm(value);
    setRun(null);
    setCursor(0);
    setIsPlaying(false);
    setRunError('');
  };

  const updateEndpoint = (setter, value) => {
    setter(value);
    setCursor(0);
    setIsPlaying(false);
    setRunError('');
  };

  const handlePlayPause = () => {
    if (!isReachable || hopCount === 0 || reducedMotion) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (isAtEnd) setCursor(0);
    setIsPlaying(true);
  };

  const handleStep = (direction) => {
    setIsPlaying(false);
    setCursor((value) => Math.max(0, Math.min(hopCount, value + direction)));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCursor(0);
  };

  if (!project) {
    return (
      <div className="page feature-page packet-explorer-page">
        <PageHeader eyebrow="WORKSPACE / PACKET JOURNEY" title="Packet Explorer" description="Follow an end-to-end packet journey using the forwarding decisions in the selected routing result." actions={<Badge tone="success">Interactive · Phase 5</Badge>} />
        <PacketEmptyState hasSavedProjects={getSavedProjects().length > 0} />
      </div>
    );
  }

  const routerOptions = project.routers.map((router) => ({ value: router.id, label: `${router.id} · ${router.label}` }));
  const routeStatusTone = route.status === 'reachable' ? 'success' : route.status === 'unreachable' ? 'warning' : 'danger';

  return (
    <div className="page feature-page packet-explorer-page">
      <PageHeader
        eyebrow="WORKSPACE / PACKET JOURNEY"
        title="Packet Explorer"
        description="Choose two routers and follow a conceptual packet as each router forwards it using its own routing-table entry."
        actions={<Badge tone="success" dot>Interactive · Phase 5</Badge>}
      />

      <div className="packet-project-strip">
        <div><span className="packet-project-mark"><Activity size={16} /></span><div><span className="eyebrow muted">SAVED NETWORK</span><strong>{project.name}</strong><small>{project.routers.length} routers · {project.links.filter((link) => link.status === 'up').length} active links · Revision {project.topologyRevision}</small></div></div>
        <Link to="/studio" className="inline-link">Edit topology <ArrowRight size={14} /></Link>
      </div>

      <Card className="packet-control-card">
        <div className="packet-control-heading"><div><span className="eyebrow muted">FORWARDING SETUP</span><h2>Where should the packet travel?</h2><p>The route is generated from the saved topology and the selected algorithm's final forwarding tables.</p></div><Badge tone={run ? 'success' : 'subtle'} dot>{run ? 'Routing result ready' : 'Awaiting calculation'}</Badge></div>
        <div className="packet-control-grid">
          <Select label="Routing algorithm" value={algorithm} onChange={(event) => updateAlgorithm(event.target.value)} options={ALGORITHM_OPTIONS} />
          <Select label="Source router" value={sourceRouterId} onChange={(event) => updateEndpoint(setSourceRouterId, event.target.value)} options={routerOptions} />
          <Select label="Destination router" value={destinationRouterId} onChange={(event) => updateEndpoint(setDestinationRouterId, event.target.value)} options={routerOptions} />
          <div className="packet-generate-action"><Button icon={RefreshCw} onClick={handleGenerate}>Calculate forwarding route</Button></div>
        </div>
        {runError && <div className="packet-error-banner" role="alert"><ShieldAlert size={15} /><span>{runError}</span></div>}
      </Card>

      {run && (
        <>
          <div className="packet-result-heading"><div><span className="eyebrow muted">ROUTE RESULT</span><h2>{sourceRouterId} <ArrowRight size={18} /> {destinationRouterId}</h2></div><Badge tone={routeStatusTone} dot>{route.status === 'reachable' ? 'Reachable' : route.status === 'unreachable' ? 'Unreachable' : 'Forwarding validation failed'}</Badge></div>
          {route.status === 'reachable' ? (
            <>
              <div className="packet-summary-grid">
                <PacketMetric label="HOP COUNT" value={route.hopCount} note="Router-to-router forwards" />
                <PacketMetric label="TOTAL PATH COST" value={route.totalCost} note="Sum of active link costs" />
                <PacketMetric label="CURRENT ROUTER" value={currentRouterId || '—'} note={isAtEnd ? 'Destination reached' : 'Packet position'} />
                <PacketMetric label="ROUTING MODEL" value={algorithm === 'distance-vector' ? 'Distance Vector' : 'Link State'} note="Final routing result" />
              </div>

              <Card className="packet-visual-card" padding="none">
                <div className="packet-visual-header"><div><span className="eyebrow muted">LIVE PACKET JOURNEY</span><h2>{isAtEnd ? 'Packet delivered.' : `Forwarding at ${currentRouterId || sourceRouterId}.`}</h2></div><Badge tone={isAtEnd ? 'success' : isPlaying ? 'info' : 'subtle'} dot>{isAtEnd ? 'Delivered' : isPlaying ? 'In transit' : 'Ready / paused'}</Badge></div>
                <PacketTopologyView project={project} route={route} cursor={cursor} showPacket />
                <div className="packet-playback-row">
                  <div className="packet-playback-buttons">
                    <Button size="sm" variant="secondary" icon={SkipBack} disabled={cursor <= 0} onClick={() => handleStep(-1)} aria-label="Previous hop">Previous</Button>
                    <Button size="sm" icon={isPlaying ? Pause : Play} onClick={handlePlayPause} disabled={hopCount === 0 || reducedMotion}>{isPlaying ? 'Pause' : isAtEnd ? 'Replay journey' : 'Play journey'}</Button>
                    <Button size="sm" variant="secondary" icon={SkipForward} disabled={cursor >= hopCount} onClick={() => handleStep(1)} aria-label="Next hop">Next hop</Button>
                    <Button size="sm" variant="ghost" icon={RotateCcw} onClick={handleReset}>Reset</Button>
                  </div>
                  <Select aria-label="Packet animation speed" value={String(speed)} onChange={(event) => setSpeed(Number(event.target.value))} options={SPEED_OPTIONS} />
                </div>
                {reducedMotion && <div className="packet-motion-note">Reduced-motion preference is on. Automatic movement is disabled; use Previous and Next hop to inspect the route step by step.</div>}
                <div className="packet-progress-block"><div><span>Journey progress</span><strong>{cursor} / {hopCount} hops</strong></div><div className="packet-progress-track"><span style={{ width: `${progress}%` }} /></div></div>
              </Card>

              <div className="packet-detail-grid">
                <Card className="packet-hop-card">
                  <div className="packet-section-heading"><div><span className="eyebrow muted">FORWARDING DECISIONS</span><h2>Hop-by-hop route</h2></div><Badge tone="info">{route.forwardingDecisions.length} forwards</Badge></div>
                  <div className="packet-hop-list">
                    {route.path.map((routerId, index) => {
                      const decision = route.forwardingDecisions[index];
                      const isCurrent = index === cursor;
                      const isVisited = index < cursor;
                      return (
                        <div className={`packet-hop-row ${isCurrent ? 'hop-current' : ''} ${isVisited ? 'hop-visited' : ''}`} key={`${routerId}-${index}`}>
                          <span className="packet-hop-index">{String(index + 1).padStart(2, '0')}</span>
                          <span className="packet-hop-router"><i>{isVisited ? <CheckCircle2 size={13} /> : <CircleDot size={13} />}</i><strong>{routerId}</strong><small>{index === 0 ? 'Source router' : index === route.path.length - 1 ? 'Destination router' : 'Transit router'}</small></span>
                          <span className="packet-hop-cost">{decision ? <><b>Link cost {decision.linkCost}</b><small>{decision.fromRouterId} → {decision.toRouterId}</small></> : <><b>Delivered</b><small>Packet destination</small></>}</span>
                          {index < route.path.length - 1 && <span className="packet-hop-connector"><ArrowDown size={13} /></span>}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="packet-decision-card">
                  <div className="packet-section-heading"><div><span className="eyebrow muted">CURRENT FORWARDING ENTRY</span><h2>{currentRouterId || 'Router'} → {destinationRouterId}</h2></div><Badge tone="success">Table lookup</Badge></div>
                  {cursor < hopCount ? (() => {
                    const decision = route.forwardingDecisions[cursor];
                    return decision ? <div className="packet-decision-content">
                      <div className="packet-decision-equation"><span>{decision.remainingCostBefore}</span><b>−</b><span>{decision.linkCost}</span><b>=</b><strong>{decision.remainingCostAfter}</strong></div>
                      <p>At <b>{decision.fromRouterId}</b>, the destination entry names <b>{decision.toRouterId}</b> as the next hop. The active link costs {decision.linkCost}; the remaining route cost is {decision.remainingCostAfter}.</p>
                      <div className="packet-decision-facts"><div><span>Next hop</span><strong>{decision.toRouterId}</strong></div><div><span>Link identifier</span><strong>{decision.linkId}</strong></div><div><span>Cumulative cost</span><strong>{decision.cumulativeCost}</strong></div><div><span>Remaining cost</span><strong>{decision.remainingCostAfter}</strong></div></div>
                    </div> : null;
                  })() : <div className="packet-delivery-state"><CheckCircle2 size={25} /><strong>Packet delivered to {destinationRouterId}</strong><p>Every forwarding decision used an active link and the route's accumulated cost matches the routing table.</p></div>}
                </Card>
              </div>
            </>
          ) : (
            <Card className="packet-unreachable-card">
              <div className="packet-unreachable-icon"><ShieldAlert size={22} /></div>
              <div><strong>{route.status === 'unreachable' ? 'No route is available.' : 'Forwarding validation stopped the journey.'}</strong><p>{route.reason || route.message || 'RouteLab could not verify a safe hop-by-hop forwarding path. No packet animation was started.'}</p></div>
              <Link to="/failures" className="inline-link">Open Network Failure Lab <ArrowRight size={14} /></Link>
            </Card>
          )}
        </>
      )}

      {!run && <Card className="packet-before-run"><div className="packet-before-run-icon"><Send size={19} /></div><div><strong>Calculate a route to begin.</strong><p>RouteLab will run the selected algorithm once, then derive each forwarding hop from the current router's own destination entry. It will never animate a guessed path.</p></div></Card>}

      <div className="packet-learning-note"><div className="packet-note-icon"><Workflow size={18} /></div><div><strong>Conceptual packet simulation</strong><p>This animation represents forwarding decisions across the saved topology. It does not send a real IP packet, model packet bytes, or emulate transport-layer delivery.</p></div><Badge tone="subtle">Educational model</Badge></div>
    </div>
  );
}
