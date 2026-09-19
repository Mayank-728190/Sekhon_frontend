// ============================================================
// AEROSCOUT — TACTICAL MAP COMPONENT (react-leaflet)
// ============================================================
import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';

// ── CUSTOM ICON FACTORIES ──────────────────────────────────
function droneIcon(status) {
  const color = status === 'active' ? '#00d4ff' : status === 'warning' ? '#ffea00' : '#ff4500';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:40px;height:40px;border-radius:50%;border:2px solid ${color};opacity:0.4;animation:scanRing 2s ease-out infinite;"></div>
      <div style="position:absolute;width:28px;height:28px;border-radius:50%;border:1px solid ${color};opacity:0.6;animation:scanRing 2s ease-out infinite;animation-delay:0.5s;"></div>
      <div style="width:20px;height:20px;border-radius:50%;background:rgba(8,12,23,0.95);border:2px solid ${color};box-shadow:0 0 12px ${color}80;display:flex;align-items:center;justify-content:center;font-size:10px;z-index:2;position:relative;">🚁</div>
    </div>`,
    iconSize: [40, 40], iconAnchor: [20, 20],
  });
}

function survivorIcon(count) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;">
      <div style="width:28px;height:28px;border-radius:50%;background:rgba(255,184,48,0.15);border:2px solid #ffb830;box-shadow:0 0 12px rgba(255,184,48,0.5);display:flex;align-items:center;justify-content:center;font-size:13px;animation:survivorPulse 2s ease-in-out infinite;">🧍</div>
      ${count > 1 ? `<div style="position:absolute;top:-6px;right:-6px;background:#ffb830;color:#000;font-size:9px;font-weight:800;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${count}</div>` : ''}
    </div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });
}

function hazardIcon(type) {
  const configs = { fire:{emoji:'🔥',color:'#ff4500',bg:'rgba(255,69,0,0.15)'}, flood:{emoji:'🌊',color:'#00b4d8',bg:'rgba(0,180,216,0.15)'}, debris:{emoji:'🪨',color:'#a0917e',bg:'rgba(160,145,126,0.15)'}, landslide:{emoji:'⛰️',color:'#c4894a',bg:'rgba(196,137,74,0.15)'}, structural:{emoji:'🏚️',color:'#ffea00',bg:'rgba(255,234,0,0.12)'}, electrical:{emoji:'⚡',color:'#c77dff',bg:'rgba(199,125,255,0.15)'}, chemical:{emoji:'☣️',color:'#00e676',bg:'rgba(0,230,118,0.12)'} };
  const cfg = configs[type] || { emoji:'⚠️', color:'#ffea00', bg:'rgba(255,234,0,0.12)' };
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:6px;background:${cfg.bg};border:1.5px solid ${cfg.color}80;box-shadow:0 0 8px ${cfg.color}40;display:flex;align-items:center;justify-content:center;font-size:13px;animation:hazardPulse 2.5s ease-in-out infinite;">${cfg.emoji}</div>`,
    iconSize: [26, 26], iconAnchor: [13, 13],
  });
}

// ── FLY TO CONTROLLER ──────────────────────────────────────
function FlyToController({ focusedDetId, detections }) {
  const map = useMap();
  const lastFocused = useRef(null);

  useEffect(() => {
    if (!focusedDetId || focusedDetId === lastFocused.current) return;
    const det = detections.find(d => d.id === focusedDetId);
    if (det) {
      map.flyTo([det.lat, det.lon], 15, { animate: true, duration: 1.2 });
      lastFocused.current = focusedDetId;
    }
  }, [focusedDetId, detections, map]);

  return null;
}

// ── POPUP STYLE ────────────────────────────────────────────
const popupStyle = (borderColor) => ({
  background: '#0d1424', border: `1px solid ${borderColor}`, borderRadius: 8,
  padding: 12, color: '#e8eaf6', fontFamily: "'Outfit',sans-serif", minWidth: 200,
});

