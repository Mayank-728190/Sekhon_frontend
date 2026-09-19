// ============================================================
// AEROSCOUT — DETECTION PANEL COMPONENT
// ============================================================
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const FILTERS = [
  { id: 'all',       label: 'All',         cls: '' },
  { id: 'survivor',  label: 'Survivors', cls: 'survivor' },
  { id: 'fire',      label: 'Fire',      cls: '' },
  { id: 'flood',     label: 'Flood',     cls: '' },
  { id: 'debris',    label: 'Debris',    cls: '' },
  { id: 'landslide', label: 'Slide',     cls: '' },
];

function DetectionItem({ det, isHighlighted, onClick }) {
  return (
    <div
      className={`detection-item${isHighlighted ? ' highlighted' : ''}`}
      onClick={() => onClick(det.id)}
      title="Click to view on map"
    >
      <div className={`detection-icon ${det.type}`}>{det.emoji}</div>
      <div className="detection-body">
        <div className={`detection-type ${det.type}`}>{det.label}</div>
        <div className="detection-coords">{det.coordsStr}</div>
        <div className="detection-meta">
          <span className="detection-time">{det.timestamp}</span>
          <span className="drone-badge">{det.droneId}</span>
        </div>
      </div>
      <div className="detection-right">
        <span className={`confidence-badge ${det.confidenceLabel}`}>
          {(det.confidence * 100).toFixed(0)}%
        </span>
        {det.type === 'survivor' && det.survivorCount > 1 && (
          <span className="drone-badge" style={{ color:'var(--amber-core)' }}>×{det.survivorCount}</span>
        )}
      </div>
    </div>
  );
}

export default function DetectionPanel() {
  const { state, focusDetection } = useApp();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = state.detections.filter(d => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'survivor') return d.type === 'survivor';
    return d.type === activeFilter;
  });

  const handleClick = (id) => focusDetection(id);

  return (
    <div className="panel" id="panel-detections">
      <div className="section-header">
        <span className="section-title">
          Detections
          <span style={{ background:'var(--blue-dim)', border:'1px solid rgba(0,212,255,0.3)', borderRadius:4, padding:'2px 7px', color:'var(--blue-bright)', fontSize:'0.571rem', fontWeight:700, marginLeft: '4px' }}>
            {state.detections.length}
          </span>
        </span>
      </div>

      <div className="filter-tabs" role="tablist">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-tab${f.cls ? ` ${f.cls}` : ''}${activeFilter === f.id ? ' active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
            role="tab"
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="panel-body" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <div className="empty-state-text">No detections yet.<br />Scanning in progress...</div>
          </div>
        ) : (
          filtered.map(det => (
            <DetectionItem
              key={det.id}
              det={det}
              isHighlighted={state.focusedDetId === det.id}
              onClick={handleClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
