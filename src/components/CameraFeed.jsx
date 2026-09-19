// ============================================================
// AEROSCOUT — CAMERA FEED COMPONENT
// Canvas-based drone camera with YOLO bbox overlays
// ============================================================
import { useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const rand = (min, max) => min + Math.random() * (max - min);

function getTypeColor(type, mode) {
  if (mode === 'thermal') return type === 'survivor' ? '#ff6b35' : '#c77dff';
  const c = { survivor:'#ffb830', fire:'#ff4500', flood:'#00b4d8', debris:'#a0917e', landslide:'#c4894a', structural:'#ffea00', electrical:'#c77dff', chemical:'#00e676' };
  return c[type] || '#00d4ff';
}

function drawBackground(ctx, w, h, mode) {
  if (mode === 'rgb') {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.3);
    sky.addColorStop(0, '#0d1f3e'); sky.addColorStop(1, '#1a3a5c');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.3);
    const gnd = ctx.createLinearGradient(0, h * 0.3, 0, h);
    gnd.addColorStop(0, '#2d3b1e'); gnd.addColorStop(0.4, '#3d4a25'); gnd.addColorStop(1, '#1a2810');
    ctx.fillStyle = gnd; ctx.fillRect(0, h * 0.3, w, h);
    for (let i = 0; i < 80; i++) {
      const x = (Math.sin(i * 2.7) * 0.5 + 0.5) * w;
      const y = h * 0.35 + (Math.cos(i * 1.9) * 0.5 + 0.5) * h * 0.5;
      const r = 2 + Math.random() * 8;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.2)' : 'rgba(80,120,40,0.2)';
      ctx.beginPath(); ctx.ellipse(x, y, r * 3, r, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,120,180,0.7)'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, h * 0.55); ctx.bezierCurveTo(w * 0.3, h * 0.5, w * 0.6, h * 0.65, w, h * 0.58); ctx.stroke();
    ctx.strokeStyle = 'rgba(100,200,255,0.3)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, h * 0.54); ctx.bezierCurveTo(w * 0.3, h * 0.49, w * 0.6, h * 0.64, w, h * 0.57); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const x = (0.05 + ((i * 0.08) % 0.9)) * w;
      const y = h * 0.45 + Math.sin(i * 0.8) * h * 0.12;
      ctx.fillStyle = `rgba(${80+i*5},${70+i*3},${60+i*2},0.6)`;
      ctx.beginPath(); ctx.ellipse(x, y, 10 + i * 2, 6 + i, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    const grad = ctx.createRadialGradient(w*.5, h*.5, 0, w*.5, h*.5, w*.6);
    grad.addColorStop(0,'#1a0040'); grad.addColorStop(0.3,'#0d004a'); grad.addColorStop(0.6,'#000d2e'); grad.addColorStop(1,'#000814');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    [{ x:.3,y:.45,r:.06,hot:true },{ x:.65,y:.55,r:.04,hot:true },{ x:.5,y:.35,r:.10,hot:false },{ x:.15,y:.65,r:.05,hot:true }]
      .forEach(pt => {
        const gx = ctx.createRadialGradient(pt.x*w,pt.y*h,0,pt.x*w,pt.y*h,pt.r*w);
        if (pt.hot) { gx.addColorStop(0,'rgba(255,80,0,0.95)'); gx.addColorStop(0.4,'rgba(255,30,0,0.5)'); gx.addColorStop(1,'rgba(200,0,50,0)'); }
        else        { gx.addColorStop(0,'rgba(100,50,200,0.7)'); gx.addColorStop(0.5,'rgba(50,20,150,0.3)'); gx.addColorStop(1,'rgba(0,0,100,0)'); }
        ctx.fillStyle = gx; ctx.fillRect(0, 0, w, h);
      });
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 200; i++) ctx.fillRect(Math.random()*w, Math.random()*h, 1, 1);
  }
}

function drawBBoxes(ctx, bboxes, mode, w, h) {
  bboxes.forEach(box => {
    const color = getTypeColor(box.type, mode);
    const bx = box.x*w, by = box.y*h, bw = box.w*w, bh = box.h*h;
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([6,3]);
    ctx.strokeRect(bx, by, bw, bh); ctx.setLineDash([]);
    const cl = 10; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx,by+cl); ctx.lineTo(bx,by); ctx.lineTo(bx+cl,by);
    ctx.moveTo(bx+bw-cl,by); ctx.lineTo(bx+bw,by); ctx.lineTo(bx+bw,by+cl);
    ctx.moveTo(bx,by+bh-cl); ctx.lineTo(bx,by+bh); ctx.lineTo(bx+cl,by+bh);
    ctx.moveTo(bx+bw-cl,by+bh); ctx.lineTo(bx+bw,by+bh); ctx.lineTo(bx+bw,by+bh-cl);
    ctx.stroke(); ctx.shadowBlur = 0;
    const label = `${box.label} ${(box.confidence*100).toFixed(0)}%`;
    ctx.font = 'bold 10px Outfit,sans-serif';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle='rgba(8,12,23,0.85)'; ctx.fillRect(bx,by-20,tw+10,18);
    ctx.strokeStyle=color; ctx.lineWidth=1; ctx.strokeRect(bx,by-20,tw+10,18);
    ctx.fillStyle=color; ctx.fillText(label,bx+5,by-6);
  });
}

