// ============================================================
// AEROSCOUT — SIMULATION ENGINE (reusable, framework-agnostic)
// ============================================================

const ZONE = { latMin: 30.38, latMax: 30.46, lonMin: 79.28, lonMax: 79.37 };

const DETECTION_TYPES = [
  { type: 'survivor',   label: 'Survivor Detected',    emoji: '', priority: 'critical', weight: 30 },
  { type: 'survivor',   label: 'Survivor Group (3)',   emoji: '', priority: 'critical', weight: 15 },
  { type: 'fire',       label: 'Active Fire',          emoji: '', priority: 'critical', weight: 20 },
  { type: 'flood',      label: 'Floodwater Zone',      emoji: '', priority: 'high',     weight: 18 },
  { type: 'debris',     label: 'Structural Debris',    emoji: '', priority: 'medium',   weight: 20 },
  { type: 'landslide',  label: 'Landslide Zone',       emoji: '', priority: 'high',     weight: 15 },
  { type: 'structural', label: 'Unstable Structure',   emoji: '', priority: 'high',     weight: 12 },
  { type: 'electrical', label: 'Exposed Power Lines',  emoji: '', priority: 'high',     weight: 10 },
  { type: 'chemical',   label: 'Chemical Spill Sign',  emoji: '', priority: 'medium',   weight: 8 },
];

const ALERT_MESSAGES = {
  survivor:   ['Thermal signature consistent with live human detected. Immediate rescue recommended.', 'Motion detected in rubble zone. Possible survivor trapped under debris.', 'Group of survivors detected on rooftop — flood water rising. Urgent extraction required.'],
  fire:       ['Active fire spreading NW direction. Wind speed 22 km/h. Evacuation route blocked.', 'Fire detected near gas pipeline. Chemical explosion risk. Keep rescue teams at safe distance.'],
  flood:      ['Rapid inundation in low-lying area. Water level rising 0.3m/hr. Evacuate immediately.', 'Floodwater isolating village cluster. Bridge road submerged. Aerial extraction only.'],
  debris:     ['Large debris field identified. Road access blocked for 2.4 km stretch.', 'Building collapse debris zone. Secondary collapse risk moderate.'],
  landslide:  ['Active landslide movement detected. Do not enter zone. Aerial observation only.', 'Landslide has blocked National Highway. 200m stretch impassable.'],
  structural: ['Severely damaged structure identified. Risk of secondary collapse high.', 'Cracked foundation and missing support columns. Zone marked DANGER.'],
  electrical: ['Downed power lines detected. 400m exclusion zone recommended.'],
  chemical:   ['Discoloration pattern consistent with chemical spill. Hazmat team required.'],
};

const rand    = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const choose  = arr => arr[randInt(0, arr.length - 1)];
const fmtCoords = (lat, lon) => `${lat.toFixed(5)}°N, ${lon.toFixed(5)}°E`;
const fmtTime   = () => new Date().toTimeString().slice(0, 8);
const weightedChoose = types => {
  const total = types.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of types) { r -= t.weight; if (r <= 0) return t; }
  return types[0];
};

export function createInitialDrones() {
  return [
    { id: 'ALPHA-1', name: 'Drone Alpha', status: 'active',  lat: 30.415, lon: 79.312, altitude: 87,  speed: 14.2, battery: 78, signal: 4, gps: 'locked', heading: 45,  missionZone: 'Sector A', detectionsCount: 0 },
    { id: 'BETA-2',  name: 'Drone Beta',  status: 'active',  lat: 30.428, lon: 79.325, altitude: 72,  speed: 11.8, battery: 62, signal: 3, gps: 'locked', heading: 270, missionZone: 'Sector B', detectionsCount: 0 },
    { id: 'GAMMA-3', name: 'Drone Gamma', status: 'warning', lat: 30.400, lon: 79.298, altitude: 65,  speed: 0,    battery: 23, signal: 2, gps: 'locked', heading: 180, missionZone: 'Sector C', detectionsCount: 0 },
  ];
}

