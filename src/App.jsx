// ============================================================
// AEROSCOUT — ROOT APP COMPONENT
// ============================================================
import './index.css';
import { AppProvider } from './context/AppContext';
import TopBar        from './components/TopBar';
import FleetPanel    from './components/FleetPanel';
import CameraFeed    from './components/CameraFeed';
import TacticalMap   from './components/TacticalMap';
import DetectionPanel from './components/DetectionPanel';
import AlertsPanel   from './components/AlertsPanel';
import AnalyticsBar  from './components/AnalyticsBar';
import ToastContainer from './components/ToastContainer';

function Dashboard() {
  return (
    <div className="app">
      <TopBar />

      <main className="main-grid">
        {/* LEFT COLUMN — spans both grid rows */}
        <aside className="col-left">
          <FleetPanel />
        </aside>

        {/* CENTER COLUMN — row 1 only (feed + map) */}
        <section className="col-center">
          <div className="center-top">
            <CameraFeed />
            <TacticalMap />
          </div>
        </section>

        {/* RIGHT COLUMN — spans both grid rows */}
        <aside className="col-right">
          <DetectionPanel />
          <AlertsPanel />
        </aside>

        {/* BOTTOM BAR — direct grid child → grid-column:2, grid-row:2 */}
        <AnalyticsBar />
      </main>

      <ToastContainer />
    </div>
  );
}


export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
