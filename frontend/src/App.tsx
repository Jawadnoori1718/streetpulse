import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import OverviewPage from './pages/OverviewPage';
import LiveMapPage from './pages/LiveMapPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AIPage from './pages/AIPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import SavedPlacesPage from './pages/SavedPlacesPage';
import { useMediaQuery } from './hooks/useMediaQuery';
import { fetchStats, fetchAlerts } from './services/api';
import type { Alert } from './types';

function computeSafetyScore(total: number, high: number, last24: number): number {
  if (total === 0) return 80;
  const raw = 100 - (high / total) * 55 - Math.min(last24 * 4, 25);
  return Math.round(Math.max(5, Math.min(99, raw)));
}

export default function App() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [safetyScore, setSafetyScore] = useState(80);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const refresh = useCallback(() => {
    fetchStats()
      .then((s) => setSafetyScore(computeSafetyScore(s.totalIncidents, s.highSeverityCount, s.last24HoursCount)))
      .catch(() => {});
    fetchAlerts().then(setAlerts).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
        <Sidebar isDesktop={isDesktop} open={drawerOpen} onClose={() => setDrawerOpen(false)} safetyScore={safetyScore} />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100dvh' }}>
          <TopBar isDesktop={isDesktop} alerts={alerts} onMenuClick={() => setDrawerOpen(true)} />
          <main style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/map" element={<LiveMapPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/ai" element={<AIPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/saved" element={<SavedPlacesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