function drawHUD(ctx, drone, mode, w, h) {
  const cx = w/2, cy = h/2;
  ctx.strokeStyle='rgba(0,212,255,0.35)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(cx-30,cy); ctx.lineTo(cx+30,cy); ctx.moveTo(cx,cy-30); ctx.lineTo(cx,cy+30); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle='rgba(0,212,255,0.3)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(cx,cy,15,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle='rgba(0,212,255,0.2)'; ctx.lineWidth=1; ctx.strokeRect(w-52,cy-40,42,80);
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(w-52,cy-40,42,80);
  ctx.fillStyle='#00d4ff'; ctx.font='9px JetBrains Mono,monospace'; ctx.fillText('ALT',w-46,cy-26);
  ctx.font='bold 12px JetBrains Mono,monospace'; ctx.fillText(`${drone.altitude.toFixed(0)}`,w-48,cy-8);
  ctx.font='8px JetBrains Mono,monospace'; ctx.fillStyle='rgba(0,212,255,0.6)'; ctx.fillText('m AGL',w-50,cy+6);
  ctx.fillStyle='#00d4ff'; ctx.font='9px JetBrains Mono,monospace'; ctx.fillText('SPD',w-46,cy+22);
  ctx.font='bold 11px JetBrains Mono,monospace'; ctx.fillStyle='#00d4ff'; ctx.fillText(`${drone.speed.toFixed(1)}`,w-48,cy+36);
  ctx.font='8px JetBrains Mono,monospace'; ctx.fillStyle='rgba(0,212,255,0.6)'; ctx.fillText('m/s',w-45,cy+50);
  if (mode === 'thermal') { ctx.fillStyle='rgba(199,125,255,0.8)'; ctx.font='bold 10px Outfit,sans-serif'; ctx.fillText('THERMAL IR',8,h-8); }
}

export default function CameraFeed() {
  const { state, toggleCamera } = useApp();
  const canvasRef    = useRef(null);
  const animFrameRef = useRef(null);
  const bboxesRef    = useRef([]);
  const lastBboxTime = useRef(0);
  const modeRef      = useRef(state.cameraMode);

  useEffect(() => { modeRef.current = state.cameraMode; }, [state.cameraMode]);

  const activeDrone = state.drones.find(d => d.id === state.selectedDroneId) || state.drones[0];

  const refreshBBoxes = useCallback(() => {
    const dets = state.detections.filter(d => d.droneId === activeDrone.id).slice(0, 3);
    bboxesRef.current = dets.map((d, i) => ({
      x: 0.15 + i * 0.25 + Math.sin(Date.now() * 0.0003 + i) * 0.03,
      y: 0.2  + Math.cos(Date.now() * 0.0002 + i) * 0.05,
      w: d.type === 'survivor' ? 0.08 : 0.18,
      h: d.type === 'survivor' ? 0.18 : 0.12,
      label: d.label, confidence: d.confidence, type: d.type,
    }));
  }, [state.detections, activeDrone.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const parent = canvas.parentElement;
      if (parent) {
        if (canvas.width  !== parent.clientWidth)  canvas.width  = parent.clientWidth;
        if (canvas.height !== parent.clientHeight) canvas.height = parent.clientHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground(ctx, canvas.width, canvas.height, modeRef.current);
      if (Date.now() - lastBboxTime.current > 2000) { refreshBBoxes(); lastBboxTime.current = Date.now(); }
      drawBBoxes(ctx, bboxesRef.current, modeRef.current, canvas.width, canvas.height);
      drawHUD(ctx, activeDrone, modeRef.current, canvas.width, canvas.height);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [activeDrone, refreshBBoxes]);

  const mode = state.cameraMode;

  return (
    <div className="panel" id="panel-feed" style={{ position:'relative' }}>
      <div className="corner-decoration tl" />
      <div className="corner-decoration tr" />
      <div className="corner-decoration bl" />
      <div className="corner-decoration br" />

      <div className="section-header" style={{ zIndex:2, position:'relative' }}>
        <span className="section-title">
          Live Feed
          <span style={{ background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', borderRadius:4, padding:'2px 6px', color:'var(--blue-bright)', fontSize:'0.571rem', marginLeft:'4px' }}>
            {activeDrone.id}
          </span>
        </span>
        <span style={{ fontSize:'0.643rem', fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>30fps · 1080p</span>
      </div>

      <div className="feed-container">
        <div className="feed-canvas-wrap" id="feed-canvas-wrap">
          <canvas ref={canvasRef} className="feed-canvas" />
          <div className="feed-scanline" />
          <div className="feed-scan-sweep" />
          <div className="feed-hud">
            <div className="feed-hud-top">
              <div className="feed-coords-box">
                <div className="feed-coords-text">
                  LAT: {activeDrone.lat.toFixed(5)}°N<br />
                  LON: {activeDrone.lon.toFixed(5)}°E<br />
                  HDG: {activeDrone.heading.toFixed(0)}°
                </div>
              </div>
              <div className="feed-rec-indicator">
                <div className="rec-dot" />
                <span className="rec-text">REC</span>
              </div>
            </div>
            <div className="feed-hud-bottom">
              <div className={`feed-mode-badge ${mode}`}>
                {mode === 'rgb' ? 'RGB' : 'THERMAL'}
              </div>
              <div className="feed-altitude">
                <div className="feed-altitude-val">{activeDrone.altitude.toFixed(0)}m</div>
                <div className="feed-altitude-lbl">AGL</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="feed-controls">
        <button
          className={`btn-feed-toggle${mode === 'rgb' ? ' active-rgb' : ''}`}
          onClick={() => mode === 'thermal' && toggleCamera()}
        >RGB</button>
        <button
          className={`btn-feed-toggle${mode === 'thermal' ? ' active-thermal' : ''}`}
          onClick={() => mode === 'rgb' && toggleCamera()}
        >Thermal</button>
        <div style={{ flex:'0 0 auto', fontFamily:'var(--font-mono)', fontSize:'0.571rem', color:'var(--text-muted)', padding:'0 4px' }}>
          YOLO11m · <span style={{ color:'var(--green-core)' }}>23ms</span>
        </div>
      </div>
    </div>
  );
}
