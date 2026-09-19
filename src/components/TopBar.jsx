// ============================================================
// AEROSCOUT — TOPBAR COMPONENT
// ============================================================
import { useApp } from '../context/AppContext';
import { useMissionTimer, useSystemClock } from '../hooks/useTimers';

function BrandLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" stroke="#00d4ff" strokeWidth="1.5" opacity="0.3"/>
      <circle cx="16" cy="16" r="9"  stroke="#00d4ff" strokeWidth="1" opacity="0.5"/>
      <rect x="13" y="13" width="6" height="6" rx="1.5" fill="#00d4ff" opacity="0.9"/>
      <line x1="4"  y1="4"  x2="13" y2="13" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
      <line x1="28" y1="4"  x2="19" y2="13" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
      <line x1="4"  y1="28" x2="13" y2="19" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
      <line x1="28" y1="28" x2="19" y2="19" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
      <circle cx="4"  cy="4"  r="3" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.6"/>
      <circle cx="28" cy="4"  r="3" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.6"/>
      <circle cx="4"  cy="28" r="3" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.6"/>
      <circle cx="28" cy="28" r="3" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.6"/>
    </svg>
  );
}

export default function TopBar() {
  const { state, togglePause, addToast } = useApp();
  const timer     = useMissionTimer(state.missionStartTime);
  const clock     = useSystemClock();
  const activeDrone = state.drones.find(d => d.id === state.selectedDroneId) || state.drones[0];

  const sigLabels = ['', '▂', '▂▄', '▂▄▆', '▂▄▆█'];

  const handleRTB = () => addToast({ type: 'info', title: 'Return to Base Initiated', desc: 'All drones ordered to RTB. ETA: ~8 minutes.' });
  const handleEmergency = () => addToast({ type: 'hazard', title: 'EMERGENCY RECALL', desc: 'All units recalled immediately. Override active.' });

  return (
    <header className="topbar">
      {/* LEFT */}
      <div className="topbar-left">
        <div className="brand">
          <BrandLogo />
          <div>
            <div className="brand-name">AeroScout</div>
            <div className="brand-sub">Disaster Response AI</div>
          </div>
        </div>

        <div className="divider-v" />

        <div>
          <div className="mission-name">OP PRAHAR-7</div>
          <div className="mission-op">Chamoli District, Uttarakhand · M6.8 EQ + Flash Flood</div>
        </div>

        <div className="mission-status active">
          <span className="status-dot active pulse" />
          MISSION {state.missionPaused ? 'PAUSED' : 'ACTIVE'}
        </div>
      </div>

      {/* CENTER */}
      <div className="topbar-center">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div className="mission-timer-label">Mission Time</div>
          <div className="mission-timer">{timer}</div>
        </div>

        <div className="divider-v" />

        <div className="topbar-stat">
          <div className="topbar-stat-value">{activeDrone.battery.toFixed(0)}%</div>
          <div className="topbar-stat-label">Battery</div>
        </div>
        <div className="topbar-stat">
          <div className="topbar-stat-value">{sigLabels[activeDrone.signal] || '▂▄▆█'}</div>
          <div className="topbar-stat-label">Signal</div>
        </div>
        <div className="topbar-stat">
          <div className="topbar-stat-value" style={{ fontSize:'0.643rem' }}>
            {activeDrone.gps === 'locked' ? 'LOCKED' : 'SEARCHING'}
          </div>
          <div className="topbar-stat-label">GPS</div>
        </div>

        <div className="divider-v" />

        <div className="topbar-stat">
          <div className="topbar-stat-value" style={{ color:'var(--text-secondary)', fontFamily:'var(--font-mono)' }}>{clock}</div>
          <div className="topbar-stat-label">IST</div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="topbar-right">
        <button
          className="btn-topbar theme"
          onClick={() => {
            document.body.classList.toggle('theme-light');
          }}
        >
          Theme
        </button>
        <button
          className={`btn-topbar pause${state.missionPaused ? ' paused' : ''}`}
          onClick={togglePause}
        >
          {state.missionPaused ? 'Resume' : 'Pause'}
        </button>
        <button className="btn-topbar rtb" onClick={handleRTB}>RTB</button>
        <button className="btn-topbar emergency" onClick={handleEmergency}>EMERGENCY</button>
      </div>
    </header>
  );
}
