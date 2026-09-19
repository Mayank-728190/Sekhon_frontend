// ============================================================
// AEROSCOUT — ANALYTICS BAR (Chart.js via react-chartjs-2)
// ============================================================
import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip
} from 'chart.js';
import { useApp } from '../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const CHART_OPTIONS = (color, fill = true) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false, min: 0 } },
  elements: { point: { radius: 0 }, line: { tension: 0.4, borderWidth: 2, borderColor: color, backgroundColor: fill ? `${color}18` : 'transparent', fill: fill } },
});

const LABELS = Array.from({ length: 30 }, (_, i) => i);

function SparkLine({ label, data, color, fill = true }) {
  return (
    <div className="chart-panel">
      <div className="chart-panel-label">{label}</div>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <Line
          data={{ labels: LABELS.slice(0, data.length), datasets: [{ data }] }}
          options={CHART_OPTIONS(color, fill)}
        />
      </div>
    </div>
  );
}

export default function AnalyticsBar() {
  const { state } = useApp();

  // Rolling history refs (30 data points)
  const detHistRef  = useRef(Array(30).fill(0));
  const covHistRef  = useRef(Array(30).fill(0));
  const bat1Ref     = useRef(Array(30).fill(78));
  const bat2Ref     = useRef(Array(30).fill(62));
  const bat3Ref     = useRef(Array(30).fill(23));

  const push = (arr, val) => { arr.push(val); if (arr.length > 30) arr.shift(); };

  useEffect(() => {
    push(detHistRef.current, state.detections.length);
    push(covHistRef.current, parseFloat(state.areaCovered.toFixed(1)));
    state.drones.forEach((d, i) => {
      if (i === 0) push(bat1Ref.current, d.battery);
      if (i === 1) push(bat2Ref.current, d.battery);
      if (i === 2) push(bat3Ref.current, d.battery);
    });
  });

  const batteryData = {
    labels: LABELS.slice(0, bat1Ref.current.length),
    datasets: [
      { data: [...bat1Ref.current], borderColor: '#00d4ff', backgroundColor: 'transparent', borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false },
      { data: [...bat2Ref.current], borderColor: '#00e676', backgroundColor: 'transparent', borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false },
      { data: [...bat3Ref.current], borderColor: '#ff4500', backgroundColor: 'transparent', borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false },
    ],
  };

  const batteryOptions = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } },
    elements: { point: { radius: 0 }, line: { tension: 0.4 } },
  };

  return (
    <div className="bottom-bar">
      <div className="chart-wrapper">
        <SparkLine
          label="Detection Rate"
          data={[...detHistRef.current]}
          color="#ffb830"
        />
      </div>
      <div className="chart-wrapper">
        <SparkLine
          label="Area Coverage (km²)"
          data={[...covHistRef.current]}
          color="#00d4ff"
        />
      </div>
      <div className="chart-panel">
        <div className="chart-panel-label">Fleet Battery (%) — <span style={{ color:'#00d4ff' }}>α</span> <span style={{ color:'#00e676' }}>β</span> <span style={{ color:'#ff4500' }}>γ</span></div>
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <Line data={batteryData} options={batteryOptions} />
        </div>
      </div>
    </div>
  );
}
