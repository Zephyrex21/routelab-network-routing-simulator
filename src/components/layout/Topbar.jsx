import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HelpCircle, Menu, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import IconButton from '../ui/IconButton.jsx';
import Dialog from '../ui/Dialog.jsx';
import Button from '../ui/Button.jsx';
import { useTheme } from '../../app/ThemeProvider.jsx';

const titles = {
  '/lab/overview': { section: 'Lab', title: 'Overview' },
  '/lab/studio': { section: 'Lab', title: 'Network Studio' },
  '/lab/simulation': { section: 'Lab', title: 'Simulation Studio' },
  '/lab/packets': { section: 'Lab', title: 'Packet Explorer' },
  '/lab/failures': { section: 'Lab', title: 'Network Failure Lab' },
  '/lab/compare': { section: 'Lab', title: 'Compare algorithms' },
};

export default function Topbar({ onMenuClick, isMobileMenuOpen, sidebarCollapsed, onToggleSidebar }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  const current = titles[location.pathname] || titles['/lab/overview'];
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const SidebarIcon = sidebarCollapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <>
      <header className="topbar">
        <div className="topbar-leading">
          <IconButton
            icon={SidebarIcon}
            label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="desktop-sidebar-toggle"
            aria-pressed={!sidebarCollapsed}
            onClick={onToggleSidebar}
          />
          <IconButton
            icon={Menu}
            label="Open navigation"
            className="mobile-menu-button"
            aria-expanded={isMobileMenuOpen}
            aria-controls="routelab-sidebar"
            onClick={onMenuClick}
          />
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">RouteLab</Link>
            <span className="breadcrumb-divider" aria-hidden="true">/</span>
            <span>{current.section}</span>
            <span className="breadcrumb-divider" aria-hidden="true">/</span>
            <strong aria-current="page">{current.title}</strong>
          </nav>
        </div>
        <div className="topbar-actions">
          <Link to="/" className="topbar-home-link">Home</Link>
          <div className="topbar-project-label"><span className="project-indicator" /> Local workspace</div>
          <span className="topbar-divider" />
          <IconButton icon={HelpCircle} label="About RouteLab" onClick={() => setHelpOpen(true)} />
          <IconButton icon={ThemeIcon} label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={toggleTheme} />
          <div className="user-avatar" aria-label="Guest workspace">G</div>
        </div>
      </header>

      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="A little about RouteLab"
        description="An educational laboratory for making network routing easier to understand."
      >
        <div className="about-dialog-content">
          <div className="about-mark"><span className="project-indicator" /> Phase 9.3 · UX and interaction polish</div>
          <p>RouteLab combines an interactive topology editor, deterministic Distance Vector and Link State engines, event-driven simulation playback, validated hop-by-hop packet forwarding, controlled network-change experiments and cross-algorithm comparison. This workspace is the hands-on lab; the public home page introduces the project and its learning workflow.</p>
          <div className="about-dialog-foot"><span>Computer Networks mini project</span><Button size="sm" onClick={() => setHelpOpen(false)}>Got it</Button></div>
        </div>
      </Dialog>
    </>
  );
}
