// ── MISSION TIMER HOOK ──────────────────────────────────────
import { useState, useEffect } from 'react';

export function useMissionTimer(startTime) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const ms   = Date.now() - startTime;
      const mins = Math.floor(ms / 60000);
      const hrs  = Math.floor(mins / 60);
      const mm   = String(mins % 60).padStart(2, '0');
      const ss   = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
      setElapsed(hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return elapsed;
}

// ── SYSTEM CLOCK HOOK ───────────────────────────────────────
export function useSystemClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── FORMAT COUNTDOWN ────────────────────────────────────────
export function fmtCountdown(secs) {
  if (secs === null || secs === undefined) return '';
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}
