import { NavLink } from 'react-router-dom';
import {
  Activity, ArrowLeftRight, CircleHelp, LayoutDashboard,
  Network, Route, Unplug, Waypoints, X,
} from 'lucide-react';
import Brand from './Brand.jsx';
import Badge from '../ui/Badge.jsx';
import Separator from '../ui/Separator.jsx';
import IconButton from '../ui/IconButton.jsx';

const primaryLinks = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
];

const workspaceLinks = [
  { to: '/studio', label: 'Network Studio', icon: Network, hint: 'Editor' },
  { to: '/simulation', label: 'Simulation', icon: Activity, hint: 'Live' },
  { to: '/packets', label: 'Packet Explorer', icon: Route, hint: 'Live' },
  { to: '/failures', label: 'Network Failure Lab', icon: Unplug, hint: 'Live' },
  { to: '/compare', label: 'Compare algorithms', icon: ArrowLeftRight, hint: 'Live' },
];

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} onClick={onNavigate} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      <span>{item.label}</span>
      {item.hint && <span className="nav-hint">{item.hint}</span>}
    </NavLink>
  );
}

export default function Sidebar({ mobileOpen, onNavigate, onClose }) {
  return (
    <>
      <button className={`mobile-sidebar-scrim ${mobileOpen ? 'is-visible' : ''}`} type="button" aria-label="Close navigation" aria-hidden="true" onClick={onClose} tabIndex={-1} />
      <aside id="routelab-sidebar" className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label={mobileOpen ? 'Navigation menu' : 'Application sidebar'} role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen ? 'true' : undefined}>
        <div className="sidebar-brand-row">
          <NavLink to="/" className="sidebar-brand" aria-label="RouteLab overview" onClick={onNavigate}>
            <Brand />
          </NavLink>
          <div className="sidebar-brand-actions">
            <Badge tone="subtle">BETA</Badge>
            <IconButton icon={X} label="Close navigation" className="sidebar-close-button" onClick={onClose} />
          </div>
        </div>

        <div className="sidebar-project">
          <div className="project-avatar"><Waypoints size={17} strokeWidth={1.7} /></div>
          <div className="project-meta">
            <span className="project-kicker">CURRENT WORKSPACE</span>
            <strong>No project selected</strong>
          </div>
          <span className="project-menu-dot" aria-hidden="true">•••</span>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <div className="nav-section-label">GENERAL</div>
          {primaryLinks.map((item) => <NavItem key={item.to} item={item} onNavigate={onNavigate} />)}

          <div className="nav-section-label nav-section-spaced">WORKSPACE</div>
          {workspaceLinks.map((item) => <NavItem key={item.to} item={item} onNavigate={onNavigate} />)}
        </nav>

        <div className="sidebar-bottom">
          <Separator />
          <div className="sidebar-learning">
            <div className="learning-icon"><CircleHelp size={16} /></div>
            <div><strong>Learning mode</strong><span>Built for understanding</span></div>
          </div>
          <div className="sidebar-build">
            <span><span className="build-dot" /> Release hardening</span>
            <span>v0.8.0 · Phase 7</span>
          </div>
        </div>
      </aside>
    </>
  );
}
