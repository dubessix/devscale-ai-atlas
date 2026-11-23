import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Box,
  Cpu,
  Database,
  Expand,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Server,
  Shield,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  FlowKind,
  MetricSpec,
  NodeTone,
  ParamValues,
  SceneLink,
  SceneNode,
  SceneSpec,
  SimControl,
} from '../types/course';

interface IsometricStageProps {
  metrics: MetricSpec[];
  scene: SceneSpec;
  controls?: SimControl[];
  params?: ParamValues;
  onParamChange?: (id: string, val: number | string | boolean) => void;
  paused: boolean;
  onTogglePause: () => void;
  replayKey: number;
  onReplay: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  stepKey: string;
}

const TONE_PALETTE: Record<
  NodeTone,
  { top: string; left: string; right: string; darkTop: string; darkLeft: string; darkRight: string }
> = {
  blue: {
    top: '#cde0f5',
    left: '#b4cde9',
    right: '#9dbad9',
    darkTop: '#2c4159',
    darkLeft: '#223347',
    darkRight: '#1a2738',
  },
  orange: {
    top: '#f8d2ad',
    left: '#ebb98a',
    right: '#dca16d',
    darkTop: '#5b422b',
    darkLeft: '#493421',
    darkRight: '#3a2919',
  },
  amber: {
    top: '#fbe5bd',
    left: '#efd19c',
    right: '#dfbb7d',
    darkTop: '#584426',
    darkLeft: '#47361d',
    darkRight: '#382a15',
  },
  violet: {
    top: '#dfd3f4',
    left: '#cab9ea',
    right: '#b4a0dc',
    darkTop: '#45355c',
    darkLeft: '#37294a',
    darkRight: '#2a1f3a',
  },
  green: {
    top: '#cce4be',
    left: '#b2d39f',
    right: '#98be83',
    darkTop: '#334b2e',
    darkLeft: '#273b23',
    darkRight: '#1d2d1a',
  },
  red: {
    top: '#e3b8b2',
    left: '#cfa099',
    right: '#ba8780',
    darkTop: '#57342f',
    darkLeft: '#452824',
    darkRight: '#361e1b',
  },
  sand: {
    top: '#f5e4c3',
    left: '#e6d0a7',
    right: '#d6bc8c',
    darkTop: '#4e422c',
    darkLeft: '#3e3422',
    darkRight: '#2f2719',
  },
  muted: {
    top: '#e7dfd4',
    left: '#d4cabd',
    right: '#bfb4a5',
    darkTop: '#39342d',
    darkLeft: '#2e2a24',
    darkRight: '#24201b',
  },
};

const FLOW_STYLES: Record<FlowKind, { fill: string; stroke: string; shape: 'circle' | 'square' | 'ring' | 'x' | 'diamond' }> = {
  request: { fill: '#e8834d', stroke: '#1d1b18', shape: 'circle' },
  heavy: { fill: '#e5534b', stroke: '#1d1b18', shape: 'square' },
  response: { fill: '#7fc278', stroke: '#1d1b18', shape: 'circle' },
  health: { fill: '#ffffff', stroke: '#4caf50', shape: 'ring' },
  failed: { fill: '#e5534b', stroke: '#1d1b18', shape: 'x' },
  stream: { fill: '#2a9d8f', stroke: '#1d1b18', shape: 'circle' },
  vector: { fill: '#7c63d0', stroke: '#1d1b18', shape: 'diamond' },
  ai: { fill: '#8b68e0', stroke: '#1d1b18', shape: 'diamond' },
  cache: { fill: '#65b868', stroke: '#1d1b18', shape: 'circle' },
  db: { fill: '#5d95d9', stroke: '#1d1b18', shape: 'square' },
};

function getAnchor(node: SceneNode): { x: number; y: number } {
  if (node.kind === 'arrayViz') return { x: node.x, y: node.y };
  return { x: node.x, y: node.y };
}

