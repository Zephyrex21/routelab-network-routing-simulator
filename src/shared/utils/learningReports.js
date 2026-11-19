import { getEventExplanation, getEventLabel } from '../features/simulation/model/simulationViewModel.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const number = (value) => Number.isFinite(value) ? value.toLocaleString() : '—';
const cost = (route) => route?.status === 'reachable' && Number.isFinite(route.cost) ? number(route.cost) : '∞';

function createTopologySvg(project) {
  const routers = project?.routers || [];
  if (!routers.length) return '<p>Topology diagram unavailable.</p>';
  const xs = routers.map((router) => Number(router.position?.x) || 0);
  const ys = routers.map((router) => Number(router.position?.y) || 0);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const width = Math.max(1, maxX - minX), height = Math.max(1, maxY - minY);
  const points = new Map(routers.map((router) => [router.id, {
    x: 72 + ((Number(router.position?.x) || 0) - minX) / width * 756,
    y: 54 + ((Number(router.position?.y) || 0) - minY) / height * 260,
  }]));
  const lines = (project.links || []).map((link) => {
    const a = points.get(link.sourceRouterId), b = points.get(link.targetRouterId);
    if (!a || !b) return '';
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    const down = link.status === 'down';
    return `<g class="topology-link ${down ? 'is-down' : ''}"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><rect x="${x - 15}" y="${y - 12}" width="30" height="19" rx="6"/><text x="${x}" y="${y + 1.5}" text-anchor="middle">${escapeHtml(link.cost)}</text></g>`;
  }).join('');
  const nodes = routers.map((router) => {
    const point = points.get(router.id);
    return `<g class="topology-router"><circle cx="${point.x}" cy="${point.y}" r="19"/><text class="router-id" x="${point.x}" y="${point.y + 3}" text-anchor="middle">${escapeHtml(router.id)}</text><text class="router-label" x="${point.x}" y="${point.y + 34}" text-anchor="middle">${escapeHtml(router.label)}</text></g>`;
  }).join('');
  return `<svg class="topology-diagram" role="img" aria-label="Topology diagram for ${escapeHtml(project.name)}" viewBox="0 0 900 370" xmlns="http://www.w3.org/2000/svg"><g class="topology-links">${lines}</g><g class="topology-routers">${nodes}</g></svg>`;
}

