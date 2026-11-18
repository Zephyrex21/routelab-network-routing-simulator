import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, CheckCircle2, GitBranch, Link2, Network, Plus,
  RefreshCw, Save, ShieldAlert, SlidersHorizontal, Unplug,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { runRoutingAlgorithm } from '../../engine/algorithms/index.js';
import { createProject } from '../topology/model/projectModel.js';
import { getLastProject, getSavedProjects, saveProject } from '../topology/model/projectStore.js';
import { createPacketRoute } from '../packet-explorer/model/packetRouting.js';
import PacketTopologyView from '../packet-explorer/components/PacketTopologyView.jsx';
import { comparePacketRoutes, createLinkExperiment } from './model/failureExperiment.js';
import './network-failure.css';

const ALGORITHM_OPTIONS = [
  { value: 'distance-vector', label: 'Distance Vector' },
  { value: 'link-state', label: 'Link State' },
];
const OPERATION_OPTIONS = [
  { value: 'down', label: 'Disable this link' },
  { value: 'up', label: 'Enable this link' },
  { value: 'cost', label: 'Change link cost' },
];

function getActiveProject() {
  return getLastProject() || getSavedProjects()[0] || null;
}

function OutcomeBadge({ outcome }) {
  const config = {
    unchanged: ['success', 'Unchanged'],
    changed: ['info', 'Route changed'],
    'cost-changed': ['warning', 'Cost changed'],
    'alternate-equal-cost': ['info', 'Equal-cost alternative'],
    'became-unreachable': ['danger', 'Became unreachable'],
    'became-reachable': ['success', 'Now reachable'],
    'still-unreachable': ['warning', 'Still unreachable'],
  }[outcome] || ['neutral', 'Analysed'];
  return <Badge tone={config[0]} dot>{config[1]}</Badge>;
}

function EmptyFailureState() {
  return (
    <Card className="failure-empty-state">
      <div className="failure-empty-icon"><Unplug size={23} /></div>
      <span className="eyebrow muted">NO SAVED TOPOLOGY</span>
      <h2>Create a network to experiment with.</h2>
      <p>The Failure Lab needs a saved topology with at least one link. Your original project will remain untouched while you test temporary changes.</p>
      <Link to="/studio" className="button button-primary"><Network size={16} /> Open Network Studio <ArrowRight size={15} /></Link>
    </Card>
  );
}

function RouteOutcomeCard({ title, subtitle, route }) {
  const reachable = route?.status === 'reachable';
  return (
    <Card className="failure-outcome-card">
      <div className="failure-outcome-header"><div><span className="eyebrow muted">{subtitle}</span><h3>{title}</h3></div><Badge tone={reachable ? 'success' : 'warning'}>{reachable ? 'Reachable' : 'Unreachable'}</Badge></div>
      <div className="failure-outcome-path">{reachable ? route.path.map((id, index) => <span key={`${id}-${index}`}>{index > 0 && <ArrowRight size={13} />}{id}</span>) : <span className="failure-no-path">No available path</span>}</div>
      <div className="failure-outcome-metrics"><div><span>Total cost</span><strong>{reachable ? route.totalCost : '—'}</strong></div><div><span>Hop count</span><strong>{reachable ? route.hopCount : '—'}</strong></div></div>
    </Card>
  );
}