function buildEdgePath(from: SceneNode, to: SceneNode, bend = 0): { d: string; mx: number; my: number; pts: [number, number][] } {
  const a = getAnchor(from);
  const b = getAnchor(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Shorten ends slightly so arrows land on node perimeters cleanly
  const padA =
    from.kind === 'users'
      ? 46
      : from.kind === 'device'
      ? 38
      : from.kind === 'cylinder'
      ? 28
      : from.kind === 'graphNode'
      ? 24
      : 34;
  const padB =
    to.kind === 'users'
      ? 46
      : to.kind === 'device'
      ? 38
      : to.kind === 'cylinder'
      ? 28
      : to.kind === 'graphNode'
      ? 24
      : 34;
  const sx = a.x + (dx / len) * Math.min(padA, len * 0.35);
  const sy = a.y + (dy / len) * Math.min(padA, len * 0.35);
  const ex = b.x - (dx / len) * Math.min(padB, len * 0.35);
  const ey = b.y - (dy / len) * Math.min(padB, len * 0.35);

  if (Math.abs(bend) > 1) {
    const nx = -dy / len;
    const ny = dx / len;
    const cx = (sx + ex) / 2 + nx * bend;
    const cy = (sy + ey) / 2 + ny * bend;
    return {
      d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      mx: (sx + 2 * cx + ex) / 4,
      my: (sy + 2 * cy + ey) / 4,
      pts: [
        [sx, sy],
        [cx, cy],
        [ex, ey],
      ],
    };
  }

  return {
    d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`,
    mx: (sx + ex) / 2,
    my: (sy + ey) / 2,
    pts: [
      [sx, sy],
      [ex, ey],
    ],
  };
}

function evalPathPoint(pts: [number, number][], t: number): [number, number] {
  if (pts.length === 2) {
    const [a, b] = pts;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  const [p0, p1, p2] = pts;
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

function NodeGlyph({ icon }: { icon?: SceneNode['icon'] }) {
  switch (icon) {
    case 'lb':
      return (
        <g stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="-6" cy="0" r="2.2" fill="currentColor" />
          <path d="M-3.5 0 H2 M2 -5 V5 M2 -5 H7 M2 0 H7 M2 5 H7" />
          <circle cx="8" cy="-5" r="1.3" fill="currentColor" />
          <circle cx="8" cy="0" r="1.3" fill="currentColor" />
          <circle cx="8" cy="5" r="1.3" fill="currentColor" />
        </g>
      );
    case 'ai':
      return (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0 -8 L2.2 -2.2 L8 0 L2.2 2.2 L0 8 L-2.2 2.2 L-8 0 L-2.2 -2.2 Z" />
          <circle cx="6.5" cy="-6" r="1.1" fill="currentColor" />
        </g>
      );
    case 'vector':
      return (
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
          <circle cx="-5" cy="-3" r="2" />
          <circle cx="5" cy="-4" r="2" />
          <circle cx="0" cy="5" r="2" />
          <path d="M-3.2 -2.5 L3.2 -3.6 M-4 -1 L-1 3.3 M4 -2.2 L1 3.3" />
        </g>
      );
    case 'cache':
      return (
        <path
          d="M1 -8 L-5 1 H0 L-2 8 L6 -1 H1 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      );
    case 'queue':
      return (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M-7 -4 H7 M-7 0 H7 M-7 4 H7" />
          <path d="M4 -6.5 L7 -4 L4 -1.5" />
        </g>
      );
    case 'shield':
      return (
        <path
          d="M0 -8 L7 -5 V1 C7 5 3.5 7.5 0 9 C-3.5 7.5 -7 5 -7 1 V-5 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      );
    case 'lock':
      return (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="-5.5" y="-1" width="11" height="8" rx="2" />
          <path d="M-3 -1 V-4 A3 3 0 0 1 3 -4 V-1" />
        </g>
      );
    case 'filter':
      return (
        <path
          d="M-7 -6 H7 L2 1 V7 L-2 5 V1 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      );
    case 'globe':
    case 'cdn':
      return (
        <g stroke="currentColor" strokeWidth="1.4" fill="none">
          <circle cx="0" cy="0" r="7.5" />
          <ellipse cx="0" cy="0" rx="3.4" ry="7.5" />
          <path d="M-7.2 0 H7.2" />
        </g>
      );
    case 'search':
      return (
        <g stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round">
          <circle cx="-1.5" cy="-1.5" r="5" />
          <path d="M2.2 2.2 L6.5 6.5" />
        </g>
      );
    case 'loop':
      return (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M-5.5 -2 A6 6 0 1 1 -3 5" />
          <path d="M-7.5 -1 L-5.5 -4 L-3 -1.5" />
        </g>
      );
    case 'code':
      return (
        <g stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-3 -4 L-7 0 L-3 4 M3 -4 L7 0 L3 4 M1 -5 L-1 5" />
        </g>
      );
    default:
      return (
        <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round">
          <rect x="-8" y="-6" width="16" height="5" rx="1.2" />
          <rect x="-8" y="1" width="16" height="5" rx="1.2" />
          <circle cx="-4.5" cy="-3.5" r="0.8" fill="currentColor" />
          <circle cx="-4.5" cy="3.5" r="0.8" fill="currentColor" />
        </g>
      );
  }
}

export const IsometricStage: React.FC<IsometricStageProps> = ({
  metrics,
  scene,
  controls,
  params = {},
  onParamChange,
  paused,
  onTogglePause,
  replayKey,
  onReplay,
  isFullscreen,
  onToggleFullscreen,
  stepKey,
}) => {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
  );
  const [zoom, setZoom] = useState({ k: 1, tx: 0, ty: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [tickPhase, setTickPhase] = useState(0);
  const prevMetricMap = useRef<Record<string, string>>({});
  const [changedMetrics, setChangedMetrics] = useState<Record<string, boolean>>({});

  // Sync theme attribute changes
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.dataset.theme === 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Flash updated metrics
  useEffect(() => {
    const nextChanged: Record<string, boolean> = {};
    metrics.forEach((m) => {
      if (prevMetricMap.current[m.id] !== undefined && prevMetricMap.current[m.id] !== m.value) {
        nextChanged[m.id] = true;
      }
      prevMetricMap.current[m.id] = m.value;
    });
    if (Object.keys(nextChanged).length > 0) {
      setChangedMetrics(nextChanged);
      const timer = setTimeout(() => setChangedMetrics({}), 900);
      return () => clearTimeout(timer);
    }
  }, [metrics]);

  // Clear inspected node when step changes
  useEffect(() => {
    setInspectedId(null);
  }, [stepKey]);

  // Smooth 60fps particle animation clock
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setTickPhase((p) => (p + dt) % 10000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, replayKey]);

  // Keyboard shortcuts for Fit (0)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '0') setZoom({ k: 1, tx: 0, ty: 0 });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const nodeMap = useMemo(() => {
    const m = new Map<string, SceneNode>();
    scene.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [scene.nodes]);

  const inspectedNode = inspectedId ? nodeMap.get(inspectedId) ?? null : null;

  const isZoomed = zoom.k > 1.02;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom((prev) => {
        const nk = Math.max(1, Math.min(2.6, prev.k * delta));
        if (nk === 1) return { k: 1, tx: 0, ty: 0 };
        return { ...prev, k: nk };
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    setDragging(true);
    dragOrigin.current = { x: e.clientX, y: e.clientY, tx: zoom.tx, ty: zoom.ty };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragOrigin.current) return;
    const dx = (e.clientX - dragOrigin.current.x) / zoom.k;
    const dy = (e.clientY - dragOrigin.current.y) / zoom.k;
    setZoom((prev) => ({
      ...prev,
      tx: Math.max(-220, Math.min(220, dragOrigin.current!.tx + dx)),
      ty: Math.max(-160, Math.min(160, dragOrigin.current!.ty + dy)),
    }));
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragOrigin.current = null;
  };

  const viewBox = useMemo(() => {
    const w = 800 / zoom.k;
    const h = 470 / zoom.k;
    const cx = 400 - zoom.tx;
    const cy = 235 - zoom.ty;
    return `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
  }, [zoom]);

  const zones = scene.nodes.filter((n) => n.kind === 'zone');
  const mainNodes = scene.nodes.filter((n) => n.kind !== 'zone');

  return (
    <section className={`card stage ${isFullscreen ? 'is-full' : ''}`}>
      {/* Top-Left Telemetry HUD */}
      <div className="stage__hud">
        {metrics.map((m) => (
          <div
            key={m.id}
            className={`chip ${changedMetrics[m.id] ? 'is-changed' : ''}`}
            data-level={m.level || 'neutral'}
          >
            <span className="chip__label">
              <Activity size={10} />
              {m.label}
            </span>
            <span key={m.value} className="chip__value is-swap">
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Top-Right Stage Controls */}
      <div className="stage__tools">
        {isZoomed && (
          <button
            type="button"
            className="tool"
            title="Reset zoom (0)"
            onClick={() => setZoom({ k: 1, tx: 0, ty: 0 })}
          >
            <ZoomOut size={14} />
            <span>Fit</span>
          </button>
        )}
        <button
          type="button"
          className="tool"
          title="Zoom in"
          onClick={() =>
            setZoom((z) => ({ ...z, k: Math.min(2.6, z.k * 1.25) }))
          }
        >
          <ZoomIn size={14} />
        </button>
        <button type="button" className="tool" title="Replay step (R)" onClick={onReplay}>
          <RotateCcw size={14} />
          <span>Replay</span>
        </button>
        <button
          type="button"
          className={`tool ${paused ? 'is-on' : ''}`}
          title="Pause traffic (Space)"
          onClick={onTogglePause}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          <span>{paused ? 'Resume' : 'Pause'}</span>
        </button>
        {onToggleFullscreen && (
          <button
            type="button"
            className="tool tool--expand"
            title={isFullscreen ? 'Exit full screen' : 'Full screen diagram'}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Expand size={14} />}
          </button>
        )}
      </div>

      {/* Main SVG Canvas */}
      <div
        className={`stage__canvas ${isZoomed ? 'is-zoomed' : ''} ${dragging ? 'is-dragging' : ''}`}
        onDoubleClick={() =>
          setZoom((z) => (z.k > 1.05 ? { k: 1, tx: 0, ty: 0 } : { k: 1.55, tx: 0, ty: 0 }))
        }
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg className="stage-svg" viewBox={viewBox} role="img" aria-label="Interactive isometric system diagram">
          <defs>
            <pattern id="iso-grid" patternUnits="userSpaceOnUse" x="0" y="-7" width="28" height="14">
              <path
                d="M0 7 L14 0 L28 7 L14 14 Z"
                fill="none"
                stroke="var(--grid-stroke)"
                strokeOpacity={dark ? 0.22 : 0.28}
                strokeWidth="0.8"
              />
            </pattern>
            <radialGradient id="grid-fade" cx="50%" cy="50%" r="52%">
              <stop offset="40%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="grid-mask">
              <rect x="0" y="0" width="800" height="470" fill="url(#grid-fade)" />
            </mask>
            <marker id="arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M1,1.4 L9,5 L1,8.6 Z" fill="var(--ink-2)" />
            </marker>
            <marker id="arrow-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1,1.4 L9,5 L1,8.6 Z" fill="var(--muted)" />
            </marker>
            <filter id="glow-bad" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Soft Isometric Grid Background */}
          <rect x="0" y="0" width="800" height="470" fill="url(#iso-grid)" mask="url(#grid-mask)" />

          {/* Isometric Floor Cluster Zones */}
          {zones.map((z) => {
            const hw = (z.w || 160) / 2;
            const hh = (z.h || 85) / 2;
            const pts = `${z.x},${z.y - hh} ${z.x + hw},${z.y} ${z.x},${z.y + hh} ${z.x - hw},${z.y}`;
            return (
              <g key={z.id} opacity={z.dimmed ? 0.4 : 0.92}>
                <polygon
                  points={pts}
                  fill={dark ? 'rgba(255,255,255,0.02)' : 'rgba(29,27,24,0.025)'}
                  stroke="var(--muted)"
                  strokeWidth="1.2"
                  strokeDasharray="5 4"
                />
                <text
                  x={z.x - hw * 0.45}
                  y={z.y + hh * 0.68}
                  fill="var(--muted)"
                  fontSize="9.5"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  transform={`rotate(26, ${z.x - hw * 0.45}, ${z.y + hh * 0.68})`}
                >
                  {z.label.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Links & Animated Flow Particles */}
          {scene.links.map((link: SceneLink) => {
            const from = nodeMap.get(link.from);
            const to = nodeMap.get(link.to);
            if (!from || !to) return null;
            const { d, mx, my, pts } = buildEdgePath(from, to, link.bend || 0);
            const flow = link.flow;
            const fStyle = flow ? FLOW_STYLES[flow.kind] : null;
            const rate = flow?.rate ?? 1;
            const speed = flow?.speed ?? 1;
            const count = flow ? Math.max(1, Math.min(4, Math.round(rate * 2))) : 0;

            return (
              <g key={link.id} opacity={link.dimmed ? 0.32 : 1}>
                <path
                  d={d}
                  fill="none"
                  stroke={link.dimmed ? 'var(--muted)' : 'var(--ink-2)'}
                  strokeWidth={link.dashed ? 1.3 : 1.7}
                  strokeDasharray={link.dashed ? '5 4' : undefined}
                  markerEnd={link.dimmed ? 'url(#arrow-dim)' : 'url(#arrow-end)'}
                  markerStart={link.bidirectional ? 'url(#arrow-end)' : undefined}
                />

                {/* Animated Particles */}
                {flow &&
                  fStyle &&
                  Array.from({ length: count }).map((_, idx) => {
                    const rawT = (tickPhase * speed * 0.48 + idx / count) % 1;
                    const t = flow.reverse ? 1 - rawT : rawT;
                    const [px, py] = evalPathPoint(pts, t);
                    if (fStyle.shape === 'square') {
                      return (
                        <rect
                          key={idx}
                          x={px - 4.2}
                          y={py - 4.2}
                          width={8.4}
                          height={8.4}
                          rx={2}
                          fill={fStyle.fill}
                          stroke={fStyle.stroke}
                          strokeWidth="1.2"
                        />
                      );
                    }
                    if (fStyle.shape === 'diamond') {
                      return (
                        <polygon
                          key={idx}
                          points={`${px},${py - 5} ${px + 5},${py} ${px},${py + 5} ${px - 5},${py}`}
                          fill={fStyle.fill}
                          stroke={fStyle.stroke}
                          strokeWidth="1.2"
                        />
                      );
                    }
                    if (fStyle.shape === 'ring') {
                      return (
                        <circle
                          key={idx}
                          cx={px}
                          cy={py}
                          r={4.2}
                          fill={fStyle.fill}
                          stroke={fStyle.stroke}
                          strokeWidth="1.8"
                        />
                      );
                    }
                    if (fStyle.shape === 'x') {
                      return (
                        <g key={idx} transform={`translate(${px}, ${py})`}>
                          <circle r={5} fill={fStyle.fill} stroke={fStyle.stroke} strokeWidth="1.1" />
                          <path d="M-2 -2 L2 2 M2 -2 L-2 2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
                        </g>
                      );
                    }
                    return (
                      <circle
                        key={idx}
                        cx={px}
                        cy={py}
                        r={4.2}
                        fill={fStyle.fill}
                        stroke={fStyle.stroke}
                        strokeWidth="1.2"
                      />
                    );
                  })}

                {/* Edge Label Pill */}
                {link.label && (
                  <g transform={`translate(${mx}, ${my - 9})`}>
                    <rect
                      x={-(link.label.length * 3.4 + 10)}
                      y={-10}
                      width={link.label.length * 6.8 + 20}
                      height={19}
                      rx={9.5}
                      fill="var(--crisp)"
                      stroke="var(--ink-2)"
                      strokeWidth="1.2"
                    />
                    <text
                      textAnchor="middle"
                      y={3}
                      fill="var(--ink)"
                      fontSize="9.8"
                      fontWeight="700"
                    >
                      {link.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Isometric Nodes */}
          {mainNodes.map((node) => {
            const pal = TONE_PALETTE[node.tone || 'blue'];
            const topColor = dark ? pal.darkTop : pal.top;
            const leftColor = dark ? pal.darkLeft : pal.left;
            const rightColor = dark ? pal.darkRight : pal.right;
            const inkStroke = 'var(--ink)';
            const isSelected = inspectedId === node.id;
            const clickable = Boolean(node.inspect);

            const glowColor =
              node.glow === 'bad'
                ? 'rgba(229, 83, 75, 0.35)'
                : node.glow === 'warn'
                ? 'rgba(232, 163, 58, 0.32)'
                : node.glow === 'good'
                ? 'rgba(127, 194, 120, 0.32)'
                : null;

            return (
              <g
                key={node.id}
                opacity={node.dimmed ? 0.32 : 1}
                style={{ cursor: clickable ? 'pointer' : 'default' }}
                onClick={(e) => {
                  if (!clickable) return;
                  e.stopPropagation();
                  setInspectedId((cur) => (cur === node.id ? null : node.id));
                }}
              >
                {/* Glow Halo */}
                {glowColor && (
                  <ellipse
                    cx={node.x}
                    cy={node.y + 8}
                    rx={58}
                    ry={32}
                    fill={glowColor}
                    style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
                  />
                )}

                {/* Selection Highlight Ring */}
                {isSelected && (
                  <ellipse
                    cx={node.x}
                    cy={node.y + 8}
                    rx={60}
                    ry={34}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}

                {/* BOX NODE (Isometric Rounded Prism) */}
                {node.kind === 'box' && (
                  <g transform={`translate(${node.x}, ${node.y})`}>
                    {/* Soft Ground Shadow */}
                    <polygon points="0,37 58,8 0,-18 -58,8" fill="rgba(29,27,24,0.12)" transform="translate(0, 13)" />
                    {/* Left Bevel Wall */}
                    <path
                      d="M-56 0 L0 29 V46 L-56 17 Z"
                      fill={leftColor}
                      stroke={inkStroke}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    {/* Right Bevel Wall */}
                    <path
                      d="M56 0 L0 29 V46 L56 17 Z"
                      fill={rightColor}
                      stroke={inkStroke}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    {/* Top Diamond Face */}
                    <path
                      d="M0 -31 L56 0 L0 29 L-56 0 Z"
                      fill={topColor}
                      stroke={inkStroke}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    {/* Crisp Centered Isometric Emblem */}
                    <g transform="translate(0, -2) scale(1.12)" color="var(--ink)">
                      <NodeGlyph icon={node.icon} />
                    </g>
                    {/* Crisp Label Pill Beneath Prism (Zero Diamond Overflow / Overlap) */}
                    {(() => {
                      const pillW = Math.max(node.label.length * 6.4 + 22, 74);
                      return (
                        <g transform="translate(0, 56)">
                          <rect
                            x={-pillW / 2}
                            y={-10}
                            width={pillW}
                            height={20}
                            rx={10}
                            fill="var(--crisp)"
                            stroke={inkStroke}
                            strokeWidth="1.3"
                          />
                          <text textAnchor="middle" y={3.5} fill="var(--ink)" fontSize="10" fontWeight="800">
                            {node.label}
                          </text>
                          {node.sublabel && (
                            <text textAnchor="middle" y={21} fill="var(--ink-2)" fontSize="8.8" fontWeight="700">
                              {node.sublabel}
                            </text>
                          )}
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* CYLINDER NODE (3D Isometric Database / Cache / Vector DB) */}
                {node.kind === 'cylinder' && (
                  <g transform={`translate(${node.x}, ${node.y})`}>
                    <ellipse cx="0" cy="24" rx="34" ry="16" fill="rgba(29,27,24,0.13)" />
                    <path
                      d="M-32 -8 V18 A32 14 0 0 0 32 18 V-8 Z"
                      fill={leftColor}
                      stroke={inkStroke}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    {/* Horizontal Storage Rings */}
                    <path d="M-32 1 A32 13 0 0 0 32 1" fill="none" stroke={inkStroke} strokeOpacity="0.35" strokeWidth="1.1" />
                    <path d="M-32 10 A32 13 0 0 0 32 10" fill="none" stroke={inkStroke} strokeOpacity="0.35" strokeWidth="1.1" />
                    {/* Top Ellipse */}
                    <ellipse
                      cx="0"
                      cy="-8"
                      rx="32"
                      ry="14"
                      fill={topColor}
                      stroke={inkStroke}
                      strokeWidth="1.5"
                    />
                    <g transform="translate(0, -8)" color="var(--ink)">
                      <NodeGlyph icon={node.icon || 'db'} />
                    </g>
                    {/* Label Pill */}
                    {(() => {
                      const pillW = Math.max(node.label.length * 6.6 + 24, 74);
                      return (
                        <g transform="translate(0, 32)">
                          <rect
                            x={-pillW / 2}
                            y={-9}
                            width={pillW}
                            height={18}
                            rx={9}
                            fill="var(--crisp)"
                            stroke={inkStroke}
                            strokeWidth="1.3"
                          />
                          <text textAnchor="middle" y={3.5} fill="var(--ink)" fontSize="9.8" fontWeight="700">
                            {node.label}
                          </text>
                          {node.sublabel && (
                            <text textAnchor="middle" y={19} fill="var(--ink-2)" fontSize="8.6" fontWeight="700">
                              {node.sublabel}
                            </text>
                          )}
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* DEVICE NODE (Isometric Laptop / Phone Pad) */}
                {node.kind === 'device' && (
                  <g transform={`translate(${node.x}, ${node.y})`}>
                    {/* Isometric Base Pad */}
                    <path
                      d="M-50 4 L0 -20 L50 4 L0 28 Z"
                      fill={dark ? '#383129' : '#e9dfd2'}
                      stroke={inkStroke}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M-50 4 L0 28 V34 L-50 10 Z"
                      fill={dark ? '#2b251f' : '#d5c9ba'}
                      stroke={inkStroke}
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M50 4 L0 28 V34 L50 10 Z"
                      fill={dark ? '#221d18' : '#c4b7a7'}
                      stroke={inkStroke}
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    {node.icon === 'phone' ? (
                      <g transform="translate(0, -8)">
                        <rect x="-11" y="-22" width="22" height="36" rx="4" fill="#2d2925" stroke={inkStroke} strokeWidth="1.5" />
                        <rect x="-8.5" y="-17" width="17" height="26" rx="2" fill="var(--crisp)" />
                        <rect x="-6" y="-13" width="12" height="5" rx="1.5" fill="var(--violet)" />
                        <rect x="-6" y="-5" width="12" height="10" rx="1.5" fill="var(--green)" />
                      </g>
                    ) : (
                      <g transform="translate(0, -6)">
                        {/* Screen */}
                        <path
                          d="M-20 -26 L16 -42 L16 -12 L-20 4 Z"
                          fill="#2d2925"
                          stroke={inkStroke}
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M-17 -23 L13 -37 L13 -14 L-17 0 Z"
                          fill="var(--crisp)"
                        />
                        <path d="M-14 -18 L8 -28" stroke="var(--violet)" strokeWidth="4" strokeLinecap="round" />
                        <path d="M-14 -10 L3 -18" stroke="var(--green-2)" strokeWidth="3" strokeLinecap="round" />
                        {/* Keyboard Base */}
                        <path
                          d="M-20 4 L16 -12 L34 -2 L-2 15 Z"
                          fill={dark ? '#5a5248' : '#ebe3d8'}
                          stroke={inkStroke}
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                      </g>
                    )}
                    <g transform="translate(0, 46)">
                      <rect
                        x={-(node.label.length * 3.5 + 14)}
                        y={-10}
                        width={node.label.length * 7 + 28}
                        height={20}
                        rx={10}
                        fill="var(--crisp)"
                        stroke={inkStroke}
                        strokeWidth="1.3"
                      />
                      <text textAnchor="middle" y={3.5} fill="var(--ink)" fontSize="10.2" fontWeight="800">
                        {node.label}
                      </text>
                    </g>
                  </g>
                )}

                {/* USERS CROWD NODE */}
                {node.kind === 'users' && (
                  <g transform={`translate(${node.x}, ${node.y})`}>
                    <path
                      d="M-64 4 L0 -26 L64 4 L0 34 Z"
                      fill={dark ? '#383129' : '#ece2d5'}
                      stroke={inkStroke}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M-64 4 L0 34 V40 L-64 10 Z"
                      fill={dark ? '#2a241e' : '#d5c9ba'}
                      stroke={inkStroke}
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M64 4 L0 34 V40 L64 10 Z"
                      fill={dark ? '#211c17' : '#c4b7a7'}
                      stroke={inkStroke}
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    {[
                      [-24, -6, '#b7d4f2'],
                      [-6, -12, '#f5c3a6'],
                      [12, -8, '#d5c4f0'],
                      [-32, 4, '#cbe3b5'],
                      [-14, 0, '#f4d58d'],
                      [4, 2, '#f2b8b5'],
                      [24, 0, '#b7d4f2'],
                      [-18, 12, '#d5c4f0'],
                      [0, 14, '#cbe3b5'],
                      [18, 11, '#f5c3a6'],
                    ].map(([ux, uy, col], i) => (
                      <g key={i} transform={`translate(${ux}, ${uy})`}>
                        <rect x="-4.5" y="-5" width="9" height="11" rx="4" fill={String(col)} stroke={inkStroke} strokeWidth="1.2" />
                        <circle cx="0" cy="-9" r="3.4" fill={String(col)} stroke={inkStroke} strokeWidth="1.2" />
                      </g>
                    ))}
                    <g transform="translate(0, 50)">
                      <rect
                        x={-(node.label.length * 3.5 + 16)}
                        y={-10}
                        width={node.label.length * 7 + 32}
                        height={20}
                        rx={10}
                        fill="var(--crisp)"
                        stroke={inkStroke}
                        strokeWidth="1.3"
                      />
                      <text textAnchor="middle" y={3.5} fill="var(--ink)" fontSize="10.2" fontWeight="800">
                        {node.label}
                      </text>
                    </g>
                  </g>
                )}

                {/* CODE / CONTRACT CARD NODE */}
                {node.kind === 'codeCard' && (
                  <g transform={`translate(${node.x}, ${node.y})`}>
                    {(() => {
                      const lines = node.lines || [];
                      const width = 232;
                      const height = 38 + lines.length * 15;
                      const border = node.codeStatus === 'alert' ? 'var(--bad)' : node.codeStatus === 'good' ? 'var(--good)' : 'var(--line-strong)';
                      return (
                        <g transform={`translate(${-width / 2}, ${-height / 2})`}>
                          <rect
                            width={width}
                            height={height}
                            rx={10}
                            fill="var(--crisp)"
                            stroke={border}
                            strokeWidth="1.5"
                          />
                          <text x="12" y="18" fill="var(--muted)" fontSize="9.5" fontWeight="800" letterSpacing="0.06em">
                            {node.label.toUpperCase()}
                          </text>
                          <line x1="10" y1="25" x2={width - 10} y2="25" stroke="var(--line)" strokeWidth="1" />
                          {lines.map((ln, idx) => (
                            <text
                              key={idx}
                              x="12"
                              y={40 + idx * 15}
                              fill={ln.startsWith('!') ? 'var(--bad)' : ln.startsWith('✓') ? 'var(--green-ink)' : 'var(--ink-2)'}
                              fontSize="10"
                              fontWeight={ln.startsWith('!') || ln.startsWith('✓') ? '800' : '500'}
                            >
                              {ln}
                            </text>
                          ))}
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* INTERACTIVE DSA ARRAY / WINDOW / HASHMAP VISUALIZER */}
                {node.kind === 'arrayViz' && node.arrayData && (
                  <g transform={`translate(${node.x}, ${node.y})`}>
                    {(() => {
                      const { cells, pointers = [], highlights = [], summary, hashEntries = [] } = node.arrayData;
                      const cw = 36;
                      const totalW = Math.max(260, cells.length * cw + 24);
                      const startX = -((cells.length * cw) / 2);
                      const cardH = hashEntries.length > 0 ? 128 : 92;
                      return (
                        <g>
                          <rect
                            x={-totalW / 2}
                            y={-cardH / 2}
                            width={totalW}
                            height={cardH}
                            rx={12}
                            fill="var(--crisp)"
                            stroke={inkStroke}
                            strokeWidth="1.5"
                          />
                          <text
                            x={-totalW / 2 + 12}
                            y={-cardH / 2 + 17}
                            fill="var(--muted)"
                            fontSize="9.5"
                            fontWeight="800"
                            letterSpacing="0.06em"
                          >
                            {node.label.toUpperCase()}
                          </text>
                          {summary && (
                            <text
                              x={totalW / 2 - 12}
                              y={-cardH / 2 + 17}
                              textAnchor="end"
                              fill="var(--ink)"
                              fontSize="10"
                              fontWeight="800"
                            >
                              {summary}
                            </text>
                          )}

                          {/* Cells */}
                          {cells.map((val, i) => {
                            const cx = startX + i * cw;
                            const isHl = highlights.includes(i);
                            return (
                              <g key={i} transform={`translate(${cx}, -12)`}>
                                <rect
                                  x={2}
                                  y={0}
                                  width={cw - 4}
                                  height={30}
                                  rx={6}
                                  fill={isHl ? 'var(--green)' : 'var(--paper)'}
                                  stroke={isHl ? 'var(--ink)' : 'var(--line-strong)'}
                                  strokeWidth={isHl ? '1.6' : '1.2'}
                                />
                                <text x={cw / 2} y={19} textAnchor="middle" fill="var(--ink)" fontSize="12" fontWeight="800">
                                  {val}
                                </text>
                                <text x={cw / 2} y={40} textAnchor="middle" fill="var(--muted-2)" fontSize="8.5">
                                  [{i}]
                                </text>
                              </g>
                            );
                          })}

                          {/* Pointers (L, R, i, j) */}
                          {pointers.map((ptr, pIdx) => {
                            const px = startX + ptr.index * cw + cw / 2;
                            return (
                              <g key={pIdx} transform={`translate(${px}, -23)`}>
                                <rect
                                  x={-11}
                                  y={-8}
                                  width={22}
                                  height={15}
                                  rx={5}
                                  fill={ptr.color || 'var(--orange)'}
                                  stroke={inkStroke}
                                  strokeWidth="1.2"
                                />
                                <text textAnchor="middle" y={3} fill="var(--ink)" fontSize="9.5" fontWeight="800">
                                  {ptr.label}
                                </text>
                              </g>
                            );
                          })}

                          {/* Optional Hash Map / Memo Slots */}
                          {hashEntries.length > 0 && (
                            <g transform={`translate(${-totalW / 2 + 12}, 38)`}>
                              <text fill="var(--muted)" fontSize="9" fontWeight="800">
                                HASH / STATE:
                              </text>
                              <g transform="translate(82, -10)">
                                {hashEntries.slice(0, 4).map(([k, v], idx) => (
                                  <g key={k} transform={`translate(${idx * 62}, 0)`}>
                                    <rect width="56" height="18" rx="5" fill="var(--violet)" stroke={inkStroke} strokeWidth="1" />
                                    <text x="28" y="12.5" textAnchor="middle" fill="var(--ink)" fontSize="9.2" fontWeight="700">
                                      {k}:{v}
                                    </text>
                                  </g>
                                ))}
                              </g>
                            </g>
                          )}
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* GRAPH / TREE NODE (DSA BST, Trie, BFS/DFS, Dijkstra) */}
                {node.kind === 'graphNode' && (
                  <g transform={`translate(${node.x}, ${node.y})`}>
                    {(() => {
                      const st = node.graphState?.status || 'unvisited';
                      const fill =
                        st === 'path'
                          ? 'var(--green)'
                          : st === 'frontier'
                          ? 'var(--amber-soft)'
                          : st === 'visited'
                          ? 'var(--blue-soft)'
                          : 'var(--crisp)';
                      return (
                        <>
                          <ellipse cx="0" cy="19" rx="22" ry="7" fill="rgba(29,27,24,0.12)" />
                          <circle
                            cx="0"
                            cy="0"
                            r="22"
                            fill={fill}
                            stroke={inkStroke}
                            strokeWidth={st === 'path' || st === 'frontier' ? '2' : '1.5'}
                          />
                          <text textAnchor="middle" y="4" fill="var(--ink)" fontSize="11.5" fontWeight="800">
                            {node.label}
                          </text>
                          {node.sublabel && (
                            <text textAnchor="middle" y="34" fill="var(--muted)" fontSize="9.2" fontWeight="700">
                              {node.sublabel}
                            </text>
                          )}
                          {node.graphState?.badge && (
                            <g transform="translate(18, -18)">
                              <rect x="-18" y="-9" width="36" height="16" rx="8" fill="var(--violet)" stroke={inkStroke} strokeWidth="1.2" />
                              <text textAnchor="middle" y="2.5" fill="var(--ink)" fontSize="8.8" fontWeight="800">
                                {node.graphState.badge}
                              </text>
                            </g>
                          )}
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* 2D DP TABLE / SELF-ATTENTION MATRIX VISUALIZER */}
                {node.kind === 'matrixViz' && node.matrixData && (
                  <g transform={`translate(${node.x}, ${node.y})`}>
                    {(() => {
                      const { rowLabels, colLabels, values, active, deps = [], formula } = node.matrixData;
                      const cw = 46;
                      const ch = 26;
                      const leftPad = 56;
                      const topPad = 44;
                      const gridW = leftPad + colLabels.length * cw + 20;
                      const labelW = (node.label?.length || 0) * 6.4 + 28;
                      const formulaW = formula ? formula.length * 6.3 + 30 : 0;
                      const w = Math.max(gridW, labelW, formulaW);
                      const gridLeft = (w - (leftPad + colLabels.length * cw)) / 2 + leftPad;
                      const h = topPad + rowLabels.length * ch + (formula ? 34 : 16);
                      const ox = -w / 2;
                      const oy = -h / 2;
                      const isDep = (r: number, c: number) => deps.some(([dr, dc]) => dr === r && dc === c);
                      return (
                        <g>
                          <rect x={ox} y={oy} width={w} height={h} rx={12} fill="var(--crisp)" stroke={inkStroke} strokeWidth="1.5" />
                          <text x={0} y={oy + 19} textAnchor="middle" fill="var(--muted)" fontSize="9.5" fontWeight="800" letterSpacing="0.05em">
                            {node.label.toUpperCase()}
                          </text>
                          {colLabels.map((cl, cIdx) => (
                            <text
                              key={cIdx}
                              x={ox + gridLeft + cIdx * cw + cw / 2}
                              y={oy + topPad - 6}
                              textAnchor="middle"
                              fill="var(--muted)"
                              fontSize="9.5"
                              fontWeight="800"
                            >
                              {cl}
                            </text>
                          ))}
                          {rowLabels.map((rl, rIdx) => (
                            <g key={rIdx}>
                              <text
                                x={ox + gridLeft - 8}
                                y={oy + topPad + rIdx * ch + 17}
                                textAnchor="end"
                                fill="var(--muted)"
                                fontSize="9.5"
                                fontWeight="800"
                              >
                                {rl}
                              </text>
                              {values[rIdx].map((cell, cIdx) => {
                                const isAct = active && active[0] === rIdx && active[1] === cIdx;
                                const dep = isDep(rIdx, cIdx);
                                return (
                                  <g key={cIdx} transform={`translate(${ox + gridLeft + cIdx * cw}, ${oy + topPad + rIdx * ch})`}>
                                    <rect
                                      x={2}
                                      y={2}
                                      width={cw - 4}
                                      height={ch - 4}
                                      rx={5}
                                      fill={isAct ? 'var(--green)' : dep ? 'var(--amber-soft)' : 'var(--paper)'}
                                      stroke={isAct ? inkStroke : dep ? 'var(--amber-ink)' : 'var(--line-strong)'}
                                      strokeWidth={isAct ? '1.6' : '1.1'}
                                    />
                                    <text x={cw / 2} y={17} textAnchor="middle" fill="var(--ink)" fontSize="10.5" fontWeight={isAct ? '800' : '600'}>
                                      {cell}
                                    </text>
                                  </g>
                                );
                              })}
                            </g>
                          ))}
                          {formula && (
                            <text x={0} y={oy + h - 12} textAnchor="middle" fill="var(--ink)" fontSize="9.8" fontWeight="800">
                              {formula}
                            </text>
                          )}
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* CPU / LOAD METER PILL ABOVE NODE */}
                {typeof node.load === 'number' && (
                  <g transform={`translate(${node.x}, ${node.y - (node.kind === 'cylinder' ? 38 : 48)})`}>
                    <rect
                      x="-44"
                      y="-10"
                      width="88"
                      height="20"
                      rx={10}
                      fill="var(--crisp)"
                      stroke={inkStroke}
                      strokeWidth="1.3"
                    />
                    <circle cx="-33" cy="0" r="4" fill="none" stroke="var(--muted)" strokeWidth="1.5" />
                    <rect x="-24" y="-3" width="36" height="6" rx="3" fill="var(--line)" />
                    <rect
                      x="-24"
                      y="-3"
                      width={Math.max(3, (Math.min(100, node.load) / 100) * 36)}
                      height="6"
                      rx="3"
                      fill={node.load >= 85 ? 'var(--bad)' : node.load >= 65 ? 'var(--warn)' : 'var(--good)'}
                    />
                    <text x="36" y="3.5" textAnchor="end" fill="var(--ink)" fontSize="9.5" fontWeight="800">
                      {Math.round(node.load)}%
                    </text>
                  </g>
                )}

                {/* FLOATING STATUS TAG PILL (e.g. "23 queued" or "VIP") */}
                {node.tag && (
                  <g
                    transform={`translate(${node.x}, ${
                      node.y - (typeof node.load === 'number' ? 68 : node.kind === 'cylinder' ? 38 : 48)
                    })`}
                  >
                    {(() => {
                      const tw = Math.max(46, node.tag.text.length * 6.5 + 18);
                      const bg =
                        node.tag.tone === 'red'
                          ? 'var(--red-soft)'
                          : node.tag.tone === 'green'
                          ? 'var(--green)'
                          : node.tag.tone === 'amber'
                          ? 'var(--amber-soft)'
                          : node.tag.tone === 'violet'
                          ? 'var(--violet)'
                          : 'var(--crisp)';
                      const tc = node.tag.tone === 'red' ? 'var(--red-ink)' : 'var(--ink)';
                      return (
                        <>
                          <rect
                            x={-tw / 2}
                            y="-10"
                            width={tw}
                            height="20"
                            rx={10}
                            fill={bg}
                            stroke={inkStroke}
                            strokeWidth="1.3"
                          />
                          <text textAnchor="middle" y={3.5} fill={tc} fontSize="9.5" fontWeight="800">
                            {node.tag.text}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Click-to-Inspect Node Popover */}
        {inspectedNode && inspectedNode.inspect && (
          <div className="inspector" onClick={(e) => e.stopPropagation()}>
            <div className="inspector__head">
              <span className="inspector__title">{inspectedNode.label}</span>
              <button
                type="button"
                aria-label="Close inspector"
                onClick={() => setInspectedId(null)}
                style={{ padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>
            <p className="inspector__desc">{inspectedNode.inspect.role}</p>
            <div className="inspector__meta">
              <div className="inspector__kv">
                <b>Latency</b>
                <span>{inspectedNode.inspect.latency}</span>
              </div>
              <div className="inspector__kv">
                <b>Capacity</b>
                <span>{inspectedNode.inspect.throughput}</span>
              </div>
              <div className="inspector__kv" style={{ gridColumn: '1 / -1' }}>
                <b>Real-World Stack</b>
                <span>{inspectedNode.inspect.stack}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-Left Color Legend */}
      <div className="stage__legend">
        {scene.legend.map((item) => {
          const st = FLOW_STYLES[item.kind];
          return (
            <span key={item.kind + item.label}>
              <i
                className={`legend-dot ${st.shape === 'square' || st.shape === 'diamond' ? 'legend-dot--sq' : ''}`}
                style={{ background: st.fill, borderColor: st.stroke }}
              />
              {item.label}
            </span>
          );
        })}
      </div>

      {/* Bottom-Right Live Simulation Parameter Controls ("Update & Change Value") */}
      {controls && controls.length > 0 && onParamChange && (
        <div className="sim-dock" aria-label="Live simulation controls">
          {controls.map((ctrl) => {
            const val = params[ctrl.id] ?? ctrl.defaultValue;
            if (ctrl.type === 'slider') {
              return (
                <label key={ctrl.id} className="sim-ctrl">
                  <span className="sim-ctrl__label">{ctrl.label}</span>
                  <input
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step || 1}
                    value={Number(val)}
                    onChange={(e) => onParamChange(ctrl.id, Number(e.target.value))}
                  />
                  <span className="sim-ctrl__val">
                    {val}
                    {ctrl.unit ? ` ${ctrl.unit}` : ''}
                  </span>
                </label>
              );
            }
            if (ctrl.type === 'segmented' && ctrl.options) {
              return (
                <div key={ctrl.id} className="sim-ctrl">
                  <span className="sim-ctrl__label">{ctrl.label}</span>
                  <div className="sim-seg">
                    {ctrl.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={String(val) === opt.value ? 'is-on' : ''}
                        onClick={() => onParamChange(ctrl.id, opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            const isDanger = /kill|burst|down|crash/i.test(ctrl.label);
            return (
              <button
                key={ctrl.id}
                type="button"
                className={`sim-toggle ${val ? 'is-on' : ''} ${isDanger ? 'is-danger' : ''}`}
                onClick={() => onParamChange(ctrl.id, !val)}
              >
                {ctrl.label}: {val ? 'ON' : 'OFF'}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