function createReportShell({ title, subtitle, project, generatedAt, body }) {
  const generated = generatedAt instanceof Date ? generatedAt : new Date(generatedAt || Date.now());
  const generatedLabel = Number.isNaN(generated.getTime()) ? 'Unknown' : generated.toLocaleString();
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(project?.name || 'RouteLab')}</title>
<style>
:root{color-scheme:light;--ink:#17243a;--muted:#5f6d80;--line:#d8e0e9;--soft:#f4f7fb;--blue:#315fbd;--blue-soft:#eaf1ff;--green:#16734a;--amber:#9a6510}
*{box-sizing:border-box}body{margin:0;background:#eef2f7;color:var(--ink);font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.report-toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px max(22px,calc((100vw - 980px)/2));border-bottom:1px solid var(--line);background:#fff}
.report-toolbar span{color:var(--muted);font-size:12px}.report-toolbar button{border:0;border-radius:8px;padding:10px 15px;background:var(--blue);color:#fff;font:600 12px/1.2 system-ui,sans-serif;cursor:pointer}
.report-shell{max-width:980px;margin:28px auto;padding:44px 52px;background:#fff;box-shadow:0 8px 40px #1d355014}
.report-cover{padding-bottom:24px;border-bottom:2px solid var(--ink)}.report-kicker,.section-kicker{color:var(--blue);font-size:10px;font-weight:750;letter-spacing:.13em;text-transform:uppercase}
h1{margin:10px 0 5px;font-size:32px;letter-spacing:-.045em;line-height:1.1}.report-subtitle{max-width:720px;margin:0;color:var(--muted);font-size:14px}
.report-meta{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:20px;color:var(--muted);font-size:11px}.report-meta b{color:var(--ink)}
.report-section{margin-top:27px;break-inside:avoid}.report-section h2{margin:4px 0 12px;font-size:18px;letter-spacing:-.025em}.report-section h3{margin:15px 0 7px;font-size:13px}.report-section p{color:var(--muted);font-size:12px}
.fact-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:14px}.fact{padding:11px 12px;border:1px solid var(--line);border-radius:9px;background:var(--soft)}
.fact span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.06em}.fact strong{display:block;margin-top:4px;font-size:17px}
.topology-frame{margin-top:10px;padding:12px;border:1px solid var(--line);border-radius:10px;background:#fbfcfe}.topology-diagram{display:block;width:100%;height:auto;max-height:380px}
.topology-link line{stroke:#9aa9bd;stroke-width:2.2}.topology-link.is-down line{stroke:#c45d62;stroke-dasharray:7 5}.topology-link rect{fill:#fff;stroke:#d8e0e9}.topology-link.is-down rect{fill:#fff4f4;stroke:#e7b7b9}.topology-link text{fill:#52647b;font-size:11px;font-weight:700}
.topology-router circle{fill:#eef3ff;stroke:#6f90d4;stroke-width:2}.topology-router .router-id{fill:#244a99;font-size:11px;font-weight:800}.topology-router .router-label{fill:#5c6a7b;font-size:10px}
.legend{display:flex;flex-wrap:wrap;gap:10px 18px;color:var(--muted);font-size:10px}.legend span{display:inline-flex;align-items:center;gap:6px}.legend i{width:16px;height:3px;border-radius:2px;background:#9aa9bd}.legend i.down{height:0;border-top:2px dashed #c45d62;background:none}
.report-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:9px}table{width:100%;border-collapse:collapse;font-size:10.5px}thead{background:var(--soft)}
th,td{padding:8px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{color:#43546b;font-size:9px;letter-spacing:.04em;text-transform:uppercase}
tbody tr:last-child td,tbody tr:last-child th{border-bottom:0}td.path{max-width:250px;overflow-wrap:anywhere}.status-good{color:var(--green);font-weight:700}.status-unreachable{color:var(--amber);font-weight:700}
.metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.metric{padding:10px 12px;border:1px solid var(--line);border-radius:8px}.metric span{display:block;color:var(--muted);font-size:10px}.metric strong{display:block;margin-top:3px;font-size:17px}.metric small{display:block;margin-top:3px;color:var(--muted);font-size:9px;line-height:1.45}
.learning-item{padding:12px 0;border-bottom:1px solid var(--line);break-inside:avoid}.learning-item:last-child{border-bottom:0}.learning-item h3{margin:0 0 4px;font-size:12px}.learning-item .event-message{margin:0 0 6px;color:var(--muted);font-size:10px}.learning-item p{margin:5px 0;font-size:11px}
.takeaway{padding:8px 10px;border-left:3px solid var(--blue);background:var(--blue-soft);color:#334d78!important}
.report-note{margin-top:18px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--soft);color:var(--muted);font-size:10px}
.report-footer{margin-top:30px;padding-top:12px;border-top:1px solid var(--line);color:var(--muted);font-size:9px}
.report-table-wrap,.metric,.fact{break-inside:avoid}
@media(max-width:700px){.report-shell{margin:0;padding:24px 18px}.fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.report-toolbar{padding:10px 14px}}
@media print{body{background:#fff}.report-toolbar{display:none}.report-shell{max-width:none;margin:0;padding:0;box-shadow:none}a{color:inherit;text-decoration:none}.report-section{break-inside:auto}.report-table-wrap{overflow:visible}.report-table-wrap table{break-inside:auto}tr{break-inside:avoid;break-after:auto}.report-cover{break-after:avoid}.report-footer{break-inside:avoid}}
</style></head><body>
<div class="report-toolbar"><span>RouteLab · Printable learning report · Use your browser’s destination to save a PDF</span><button type="button" onclick="window.print()">Print / Save as PDF</button></div>
<main class="report-shell"><header class="report-cover"><div class="report-kicker">RouteLab / Computer Networks Learning Laboratory</div><h1>${escapeHtml(title)}</h1><p class="report-subtitle">${escapeHtml(subtitle)}</p>
<div class="report-meta"><span><b>Network:</b> ${escapeHtml(project?.name || 'Unknown')}</span><span><b>Routers:</b> ${number(project?.routers?.length)}</span><span><b>Links:</b> ${number(project?.links?.length)}</span><span><b>Generated:</b> ${escapeHtml(generatedLabel)}</span></div></header>
${body}<footer class="report-footer">Generated by RouteLab · Educational Distance Vector and Link State models · This report documents simulated model results, not live production network traffic.</footer></main></body></html>`;
}

function createTopologySection(project) {
  const activeLinks = project.links.filter((link) => link.status === 'up').length;
  return `<section class="report-section"><div class="section-kicker">01 / Network snapshot</div><h2>Topology overview</h2>
<p>Topology revision ${number(project.topologyRevision)} · ${number(activeLinks)} active links · ${number(project.links.length - activeLinks)} disabled links.</p>
<div class="topology-frame">${createTopologySvg(project)}</div><div class="legend"><span><i></i> Active link</span><span><i class="down"></i> Disabled link</span><span>Numbers on links represent configured costs.</span></div>
<div class="report-table-wrap"><table><thead><tr><th>Router</th><th>Label</th><th>Position</th></tr></thead><tbody>${project.routers.map((router) => `<tr><th>${escapeHtml(router.id)}</th><td>${escapeHtml(router.label)}</td><td>${number(router.position?.x)}, ${number(router.position?.y)}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function metricLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function createMetricGrid(metrics) {
  const entries = Object.entries(metrics || {}).filter(([, value]) => Number.isFinite(value));
  if (!entries.length) return '<p>No numeric metrics were recorded.</p>';
  return `<div class="metric-grid">${entries.map(([key, value]) => `<div class="metric"><span>${escapeHtml(metricLabel(key))}</span><strong>${number(value)}</strong></div>`).join('')}</div>`;
}

function createRouteTable(title, rows) {
  return `<h3>${escapeHtml(title)}</h3><div class="report-table-wrap"><table><thead><tr><th>Destination</th><th>Next hop</th><th>Cost</th><th>Status</th><th>Selected path</th></tr></thead><tbody>
${rows.map((route) => `<tr><th>${escapeHtml(route.destinationRouterId)}</th><td>${escapeHtml(route.nextHopRouterId || '—')}</td><td>${escapeHtml(cost(route))}</td><td class="${route.status === 'reachable' ? 'status-good' : 'status-unreachable'}">${escapeHtml(route.status)}</td><td class="path">${escapeHtml(route.path?.length ? route.path.join(' → ') : '—')}</td></tr>`).join('')}</tbody></table></div>`;
}

const LEARNING_EVENT_TYPES = new Set([
  'distance-vector.route.updated', 'distance-vector.round.completed', 'distance-vector.converged',
  'link-state.lsa.duplicate-suppressed', 'link-state.flooding.completed',
  'link-state.dijkstra.vertex.settled', 'link-state.dijkstra.relaxation.updated',
]);

function createLearningSection(runs) {
  const items = runs.flatMap(({ label, run }) => run.events
    .filter((event) => LEARNING_EVENT_TYPES.has(event.type))
    .map((event) => ({ label, event, guide: getEventExplanation(event) }))).slice(0, 18);
  if (!items.length) return '';
  return `<section class="report-section"><div class="section-kicker">05 / Algorithm reasoning</div><h2>Learning highlights</h2>
<p>Selected decision points from the simulation event stream, with the explanation and takeaway for each step.</p>
${items.map(({ label, event, guide }) => `<article class="learning-item"><h3>${escapeHtml(label)} · Event ${number(event.sequence + 1)} — ${escapeHtml(getEventLabel(event.type))}</h3>
<p class="event-message">${escapeHtml(event.message)}</p><p>${escapeHtml(guide.explanation)}</p><p class="takeaway"><b>Key idea:</b> ${escapeHtml(guide.takeaway)}</p></article>`).join('')}</section>`;
}

export function createSimulationReportHtml({ project, run, generatedAt = new Date() } = {}) {
  if (!project || !Array.isArray(project.routers) || !run || !Array.isArray(run.events)) {
    throw new TypeError('A valid topology and completed simulation run are required to create a learning report.');
  }
  if (run.projectId !== project.projectId || run.topologyRevision !== project.topologyRevision) {
    throw new TypeError('The simulation run does not match the supplied topology snapshot.');
  }
  const label = run.algorithm === 'distance-vector' ? 'Distance Vector' : 'Link State';
  const tables = Object.entries(run.finalTables || {});
  const body = `<section class="report-section"><div class="section-kicker">02 / Simulation summary</div><h2>${escapeHtml(label)} results</h2>
<div class="fact-grid"><div class="fact"><span>Run status</span><strong>${escapeHtml(run.status || 'completed')}</strong></div><div class="fact"><span>Events</span><strong>${number(run.events.length)}</strong></div><div class="fact"><span>Started</span><strong>${escapeHtml(run.startedAt || '—')}</strong></div><div class="fact"><span>Completed</span><strong>${escapeHtml(run.completedAt || '—')}</strong></div></div></section>
<section class="report-section"><div class="section-kicker">03 / Algorithm metrics</div><h2>Run metrics</h2>${createMetricGrid(run.metrics)}</section>
<section class="report-section"><div class="section-kicker">04 / Forwarding results</div><h2>Final routing tables</h2><p>Every router’s final forwarding entries, including unreachable destinations, next hops and selected paths.</p>
${tables.map(([routerId, rows]) => createRouteTable(`Router ${routerId}`, rows)).join('')}</section>
${createLearningSection([{ label, run }])}`;
  return createReportShell({
    title: 'Simulation learning report',
    subtitle: `A complete ${label} run report with topology, routing results, measured algorithm work and selected learning explanations.`,
    project, generatedAt, body: createTopologySection(project) + body,
  });
}

function createComparisonRouteTable(rows) {
  return `<div class="report-table-wrap"><table><thead><tr><th>Destination</th><th>DV path</th><th>DV cost</th><th>LS path</th><th>LS cost</th><th>Agreement</th></tr></thead><tbody>
${rows.map((row) => `<tr><th>${escapeHtml(row.destinationRouterId)}</th><td class="path">${escapeHtml(row.distanceVector.path?.join(' → ') || '—')}</td><td>${escapeHtml(cost(row.distanceVector))}</td><td class="path">${escapeHtml(row.linkState.path?.join(' → ') || '—')}</td><td>${escapeHtml(cost(row.linkState))}</td><td>${escapeHtml(row.agreement.status)}</td></tr>`).join('')}</tbody></table></div>`;
}

function createWorkProfiles(profiles) {
  return `<div class="metric-grid">${Object.entries(profiles).map(([algorithm, profile]) => `<div class="metric"><strong>${escapeHtml(profile.title)}</strong><span>${escapeHtml(algorithm === 'distance-vector' ? 'Distance Vector' : 'Link State')} · ${number(profile.eventCount)} events</span>
${profile.items.map((item) => `<p><b>${escapeHtml(item.label)}:</b> ${number(item.value)}<br><small>${escapeHtml(item.definition)}</small></p>`).join('')}</div>`).join('')}</div>`;
}

function createFailureSection(failureResult) {
  if (!failureResult) return '';
  return `<section class="report-section"><div class="section-kicker">06 / Topology change experiment</div><h2>Baseline versus modified link</h2>
<p>${escapeHtml(failureResult.linkChange.before.sourceRouterId)} ↔ ${escapeHtml(failureResult.linkChange.before.targetRouterId)} · ${escapeHtml(failureResult.operation)}</p>
<div class="report-table-wrap"><table><thead><tr><th>Algorithm</th><th>Before path / cost</th><th>After path / cost</th><th>Outcome</th></tr></thead><tbody>
${Object.entries(failureResult.algorithms).map(([algorithm, result]) => `<tr><th>${escapeHtml(algorithm === 'distance-vector' ? 'Distance Vector' : 'Link State')}</th>
<td>${escapeHtml(result.beforeRoute.path?.join(' → ') || 'Unreachable')} · ${escapeHtml(cost({ status: result.beforeRoute.status, cost: result.beforeRoute.totalCost }))}</td>
<td>${escapeHtml(result.afterRoute.path?.join(' → ') || 'Unreachable')} · ${escapeHtml(cost({ status: result.afterRoute.status, cost: result.afterRoute.totalCost }))}</td>
<td>${escapeHtml(result.routeChange.outcome)} — ${escapeHtml(result.routeChange.explanation)}</td></tr>`).join('')}</tbody></table></div></section>`;
}

export function createComparisonReportHtml({ project, comparison, sourceRouterId, destinationRouterId, failureResult = null, generatedAt = new Date() } = {}) {
  if (!project || !comparison || comparison.projectId !== project.projectId || comparison.topologyRevision !== project.topologyRevision) {
    throw new TypeError('A current algorithm comparison and its matching topology are required to create a report.');
  }
  const rows = Object.entries(comparison.pairs?.[sourceRouterId] || {}).map(([destinationRouterId, pair]) => ({
    destinationRouterId,
    distanceVector: { ...pair.distanceVector, cost: pair.distanceVector.totalCost },
    linkState: { ...pair.linkState, cost: pair.linkState.totalCost },
    agreement: pair.agreement,
  }));
  const selected = comparison.pairs?.[sourceRouterId]?.[destinationRouterId];
  const summary = comparison.summary;
  const body = `<section class="report-section"><div class="section-kicker">02 / Comparison summary</div><h2>Both algorithms · same topology</h2>
<div class="fact-grid"><div class="fact"><span>Ordered pairs</span><strong>${number(summary.pairsCompared)}</strong></div><div class="fact"><span>Reachability agreement</span><strong>${number(summary.reachabilityAgreements)} / ${number(summary.pairsCompared)}</strong></div><div class="fact"><span>Cost agreement</span><strong>${number(summary.reachableCostAgreements)} / ${number(summary.reachableCostComparisons)}</strong></div><div class="fact"><span>Equal-cost alternatives</span><strong>${number(summary.equalCostAlternatives)}</strong></div></div>
<p>Cost differences: ${number(summary.costDifferences)} · Reachability differences: ${number(summary.reachabilityDifferences)} · Mutually unreachable pairs: ${number(summary.mutuallyUnreachable)}. These are output-agreement measures, not a speed ranking.</p></section>
<section class="report-section"><div class="section-kicker">03 / Selected source routes</div><h2>Routing-table comparison · source ${escapeHtml(sourceRouterId || '—')}</h2>
<p>${rows.length} destinations are compared from the selected source. ${selected ? `Selected pair: ${escapeHtml(sourceRouterId)} → ${escapeHtml(destinationRouterId)} · ${escapeHtml(selected.agreement.status)}.` : 'Select a source/destination pair in the Comparison Lab to inspect a specific route.'}</p>${createComparisonRouteTable(rows)}</section>
<section class="report-section"><div class="section-kicker">04 / Algorithm-specific work</div><h2>Work profiles</h2><p>Each model reports its own operation counters. These different counters are not combined into an elapsed-time or speed score.</p>${createWorkProfiles(comparison.workProfiles)}</section>
${createLearningSection([{ label: 'Distance Vector', run: comparison.runs['distance-vector'] }, { label: 'Link State', run: comparison.runs['link-state'] }])}
${createFailureSection(failureResult)}`;
  return createReportShell({
    title: 'Routing algorithms comparison report',
    subtitle: 'A side-by-side report of Distance Vector and Link State on the same network topology.',
    project, generatedAt, body: createTopologySection(project) + body,
  });
}

export function openPrintableReport(html) {
  if (typeof window === 'undefined' || typeof window.open !== 'function') return { ok: false, message: 'Reports can only be opened from a browser window.' };
  try {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return { ok: false, message: 'The report tab was blocked. Allow pop-ups for RouteLab and try again.' };
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
    return { ok: true, message: 'Report opened. Choose Print / Save as PDF in the report tab.' };
  } catch {
    return { ok: false, message: 'The printable report could not be opened in this browser.' };
  }
}
