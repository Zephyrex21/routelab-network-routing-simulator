import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Activity, ArrowLeftRight, CircleHelp, LayoutDashboard,
  Network, Route, Unplug, Waypoints, X,
} from 'lucide-react';
import Brand from './Brand.jsx';
import Badge from '../ui/Badge.jsx';
import Separator from '../ui/Separator.jsx';
import IconButton from '../ui/IconButton.jsx';
import { getActiveProject } from '../../features/topology/model/projectStore.js';

const workspaceLinks = [
  { to: '/lab/overview', label: 'Lab overview', icon: LayoutDashboard, end: true },
  { to: '/lab/studio', label: 'Network Studio', icon: Network, hint: 'Editor' },
  { to: '/lab/simulation', label: 'Simulation Studio', icon: Activity, hint: 'Live' },
  { to: '/lab/packets', label: 'Packet Explorer', icon: Route, hint: 'Live' },
  { to: '/lab/failures', label: 'Network Failure Lab', icon: Unplug, hint: 'Live' },
  { to: '/lab/compare', label: 'Compare algorithms', icon: ArrowLeftRight, hint: 'Live' },
];

function NavItem({ item, onNavigate, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
    >
      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
      <span className="sidebar-link-label">{item.label}</span>
      {item.hint && <span className="nav-hint">{item.hint}</span>}
    </NavLink>
  );
}

export default function Sidebar({ collapsed = false, mobileOpen, onNavigate, onClose }) {
  const [activeProject, setActiveProject] = useState(getActiveProject);
  useEffect(() => {
    const refresh = () => setActiveProject(getActiveProject());
    window.addEventListener('routelab:project-saved', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('routelab:project-saved', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const sidebarClass = ['sidebar', collapsed ? 'sidebar-collapsed' : '', mobileOpen ? 'sidebar-open' : ''].filter(Boolean).join(' ');

  return (
    <>
      <button className={`mobile-sidebar-scrim ${mobileOpen ? 'is-visible' : ''}`} type="button" aria-label="Close navigation" aria-hidden="true" onClick={onClose} tabIndex={-1} />
      <aside
        id="routelab-sidebar"
        className={sidebarClass}
        aria-label={collapsed ? 'Collapsed application navigation' : mobileOpen ? 'Navigation menu' : 'Application sidebar'}
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? 'true' : undefined}
      >
        <div className="sidebar-brand-row">
          <Link to="/lab/overview" className="sidebar-brand" aria-label="RouteLab workspace overview" onClick={onNavigate}>
            <Brand compact={collapsed} />
          </Link>
          <div className="sidebar-brand-actions">
            {!collapsed && <Badge tone="subtle">LAB</Badge>}
            <IconButton icon={X} label="Close navigation" className="sidebar-close-button" onClick={onClose} />
          </div>
        </div>

        <div className="sidebar-project" title={collapsed ? 'No project selected' : undefined}>
          <div className="project-avatar"><Waypoints size={18} strokeWidth={1.7} /></div>
          <div className="project-meta">
            <span className="project-kicker">CURRENT WORKSPACE</span>
            <strong>{activeProject?.name || 'No saved project selected'}</strong>
          </div>
          <span className="project-menu-dot" aria-hidden="true">•••</span>
        </div>

        <nav className="sidebar-nav" aria-label="Lab navigation">
          <div className="nav-section-label">WORKSPACE</div>
          {workspaceLinks.map((item) => <NavItem key={item.to} item={item} onNavigate={onNavigate} collapsed={collapsed} />)}
        </nav>

        <div className="sidebar-bottom">
          <Separator />
          <div className="sidebar-learning" title={collapsed ? 'Learning mode · Built for understanding' : undefined}>
            <div className="learning-icon"><CircleHelp size={18} /></div>
            <div><strong>Learning mode</strong><span>Built for understanding</span></div>
          </div>
          <div className="sidebar-build" title={collapsed ? 'Design system refinement · Version 0.9.6' : undefined}>
            <span><span className="build-dot" /> <span className="sidebar-build-label">Workspace refinement</span></span>
            <span>v0.9.6 · Phase 9.2</span>
          </div>
        </div>
      </aside>
    </>
  );
}
