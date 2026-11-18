import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './ThemeProvider.jsx';
import { ToastProvider } from '../components/ui/ToastProvider.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import OverviewPage from '../features/dashboard/OverviewPage.jsx';
import NetworkStudioPage from '../features/topology/NetworkStudioPage.jsx';
import SimulationPage from '../features/simulation/SimulationPage.jsx';
import PacketExplorerPage from '../features/packet-explorer/PacketExplorerPage.jsx';
import NetworkFailureLabPage from '../features/network-failure/NetworkFailureLabPage.jsx';
import ComparePage from '../features/comparison/ComparePage.jsx';

function NotFoundPage() {
  return <div className="page not-found-page"><span className="eyebrow muted">404 / NOT FOUND</span><h1>This route hasn't been mapped.</h1><p>The page may have moved, or the address may be incorrect.</p><a className="inline-link" href="/">Return to overview <span aria-hidden="true">→</span></a></div>;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route path="studio" element={<NetworkStudioPage />} />
              <Route path="simulation" element={<SimulationPage />} />
              <Route path="packets" element={<PacketExplorerPage />} />
              <Route path="failures" element={<NetworkFailureLabPage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
