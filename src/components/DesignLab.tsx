import React, { useMemo, useState } from 'react';
import { AlertTriangle, Boxes, Flame, Sparkles } from 'lucide-react';
import { IsometricStage } from './IsometricStage';
import type { MetricSpec, SceneLink, SceneNode, SceneSpec } from '../types/course';

export const DesignLab: React.FC = () => {
  const [paused, setPaused] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const [blocks, setBlocks] = useState<Record<string, boolean>>({
    cdn: true,
    lb: true,
    redis: true,
    queue: true,
    replica: false,
    vectorDb: true,
    llmRouter: true,
  });

  const [qps, setQps] = useState(4000);
  const [aiShare, setAiShare] = useState(35);
  const [cacheHit, setCacheHit] = useState(80);
  const [spike, setSpike] = useState(false);
  const [killDb, setKillDb] = useState(false);

  const applyPreset = (name: 'ai' | 'api' | 'minimal') => {
    setSpike(false);
    setKillDb(false);
    if (name === 'ai') {
      setBlocks({ cdn: true, lb: true, redis: true, queue: true, replica: true, vectorDb: true, llmRouter: true });
      setQps(6000);
      setAiShare(45);
      setCacheHit(82);
    } else if (name === 'api') {
      setBlocks({ cdn: true, lb: true, redis: true, queue: true, replica: true, vectorDb: false, llmRouter: false });
      setQps(9000);
      setAiShare(0);
      setCacheHit(88);
    } else {
      setBlocks({ cdn: false, lb: false, redis: false, queue: false, replica: false, vectorDb: false, llmRouter: false });
      setQps(2500);
      setAiShare(20);
      setCacheHit(0);
    }
  };

  const sim = useMemo(() => {
    const effQps = qps * (spike ? 4 : 1);
    const cdnOffload = blocks.cdn ? 0.3 : 0;
    const originQps = effQps * (1 - cdnOffload);
    const cacheFactor = blocks.redis ? 1 - cacheHit / 100 : 1;
    const dbQps = originQps * cacheFactor * (blocks.replica ? 0.55 : 1);

    const dbLoad = killDb ? 100 : Math.min(100, Math.round((dbQps / 1800) * 65 + 10));
    const apiLoad = Math.min(100, Math.round((originQps / (blocks.lb ? 14000 : 4500)) * 75 + 12));
    const aiLoad = blocks.llmRouter ? Math.min(100, Math.round(((originQps * (aiShare / 100)) / 3500) * 60 + 14)) : 0;

    const p95 = killDb
      ? 4500
      : Math.round(
          (blocks.cdn ? 22 : 55) +
            (dbLoad > 85 ? 850 : dbLoad * 1.4) +
            (apiLoad > 85 ? 540 : apiLoad * 0.9) +
            (aiShare > 0 ? (blocks.llmRouter ? 190 : 980) : 0)
        );
    const errors = killDb
      ? blocks.replica
        ? 4
        : 92
      : Math.max(0, Math.round((dbLoad > 88 ? (dbLoad - 85) * 1.3 : 0) + (apiLoad > 88 ? (apiLoad - 85) * 1.1 : 0)));

    const monthlyCost = Math.round(
      140 +
        (blocks.cdn ? 45 : 0) +
        (blocks.lb ? 35 : 0) +
        (blocks.redis ? 75 : 0) +
        (blocks.queue ? 40 : 0) +
        (blocks.replica ? 110 : 0) +
        (blocks.vectorDb ? 95 : 0) +
        (blocks.llmRouter ? Math.round((effQps * (aiShare / 100)) * 0.16) : 0)
    );

    const metrics: MetricSpec[] = [
      { id: 'qps', label: 'Effective QPS', value: `${effQps.toLocaleString()}/s`, level: spike ? 'warn' : 'neutral' },
      { id: 'p95', label: 'P95 Latency', value: p95 >= 1000 ? `${(p95 / 1000).toFixed(1)} s` : `${p95} ms`, level: p95 <= 280 ? 'good' : p95 <= 600 ? 'warn' : 'bad' },
      { id: 'err', label: 'Errors', value: `${errors}%`, level: errors === 0 ? 'good' : 'bad' },
      { id: 'cost', label: 'Est. Monthly', value: `$${monthlyCost.toLocaleString()}`, level: 'neutral' },
    ];

    const nodes: SceneNode[] = [
      { id: 'u', kind: 'users', x: 105, y: 245, label: `${effQps.toLocaleString()} req/s` },
    ];
    const links: SceneLink[] = [];

    const entryTarget = blocks.cdn ? 'cdn' : blocks.lb ? 'lb' : 'api';
    if (blocks.cdn) {
      nodes.push({ id: 'cdn', kind: 'box', x: 240, y: 145, label: 'Edge CDN', tone: 'green', icon: 'cdn', glow: 'good' });
      links.push({ id: 'u-cdn', from: 'u', to: 'cdn', flow: { kind: 'request', rate: 1.8, speed: 1.5 } });
      links.push({ id: 'cdn-next', from: 'cdn', to: blocks.lb ? 'lb' : 'api', flow: { kind: 'request', rate: 1.3, speed: 1.4 } });
    } else {
      links.push({ id: 'u-entry', from: 'u', to: entryTarget, flow: { kind: errors > 0 ? 'heavy' : 'request', rate: 1.8, speed: 1.4 } });
    }

    if (blocks.lb) {
      nodes.push({ id: 'lb', kind: 'box', x: 270, y: 295, label: 'Load Balancer', tone: 'orange', icon: 'lb' });
      links.push({ id: 'lb-api', from: 'lb', to: 'api', flow: { kind: 'request', rate: 1.5, speed: 1.5 } });
    }

    nodes.push({
      id: 'api',
      kind: 'box',
      x: 425,
      y: 225,
      label: blocks.lb ? 'API Pool (3×)' : 'Single API',
      tone: apiLoad > 85 ? 'red' : 'blue',
      icon: 'server',
      load: apiLoad,
      glow: apiLoad > 85 ? 'bad' : undefined,
    });

    if (blocks.redis) {
      nodes.push({ id: 'redis', kind: 'cylinder', x: 465, y: 95, label: `Redis (${cacheHit}%)`, tone: 'green', icon: 'cache', glow: 'good' });
      links.push({ id: 'api-redis', from: 'api', to: 'redis', flow: { kind: 'response', rate: 1.5, speed: 1.7 } });
    }

    nodes.push({
      id: 'db',
      kind: 'cylinder',
      x: 655,
      y: 142,
      label: killDb ? (blocks.replica ? 'Failover Replica' : 'DB CRASHED!') : blocks.replica ? 'Postgres + Replica' : 'Postgres DB',
      tone: killDb && !blocks.replica ? 'red' : dbLoad > 85 ? 'red' : 'violet',
      icon: 'db',
      load: dbLoad,
      glow: dbLoad > 85 ? 'bad' : undefined,
    });
    links.push({
      id: 'api-db',
      from: 'api',
      to: 'db',
      dashed: blocks.redis && cacheHit >= 80,
      flow: { kind: errors > 10 ? 'failed' : dbLoad > 80 ? 'heavy' : 'request', rate: blocks.redis ? 0.6 : 1.7, speed: 1.3 },
    });

    if (blocks.queue) {
      nodes.push({ id: 'q', kind: 'box', x: 455, y: 365, label: 'Async Queue', tone: 'sand', icon: 'queue', load: spike ? 65 : 22 });
      links.push({ id: 'api-q', from: 'api', to: 'q', flow: { kind: 'health', rate: 0.9, speed: 1.3 } });
    }

    if (blocks.vectorDb && aiShare > 0) {
      nodes.push({ id: 'vdb', kind: 'cylinder', x: 615, y: 388, label: 'Vector HNSW', tone: 'violet', icon: 'vector' });
      links.push({ id: 'api-vdb', from: 'api', to: 'vdb', flow: { kind: 'vector', rate: 1.2, speed: 1.4 } });
    }

    if (blocks.llmRouter && aiShare > 0) {
      nodes.push({ id: 'llm', kind: 'box', x: 705, y: 268, label: 'LLM Router', sublabel: 'SSE stream', tone: 'blue', icon: 'ai', load: aiLoad });
      links.push({ id: 'api-llm', from: 'api', to: 'llm', flow: { kind: 'stream', rate: 1.4, speed: 1.6 } });
    }

    let diagnosis = 'Architecture looks balanced and healthy under current traffic.';
    if (killDb && !blocks.replica) diagnosis = 'Primary DB crashed with no Read Replica! Enable Postgres Replica to survive failover.';
    else if (dbLoad > 85 && !blocks.redis) diagnosis = 'Postgres is saturated! Turn on Redis Cache to absorb hot reads.';
    else if (apiLoad > 85 && !blocks.lb) diagnosis = 'Single API server bottlenecked! Enable Load Balancer to distribute across replicas.';
    else if (aiShare > 0 && !blocks.llmRouter) diagnosis = 'AI prompts hitting API synchronously! Add LLM Router + SSE streaming.';

    const scene: SceneSpec = {
      nodes,
      links,
      legend: [
        { kind: 'request', label: 'HTTP / SQL' },
        { kind: 'response', label: 'cache hit' },
        { kind: 'vector', label: 'RAG search' },
        { kind: 'stream', label: 'AI SSE' },
      ],
    };

    return { metrics, scene, diagnosis, healthy: errors === 0 && p95 <= 350 };
  }, [blocks, qps, aiShare, cacheHit, spike, killDb]);

  return (
    <div className="workspace-wide">
      <div className="wide-grid">
        {/* Left Architecture Palette */}
        <aside className="card wide-panel">
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Boxes size={15} />
            Architecture Blocks
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="btn-ghost" style={{ height: 28, fontSize: 11 }} onClick={() => applyPreset('ai')}>AI RAG Preset</button>
            <button type="button" className="btn-ghost" style={{ height: 28, fontSize: 11 }} onClick={() => applyPreset('api')}>Scale API</button>
            <button type="button" className="btn-ghost" style={{ height: 28, fontSize: 11 }} onClick={() => applyPreset('minimal')}>Minimal</button>
          </div>

          {[
            { id: 'cdn', label: 'Edge CDN (Global PoPs)' },
            { id: 'lb', label: 'Load Balancer (Least Conns)' },
            { id: 'redis', label: 'Redis Cache-Aside' },
            { id: 'queue', label: 'Async Message Queue' },
            { id: 'replica', label: 'Postgres Read Replica' },
            { id: 'vectorDb', label: 'HNSW Vector DB' },
            { id: 'llmRouter', label: 'LLM Router + SSE' },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              className={`toggle-tile ${blocks[b.id] ? 'is-on' : ''}`}
              onClick={() => setBlocks((prev) => ({ ...prev, [b.id]: !prev[b.id] }))}
            >
              <span>{b.label}</span>
              <span>{blocks[b.id] ? 'ACTIVE' : 'OFF'}</span>
            </button>
          ))}
        </aside>

        {/* Center Live Sandbox Stage */}
        <IsometricStage
          metrics={sim.metrics}
          scene={sim.scene}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          replayKey={replayKey}
          onReplay={() => setReplayKey((k) => k + 1)}
          stepKey="design-lab"
        />

        {/* Right Load Controls & Chaos Engineering */}
        <aside className="card wide-panel">
          <span className="chapter chapter--technique">SANDBOX SIMULATOR</span>
          <h3 className="guide__title" style={{ marginTop: 4 }}>Traffic & Chaos Controls</h3>

          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>Traffic: {qps.toLocaleString()} req/s</span>
            <input type="range" min={500} max={15000} step={500} value={qps} onChange={(e) => setQps(Number(e.target.value))} />
          </label>
          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>Cache Hit Target: {cacheHit}%</span>
            <input type="range" min={0} max={95} step={5} value={cacheHit} onChange={(e) => setCacheHit(Number(e.target.value))} />
          </label>
          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>AI Prompt Share: {aiShare}%</span>
            <input type="range" min={0} max={100} step={5} value={aiShare} onChange={(e) => setAiShare(Number(e.target.value))} />
          </label>

          <div className="eyebrow" style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
            Chaos Injection Drills
          </div>
          <button type="button" className={`sim-toggle ${spike ? 'is-on' : ''}`} style={{ padding: '7px 10px', textAlign: 'left' }} onClick={() => setSpike((s) => !s)}>
            <Flame size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            4× Viral Traffic Spike: {spike ? 'ACTIVE' : 'OFF'}
          </button>
          <button type="button" className={`sim-toggle ${killDb ? 'is-on' : ''}`} style={{ padding: '7px 10px', textAlign: 'left' }} onClick={() => setKillDb((k) => !k)}>
            <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Kill Primary Postgres Node: {killDb ? 'DOWN' : 'HEALTHY'}
          </button>

          <div style={{ marginTop: 'auto' }}>
            <div className={`callout ${sim.healthy ? 'callout--tip' : 'callout--warn'}`}>
              <div className="callout__icon">
                {sim.healthy ? <Sparkles size={15} /> : <AlertTriangle size={15} />}
              </div>
              <div>
                <div className="callout__title">ARCHITECTURE DIAGNOSIS</div>
                <p>{sim.diagnosis}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
