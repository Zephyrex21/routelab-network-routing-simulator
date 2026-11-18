import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

const SIDEBAR_STORAGE_KEY = 'routelab-sidebar-collapsed-v1';

function getInitialSidebarState() {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getFocusableSidebarControls(sidebar) {
  return [...(sidebar?.querySelectorAll('a[href], button:not([disabled])') || [])]
    .filter((element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarState);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // The sidebar remains usable for this session if storage is unavailable.
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((current) => !current);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const sidebar = document.querySelector('.sidebar');
    const mainColumn = document.querySelector('.main-column');
    const menuButton = document.querySelector('.mobile-menu-button');
    const previousMainInert = mainColumn?.inert ?? false;
    const previousBodyOverflow = document.body.style.overflow;

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

  const compactSidebar = sidebarCollapsed && !mobileOpen;

  return (
    <div className={`app-frame ${sidebarCollapsed ? 'app-frame-sidebar-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Sidebar
        collapsed={compactSidebar}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onClose={() => setMobileOpen(false)}
      />
      <div className="main-column">
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          isMobileMenuOpen={mobileOpen}
          onMenuClick={() => setMobileOpen(true)}
        />
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