export function createSeedData() {
  const seeds = [
    { type: 'flood',      label: 'Floodwater Zone',     emoji: '', droneId: 'BETA-2',  lat: 30.424, lon: 79.320, minsAgo: 22 },
    { type: 'debris',     label: 'Structural Debris',   emoji: '', droneId: 'ALPHA-1', lat: 30.412, lon: 79.308, minsAgo: 20 },
    { type: 'survivor',   label: 'Survivor Detected',   emoji: '', droneId: 'ALPHA-1', lat: 30.417, lon: 79.315, minsAgo: 18 },
    { type: 'fire',       label: 'Active Fire',         emoji: '', droneId: 'BETA-2',  lat: 30.431, lon: 79.328, minsAgo: 15 },
    { type: 'landslide',  label: 'Landslide Zone',      emoji: '', droneId: 'GAMMA-3', lat: 30.402, lon: 79.296, minsAgo: 12 },
    { type: 'survivor',   label: 'Survivor Group (3)',  emoji: '', droneId: 'BETA-2',  lat: 30.426, lon: 79.322, minsAgo: 9  },
    { type: 'structural', label: 'Unstable Structure',  emoji: '', droneId: 'ALPHA-1', lat: 30.410, lon: 79.306, minsAgo: 6  },
    { type: 'electrical', label: 'Exposed Power Lines', emoji: '', droneId: 'GAMMA-3', lat: 30.398, lon: 79.301, minsAgo: 3  },
  ];

  let detId = 1, altId = 1;
  const detections = [];
  const alerts = [];

  seeds.forEach(s => {
    const conf = s.type === 'survivor' ? rand(0.82, 0.97) : rand(0.7, 0.95);
    const priority = s.type === 'survivor' || s.type === 'fire' ? 'critical' : s.type === 'landslide' || s.type === 'flood' ? 'high' : 'medium';
    const d = new Date(Date.now() - s.minsAgo * 60000);
    const det = {
      id: `DET-${String(detId++).padStart(4,'0')}`,
      type: s.type, label: s.label, emoji: s.emoji, priority,
      confidence: conf, confidenceLabel: conf >= 0.85 ? 'high' : conf >= 0.7 ? 'medium' : 'low',
      lat: s.lat, lon: s.lon, droneId: s.droneId,
      timestamp: d.toTimeString().slice(0, 8),
      coordsStr: fmtCoords(s.lat, s.lon), isNew: false,
      survivorCount: s.type === 'survivor' ? (s.label.includes('Group') ? 3 : 1) : undefined
    };
    detections.push(det);

    if (['critical', 'high'].includes(priority)) {
      const messages = ALERT_MESSAGES[s.type] || ['Hazard detected.'];
      alerts.push({
        id: `ALT-${String(altId++).padStart(3,'0')}`,
        detectionId: det.id, type: s.type, emoji: s.emoji, priority,
        title: s.label, description: choose(messages),
        lat: s.lat, lon: s.lon, coordsStr: det.coordsStr, droneId: s.droneId,
        timestamp: det.timestamp,
        status: s.type === 'fire' ? 'dispatched' : 'open',
        countdown: priority === 'critical' && s.type !== 'fire' ? randInt(300, 800) : null,
      });
    }
  });

  return { detections, alerts, detId, altId };
}

export function generateNewDetection(drones, detIdCounter) {
  const template = weightedChoose(DETECTION_TYPES);
  const active   = drones.filter(d => d.status !== 'lost');
  const drone    = choose(active);
  const conf     = template.type === 'survivor' ? rand(0.78, 0.99) : rand(0.65, 0.97);

  const det = {
    id: `DET-${String(detIdCounter).padStart(4,'0')}`,
    type: template.type, label: template.label, emoji: template.emoji, priority: template.priority,
    confidence: conf, confidenceLabel: conf >= 0.85 ? 'high' : conf >= 0.7 ? 'medium' : 'low',
    lat: drone.lat + rand(-0.008, 0.008),
    lon: drone.lon + rand(-0.008, 0.008),
    droneId: drone.id, timestamp: fmtTime(), isNew: true,
    survivorCount: template.label.includes('Group') ? randInt(2, 5) : template.type === 'survivor' ? 1 : undefined,
  };
  det.coordsStr = fmtCoords(det.lat, det.lon);
  return det;
}

export function generateAlertFromDetection(det, altIdCounter) {
  const messages = ALERT_MESSAGES[det.type] || ['Hazard detected.'];
  return {
    id: `ALT-${String(altIdCounter).padStart(3,'0')}`,
    detectionId: det.id, type: det.type, emoji: det.emoji, priority: det.priority,
    title: det.label, description: choose(messages),
    lat: det.lat, lon: det.lon, coordsStr: det.coordsStr, droneId: det.droneId,
    timestamp: det.timestamp, status: 'open',
    countdown: det.priority === 'critical' ? 900 : null,
  };
}

export function stepDrones(drones) {
  return drones.map(drone => {
    if (drone.status === 'idle' || drone.status === 'lost') return drone;
    const d = { ...drone };
    const headingRad = (d.heading * Math.PI) / 180;
    const speed = d.speed * 0.00001;
    d.lat += Math.cos(headingRad) * speed;
    d.lon += Math.sin(headingRad) * speed;

    if (d.lat < ZONE.latMin || d.lat > ZONE.latMax) { d.heading = (180 - d.heading + 360) % 360; d.lat = Math.max(ZONE.latMin, Math.min(ZONE.latMax, d.lat)); }
    if (d.lon < ZONE.lonMin || d.lon > ZONE.lonMax) { d.heading = (360 - d.heading + 360) % 360; d.lon = Math.max(ZONE.lonMin, Math.min(ZONE.lonMax, d.lon)); }
    d.heading = (d.heading + rand(-5, 5) + 360) % 360;
    d.battery = Math.max(0, d.battery - 0.004);
    if (d.battery < 15 && d.status === 'active') d.status = 'warning';
    if (d.battery < 3) d.status = 'danger';
    d.altitude = Math.max(30, Math.min(120, d.altitude + rand(-0.5, 0.5)));
    d.speed    = Math.max(5,  Math.min(20,  d.speed    + rand(-0.5, 0.5)));
    if (Math.random() < 0.03) d.signal = Math.max(1, Math.min(4, d.signal + choose([-1, 0, 0, 1])));
    return d;
  });
}

export function tickAlertCountdowns(alerts) {
  return alerts.map(a => {
    if (a.countdown !== null && a.countdown > 0 && a.status === 'open') {
      return { ...a, countdown: a.countdown - 1 };
    }
    return a;
  });
}
