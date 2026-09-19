// ============================================================
// AEROSCOUT — FLEET PANEL COMPONENT
// ============================================================
import { useApp } from '../context/AppContext';

function getBatteryClass(pct) {
  if (pct > 50) return 'high';
  if (pct > 25) return 'medium';
  return 'low';
}
function getStatusClass(drone) {
  if (drone.battery <= 10 || drone.status === 'danger') return 'status-danger';
  if (drone.battery <= 25 || drone.status === 'warning') return 'status-warning';
  if (drone.status === 'active') return 'status-active';
  return 'status-idle';
}
function getStatusDotClass(drone) {
  if (drone.status === 'danger' || drone.battery <= 10) return 'danger pulse';
  if (drone.status === 'warning' || drone.battery <= 25) return 'warning pulse';
  if (drone.status === 'active') return 'active pulse';
  return 'idle';
}

function SignalBars({ level }) {
  return (
    <div className={`signal-bars level-${level}`}>
      {[1,2,3,4].map(i => <div key={i} className="signal-bar" />)}
    </div>
  );
}

function DroneCard({ drone, isSelected, onSelect, onAssign }) {
  const batClass = getBatteryClass(drone.battery);
  const stClass  = getStatusClass(drone);
  const dotClass = getStatusDotClass(drone);
  const stText   = drone.status === 'danger' ? 'CRITICAL' : drone.battery <= 25 ? 'LOW BAT' : drone.status === 'active' ? 'ACTIVE' : 'IDLE';

  return (
    <div
      className={`drone-card ${stClass}${isSelected ? ' selected' : ''}`}
      onClick={() => onSelect(drone.id)}
    >
      <div className="drone-card-header">
        <div style={{ display:'flex', alignItems:'center', gap:'var(--gap-sm)' }}>
          <span className={`status-dot ${dotClass}`} />
          <span className="drone-name">{drone.name}</span>
        </div>
        <span className="drone-id">{drone.id}</span>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'0.571rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {stText} · {drone.missionZone}
        </span>
        <SignalBars level={drone.signal} />
      </div>

      <div className="battery-bar" title={`${drone.battery.toFixed(0)}% battery`}>
        <div className={`battery-fill ${batClass}`} style={{ width: `${drone.battery.toFixed(1)}%` }} />
      </div>

      <div className="drone-stats">
        <div className="drone-stat">
          <span className="drone-stat-val">{drone.battery.toFixed(0)}%</span>
          <span className="drone-stat-lbl">Battery</span>
        </div>
        <div className="drone-stat">
          <span className="drone-stat-val" style={{ fontFamily:'var(--font-mono)' }}>{drone.altitude.toFixed(0)}m</span>
          <span className="drone-stat-lbl">Alt</span>
        </div>
        <div className="drone-stat">
          <span className="drone-stat-val" style={{ fontFamily:'var(--font-mono)' }}>{drone.speed.toFixed(1)}</span>
          <span className="drone-stat-lbl">m/s</span>
        </div>
      </div>

      <button
        className="drone-action-btn"
        onClick={(e) => { e.stopPropagation(); onAssign(drone.id); }}
      >
        📡 Assign Zone
      </button>
    </div>
  );
}

