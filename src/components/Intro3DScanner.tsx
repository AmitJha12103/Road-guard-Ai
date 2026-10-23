import React, { useEffect, useState, useRef } from 'react';
import { Cpu, Eye, Radio, Shield, Zap } from 'lucide-react';

interface Intro3DScannerProps {
  onComplete: () => void;
}

export const Intro3DScanner: React.FC<Intro3DScannerProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [telemetryPhase, setTelemetryPhase] = useState('INITIALIZING 3D LIDAR ROAD SENSORS...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas animation for 3D perspective point cloud
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Render loop
    const render = () => {
      t += 0.025;
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;
      const horizonY = cy;

      // Draw horizon glow
      const grad = ctx.createRadialGradient(cx, horizonY, 10, cx, horizonY, canvas.width * 0.7);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      grad.addColorStop(0.5, 'rgba(14, 116, 144, 0.08)');
      grad.addColorStop(1, 'rgba(7, 11, 20, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw 3D road perspective lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;

      const numLines = 24;
      for (let i = -numLines / 2; i <= numLines / 2; i++) {
        const spread = (i / (numLines / 2)) * (canvas.width * 0.85);
        ctx.beginPath();
        ctx.moveTo(cx, horizonY);
        ctx.lineTo(cx + spread * 2.2, canvas.height);
        ctx.stroke();
      }

      // Draw horizontal scanning grid rungs moving forward
      const numRungs = 18;
      const offset = (t * 0.5) % 1;
      for (let j = 0; j < numRungs; j++) {
        const p = (j + offset) / numRungs;
        // Non-linear depth projection
        const depth = Math.pow(p, 2.5);
        const y = horizonY + depth * (canvas.height - horizonY);
        const widthAtY = depth * canvas.width * 1.8;

        ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 + depth * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(cx - widthAtY / 2, y);
        ctx.lineTo(cx + widthAtY / 2, y);
        ctx.stroke();
      }

      // Draw 3D Pothole Cavity Wireframe in center road
      const craterCenterY = canvas.height * 0.72;
      const craterRadiusX = 140 + Math.sin(t * 3) * 5;
      const craterRadiusY = 55 + Math.cos(t * 3) * 3;

      // Outer fracture ring
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, craterCenterY, craterRadiusX, craterRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Deep crater contour rings (concentric depths)
      for (let ring = 1; ring <= 4; ring++) {
        const factor = 1 - ring * 0.18;
        const depthDrop = ring * 12;
        ctx.strokeStyle = ring === 4 ? 'rgba(239, 68, 68, 0.9)' : `rgba(249, 115, 22, ${0.8 - ring * 0.15})`;
        ctx.beginPath();
        ctx.ellipse(cx, craterCenterY + depthDrop, craterRadiusX * factor, craterRadiusY * factor, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshair target reticle
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - craterRadiusX - 40, craterCenterY);
      ctx.lineTo(cx + craterRadiusX + 40, craterCenterY);
      ctx.moveTo(cx, craterCenterY - craterRadiusY - 40);
      ctx.lineTo(cx, craterCenterY + craterRadiusY + 60);
      ctx.stroke();
      ctx.setLineDash([]);

      // Laser sweep bar traveling down
      const scanBarY = horizonY + ((Math.sin(t * 2) + 1) / 2) * (canvas.height - horizonY);
      const sweepGrad = ctx.createLinearGradient(0, scanBarY - 12, 0, scanBarY + 12);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      sweepGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.85)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, scanBarY - 6, canvas.width, 12);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Timer and progress state
  useEffect(() => {
    const startTime = Date.now();
    const duration = 3200; // 3.2 seconds duration

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 25) {
        setTelemetryPhase('PHASE 1: CALIBRATING STEREO DISPARITY SENSORS...');
      } else if (pct < 55) {
        setTelemetryPhase('PHASE 2: SEGMENTING 3D ROAD SURFACE MESH...');
      } else if (pct < 85) {
        setTelemetryPhase('PHASE 3: DETECTED PAVEMENT CAVITY · SEVERITY: CRITICAL');
      } else {
        setTelemetryPhase('PHASE 4: INITIALIZING ROADGUARD INTELLIGENCE PORTAL...');
      }

      if (pct >= 100) {
        clearInterval(interval);
        handleFinish();
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 600); // 600ms smooth fade transition
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-between bg-[#070b14] text-cyan-400 select-none overflow-hidden transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 3D Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Top HUD Telemetry */}
      <div className="relative z-10 p-6 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div className="space-y-0.5">
            <span className="text-white font-bold tracking-widest text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              ROADGUARD AI · 3D LIDAR SCANNER
            </span>
            <div className="text-[11px] text-cyan-500/90">SYS_REV: v2.4-OPTICAL-DEPTH</div>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="px-3.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold backdrop-blur transition-colors"
        >
          Skip Intro ➔
        </button>
      </div>

      {/* Center Target Telemetry Overlay */}
      <div className="relative z-10 max-w-lg mx-auto text-center space-y-3 pointer-events-none px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/50 bg-red-950/60 text-red-400 text-xs font-mono shadow-lg shadow-red-500/20">
          <Zap className="w-3.5 h-3.5 animate-pulse text-red-400" />
          <span>ROAD CAVITY RECOGNITION ACTIVE</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans drop-shadow-md">
          Autonomous Road Defect Segmentation
        </h1>

        <div className="text-xs font-mono text-cyan-300/80 max-w-sm mx-auto">
          {telemetryPhase}
        </div>
      </div>

      {/* Bottom Progress & Sensor Bar */}
      <div className="relative z-10 p-6 max-w-2xl mx-auto w-full space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-2 text-cyan-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>NEURAL SCAN IN PROGRESS</span>
          </span>
          <span className="font-bold text-white tabular-nums">{progress}%</span>
        </div>

        {/* High-tech Glowing Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-900/80 border border-cyan-500/30 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
          <span>LAT: 28.5912° N · LON: 77.1615° E</span>
          <span>EST. DEPTH: 68mm · ACCURACY: 94.8%</span>
        </div>
      </div>
    </div>
  );
};
