// ============================================================
// AEROSCOUT — ALERTS PANEL COMPONENT
// ============================================================
import { useApp } from '../context/AppContext';
import { fmtCountdown } from '../hooks/useTimers';

function AlertCard({ alert, onDispatch }) {
  const isDispatched = alert.status === 'dispatched';

  return (
    <div className={`alert-card ${alert.priority}${isDispatched ? ' dispatched' : ''}${!isDispatched ? ` ${alert.priority === 'critical' ? 'open' : ''}` : ''}`}>
      <div className="alert-header">
        <span className="alert-priority-badge">
          {alert.priority.toUpperCase()}
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--gap-sm)' }}>
          {alert.countdown !== null && !isDispatched && (
            <span
              className="alert-countdown"
              style={alert.countdown <= 60 ? { animation:'batteryPulse 0.5s ease-in-out infinite' } : {}}
            >
              {fmtCountdown(alert.countdown)}
            </span>
          )}
          <span style={{ fontSize:'0.571rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{alert.timestamp}</span>
        </div>
      </div>

      <div className="alert-title">{alert.title}</div>
      <div className="alert-desc">{alert.description}</div>

      <div className="alert-footer">
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--gap-xs)' }}>
          <span className="alert-coords">{alert.coordsStr}</span>
          <span style={{ fontSize:'0.571rem', color:'var(--text-muted)' }}>{alert.droneId} · {alert.id}</span>
        </div>
        {isDispatched ? (
          <div className="dispatched-tag">Dispatched</div>
        ) : (
          <button className="btn-dispatch" onClick={() => onDispatch(alert.id)}>
            Dispatch Team
          </button>
        )}
      </div>
    </div>
  );
}

export default function AlertsPanel() {
  const { state, dispatchAlert } = useApp();
  const openCount = state.alerts.filter(a => a.status === 'open').length;

  return (
    <div className="panel" id="panel-alerts">
      <div className="section-header">
        <span className="section-title">
          Alerts &amp; Recommendations
          {openCount > 0 && (
            <span style={{ background:'rgba(255,69,0,0.15)', border:'1px solid rgba(255,69,0,0.4)', borderRadius:4, padding:'2px 7px', color:'var(--red-bright)', fontSize:'0.571rem', fontWeight:700, marginLeft: '4px' }}>
              {openCount}
            </span>
          )}
        </span>
        <span style={{ fontSize:'0.643rem', color:'var(--text-muted)' }}>AI Prioritized</span>
      </div>

      <div className="panel-body" aria-live="polite">
        {state.alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <div className="empty-state-text">No active alerts.<br />System monitoring...</div>
          </div>
        ) : (
          state.alerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} onDispatch={dispatchAlert} />
          ))
        )}
      </div>
    </div>
  );
}
