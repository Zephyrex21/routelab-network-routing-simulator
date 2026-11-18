import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, Menu, Moon, Sun } from 'lucide-react';
import IconButton from '../ui/IconButton.jsx';
import Dialog from '../ui/Dialog.jsx';
import Button from '../ui/Button.jsx';
import { useTheme } from '../../app/ThemeProvider.jsx';

const titles = {
  '/': { section: 'Workspace', title: 'Overview' },
  '/studio': { section: 'Workspace', title: 'Network Studio' },
  '/simulation': { section: 'Workspace', title: 'Simulation' },
  '/packets': { section: 'Workspace', title: 'Packet Explorer' },
  '/failures': { section: 'Workspace', title: 'Network Failure Lab' },
  '/compare': { section: 'Workspace', title: 'Compare algorithms' },
};

export default function Topbar({ onMenuClick, isMobileMenuOpen }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  const current = titles[location.pathname] || titles['/'];
  const ThemeIcon = theme === 'dark' ? Sun : Moon;

  return (
    <>
      <header className="topbar">
        <div className="topbar-leading">
          <IconButton icon={Menu} label="Open navigation" className="mobile-menu-button" aria-expanded={isMobileMenuOpen} aria-controls="routelab-sidebar" onClick={onMenuClick} />
          <nav className="breadcrumbs" aria-label="Breadcrumb"><span>{current.section}</span><span className="breadcrumb-divider" aria-hidden="true">/</span><strong aria-current="page">{current.title}</strong></nav>
        </div>
        <div className="topbar-actions">
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
          <div className="about-mark"><span className="project-indicator" /> Phase 7 · release hardening</div>
          <p>RouteLab is being built in phases. The current release includes an interactive topology editor, local project saving, deterministic Distance Vector and Link State engines, event-driven simulation playback, hop-by-hop packet forwarding and controlled before/after network experiments, and cross-algorithm comparison with clearly separated work metrics. The current development pass focuses on accessibility, reliability, security and release readiness.</p>
          <div className="about-dialog-foot"><span>Computer Networks mini project</span><Button size="sm" onClick={() => setHelpOpen(false)}>Got it</Button></div>
        </div>
      </Dialog>
    </>
  );
}