export default function FleetPanel() {
  const { state, selectDrone, addToast } = useApp();
  const zones = ['Sector A', 'Sector B', 'Sector C', 'Sector D', 'Sector E'];

  const handleAssign = (droneId) => {
    const zone = zones[Math.floor(Math.random() * zones.length)];
    addToast({ type: 'info', icon: '📡', title: 'Zone Reassigned', desc: `${droneId} → ${zone}` });
  };

  const survivorCount = state.survivors;
  const hazardCount   = state.hazards;
  const totalDets     = state.detections.length;

  return (
    <>
      {/* Fleet Panel */}
      <div className="panel" style={{ flex: '0 0 auto' }}>
        <div className="section-header">
          <span className="section-title">Fleet Status</span>
          <span style={{ fontSize:'0.643rem', fontFamily:'var(--font-mono)', color:'var(--green-core)' }}>
            {state.drones.filter(d => d.status === 'active').length} / {state.drones.length} ACTIVE
          </span>
        </div>
        <div className="panel-body" style={{ padding:'var(--gap-sm)', display:'flex', flexDirection:'column', gap:'var(--gap-sm)', overflowY: 'auto', minHeight: 0 }}>
          {state.drones.map(d => (
            <DroneCard
              key={d.id}
              drone={d}
              isSelected={state.selectedDroneId === d.id}
              onSelect={selectDrone}
              onAssign={handleAssign}
            />
          ))}
        </div>
      </div>

      {/* Mission Stats */}
      <div className="panel" style={{ flex: '0 0 auto' }}>
        <div className="section-header">
          <span className="section-title">Mission Stats</span>
        </div>
        <div className="panel-body" style={{ overflowY: 'auto', minHeight: 0 }}>
          <div className="stat-mini-grid">
            <div className="stat-mini">
              <div className="stat-mini-val" style={{ color:'var(--amber-core)' }}>{survivorCount}</div>
              <div className="stat-mini-lbl">Survivors</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-val" style={{ color:'var(--red-core)' }}>{hazardCount}</div>
              <div className="stat-mini-lbl">Hazards</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-val" style={{ color:'var(--blue-bright)' }}>{state.areaCovered.toFixed(1)}</div>
              <div className="stat-mini-lbl">km² Covered</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-val" style={{ color:'var(--green-core)' }}>{totalDets}</div>
              <div className="stat-mini-lbl">Detections</div>
            </div>
          </div>

          {/* Hazard breakdown */}
          <div style={{ marginTop:'var(--gap-md)' }}>
            <div style={{ fontSize:'0.571rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:'var(--gap-sm)' }}>
              Hazard Breakdown
            </div>
            {[
              { label: 'Fire',       color: 'var(--red-bright)',    type: 'fire'       },
              { label: 'Flood',      color: 'var(--blue-core)',     type: 'flood'      },
              { label: 'Debris',     color: '#a0917e',              type: 'debris'     },
              { label: 'Landslide',  color: '#c4894a',              type: 'landslide'  },
              { label: 'Structural', color: 'var(--yellow-core)',   type: 'structural' },
              { label: 'Electrical', color: 'var(--purple-core)',   type: 'electrical' },
            ].map(item => (
              <div key={item.type} className="hazard-row">
                <span style={{ fontSize:'0.786rem' }}>{item.label}</span>
                <span style={{ fontFamily:'var(--font-mono)', color: item.color, fontWeight:700, fontSize:'0.786rem' }}>
                  {state.detections.filter(d => d.type === item.type).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="panel" style={{ flex: '0 0 auto' }}>
        <div className="section-header">
          <span className="section-title">System</span>
        </div>
        <div className="panel-body" style={{ overflowY: 'auto', minHeight: 0 }}>
          {[
            { label: 'AI Model',       value: 'YOLO11m-seg ✓', color: 'var(--green-core)', bold: true },
            { label: 'Inference',      value: '23ms avg',       color: 'var(--blue-bright)', mono: true },
            { label: 'Connectivity',   value: '5G Partial', color: 'var(--yellow-core)', bold: true },
            { label: 'Edge Mode',      value: 'ON-DEVICE ✓',   color: 'var(--green-core)', bold: true },
            { label: 'SLAM Nav',       value: 'ACTIVE ✓',      color: 'var(--green-core)', bold: true },
            { label: 'Sensor Fusion',  value: 'RGB+THERMAL ✓', color: 'var(--green-core)', bold: true },
          ].map(row => (
            <div key={row.label} className="sys-row">
              <span style={{ fontSize:'0.786rem', color:'var(--text-secondary)' }}>{row.label}</span>
              <span style={{ fontSize:'0.786rem', color: row.color, fontWeight: row.bold ? 600 : 400, fontFamily: row.mono ? 'var(--font-mono)' : 'inherit' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
