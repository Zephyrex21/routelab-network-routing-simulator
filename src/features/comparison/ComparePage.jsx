import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeftRight, ArrowRight, CheckCircle2, GitBranch,
  FileDown, Info, Network, RefreshCw, Unplug,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { getActiveProject } from '../topology/model/projectStore.js';
import {
  getPairComparison,
  getRoutingTableComparison,
  runAlgorithmComparison,
  runFailureScenarioComparison,
} from './model/algorithmComparison.js';
import { createComparisonReportHtml, openPrintableReport } from '../../shared/utils/learningReports.js';
import './comparison.css';

const OPERATION_OPTIONS = [
  { value: 'down', label: 'Disable link' },
  { value: 'up', label: 'Enable link' },
  { value: 'cost', label: 'Change link cost' },
];

function MetricValue({ value }) {
  return <strong className="comparison-metric-value">{Number(value || 0).toLocaleString()}</strong>;
}

function EmptyComparisonState() {
  return (
    <Card className="comparison-empty-state">
      <div className="comparison-empty-icon"><Network size={23} /></div>
      <span className="eyebrow muted">NO SAVED TOPOLOGY</span>
      <h2>Build a network before comparing.</h2>
      <p>The Comparison Lab runs both routing algorithms against the same saved topology. Create and save a network in Network Studio first.</p>
      <Link to="/studio" className="button button-primary"><Network size={16} /> Open Network Studio <ArrowRight size={15} /></Link>
    </Card>
  );
}

function RouteCard({ title, subtitle, route, algorithm }) {
  const reachable = route?.status === 'reachable';
  return (
    <Card className={`comparison-route-card comparison-route-${algorithm}`}>
      <div className="comparison-route-heading">
        <div><span className="eyebrow muted">{subtitle}</span><h3>{title}</h3></div>
        <Badge tone={reachable ? 'success' : 'warning'} dot>{reachable ? 'Reachable' : 'Unreachable'}</Badge>
      </div>
      <div className="comparison-route-path" aria-label={reachable ? `Path ${route.path.join(' to ')}` : 'No route available'}>
        {reachable ? route.path.map((routerId, index) => (
          <span className="comparison-path-segment" key={`${routerId}-${index}`}>
            {index > 0 && <ArrowRight size={13} aria-hidden="true" />}
            <b>{routerId}</b>
          </span>
        )) : <span className="comparison-no-route">No available path</span>}
      </div>
      <div className="comparison-route-stats">
        <div><span>Total path cost</span><strong>{reachable ? route.totalCost : '—'}</strong></div>
        <div><span>Hop count</span><strong>{reachable ? route.hopCount : '—'}</strong></div>
        <div><span>Next hop</span><strong>{reachable && route.path.length > 1 ? route.path[1] : '—'}</strong></div>
      </div>
    </Card>
  );
}

function AgreementBadge({ agreement }) {
  if (agreement.status === 'both-unreachable') return <Badge tone="warning">Both unreachable</Badge>;
  if (agreement.status === 'reachability-difference') return <Badge tone="danger">Reachability differs</Badge>;
  if (agreement.status === 'cost-difference') return <Badge tone="danger">Cost differs</Badge>;
  if (agreement.status === 'equal-cost-alternative') return <Badge tone="info">Equal-cost alternative</Badge>;
  return <Badge tone="success">Exact path match</Badge>;
}

function PathText({ route }) {
  if (route.status !== 'reachable') return <span className="comparison-unreachable-text">Unreachable</span>;
  return <span className="comparison-path-text">{route.path.join(' → ')}</span>;
}

