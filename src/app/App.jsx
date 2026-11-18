import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './ThemeProvider.jsx';
import { ToastProvider } from '../components/ui/ToastProvider.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import PublicHomePage from '../features/dashboard/PublicHomePage.jsx';
import OverviewPage from '../features/dashboard/OverviewPage.jsx';
import NetworkStudioPage from '../features/topology/NetworkStudioPage.jsx';
import SimulationPage from '../features/simulation/SimulationPage.jsx';
import PacketExplorerPage from '../features/packet-explorer/PacketExplorerPage.jsx';
import NetworkFailureLabPage from '../features/network-failure/NetworkFailureLabPage.jsx';
import ComparePage from '../features/comparison/ComparePage.jsx';

function NotFoundPage() {
  return (
    <main className="public-not-found">
      <span className="eyebrow muted">404 / NOT FOUND</span>
      <h1>This route hasn't been mapped.</h1>
      <p>The page may have moved, or the address may be incorrect.</p>
      <a className="inline-link" href="/">Return to RouteLab home <span aria-hidden="true">→</span></a>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicHomePage />} />

            <Route path="/lab" element={<AppShell />}>
              <Route index element={<Navigate to="studio" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="studio" element={<NetworkStudioPage />} />
              <Route path="simulation" element={<SimulationPage />} />
              <Route path="packets" element={<PacketExplorerPage />} />
              <Route path="failures" element={<NetworkFailureLabPage />} />
              <Route path="compare" element={<ComparePage />} />
            </Route>

            {/* Keep the original Phase 1–7 paths working for existing bookmarks. */}
            <Route path="/overview" element={<Navigate to="/lab/overview" replace />} />
            <Route path="/studio" element={<Navigate to="/lab/studio" replace />} />
            <Route path="/simulation" element={<Navigate to="/lab/simulation" replace />} />
            <Route path="/packets" element={<Navigate to="/lab/packets" replace />} />
            <Route path="/failures" element={<Navigate to="/lab/failures" replace />} />
            <Route path="/compare" element={<Navigate to="/lab/compare" replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
