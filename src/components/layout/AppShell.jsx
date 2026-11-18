import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

function getFocusableSidebarControls(sidebar) {
  return [...(sidebar?.querySelectorAll('a[href], button:not([disabled])') || [])]
    .filter((element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const sidebar = document.querySelector('.sidebar');
    const mainColumn = document.querySelector('.main-column');
    const menuButton = document.querySelector('.mobile-menu-button');
    const previousMainInert = mainColumn?.inert ?? false;
    const previousBodyOverflow = document.body.style.overflow;

    // Treat the mobile drawer as a modal navigation surface.
    if (mainColumn) mainColumn.inert = true;
    document.body.style.overflow = 'hidden';
    getFocusableSidebarControls(sidebar)[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const controls = getFocusableSidebarControls(sidebar);
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !sidebar?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sidebar?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (mainColumn) mainColumn.inert = previousMainInert;
      document.body.style.overflow = previousBodyOverflow;
      menuButton?.focus?.();
    };
  }, [mobileOpen]);

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
      <div className="main-column">
        <Topbar isMobileMenuOpen={mobileOpen} onMenuClick={() => setMobileOpen(true)} />
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>RouteLab <span className="footer-dot">·</span> Computer Networks</span>
          <span>Routing, made visible.</span>
        </footer>
      </div>
    </div>
  );
}