function MetricProfile({ profile, tone }) {
  return (
    <Card className={`comparison-work-card comparison-work-${tone}`}>
      <div className="comparison-work-heading">
        <div><span className="eyebrow muted">ALGORITHM-SPECIFIC WORK</span><h3>{profile.title}</h3></div>
        <Badge tone="subtle">{profile.eventCount.toLocaleString()} events</Badge>
      </div>
      <div className="comparison-work-grid">
        {profile.items.map((item) => (
          <div className="comparison-work-item" key={item.key} title={item.definition}>
            <span>{item.label}</span>
            <MetricValue value={item.value} />
            <small>{item.definition}</small>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CostComparisonChart({ rows }) {
  const maximumCost = Math.max(1, ...rows.flatMap((row) => [row.distanceVector.cost, row.linkState.cost]).filter(Number.isFinite));
  return (
    <Card className="comparison-chart-card">
      <div className="comparison-section-heading">
        <div><span className="eyebrow muted">SAME MEASURE · SAME SCALE</span><h2>Route cost by destination</h2><p>Minimum path cost from the selected source router. Both algorithms are plotted on the same cost scale.</p></div>
        <div className="comparison-chart-legend"><span><i className="comparison-legend-dot comparison-legend-dv" />Distance Vector</span><span><i className="comparison-legend-dot comparison-legend-ls" />Link State</span></div>
      </div>
      <div className="comparison-cost-chart">
        {rows.map((row) => (
          <div className="comparison-cost-row" key={row.destinationRouterId}>
            <div className="comparison-cost-destination">{row.destinationRouterId}</div>
            <div className="comparison-cost-bars">
              {[
                ['DV', row.distanceVector, 'comparison-cost-dv'],
                ['LS', row.linkState, 'comparison-cost-ls'],
              ].map(([label, route, className]) => (
                <div className="comparison-cost-bar-row" key={label}>
                  <span>{label}</span>
                  {route.status === 'reachable' ? (
                    <div className="comparison-cost-track"><div className={`comparison-cost-fill ${className}`} style={{ width: `${route.cost === 0 ? 0 : Math.max(1.5, (route.cost / maximumCost) * 100)}%` }} /></div>
                  ) : <div className="comparison-cost-unreachable">Unreachable</div>}
                  <b>{route.status === 'reachable' ? route.cost : '—'}</b>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FailureOutcome({ algorithm, result }) {
  const config = {
    unchanged: ['success', 'Unchanged'],
    changed: ['info', 'Route changed'],
    'cost-changed': ['warning', 'Cost changed'],
    'alternate-equal-cost': ['info', 'Equal-cost alternative'],
    'became-unreachable': ['danger', 'Became unreachable'],
    'became-reachable': ['success', 'Now reachable'],
    'still-unreachable': ['warning', 'Still unreachable'],
  }[result.routeChange.outcome] || ['neutral', 'Analysed'];
  return (
    <div className={`comparison-failure-result comparison-failure-${algorithm}`}>
      <div className="comparison-failure-result-head"><strong>{algorithm === 'distance-vector' ? 'Distance Vector' : 'Link State'}</strong><Badge tone={config[0]}>{config[1]}</Badge></div>
      <div className="comparison-failure-route-pair">
        <div><span>Before</span><PathText route={result.beforeRoute} /><b>{result.beforeRoute.status === 'reachable' ? `Cost ${result.beforeRoute.totalCost}` : '—'}</b></div>
        <ArrowRight size={15} aria-hidden="true" />
        <div><span>After</span><PathText route={result.afterRoute} /><b>{result.afterRoute.status === 'reachable' ? `Cost ${result.afterRoute.totalCost}` : '—'}</b></div>
      </div>
      <p>{result.routeChange.explanation}</p>
    </div>
  );
}

export default function ComparePage() {
  const { notify } = useToast();
  const [project, setProject] = useState(getActiveProject);
  const projectRef = useRef(project);
  const [sourceRouterId, setSourceRouterId] = useState(project?.routers?.[0]?.id || '');
  const [destinationRouterId, setDestinationRouterId] = useState(project?.routers?.[1]?.id || project?.routers?.[0]?.id || '');
  const [comparison, setComparison] = useState(null);
  const [comparisonError, setComparisonError] = useState('');
  const initialLink = project?.links?.find((link) => link.status === 'up') || project?.links?.[0] || null;
  const [linkId, setLinkId] = useState(initialLink?.id || '');
  const [operation, setOperation] = useState(initialLink?.status === 'down' ? 'up' : 'down');
  const [costInput, setCostInput] = useState(String(initialLink?.cost ?? 5));
  const [failureResult, setFailureResult] = useState(null);
  const [failureError, setFailureError] = useState('');

  useEffect(() => {
    const refreshProject = () => {
      const nextProject = getActiveProject();
      const previous = projectRef.current;
      const sameTopology = previous?.projectId === nextProject?.projectId
        && previous?.topologyRevision === nextProject?.topologyRevision;
      projectRef.current = nextProject;
      setProject(nextProject);
      if (!sameTopology) {
        setComparison(null);
        setFailureResult(null);
        setComparisonError('The saved topology changed. Run a new comparison to use the updated network.');
        setFailureError('The saved topology changed. Configure and run the failure scenario again.');
        const routerIds = (nextProject?.routers || []).map((router) => router.id);
        setSourceRouterId(routerIds[0] || '');
        setDestinationRouterId(routerIds[1] || routerIds[0] || '');
        const nextLink = nextProject?.links?.find((link) => link.status === 'up') || nextProject?.links?.[0];
        setLinkId(nextLink?.id || '');
        setOperation(nextLink?.status === 'down' ? 'up' : 'down');
        setCostInput(String(nextLink?.cost ?? 5));
      }
    };
    window.addEventListener('routelab:project-saved', refreshProject);
    window.addEventListener('storage', refreshProject);
    return () => {
      window.removeEventListener('routelab:project-saved', refreshProject);
      window.removeEventListener('storage', refreshProject);
    };
  }, []);

  useEffect(() => {
    const handleExportComparisonReport = () => {
    if (!comparison || !comparisonIsCurrent) return;
    try {
      const html = createComparisonReportHtml({
        project,
        comparison,
        sourceRouterId,
        destinationRouterId,
        failureResult: failureIsCurrent ? failureResult : null,
      });
      const result = openPrintableReport(html);
      notify(result.message, result.ok ? 'success' : 'warning');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The comparison report could not be generated.', 'error');
    }
  };

  if (!project) return;
    const ids = project.routers.map((router) => router.id);
    if (!ids.includes(sourceRouterId)) setSourceRouterId(ids[0] || '');
    if (!ids.includes(destinationRouterId)) setDestinationRouterId(ids[1] || ids[0] || '');
    if (!project.links.some((link) => link.id === linkId)) {
      const nextLink = project.links.find((link) => link.status === 'up') || project.links[0];
      setLinkId(nextLink?.id || '');
      setOperation(nextLink?.status === 'down' ? 'up' : 'down');
      setCostInput(String(nextLink?.cost ?? 5));
    }
  }, [project, sourceRouterId, destinationRouterId, linkId]);

  const routerOptions = (project?.routers || []).map((router) => ({ value: router.id, label: `${router.id} · ${router.label}` }));
  const linkOptions = (project?.links || []).map((link) => ({
    value: link.id,
    label: `${link.id} · ${link.sourceRouterId} ↔ ${link.targetRouterId} · ${link.cost} · ${link.status}`,
  }));
  const selectedLink = project?.links?.find((link) => link.id === linkId) || null;
  const availableOperations = selectedLink
    ? OPERATION_OPTIONS.filter((item) => item.value === 'cost' || item.value !== selectedLink.status)
    : OPERATION_OPTIONS.filter((item) => item.value === 'cost');
  const selectedPair = useMemo(() => getPairComparison(comparison, sourceRouterId, destinationRouterId), [comparison, sourceRouterId, destinationRouterId]);
  const tableRows = useMemo(() => getRoutingTableComparison(comparison, sourceRouterId), [comparison, sourceRouterId]);

  const handleRunComparison = () => {
    if (!project) return;
    try {
      const result = runAlgorithmComparison(project);
      setComparison(result);
      setComparisonError('');
      setFailureResult(null);
      setFailureError('');
      notify('Both algorithms completed on the same saved topology.', 'success');
    } catch (error) {
      setComparison(null);
      setComparisonError(error.message || 'The routing comparison could not be completed.');
      notify(error.message || 'The routing comparison failed.', 'error');
    }
  };

  const handleRunFailureComparison = () => {
    if (!project) return;
    try {
      const result = runFailureScenarioComparison(project, {
        linkId,
        operation,
        nextCost: costInput,
        sourceRouterId,
        destinationRouterId,
      });
      if (!result.ok) {
        setFailureResult(null);
        setFailureError(result.message);
        notify(result.message, 'warning');
        return;
      }
      setFailureResult(result);
      setFailureError('');
      notify('Both algorithms were rerun on the baseline and modified topologies.', 'success');
    } catch (error) {
      setFailureResult(null);
      const message = error instanceof Error ? error.message : 'The failure comparison could not be completed.';
      setFailureError(message);
      notify(message, 'error');
    }
  };

  if (!project) return <div className="page feature-page compare-page"><PageHeader eyebrow="WORKSPACE / ROUTING MODELS" title="Compare algorithms" description="Run Distance Vector and Link State against one saved network." /><EmptyComparisonState /></div>;

  const comparisonIsCurrent = comparison?.projectId === project.projectId && comparison?.topologyRevision === project.topologyRevision;
  const failureIsCurrent = failureResult?.projectId === project.projectId && failureResult?.topologyRevision === project.topologyRevision;
  const routerCount = project.routers.length;
  const activeLinks = project.links.filter((link) => link.status === 'up').length;

  return (
    <div className="page feature-page compare-page">
      <PageHeader
        eyebrow="WORKSPACE / ROUTING MODELS"
        title="Compare algorithms"
        description="Run both routing models against the same topology. Compare the routes they calculate and inspect the work each model performs."
        actions={<Badge tone="success" dot>Phase 6 · Live comparison</Badge>}
      />

      <div className="compare-intro-strip">
        <div className="compare-intro-icon"><GitBranch size={19} /></div>
        <div><strong>One topology. Two algorithms. A fair comparison.</strong><p>Route costs and reachability are directly comparable. Algorithm-specific messages, update rounds, flooding and Dijkstra operations are reported separately—not combined into a misleading speed score.</p></div>
        <Badge tone="info">{project.name}</Badge>
      </div>

      <Card className="comparison-run-card">
        <div className="comparison-run-heading">
          <div><span className="eyebrow muted">COMPARISON INPUT</span><h2>Choose a route to inspect</h2><p>Both algorithms will process the same saved topology revision.</p></div>
          <div className="comparison-topology-facts"><span><Network size={14} />{routerCount} routers</span><span><ArrowLeftRight size={14} />{activeLinks} active links</span><span><Unplug size={14} />{project.links.length - activeLinks} disabled</span></div>
        </div>
        <div className="comparison-controls-grid">
          <Select label="Source router" value={sourceRouterId} onChange={(event) => { setSourceRouterId(event.target.value); setFailureResult(null); setFailureError(''); }} options={routerOptions} />
          <Select label="Destination router" value={destinationRouterId} onChange={(event) => { setDestinationRouterId(event.target.value); setFailureResult(null); setFailureError(''); }} options={routerOptions} />
          <div className="comparison-run-action"><Button icon={GitBranch} onClick={handleRunComparison}>Run both algorithms</Button></div>
        </div>
        <div className="comparison-run-foot"><span>Saved project: <b>{project.name}</b> · Revision {project.topologyRevision}</span><Link to="/studio">Edit topology <ArrowRight size={13} /></Link></div>
        {comparisonError && <div className="comparison-inline-error" role="alert"><AlertTriangle size={15} />{comparisonError}</div>}
      </Card>

      {comparisonIsCurrent && selectedPair ? (
        <>
          <div className="comparison-summary-grid">
            <Card className="comparison-summary-card"><span>Ordered routes evaluated</span><strong>{comparison.summary.pairsCompared}</strong><small>Every source → destination pair, including self-routes</small></Card>
            <Card className="comparison-summary-card"><span>Reachability agreement</span><strong>{comparison.summary.reachabilityAgreements}/{comparison.summary.pairsCompared}</strong><small>{comparison.summary.reachabilityDifferences} pair(s) differ in reachability</small></Card>
            <Card className="comparison-summary-card"><span>Reachable cost agreement</span><strong>{comparison.summary.reachableCostAgreements}/{comparison.summary.reachableCostComparisons}</strong><small>Same minimum cost where both are reachable</small></Card>
            <Card className="comparison-summary-card"><span>Equal-cost alternatives</span><strong>{comparison.summary.equalCostAlternatives}</strong><small>Different selected paths with equal cost</small></Card>
          </div>

          <section className="comparison-results-section">
            <div className="comparison-section-title"><div><span className="eyebrow muted">SELECTED ROUTE</span><h2>{sourceRouterId} <ArrowRight size={19} /> {destinationRouterId}</h2><p>Route selection from each algorithm's final forwarding table.</p></div><AgreementBadge agreement={selectedPair.agreement} /></div>
            <div className="compare-model-grid comparison-route-grid">
              <RouteCard title="Distance Vector" subtitle="BELLMAN-FORD UPDATE MODEL" route={selectedPair.distanceVector} algorithm="dv" />
              <RouteCard title="Link State" subtitle="LSA FLOODING + DIJKSTRA" route={selectedPair.linkState} algorithm="ls" />
            </div>
          </section>

          <CostComparisonChart rows={tableRows} />

          <Card className="comparison-table-card" padding="none">
            <div className="comparison-table-heading"><div><span className="panel-mini-label">FOR SOURCE ROUTER {sourceRouterId}</span><h2>Routing-table comparison</h2></div><Badge tone="info">{tableRows.length} destinations</Badge></div>
            <div className="comparison-table-wrap">
              <table className="comparison-table comparison-live-table">
                <thead><tr><th scope="col">Destination</th><th scope="col">DV next hop</th><th scope="col">DV cost</th><th scope="col">LS next hop</th><th scope="col">LS cost</th><th scope="col">Agreement</th></tr></thead>
                <tbody>{tableRows.map((row) => (
                  <tr key={row.destinationRouterId}>
                    <th scope="row">{row.destinationRouterId}</th>
                    <td>{row.distanceVector.nextHopRouterId || '—'}</td>
                    <td>{row.distanceVector.status === 'reachable' ? row.distanceVector.cost : '—'}</td>
                    <td>{row.linkState.nextHopRouterId || '—'}</td>
                    <td>{row.linkState.status === 'reachable' ? row.linkState.cost : '—'}</td>
                    <td><AgreementBadge agreement={row.agreement} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="comparison-table-foot"><span>Next hop is the first router after the selected source. Unreachable entries have no next hop or finite cost.</span><span>Current source: {sourceRouterId}</span></div>
          </Card>

          <section className="comparison-work-section">
            <div className="comparison-section-title"><div><span className="eyebrow muted">ALGORITHM-SPECIFIC METRICS</span><h2>How much model work was performed?</h2><p>These measures describe different operations in each educational model. They are not elapsed time or directly interchangeable counts.</p></div><Badge tone="subtle">No speed ranking</Badge></div>
            <div className="compare-model-grid comparison-work-grid-layout">
              <MetricProfile profile={comparison.workProfiles['distance-vector']} tone="dv" />
              <MetricProfile profile={comparison.workProfiles['link-state']} tone="ls" />
            </div>
            <div className="comparison-metric-note"><Info size={15} /><p><b>How to interpret this:</b> Distance Vector rounds count synchronous table-exchange cycles; vector messages count directed neighbour advertisements. Link State counters describe LSA flooding and independent Dijkstra runs. A larger count in one category does not prove that an algorithm is slower.</p></div>
          </section>
          <div className="comparison-report-action">
            <Button variant="secondary" icon={FileDown} onClick={handleExportComparisonReport}>Export comparison report</Button>
          </div>
        </>
      ) : (
        <Card className="comparison-awaiting-card">
          <div className="comparison-awaiting-icon"><Activity size={23} /></div>
          <span className="eyebrow muted">READY TO COMPARE</span>
          <h2>Run both algorithms to reveal the results.</h2>
          <p>RouteLab will calculate every source-to-destination route for both algorithms, compare the selected source's routing table, and report model-specific work counters.</p>
          <div className="comparison-awaiting-facts"><span><CheckCircle2 size={14} /> Same topology revision</span><span><CheckCircle2 size={14} /> All router pairs</span><span><CheckCircle2 size={14} /> Algorithm-specific metrics</span></div>
        </Card>
      )}

      <section className="comparison-failure-section">
        <div className="comparison-section-title"><div><span className="eyebrow muted">NETWORK CHANGE EXPERIMENT</span><h2>Compare both models after a link change</h2><p>Run a fresh baseline and modified-topology calculation for both algorithms using the selected source and destination.</p></div><Badge tone="info">Isolated experiment</Badge></div>
        <Card className="comparison-failure-setup-card">
          <div className="comparison-failure-setup-grid">
            <Select label="Link to change" value={linkId} onChange={(event) => { const nextId = event.target.value; const nextLink = project.links.find((link) => link.id === nextId); setLinkId(nextId); setOperation(nextLink?.status === 'down' ? 'up' : 'down'); setCostInput(String(nextLink?.cost ?? 5)); setFailureResult(null); setFailureError(''); }} options={linkOptions} />
            <Select label="Experiment" value={operation} onChange={(event) => { setOperation(event.target.value); setFailureResult(null); }} options={availableOperations} />
            {operation === 'cost' ? <Input label="New integer link cost" type="number" min="1" max="999" step="1" value={costInput} onChange={(event) => { setCostInput(event.target.value); setFailureResult(null); }} /> : <div className="comparison-failure-input-note"><span>ROUTE PAIR</span><strong>{sourceRouterId} → {destinationRouterId}</strong><small>Uses the source and destination selected above.</small></div>}
            <div className="comparison-failure-action"><Button variant="secondary" icon={RefreshCw} disabled={!project.links.length} onClick={handleRunFailureComparison}>Run failure comparison</Button></div>
          </div>
          {failureError && <div className="comparison-inline-error" role="alert"><AlertTriangle size={15} />{failureError}</div>}
          <div className="comparison-experiment-note"><AlertTriangle size={14} /><span>The original saved project is not modified. Both algorithms restart from initialization on the baseline and the isolated one-link variant.</span></div>
        </Card>
        {failureIsCurrent && (
          <Card className="comparison-failure-results-card">
            <div className="comparison-table-heading"><div><span className="panel-mini-label">BASELINE VS MODIFIED TOPOLOGY</span><h2>{failureResult.linkChange.before.sourceRouterId} ↔ {failureResult.linkChange.before.targetRouterId}</h2></div><Badge tone={failureResult.operation === 'down' ? 'danger' : 'info'}>{failureResult.operation === 'down' ? 'Link disabled' : failureResult.operation === 'up' ? 'Link enabled' : 'Cost changed'}</Badge></div>
            <div className="comparison-failure-change"><span>Before: <b>cost {failureResult.linkChange.before.cost}</b> · {failureResult.linkChange.before.status}</span><ArrowRight size={14} /><span>After: <b>cost {failureResult.linkChange.after.cost}</b> · {failureResult.linkChange.after.status}</span></div>
            <div className="comparison-failure-results-grid">
              <FailureOutcome algorithm="distance-vector" result={failureResult.algorithms['distance-vector']} />
              <FailureOutcome algorithm="link-state" result={failureResult.algorithms['link-state']} />
            </div>
          </Card>
        )}
      </section>

      <div className="comparison-bottom-note"><Activity size={15} /><p>All calculations are performed by RouteLab's educational routing engine. Link changes trigger fresh simulations; they do not emulate live RIP/OSPF timers, convergence delays or physical network traffic.</p></div>
    </div>
  );
}
