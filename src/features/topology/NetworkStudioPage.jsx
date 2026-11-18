import { useCallback, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowDownToLine, ArrowUpFromLine, Check,
  CircleHelp, FilePlus2, FolderOpen, Hand, Link2, MousePointer2, Plus,
  RefreshCw, Router as RouterIcon, Save, Trash2, Waypoints,
  ZoomIn, ZoomOut, X,
} from 'lucide-react';
import {
  addEdge, Background, BackgroundVariant, Controls, MiniMap, ReactFlow,
  useEdgesState, useNodesState,
} from '@xyflow/react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import IconButton from '../../components/ui/IconButton.jsx';
import Tooltip from '../../components/ui/Tooltip.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { useTheme } from '../../app/ThemeProvider.jsx';
import RouterNode from './components/RouterNode.jsx';
import {
  createId, createProject, edgeStyle, flowToProject, nextLinkId, nextRouterId,
  projectToFlow, validateConnection, validateProject,
} from './model/projectModel.js';
import {
  createTopologyPreset, topologyPresetOptions,
} from '../../shared/data/presets/topologyPresets.js';
import {
  deleteSavedProject, getLastProject, getSavedProjects, saveProject,
} from './model/projectStore.js';

const nodeTypes = { router: RouterNode };
const edgeLabelStyle = { fill: 'var(--text-secondary)', fontWeight: 650, fontSize: 12 };
const edgeLabelBgStyle = { fill: 'var(--surface)', fillOpacity: 0.96 };

function getInitialProject() {
  const lastProject = getLastProject();
  return lastProject && validateProject(lastProject).valid ? lastProject : createTopologyPreset('starter');
}

function formatSavedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function downloadProject(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'routelab-project'}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function NetworkStudioContent() {
  const { notify } = useToast();
  const { theme } = useTheme();
  const [baseProject, setBaseProject] = useState(getInitialProject);
  const [savedToLocalStorage, setSavedToLocalStorage] = useState(() => {
    const lastProject = getLastProject();
    return Boolean(lastProject && validateProject(lastProject).valid);
  });
  const initialFlow = useMemo(() => projectToFlow(baseProject), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);
  const [projectName, setProjectName] = useState(baseProject.name);
  const [topologyRevision, setTopologyRevision] = useState(baseProject.topologyRevision);
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toolMode, setToolMode] = useState('select');
  const [presetId, setPresetId] = useState('');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('My network');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [pendingProject, setPendingProject] = useState(null);
  const [savedProjects, setSavedProjects] = useState(() => getSavedProjects());
  const [routerLabelDraft, setRouterLabelDraft] = useState('');
  const [linkCostDraft, setLinkCostDraft] = useState('');
  const [importing, setImporting] = useState(false);
  const reactFlowRef = useRef(null);
  const canvasHostRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentProject = useMemo(() => flowToProject({
    project: { ...baseProject, topologyRevision },
    nodes,
    edges,
    name: projectName,
  }), [baseProject, topologyRevision, nodes, edges, projectName]);

  const selectedNode = selected?.type === 'router' ? nodes.find((node) => node.id === selected.id) : null;
  const selectedEdge = selected?.type === 'link' ? edges.find((edge) => edge.id === selected.id) : null;
  const activeLinks = edges.filter((edge) => edge.data?.status !== 'down').length;
  const downLinks = edges.length - activeLinks;

  const markDirty = useCallback((topologyChanged = false) => {
    setDirty(true);
    if (topologyChanged) setTopologyRevision((revision) => revision + 1);
  }, []);

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    const removed = changes.filter((change) => change.type === 'remove').map((change) => change.id);
    if (removed.length) {
      setEdges((current) => current.filter((edge) => !removed.includes(edge.source) && !removed.includes(edge.target)));
      if (selected?.type === 'router' && removed.includes(selected.id)) setSelected(null);
    }
    if (changes.some((change) => change.type === 'position' || change.type === 'remove')) {
      markDirty(removed.length > 0);
    }
  }, [onNodesChange, markDirty, setEdges, selected]);

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    const removed = changes.filter((change) => change.type === 'remove').map((change) => change.id);
    if (removed.length && selected?.type === 'link' && removed.includes(selected.id)) setSelected(null);
    if (removed.length) markDirty(true);
  }, [onEdgesChange, markDirty, selected]);

  const applyProject = useCallback((project, successMessage = 'Project loaded.', persisted = false) => {
    const validation = validateProject(project);
    if (!validation.valid) {
      notify(validation.errors[0] || 'This project could not be loaded.', 'error');
      return false;
    }
    const flow = projectToFlow(project);
    setBaseProject(project);
    setProjectName(project.name);
    setTopologyRevision(project.topologyRevision);
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setSelected(null);
    setToolMode('select');
    setDirty(false);
    setSavedToLocalStorage(persisted);
    notify(successMessage, 'success');
    return true;
  }, [notify, setNodes, setEdges]);

  const requestProjectSwitch = useCallback((project, successMessage, persisted = false, closeLibrary = false) => {
    if (dirty) {
      setPendingProject({ project, successMessage, persisted, closeLibrary });
      setReplaceDialogOpen(true);
      return;
    }
    if (applyProject(project, successMessage, persisted) && closeLibrary) setLibraryOpen(false);
  }, [dirty, applyProject]);

  const confirmProjectSwitch = useCallback(() => {
    if (!pendingProject) return;
    const applied = applyProject(pendingProject.project, pendingProject.successMessage, pendingProject.persisted);
    if (applied && pendingProject.closeLibrary) setLibraryOpen(false);
    setPendingProject(null);
    setReplaceDialogOpen(false);
  }, [pendingProject, applyProject]);

  const addRouter = useCallback(() => {
    if (nodes.length >= 20) {
      notify('A topology can contain at most 20 routers in this release.', 'error');
      return;
    }
    const id = nextRouterId(nodes);
    const viewport = reactFlowRef.current;
    const bounds = canvasHostRef.current?.getBoundingClientRect();
    const centerX = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2;
    const centerY = bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2;
    const screenX = centerX + ((nodes.length % 3) - 1) * 150;
    const screenY = centerY + (Math.floor(nodes.length / 3) - 1) * 110;
    const position = viewport?.screenToFlowPosition
      ? viewport.screenToFlowPosition({ x: screenX, y: screenY })
      : { x: 140 + (nodes.length % 4) * 130, y: 130 + Math.floor(nodes.length / 4) * 125 };
    const node = { id, type: 'router', position, data: { label: id, routerId: id } };
    setNodes((current) => [...current, node]);
    setSelected({ type: 'router', id });
    setRouterLabelDraft(id);
    setToolMode('select');
    markDirty(true);
    notify(`${id} added to the topology.`, 'success');
  }, [nodes, setNodes, markDirty, notify]);

  const handleConnect = useCallback((connection) => {
    const validation = validateConnection(connection, edges);
    if (!validation.valid) {
      notify(validation.message, 'error');
      return;
    }
    const id = nextLinkId(edges);
    const edge = {
      id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'smoothstep',
      label: '5',
      data: { cost: 5, status: 'up' },
      style: edgeStyle('up'),
      labelStyle: edgeLabelStyle,
      labelBgStyle: edgeLabelBgStyle,
      labelBgPadding: [7, 4],
      labelBgBorderRadius: 5,
    };
    setEdges((current) => addEdge(edge, current));
    setSelected({ type: 'link', id });
    setToolMode('select');
    markDirty(true);
    notify(`Link ${id} created with default cost 5.`, 'success');
  }, [edges, setEdges, markDirty, notify]);

  const updateRouterLabel = useCallback((value) => {
    setRouterLabelDraft(value);
    if (!selectedNode) return;
    setNodes((current) => current.map((node) => node.id === selectedNode.id
      ? { ...node, data: { ...node.data, label: value } }
      : node));
    markDirty(false);
  }, [selectedNode, setNodes, markDirty]);

  const updateLinkCost = useCallback((value) => {
    setLinkCostDraft(value);
  }, []);

  const commitLinkCost = useCallback(() => {
    if (!selectedEdge) return;
    const cost = Number(linkCostDraft);
    if (!Number.isInteger(cost) || cost < 1 || cost > 999) {
      setLinkCostDraft(String(selectedEdge.data?.cost ?? 5));
      notify('Link cost must be a whole number from 1 to 999.', 'error');
      return;
    }
    if (cost === selectedEdge.data?.cost) return;
    setEdges((current) => current.map((edge) => edge.id === selectedEdge.id
      ? { ...edge, label: String(cost), data: { ...edge.data, cost }, style: edgeStyle(edge.data?.status) }
      : edge));
    markDirty(true);
    notify(`Link cost updated to ${cost}.`, 'success');
  }, [selectedEdge, linkCostDraft, setEdges, markDirty, notify]);

  const toggleLinkStatus = useCallback(() => {
    if (!selectedEdge) return;
    const status = selectedEdge.data?.status === 'down' ? 'up' : 'down';
    setEdges((current) => current.map((edge) => edge.id === selectedEdge.id
      ? { ...edge, data: { ...edge.data, status }, style: edgeStyle(status) }
      : edge));
    markDirty(true);
    notify(`${selectedEdge.id} is now ${status === 'up' ? 'enabled' : 'disabled'}.`, 'success');
  }, [selectedEdge, setEdges, markDirty, notify]);

  const deleteSelection = useCallback(() => {
    if (!selected) return;
    if (selected.type === 'router') {
      if (nodes.length <= 1) {
        notify('A project must contain at least one router.', 'error');
        return;
      }
      const connectedIds = edges.filter((edge) => edge.source === selected.id || edge.target === selected.id).map((edge) => edge.id);
      setNodes((current) => current.filter((node) => node.id !== selected.id));
      setEdges((current) => current.filter((edge) => !connectedIds.includes(edge.id)));
      notify(`${selected.id} and ${connectedIds.length} connected link(s) removed.`, 'success');
    } else {
      setEdges((current) => current.filter((edge) => edge.id !== selected.id));
      notify(`${selected.id} removed.`, 'success');
    }
    setSelected(null);
    markDirty(true);
  }, [selected, nodes.length, edges, setNodes, setEdges, markDirty, notify]);

  const handleSave = useCallback(() => {
    const validation = validateProject(currentProject);
    if (!validation.valid) {
      notify(validation.errors[0] || 'Fix validation issues before saving.', 'error');
      return;
    }
    const result = saveProject(currentProject);
    if (!result.ok) {
      notify(result.message, 'error');
      return;
    }
    setBaseProject(currentProject);
    setDirty(false);
    setSavedToLocalStorage(true);
    setSavedProjects(getSavedProjects());
    notify('Project saved in this browser.', 'success');
  }, [currentProject, notify]);

  const handleValidate = useCallback(() => {
    const validation = validateProject(currentProject);
    if (validation.valid) {
      notify(validation.warnings.length ? `Topology is valid. ${validation.warnings[0]}` : 'Topology validation passed.', validation.warnings.length ? 'info' : 'success');
    } else {
      notify(validation.errors[0], 'error');
    }
  }, [currentProject, notify]);

  const handleNewProject = useCallback((event) => {
    event.preventDefault();
    const project = createProject(newProjectName);
    requestProjectSwitch(project, 'New project created. Add routers and connect them to begin.');
    setNewDialogOpen(false);
  }, [newProjectName, requestProjectSwitch]);

  const loadPreset = useCallback(() => {
    const project = createTopologyPreset(presetId);
    requestProjectSwitch(project, `${project.name} loaded.`);
  }, [presetId, requestProjectSwitch]);

  const handleExport = useCallback(() => {
    const validation = validateProject(currentProject);
    if (!validation.valid) {
      notify(validation.errors[0], 'error');
      return;
    }
    downloadProject(currentProject);
    notify('Project JSON exported.', 'success');
  }, [currentProject, notify]);

  const handleImportFile = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) {
      notify('Import file is too large. Maximum supported size is 1 MB.', 'error');
      return;
    }
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text());
      const validation = validateProject(parsed);
      if (!validation.valid) {
        notify(`Import rejected: ${validation.errors[0]}`, 'error');
      } else {
        // Imported project receives a fresh local identity to avoid overwriting an existing saved project.
        const imported = { ...parsed, projectId: createId('project'), updatedAt: new Date().toISOString() };
        requestProjectSwitch(imported, `Imported “${imported.name}”.`);
      }
    } catch {
      notify('The selected file is not valid JSON.', 'error');
    } finally {
      setImporting(false);
    }
  }, [requestProjectSwitch, notify]);

  const openLibrary = useCallback(() => {
    setSavedProjects(getSavedProjects());
    setLibraryOpen(true);
  }, []);

  const loadFromLibrary = useCallback((project) => {
    requestProjectSwitch(project, `“${project.name}” opened.`, true, true);
  }, [requestProjectSwitch]);

  const removeFromLibrary = useCallback((projectId) => {
    const result = deleteSavedProject(projectId);
    if (!result.ok) {
      notify(result.message, 'error');
      return;
    }
    setSavedProjects(getSavedProjects());
    notify('Saved project removed from this browser.', 'success');
  }, [notify]);

  const onNodeClick = useCallback((_, node) => {
    setSelected({ type: 'router', id: node.id });
    setRouterLabelDraft(node.data?.label || node.id);
  }, []);

  const onEdgeClick = useCallback((_, edge) => {
    setSelected({ type: 'link', id: edge.id });
    setLinkCostDraft(String(edge.data?.cost ?? 5));
  }, []);

  const onPaneClick = useCallback(() => setSelected(null), []);
  const onInit = useCallback((instance) => { reactFlowRef.current = instance; }, []);
  const fitCanvas = useCallback(() => reactFlowRef.current?.fitView({ padding: 0.2, duration: 240 }), []);

  const updateProjectName = (value) => {
    setProjectName(value.slice(0, 80));
    markDirty(false);
  };

  const canSave = validateProject(currentProject).valid;

  return (
    <div className="page studio-page">
      <PageHeader
        eyebrow="WORKSPACE / NETWORK DESIGN"
        title="Network Studio"
        description="Build a weighted network topology, inspect its structure and prepare it for routing experiments."
        actions={(
          <>
            <Button variant="secondary" size="sm" icon={FolderOpen} onClick={openLibrary}>Open</Button>
            <Button size="sm" icon={Save} onClick={handleSave} disabled={!canSave}>Save project</Button>
          </>
        )}
      />

      <div className="studio-toolbar-row phase2-project-toolbar">
        <div className="studio-project-name phase2-project-title">
          <span className="project-indicator" />
          <div className="phase2-project-name-field">
            <input aria-label="Project name" value={projectName} maxLength={80} onChange={(event) => updateProjectName(event.target.value)} onBlur={() => { if (!projectName.trim()) setProjectName('Untitled network'); }} />
            <span>{dirty ? 'Unsaved changes' : savedToLocalStorage ? 'Saved in this browser' : 'New local project'}</span>
          </div>
        </div>
        <div className="studio-toolbar-actions phase2-toolbar-actions">
          <Badge tone={dirty ? 'warning' : 'success'} dot>{dirty ? 'Not saved' : 'Local workspace'}</Badge>
          <Button variant="secondary" size="sm" icon={FilePlus2} onClick={() => { setNewProjectName('My network'); setNewDialogOpen(true); }}>New</Button>
          <div className="toolbar-menu-wrap">
            <Select
              aria-label="Choose topology preset"
              className="preset-select"
              value={presetId}
              onChange={(event) => setPresetId(event.target.value)}
              options={[{ value: '', label: 'Choose a preset…' }, ...topologyPresetOptions.map((preset) => ({ value: preset.id, label: preset.name }))]}
            />
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadPreset} disabled={!presetId}>Load preset</Button>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json,.json" className="visually-hidden" onChange={handleImportFile} />
          <Tooltip label="Import a RouteLab project JSON">
            <IconButton icon={ArrowUpFromLine} label="Import project JSON" onClick={() => fileInputRef.current?.click()} disabled={importing} />
          </Tooltip>
          <Tooltip label="Export current project JSON">
            <IconButton icon={ArrowDownToLine} label="Export project JSON" onClick={handleExport} disabled={!canSave} />
          </Tooltip>
        </div>
      </div>

      <div className="studio-layout phase2-studio-layout">
        <Card className="studio-tool-panel phase2-tool-panel" padding="sm">
          <div className="panel-mini-label">TOOLS</div>
          <div className="tool-stack">
            <Tooltip label="Select and move routers">
              <button type="button" className={`studio-tool-button ${toolMode === 'select' ? 'tool-active' : ''}`} aria-label="Select tool" aria-pressed={toolMode === 'select'} onClick={() => setToolMode('select')}><MousePointer2 size={17} /></button>
            </Tooltip>
            <Tooltip label="Add a router">
              <button type="button" className="studio-tool-button" aria-label="Add router" onClick={addRouter}><Plus size={17} /></button>
            </Tooltip>
            <Tooltip label="Connect routers by dragging from a router handle">
              <button type="button" className={`studio-tool-button ${toolMode === 'connect' ? 'tool-active' : ''}`} aria-label="Connect routers tool" aria-pressed={toolMode === 'connect'} onClick={() => setToolMode(toolMode === 'connect' ? 'select' : 'connect')}><Link2 size={17} /></button>
            </Tooltip>
            <Tooltip label="Pan the canvas">
              <button type="button" className={`studio-tool-button ${toolMode === 'pan' ? 'tool-active' : ''}`} aria-label="Pan canvas tool" aria-pressed={toolMode === 'pan'} onClick={() => setToolMode(toolMode === 'pan' ? 'select' : 'pan')}><Hand size={17} /></button>
            </Tooltip>
          </div>
          <div className="tool-panel-bottom">
            <span className="tool-panel-separator" />
            <Tooltip label="Validate topology">
              <button type="button" className="studio-tool-button" aria-label="Validate topology" onClick={handleValidate}><Check size={16} /></button>
            </Tooltip>
            <Tooltip label="Fit topology to canvas">
              <button type="button" className="studio-tool-button" aria-label="Fit topology to canvas" onClick={fitCanvas}><Waypoints size={16} /></button>
            </Tooltip>
          </div>
        </Card>

        <Card className="studio-canvas-card phase2-canvas-card" padding="none">
          <div className="canvas-topbar">
            <div className="canvas-topbar-left"><span className="canvas-status-dot canvas-status-live" /><strong>Topology canvas</strong><span className="canvas-meta">{nodes.length} routers · {edges.length} links</span></div>
            <div className="canvas-topbar-right">
              <Badge tone="subtle">{toolMode === 'connect' ? 'Connect mode' : toolMode === 'pan' ? 'Pan mode' : 'Select mode'}</Badge>
              <IconButton icon={ZoomOut} label="Zoom out" size="sm" onClick={() => reactFlowRef.current?.zoomOut({ duration: 160 })} />
              <IconButton icon={ZoomIn} label="Zoom in" size="sm" onClick={() => reactFlowRef.current?.zoomIn({ duration: 160 })} />
              <IconButton icon={RefreshCw} label="Fit view" size="sm" onClick={fitCanvas} />
            </div>
          </div>
          <div className="phase2-flow-wrap" ref={canvasHostRef}>
            <ReactFlow
              colorMode={theme}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onInit={onInit}
              fitView
              fitViewOptions={{ padding: 0.22 }}
              nodesConnectable={toolMode === 'connect'}
              nodesDraggable={toolMode === 'select'}
              elementsSelectable
              panOnDrag={toolMode === 'pan' ? true : [1, 2]}
              selectionOnDrag={toolMode === 'select'}
              deleteKeyCode={['Backspace', 'Delete']}
              minZoom={0.25}
              maxZoom={2}
              defaultEdgeOptions={{ type: 'smoothstep', style: edgeStyle('up') }}
              proOptions={{ hideAttribution: false }}
              attributionPosition="bottom-left"
              onBeforeDelete={async (elements) => {
                if (nodes.length - elements.nodes.length < 1) {
                  notify('A project must contain at least one router.', 'error');
                  return false;
                }
                return true;
              }}
            >
              <Background variant={BackgroundVariant.Dots} gap={19} size={1} color="var(--grid-dot)" />
              <MiniMap pannable zoomable nodeColor="var(--accent)" maskColor="var(--overlay)" className="phase2-minimap" />
              <Controls showInteractive={false} position="bottom-right" />
            </ReactFlow>
            {nodes.length === 0 && (
              <div className="phase2-empty-canvas">
                <span><Waypoints size={23} /></span>
                <strong>Start with your first router.</strong>
                <p>Add a router, then connect it to another router to create a weighted link.</p>
                <Button size="sm" icon={Plus} onClick={addRouter}>Add first router</Button>
              </div>
            )}
            {toolMode === 'connect' && <div className="phase2-canvas-hint"><Link2 size={13} /> Drag from a router's blue handle to another router's handle</div>}
          </div>
          <div className="canvas-footer phase2-canvas-footer">
            <span><span className="legend-node" /> Router</span>
            <span><span className="legend-link" /> Active link</span>
            <span><span className="legend-link legend-link-down" /> Disabled link</span>
            <span className="canvas-footer-note">Drag routers to reposition · Select an item to edit</span>
          </div>
        </Card>

        <Card className="studio-inspector phase2-inspector" padding="none">
          <div className="inspector-heading"><div><span className="panel-mini-label">INSPECTOR</span><h2>Properties</h2></div><Badge tone="subtle">{selectedNode ? 'Router' : selectedEdge ? 'Link' : 'Network'}</Badge></div>
          {selectedNode ? (
            <div className="phase2-inspector-content">
              <div className="phase2-selected-entity"><span className="phase2-entity-icon"><RouterIcon size={17} /></span><div><strong>{selectedNode.id}</strong><span>Network router</span></div></div>
              <Input label="Display name" id="router-label" value={routerLabelDraft} maxLength={40} onChange={(event) => updateRouterLabel(event.target.value)} onBlur={() => { if (!routerLabelDraft.trim()) updateRouterLabel(selectedNode.id); }} hint="Up to 40 characters. Router ID remains stable." />
              <div className="phase2-readonly-field"><span>Router ID</span><strong>{selectedNode.id}</strong></div>
              <Button variant="danger" size="sm" icon={Trash2} onClick={deleteSelection}>Delete router</Button>
              <p className="phase2-inspector-note">Deleting this router also removes its connected links.</p>
            </div>
          ) : selectedEdge ? (
            <div className="phase2-inspector-content">
              <div className="phase2-selected-entity"><span className="phase2-entity-icon phase2-link-icon"><Link2 size={17} /></span><div><strong>{selectedEdge.id}</strong><span>{selectedEdge.source} ↔ {selectedEdge.target}</span></div></div>
              <Input label="Link cost" id="link-cost" type="number" inputMode="numeric" min="1" max="999" step="1" value={linkCostDraft} onChange={(event) => updateLinkCost(event.target.value)} onBlur={commitLinkCost} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} hint="Positive integer from 1 to 999." />
              <div className="phase2-readonly-field"><span>Connection</span><strong>{selectedEdge.source} ↔ {selectedEdge.target}</strong></div>
              <div className="phase2-status-row"><span>Link status</span><Badge tone={selectedEdge.data?.status === 'down' ? 'danger' : 'success'} dot>{selectedEdge.data?.status === 'down' ? 'Disabled' : 'Active'}</Badge></div>
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={toggleLinkStatus}>{selectedEdge.data?.status === 'down' ? 'Enable link' : 'Disable link'}</Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={deleteSelection}>Delete link</Button>
            </div>
          ) : (
            <div className="phase2-inspector-content">
              <div className="inspector-empty phase2-inspector-empty"><div className="inspector-empty-icon"><CircleHelp size={18} /></div><strong>Nothing selected</strong><p>Select a router or link on the canvas to inspect and edit its properties.</p></div>
              <div className="inspector-section phase2-network-summary"><span className="panel-mini-label">NETWORK SUMMARY</span><div className="summary-placeholder"><div><span>Routers</span><strong>{nodes.length}</strong></div><div><span>Links</span><strong>{edges.length}</strong></div><div><span>Active links</span><strong>{activeLinks}</strong></div><div><span>Disabled links</span><strong>{downLinks}</strong></div><div><span>Revision</span><strong>{topologyRevision}</strong></div></div></div>
              <div className="phase2-validation-summary"><span><AlertCircle size={14} /> Topology checks</span><strong>{canSave ? 'Ready to save' : 'Needs attention'}</strong></div>
            </div>
          )}
        </Card>
      </div>

      <Card className="studio-event-panel phase2-event-panel" padding="none">
        <div className="event-panel-heading"><div><span className="panel-mini-label">WORKSPACE ACTIVITY</span><h2>Topology activity</h2></div><Badge tone="subtle">Phase 2</Badge></div>
        <div className="phase2-activity-grid">
          <div><span className="phase2-activity-mark"><Plus size={14} /></span><strong>{nodes.length} routers</strong><span>Current canvas objects</span></div>
          <div><span className="phase2-activity-mark"><Link2 size={14} /></span><strong>{edges.length} links</strong><span>{activeLinks} active · {downLinks} disabled</span></div>
          <div><span className="phase2-activity-mark"><Check size={14} /></span><strong>{canSave ? 'Valid structure' : 'Review required'}</strong><span>{canSave ? 'Ready for local save' : 'Resolve invalid values'}</span></div>
        </div>
      </Card>

      <Dialog open={newDialogOpen} onClose={() => setNewDialogOpen(false)} title="Create a new network" description="Start with one router. You can add more routers and weighted links on the canvas.">
        <form className="dialog-form" onSubmit={handleNewProject}>
          <Input label="Project name" id="new-project-name" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} maxLength={80} required autoFocus />
          <div className="dialog-actions"><Button variant="secondary" onClick={() => setNewDialogOpen(false)}>Cancel</Button><Button type="submit" icon={Plus}>Create project</Button></div>
        </form>
      </Dialog>

      <Dialog open={replaceDialogOpen} onClose={() => { setReplaceDialogOpen(false); setPendingProject(null); }} title="Discard unsaved changes?" description="The current project has edits that have not been saved. Continue only if you are happy to replace those changes.">
        <div className="dialog-actions phase2-replace-actions">
          <Button variant="secondary" onClick={() => { setReplaceDialogOpen(false); setPendingProject(null); }}>Keep editing</Button>
          <Button variant="danger" icon={RefreshCw} onClick={confirmProjectSwitch}>Discard and continue</Button>
        </div>
      </Dialog>

      <Dialog open={libraryOpen} onClose={() => setLibraryOpen(false)} title="Saved projects" description="Projects are stored locally in this browser. Export JSON to keep an external backup.">
        <div className="phase2-library-list">
          {savedProjects.length === 0 ? <div className="phase2-library-empty"><FolderOpen size={22} /><strong>No saved projects yet</strong><span>Use Save project to add your current topology to this list.</span></div> : savedProjects.map((project) => (
            <div className="phase2-library-item" key={project.projectId}>
              <button type="button" className="phase2-library-open" onClick={() => loadFromLibrary(project)}>
                <span className="phase2-library-icon"><Waypoints size={16} /></span>
                <span className="phase2-library-copy"><strong>{project.name}</strong><small>{project.routers.length} routers · {project.links.length} links · {formatSavedDate(project.updatedAt)}</small></span>
              </button>
              <Tooltip label="Remove saved project"><IconButton icon={X} label={`Delete ${project.name}`} size="sm" onClick={() => removeFromLibrary(project.projectId)} /></Tooltip>
            </div>
          ))}
        </div>
        <div className="dialog-actions phase2-library-footer"><Button variant="secondary" onClick={() => setLibraryOpen(false)}>Close</Button></div>
      </Dialog>
    </div>
  );
}

export default function NetworkStudioPage() {
  return <NetworkStudioContent />;
}