export default function NetworkFailureLabPage() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState(getActiveProject);
  const projectRef = useRef(project);
  const [linkId, setLinkId] = useState(project?.links?.[0]?.id || '');
  const [operation, setOperation] = useState(project?.links?.[0]?.status === 'down' ? 'up' : 'down');
  const [costInput, setCostInput] = useState(String(project?.links?.[0]?.cost ?? 5));
  const [algorithm, setAlgorithm] = useState('distance-vector');
  const [sourceRouterId, setSourceRouterId] = useState(project?.routers?.[0]?.id || '');
  const [destinationRouterId, setDestinationRouterId] = useState(project?.routers?.[1]?.id || project?.routers?.[0]?.id || '');
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    const refreshProject = () => {
      const nextProject = getActiveProject();
      const current = projectRef.current;
      if (current?.projectId === nextProject?.projectId && current?.topologyRevision === nextProject?.topologyRevision) {
        projectRef.current = nextProject;
        setProject(nextProject); // Non-routing metadata and canvas positions do not invalidate algorithm results.
        setAnalysis((currentAnalysis) => {
          if (!currentAnalysis) return currentAnalysis;
          const suffix = ' · Experiment';
          const experimentName = `${nextProject.name.slice(0, 80 - suffix.length)}${suffix}`;
          return {
            ...currentAnalysis,
            experimentProject: {
              ...currentAnalysis.experimentProject,
              name: experimentName,
              routers: nextProject.routers.map((router) => ({ ...router, position: { ...router.position } })),
            },
          };
        });
        return;
      }
      projectRef.current = nextProject;
      setProject(nextProject);
      setAnalysis(null);
      setAnalysisError('The saved topology changed. Run a new experiment using the updated project.');
      setLinkId(nextProject?.links?.[0]?.id || '');
      setOperation(nextProject?.links?.[0]?.status === 'down' ? 'up' : 'down');
      setCostInput(String(nextProject?.links?.[0]?.cost ?? 5));
      setSourceRouterId(nextProject?.routers?.[0]?.id || '');
      setDestinationRouterId(nextProject?.routers?.[1]?.id || nextProject?.routers?.[0]?.id || '');
    };
    window.addEventListener('routelab:project-saved', refreshProject);
    window.addEventListener('storage', refreshProject);
    return () => {
      window.removeEventListener('routelab:project-saved', refreshProject);
      window.removeEventListener('storage', refreshProject);
    };
  }, []);

  useEffect(() => {
    if (!project) return;
    if (!project.links.some((link) => link.id === linkId)) setLinkId(project.links[0]?.id || '');
    const ids = project.routers.map((router) => router.id);
    if (!ids.includes(sourceRouterId)) setSourceRouterId(ids[0] || '');
    if (!ids.includes(destinationRouterId)) setDestinationRouterId(ids[1] || ids[0] || '');
  }, [project, linkId, sourceRouterId, destinationRouterId]);

  const selectedLink = project?.links?.find((link) => link.id === linkId) || null;
  const experiment = useMemo(() => project && selectedLink
    ? createLinkExperiment(project, linkId, operation, costInput)
    : { ok: false, message: 'Choose a link to experiment with.' }, [project, selectedLink, linkId, operation, costInput]);
  const routerOptions = (project?.routers || []).map((router) => ({ value: router.id, label: `${router.id} · ${router.label}` }));
  const linkOptions = (project?.links || []).map((link) => ({ value: link.id, label: `${link.id} · ${link.sourceRouterId} ↔ ${link.targetRouterId} · cost ${link.cost} · ${link.status}` }));
  const availableOperationOptions = selectedLink
    ? OPERATION_OPTIONS.filter((item) => item.value === 'cost' || item.value !== selectedLink.status)
    : OPERATION_OPTIONS;

  const clearAnalysis = () => {
    setAnalysis(null);
    setAnalysisError('');
  };

  const handleAnalyse = () => {
    if (!project) return;
    if (!experiment.ok) {
      notify(experiment.message, 'warning');
      return;
    }
    setAnalysisError('');
    try {
      const beforeRun = runRoutingAlgorithm(project, algorithm);
      const afterRun = runRoutingAlgorithm(experiment.project, algorithm);
      const beforeRoute = createPacketRoute(project, beforeRun, sourceRouterId, destinationRouterId);
      const afterRoute = createPacketRoute(experiment.project, afterRun, sourceRouterId, destinationRouterId);
      if (beforeRoute.status === 'invalid' || afterRoute.status === 'invalid') {
        throw new Error(beforeRoute.message || afterRoute.message || 'The forwarding result could not be validated.');
      }
      const comparison = comparePacketRoutes(beforeRoute, afterRoute);
      setAnalysis({
        projectId: project.projectId,
        topologyRevision: project.topologyRevision,
        experimentProject: experiment.project,
        beforeRun,
        afterRun,
        beforeRoute,
        afterRoute,
        comparison,
        algorithm,
        sourceRouterId,
        destinationRouterId,
        linkChange: { before: experiment.before, after: experiment.after, operation },
      });
      notify('Baseline and modified topologies were recalculated successfully.', 'success');
    } catch (error) {
      setAnalysis(null);
      setAnalysisError(error instanceof Error ? error.message : 'The experiment could not be calculated.');
      notify('The network experiment could not be completed.', 'error');
    }
  };

  const handleSaveVariant = () => {
    if (!analysis) return;
    const source = analysis.experimentProject;
    const suffix = operation === 'down' ? ' · Link failure' : operation === 'up' ? ' · Link restored' : ' · Cost experiment';
    const variant = createProject(`${project.name.slice(0, 80 - suffix.length)}${suffix}`, {
      routers: source.routers,
      links: source.links,
    });
    const result = saveProject(variant);
    if (!result.ok) {
      notify(result.message || 'The experiment could not be saved.', 'error');
      return;
    }
    notify('Modified topology saved as a separate project. The original is unchanged.', 'success');
    navigate('/studio');
  };

  if (!project) {
    return (
      <div className="page feature-page failure-lab-page">
        <PageHeader eyebrow="WORKSPACE / NETWORK EXPERIMENTS" title="Network Failure Lab" description="Change a link or its cost, then inspect how the routing result changes." actions={<Badge tone="success">Interactive · Phase 5</Badge>} />
        <EmptyFailureState />
      </div>
    );
  }

  return (
    <div className="page feature-page failure-lab-page">
      <PageHeader
        eyebrow="WORKSPACE / NETWORK EXPERIMENTS"
        title="Network Failure Lab"
        description="Change one link condition, rerun the routing model from initialization, and compare its path before and after the experiment."
        actions={<Badge tone="success" dot>Interactive · Phase 5</Badge>}
      />

      <div className="failure-project-strip">
        <div><span className="failure-project-mark"><GitBranch size={16} /></span><div><span className="eyebrow muted">BASELINE TOPOLOGY</span><strong>{project.name}</strong><small>{project.routers.length} routers · {project.links.length} links · Revision {project.topologyRevision}</small></div></div>
        <Badge tone="success" dot>Original project protected</Badge>
      </div>

      <div className="failure-lab-layout">
        <Card className="failure-config-card">
          <div className="failure-section-heading"><div className="failure-section-icon"><SlidersHorizontal size={17} /></div><div><span className="eyebrow muted">EXPERIMENT SETUP</span><h2>Change one network condition.</h2></div></div>
          <div className="failure-form-stack">
            <Select label="Link to modify" value={linkId} onChange={(event) => { const nextId = event.target.value; const nextLink = project.links.find((link) => link.id === nextId); setLinkId(nextId); setOperation(nextLink?.status === 'down' ? 'up' : 'down'); setCostInput(String(nextLink?.cost ?? 5)); clearAnalysis(); }} options={linkOptions} />
            {selectedLink && <div className="failure-link-current"><span>Current link state</span><strong>{selectedLink.sourceRouterId} ↔ {selectedLink.targetRouterId}</strong><Badge tone={selectedLink.status === 'up' ? 'success' : 'danger'}>{selectedLink.status === 'up' ? 'Enabled' : 'Disabled'}</Badge><small>Current cost: {selectedLink.cost}</small></div>}
            <Select label="Experiment type" value={operation} onChange={(event) => { setOperation(event.target.value); clearAnalysis(); }} options={availableOperationOptions} />
            {operation === 'cost' && <Input label="New link cost" type="number" min="1" max="999" step="1" value={costInput} onChange={(event) => { setCostInput(event.target.value); clearAnalysis(); }} hint="Use a whole-number cost between 1 and 999." />}
            <div className="failure-form-divider" />
            <span className="eyebrow muted">ROUTE TO OBSERVE</span>
            <Select label="Routing algorithm" value={algorithm} onChange={(event) => { setAlgorithm(event.target.value); clearAnalysis(); }} options={ALGORITHM_OPTIONS} />
            <div className="failure-endpoint-row">
              <Select label="Source router" value={sourceRouterId} onChange={(event) => { setSourceRouterId(event.target.value); clearAnalysis(); }} options={routerOptions} />
              <Select label="Destination router" value={destinationRouterId} onChange={(event) => { setDestinationRouterId(event.target.value); clearAnalysis(); }} options={routerOptions} />
            </div>
            {!experiment.ok && <div className="failure-validation-hint"><ShieldAlert size={14} /><span>{experiment.message}</span></div>}
            <Button icon={RefreshCw} onClick={handleAnalyse} disabled={!experiment.ok || !project.links.length}>Run before / after analysis</Button>
            <small className="failure-small-note">Both networks are recalculated from algorithm initialization. This is not a timed live-convergence or production router failure simulation.</small>
          </div>
        </Card>

        <div className="failure-result-column">
          {analysis ? (
            <>
              <Card className="failure-change-summary">
                <div><span className="eyebrow muted">APPLIED EXPERIMENT</span><h2>{analysis.linkChange.before.sourceRouterId} ↔ {analysis.linkChange.before.targetRouterId}</h2></div>
                <div className="failure-change-values"><div><span>Before</span><strong>{analysis.linkChange.before.status === 'up' ? 'Enabled' : 'Disabled'} · cost {analysis.linkChange.before.cost}</strong></div><ArrowRight size={15} /><div><span>After</span><strong>{analysis.linkChange.after.status === 'up' ? 'Enabled' : 'Disabled'} · cost {analysis.linkChange.after.cost}</strong></div></div>
                <OutcomeBadge outcome={analysis.comparison.outcome} />
                <p>{analysis.comparison.explanation}</p>
              </Card>
              <div className="failure-topology-comparison">
                <Card className="failure-topology-card" padding="none"><div className="failure-topology-head"><div><span className="eyebrow muted">BASELINE</span><h3>Before experiment</h3></div><Badge tone="subtle">Original</Badge></div><PacketTopologyView project={project} route={analysis.beforeRoute} variant="before" /></Card>
                <Card className="failure-topology-card" padding="none"><div className="failure-topology-head"><div><span className="eyebrow muted">MODIFIED</span><h3>After experiment</h3></div><Badge tone="info">Variant</Badge></div><PacketTopologyView project={analysis.experimentProject} route={analysis.afterRoute} variant="after" /></Card>
              </div>
              <div className="failure-outcome-grid">
                <RouteOutcomeCard title="Before" subtitle="BASELINE ROUTE" route={analysis.beforeRoute} />
                <RouteOutcomeCard title="After" subtitle="EXPERIMENT ROUTE" route={analysis.afterRoute} />
              </div>
              <Card className="failure-save-card"><div className="failure-save-copy"><span className="failure-save-icon"><Save size={16} /></span><div><strong>Keep this experiment?</strong><p>Save the modified topology as a separate project. Your original saved network will not be overwritten.</p></div></div><Button size="sm" icon={Plus} onClick={handleSaveVariant}>Save as new project</Button></Card>
            </>
          ) : (
            <Card className="failure-result-placeholder">
              <div className="failure-result-placeholder-icon"><Link2 size={22} /></div>
              <span className="eyebrow muted">BEFORE / AFTER ANALYSIS</span>
              <h2>See how one link can change the route.</h2>
              <p>Choose a link and an experiment on the left, then calculate both versions of the network. RouteLab will show the original and modified routes using the same algorithm and endpoints.</p>
              <div className="failure-preview-stats"><div><strong>{project.routers.length}</strong><span>Routers</span></div><div><strong>{project.links.filter((link) => link.status === 'up').length}</strong><span>Active links</span></div><div><strong>{project.links.filter((link) => link.status === 'down').length}</strong><span>Disabled links</span></div></div>
              {analysisError && <div className="failure-error-banner" role="alert"><ShieldAlert size={14} />{analysisError}</div>}
            </Card>
          )}
        </div>
      </div>

      <div className="failure-learning-note"><div className="failure-note-icon"><CheckCircle2 size={17} /></div><div><strong>Fresh-run experiment model</strong><p>After a change, RouteLab reruns the selected algorithm from its initial state on the modified topology. It does not simulate real router timers, packet loss, triggered updates or live protocol recovery.</p></div><Badge tone="subtle">Educational model</Badge></div>
    </div>
  );
}
