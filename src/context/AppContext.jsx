// ============================================================
// AEROSCOUT — APP CONTEXT (React Context + useReducer)
// Global state: drones, detections, alerts, camera mode, toasts
// ============================================================
import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import {
  createInitialDrones, createSeedData,
  generateNewDetection, generateAlertFromDetection,
  stepDrones, tickAlertCountdowns
} from '../simulation';

// ── INITIAL STATE ──────────────────────────────────────────
const seed = createSeedData();

const initialState = {
  drones:         createInitialDrones(),
  detections:     seed.detections,
  alerts:         seed.alerts,
  detIdCounter:   seed.detId,
  altIdCounter:   seed.altId,
  survivors:      seed.detections.filter(d => d.type === 'survivor').reduce((s, d) => s + (d.survivorCount || 1), 0),
  hazards:        seed.detections.filter(d => d.type !== 'survivor').length,
  areaCovered:    0.8,
  cameraMode:     'rgb',
  missionStartTime: Date.now() - 23 * 60 * 1000,
  missionPaused:  false,
  toasts:         [],
  focusedDetId:   null,
  selectedDroneId:'ALPHA-1',
  showSurvivors:  true,
  showHazards:    true,
};

// ── REDUCER ────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'DRONES_STEP':
      return { ...state, drones: stepDrones(state.drones), areaCovered: Math.min(12.4, state.areaCovered + 0.002) };

    case 'ADD_DETECTION': {
      const det = action.payload;
      const newSurvivors = det.type === 'survivor' ? (det.survivorCount || 1) : 0;
      const newHazards   = det.type !== 'survivor' ? 1 : 0;
      return {
        ...state,
        detections:   [det, ...state.detections],
        detIdCounter: state.detIdCounter + 1,
        survivors:    state.survivors + newSurvivors,
        hazards:      state.hazards   + newHazards,
      };
    }

    case 'ADD_ALERT':
      return {
        ...state,
        alerts:       [action.payload, ...state.alerts],
        altIdCounter: state.altIdCounter + 1,
      };

    case 'DISPATCH_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a => a.id === action.payload ? { ...a, status: 'dispatched' } : a),
      };

    case 'TICK_COUNTDOWNS':
      return { ...state, alerts: tickAlertCountdowns(state.alerts) };

    case 'TOGGLE_CAMERA':
      return { ...state, cameraMode: state.cameraMode === 'rgb' ? 'thermal' : 'rgb' };

    case 'TOGGLE_PAUSE':
      return { ...state, missionPaused: !state.missionPaused };

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now() }] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    case 'FOCUS_DETECTION':
      return { ...state, focusedDetId: action.payload };

    case 'SELECT_DRONE':
      return { ...state, selectedDroneId: action.payload };

    case 'TOGGLE_SURVIVORS':
      return { ...state, showSurvivors: !state.showSurvivors };

    case 'TOGGLE_HAZARDS':
      return { ...state, showHazards: !state.showHazards };

    default:
      return state;
  }
}

// ── CONTEXT ────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Convenient action creators
  const addToast = useCallback((toast) => dispatch({ type: 'ADD_TOAST', payload: toast }), []);
  const removeToast = useCallback((id) => dispatch({ type: 'REMOVE_TOAST', payload: id }), []);
  const dispatchAlert = useCallback((alertId) => {
    dispatch({ type: 'DISPATCH_ALERT', payload: alertId });
    const alert = stateRef.current.alerts.find(a => a.id === alertId);
    addToast({ type: 'success', icon: '✅', title: 'Team Dispatched', desc: `Rescue team en route to ${alert?.coordsStr}` });
  }, [addToast]);
  const toggleCamera    = useCallback(() => dispatch({ type: 'TOGGLE_CAMERA' }), []);
  const togglePause     = useCallback(() => dispatch({ type: 'TOGGLE_PAUSE' }), []);
  const focusDetection  = useCallback((id) => dispatch({ type: 'FOCUS_DETECTION', payload: id }), []);
  const selectDrone     = useCallback((id) => dispatch({ type: 'SELECT_DRONE', payload: id }), []);
  const toggleSurvivors = useCallback(() => dispatch({ type: 'TOGGLE_SURVIVORS' }), []);
  const toggleHazards   = useCallback(() => dispatch({ type: 'TOGGLE_HAZARDS' }), []);

  // ── SIMULATION INTERVALS ─────────────────────────────────
  useEffect(() => {
    // Drone telemetry: every second
    const droneInterval = setInterval(() => {
      if (!stateRef.current.missionPaused) {
        dispatch({ type: 'DRONES_STEP' });
      }
    }, 1000);

    // Countdown timers: every second
    const countdownInterval = setInterval(() => {
      dispatch({ type: 'TICK_COUNTDOWNS' });
    }, 1000);

    // New detections: every 18–32 seconds
    let detectionTimeout;
    const scheduleDetection = () => {
      const delay = 18000 + Math.random() * 14000;
      detectionTimeout = setTimeout(() => {
        if (!stateRef.current.missionPaused) {
          const drones = stateRef.current.drones;
          const idCounter = stateRef.current.detIdCounter;
          const det = generateNewDetection(drones, idCounter);
          dispatch({ type: 'ADD_DETECTION', payload: det });

          if (['critical', 'high'].includes(det.priority)) {
            const altCounter = stateRef.current.altIdCounter;
            const alert = generateAlertFromDetection(det, altCounter);
            dispatch({ type: 'ADD_ALERT', payload: alert });
            addToast({ type: det.type === 'survivor' ? 'survivor' : 'hazard', icon: det.emoji, title: det.label, desc: `${det.coordsStr} · ${(det.confidence * 100).toFixed(0)}% · ${det.droneId}` });
          }
        }
        scheduleDetection();
      }, delay);
    };
    scheduleDetection();

    // Battery low warnings
    const batteryCheckInterval = setInterval(() => {
      stateRef.current.drones.forEach(d => {
        if (d.battery < 15 && d.battery > 14.5) {
          addToast({ type: 'hazard', icon: '🔋', title: `Low Battery: ${d.name}`, desc: `${d.id} at ${d.battery.toFixed(0)}%. RTB recommended.` });
        }
      });
    }, 5000);

    // Mission start toast
    setTimeout(() => {
      addToast({ type: 'info', icon: '🚁', title: 'Mission Active: OP PRAHAR-7', desc: 'Chamoli District, Uttarakhand · 3 drones operational' });
    }, 800);

    return () => {
      clearInterval(droneInterval);
      clearInterval(countdownInterval);
      clearInterval(batteryCheckInterval);
      clearTimeout(detectionTimeout);
    };
  }, [addToast]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      addToast, removeToast,
      dispatchAlert, toggleCamera, togglePause,
      focusDetection, selectDrone,
      toggleSurvivors, toggleHazards,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