// ── MAIN MAP COMPONENT ─────────────────────────────────────
export default function TacticalMap() {
  const { state, toggleSurvivors, toggleHazards } = useApp();

  // Drone trails per drone
  const droneTrails = useMemo(() => {
    // Static initial trail (react-leaflet handles live via state)
    return {};
  }, []);

  const trailsRef = useRef({});
  state.drones.forEach(d => {
    if (!trailsRef.current[d.id]) trailsRef.current[d.id] = [];
    const trail = trailsRef.current[d.id];
    const last = trail[trail.length - 1];
    if (!last || last[0] !== d.lat || last[1] !== d.lon) {
      trail.push([d.lat, d.lon]);
      if (trail.length > 80) trail.shift();
    }
  });

  const safeRoutePoints = [[30.380, 79.290], [30.393, 79.305], [30.408, 79.312]];
  const floodZonePoints = [[30.422, 79.318], [30.435, 79.330], [30.432, 79.338], [30.418, 79.325]];

  return (
    <div className="panel" id="panel-map" style={{ position: 'relative' }}>
      <div className="section-header" style={{ zIndex: 600, position: 'relative' }}>
        <span className="section-title">
          Tactical Map
          <span style={{ background:'rgba(255,69,0,0.1)', border:'1px solid rgba(255,69,0,0.3)', borderRadius:4, padding:'2px 6px', color:'var(--red-bright)', fontSize:'0.571rem', marginLeft:'4px' }}>LIVE</span>
        </span>
        <span style={{ fontSize:'0.643rem', color:'var(--text-muted)' }}>Chamoli, Uttarakhand</span>
      </div>

      <div className="map-container">
        <MapContainer
          center={[30.415, 79.312]}
          zoom={13}
          className="leaflet-map"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />

          <FlyToController focusedDetId={state.focusedDetId} detections={state.detections} />

          {/* Epicenter danger zone */}
          <Circle center={[30.415, 79.312]} radius={1500}
            pathOptions={{ color:'#ff4500', fillColor:'#ff4500', fillOpacity:0.05, weight:1.5, dashArray:'6,4' }}>
            <Popup>
              <div style={popupStyle('rgba(255,69,0,0.4)')}>
                <div style={{ fontSize:11, fontWeight:700, color:'#ff6b35', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>⚠️ Epicenter Zone</div>
                <div style={{ fontSize:12, fontWeight:600 }}>M6.8 Earthquake</div>
                <div style={{ fontSize:10, color:'#8892b0', marginTop:4 }}>Chamoli District · 1.5km danger zone</div>
              </div>
            </Popup>
          </Circle>

          {/* Flood zone polygon */}
          <Polygon positions={floodZonePoints}
            pathOptions={{ color:'#00b4d8', fillColor:'#00b4d8', fillOpacity:0.08, weight:1.5, dashArray:'4,4' }}>
            <Popup>
              <div style={popupStyle('rgba(0,180,216,0.4)')}>
                <div style={{ fontSize:11, fontWeight:700, color:'#00b4d8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>🌊 Flood Zone</div>
                <div style={{ fontSize:11, color:'#8892b0' }}>Water level rising 0.3m/hr</div>
              </div>
            </Popup>
          </Polygon>

          {/* Safe route */}
          {state.showHazards && (
            <Polyline positions={safeRoutePoints}
              pathOptions={{ color:'#00e676', weight:3, opacity:0.7, dashArray:'8,6' }}>
              <Popup>
                <div style={popupStyle('rgba(0,230,118,0.4)')}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#00e676', textTransform:'uppercase', letterSpacing:'0.08em' }}>✅ Safe Access Route</div>
                  <div style={{ fontSize:10, color:'#8892b0', marginTop:4 }}>NH-7 via Gopeshwar — passable</div>
                </div>
              </Popup>
            </Polyline>
          )}

          {/* Drone markers + trails */}
          {state.drones.map(drone => (
            <div key={drone.id}>
              <Marker position={[drone.lat, drone.lon]} icon={droneIcon(drone.status)}>
                <Popup>
                  <div style={popupStyle('rgba(0,212,255,0.3)')}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#00d4ff', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>🚁 {drone.name}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, fontSize:10, color:'#8892b0' }}>
                      <span>ID: <b style={{ color:'#e8eaf6' }}>{drone.id}</b></span>
                      <span>Alt: <b style={{ color:'#e8eaf6' }}>{drone.altitude.toFixed(0)}m</b></span>
                      <span>Speed: <b style={{ color:'#e8eaf6' }}>{drone.speed.toFixed(1)} m/s</b></span>
                      <span>Bat: <b style={{ color: drone.battery > 30 ? '#00e676' : '#ff4500' }}>{drone.battery.toFixed(0)}%</b></span>
                    </div>
                    <div style={{ fontSize:10, color:'#4a5570', marginTop:6, fontFamily:"'JetBrains Mono',monospace" }}>
                      {drone.lat.toFixed(5)}°N, {drone.lon.toFixed(5)}°E
                    </div>
                  </div>
                </Popup>
              </Marker>
              {trailsRef.current[drone.id]?.length > 1 && (
                <Polyline
                  positions={trailsRef.current[drone.id]}
                  pathOptions={{ color: drone.status === 'warning' ? '#ffea00' : '#00d4ff', weight:1.5, opacity:0.4, dashArray:'3,4' }}
                />
              )}
            </div>
          ))}

          {/* Survivor markers */}
          {state.showSurvivors && state.detections.filter(d => d.type === 'survivor').map(det => (
            <Marker key={det.id} position={[det.lat, det.lon]} icon={survivorIcon(det.survivorCount || 1)}>
              <Popup>
                <div style={popupStyle('rgba(255,184,48,0.3)')}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#ffb830', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>🧍 {det.label}</div>
                  <div style={{ fontSize:10, color:'#8892b0' }}>Conf: <b style={{ color:'#00e676' }}>{(det.confidence*100).toFixed(0)}%</b> · Drone: <b style={{ color:'#00d4ff' }}>{det.droneId}</b></div>
                  <div style={{ fontSize:10, color:'#4a5570', marginTop:6, fontFamily:"'JetBrains Mono',monospace" }}>{det.coordsStr}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hazard markers */}
          {state.showHazards && state.detections.filter(d => d.type !== 'survivor').map(det => (
            <Marker key={det.id} position={[det.lat, det.lon]} icon={hazardIcon(det.type)}>
              <Popup>
                <div style={popupStyle('rgba(255,69,0,0.3)')}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#ff6b35', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{det.emoji} {det.label}</div>
                  <div style={{ fontSize:10, color:'#8892b0' }}>Conf: <b style={{ color:'#ffea00' }}>{(det.confidence*100).toFixed(0)}%</b> · Drone: <b style={{ color:'#00d4ff' }}>{det.droneId}</b></div>
                  <div style={{ fontSize:10, color:'#4a5570', marginTop:6, fontFamily:"'JetBrains Mono',monospace" }}>{det.coordsStr}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map overlay controls */}
        <div className="map-controls">
          <button className={`map-control-btn${state.showSurvivors ? ' active' : ''}`} onClick={toggleSurvivors} title="Toggle survivors">Survivors</button>
          <button className={`map-control-btn${state.showHazards ? ' active' : ''}`} onClick={toggleHazards} title="Toggle hazards">Hazards</button>
        </div>

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-title">Map Legend</div>
          {[
            { color:'#ffb830', shadow:'0 0 6px #ffb830', label:'Survivor' },
            { color:'#ff4500', shadow:'0 0 6px #ff4500', label:'Fire' },
            { color:'#00b4d8', shadow:'none',            label:'Flood Zone' },
            { color:'#c4894a', shadow:'none',            label:'Landslide' },
            { color:'#00e676', shadow:'none',            label:'Safe Route' },
            { color:'#00d4ff', shadow:'0 0 6px #00d4ff', label:'Drone' },
          ].map(item => (
            <div key={item.label} className="legend-item">
              <div className="legend-dot" style={{ background: item.color, boxShadow: item.shadow }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
