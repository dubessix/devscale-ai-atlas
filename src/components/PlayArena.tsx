import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Flame, Play, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { IsometricStage } from './IsometricStage';
import type { MetricSpec, SceneSpec } from '../types/course';

interface PlayArenaProps {
  solvedGames: string[];
  onSolveGame: (gameId: string, xp: number) => void;
}

type GameId = 'outage' | 'rag-sla' | 'bigo-duel' | 'pipeline' | 'acid-race' | 'llm-router';

export const PlayArena: React.FC<PlayArenaProps> = ({ solvedGames, onSolveGame }) => {
  const [activeGame, setActiveGame] = useState<GameId>('outage');
  const [paused, setPaused] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  // Game 1: Outage Firefighter state
  const [fixes, setFixes] = useState<Record<string, boolean>>({
    redis: false,
    replica: false,
    leastConns: false,
    rateLimit: false,
    pgbouncer: false,
  });

  // Game 2: RAG SLA Tuner state
  const [ragChunk, setRagChunk] = useState(1024);
  const [ragTopK, setRagTopK] = useState(14);
  const [ragHybrid, setRagHybrid] = useState(false);
  const [ragRerank, setRagRerank] = useState(false);
  const [ragCache, setRagCache] = useState(false);

  // Game 3: Big-O Duel state
  const [bigoPick, setBigoPick] = useState<'brute' | 'sort' | 'hashmap' | 'window'>('brute');
  const [bigoTested, setBigoTested] = useState(false);

  // Game 4: Pipeline Puzzle state
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [pipelineLaunched, setPipelineLaunched] = useState(false);

  // Game 5: ACID Race Defender state
  const [acidLock, setAcidLock] = useState<'none' | 'js-check' | 'for-update'>('js-check');
  const [acidIdem, setAcidIdem] = useState(false);
  const [acidTested, setAcidTested] = useState(false);

  // Game 6: AI Gateway Cost & TTFT Balancer state
  const [routerMiniPct, setRouterMiniPct] = useState(20);
  const [routerKv, setRouterKv] = useState(false);
  const [routerSemCache, setRouterSemCache] = useState(false);

  // Evaluate Game 1
  const outageEval = useMemo(() => {
    const prices: Record<string, number> = {
      redis: 80,
      replica: 90,
      leastConns: 40,
      rateLimit: 30,
      pgbouncer: 35,
    };
    const spent = Object.entries(fixes).reduce((s, [k, on]) => s + (on ? prices[k] : 0), 0);
    const overBudget = spent > 250;

    let dbLoad = 99;
    if (fixes.redis) dbLoad -= 46;
    if (fixes.replica) dbLoad -= 22;
    if (fixes.pgbouncer) dbLoad -= 12;
    if (fixes.rateLimit) dbLoad -= 8;
    dbLoad = Math.max(11, dbLoad);

    let apiLoad = 88;
    if (fixes.leastConns) apiLoad -= 34;
    if (fixes.rateLimit) apiLoad -= 18;
    if (fixes.redis) apiLoad -= 12;
    apiLoad = Math.max(18, apiLoad);

    const p95 = Math.round(
      48 +
        Math.max(0, dbLoad - 20) * 18 +
        (fixes.leastConns ? 0 : 280) -
        (fixes.redis ? 80 : 0) -
        (fixes.replica ? 45 : 0) -
        (fixes.pgbouncer ? 45 : 0)
    );
    const safeP95 = Math.max(52, p95);
    const errors = Math.max(0, Math.round((dbLoad > 75 ? (dbLoad - 72) * 0.65 : 0) + (!fixes.leastConns && apiLoad > 70 ? 4 : 0)));
    const won = safeP95 <= 180 && errors === 0 && !overBudget;

    const metrics: MetricSpec[] = [
      { id: 'p95', label: 'P95 Latency', value: safeP95 >= 1000 ? `${(safeP95 / 1000).toFixed(1)} s` : `${safeP95} ms`, level: safeP95 <= 180 ? 'good' : safeP95 <= 450 ? 'warn' : 'bad' },
      { id: 'err', label: 'Error Rate', value: `${errors}%`, level: errors === 0 ? 'good' : 'bad' },
      { id: 'db', label: 'DB CPU', value: `${dbLoad}%`, level: dbLoad < 65 ? 'good' : dbLoad < 82 ? 'warn' : 'bad' },
      { id: 'bud', label: 'Budget', value: `$${spent} / $250`, level: overBudget ? 'bad' : 'good' },
    ];

    const scene: SceneSpec = {
      nodes: [
        { id: 'u', kind: 'users', x: 130, y: 245, label: fixes.rateLimit ? '12k req/s (Protected)' : '12k req/s Spike!' },
        { id: 'lb', kind: 'box', x: 325, y: 220, label: 'Load Balancer', sublabel: fixes.leastConns ? 'least conns' : 'round robin', tone: fixes.leastConns ? 'green' : 'orange', icon: 'lb' },
        { id: 'api', kind: 'box', x: 500, y: 120, label: 'API Cluster', tone: apiLoad > 80 ? 'red' : 'blue', icon: 'server', load: apiLoad, glow: apiLoad > 80 ? 'bad' : undefined },
        { id: 'cache', kind: 'cylinder', x: 500, y: 335, label: fixes.redis ? 'Redis Cache (ON)' : 'No Cache', tone: fixes.redis ? 'green' : 'muted', icon: 'cache', dimmed: !fixes.redis, glow: fixes.redis ? 'good' : undefined },
        { id: 'db', kind: 'cylinder', x: 665, y: 225, label: fixes.replica ? 'Primary + Replica' : 'Postgres Primary', tone: dbLoad > 80 ? 'red' : 'violet', icon: 'db', load: dbLoad, glow: dbLoad > 80 ? 'bad' : won ? 'good' : undefined, tag: dbLoad > 80 ? { text: 'OVERLOAD!', tone: 'red' } : undefined },
      ],
      links: [
        { id: 'l1', from: 'u', to: 'lb', flow: { kind: errors > 0 ? 'heavy' : 'request', rate: 2.2, speed: 1.5 } },
        { id: 'l2', from: 'lb', to: 'api', flow: { kind: errors > 0 ? 'failed' : 'request', rate: 1.6, speed: 1.4 } },
        { id: 'l3', from: 'api', to: 'cache', dashed: !fixes.redis, dimmed: !fixes.redis, flow: fixes.redis ? { kind: 'response', rate: 1.6, speed: 1.7 } : undefined },
        { id: 'l4', from: 'api', to: 'db', flow: { kind: dbLoad > 80 ? 'heavy' : 'request', rate: fixes.redis ? 0.5 : 2, speed: 1.2 } },
      ],
      legend: [
        { kind: 'request', label: 'live traffic' },
        { kind: 'response', label: 'cache offload' },
        { kind: 'failed', label: 'dropped / 503' },
      ],
    };

    return { metrics, scene, won, spent, overBudget };
  }, [fixes]);

  // Evaluate Game 2: RAG SLA Tuner
  const ragEval = useMemo(() => {
    const recall = Math.min(
      99,
      Math.round(
        64 +
          (ragHybrid ? 11 : 0) +
          (ragRerank ? 10 : 0) +
          (ragChunk >= 384 && ragChunk <= 640 ? 9 : ragChunk < 384 ? 4 : 2) +
          Math.min(8, ragTopK * 0.7)
      )
    );
    const ttft = Math.round((ragCache ? 0.68 : 1) * (210 + ragTopK * 22 + (ragRerank ? 85 : 0) + ragChunk * 0.09));
    const cost = +((ragCache ? 0.62 : 1) * (0.0014 + ragTopK * 0.00028 + (ragRerank ? 0.0004 : 0))).toFixed(4);
    const won = recall >= 90 && ttft <= 450 && cost <= 0.004;

    const metrics: MetricSpec[] = [
      { id: 'rec', label: 'Recall >= 90%', value: `${recall}%`, level: recall >= 90 ? 'good' : 'bad' },
      { id: 'ttft', label: 'TTFT <= 450ms', value: `${ttft} ms`, level: ttft <= 450 ? 'good' : 'bad' },
      { id: 'cost', label: 'Cost <= $0.004', value: `$${cost}`, level: cost <= 0.004 ? 'good' : 'bad' },
    ];

    const scene: SceneSpec = {
      nodes: [
        { id: 'u', kind: 'device', x: 130, y: 235, label: 'AI Query', icon: 'laptop' },
        { id: 'sc', kind: 'cylinder', x: 300, y: 120, label: 'Semantic Cache', tone: ragCache ? 'green' : 'muted', icon: 'cache', dimmed: !ragCache, glow: ragCache ? 'good' : undefined },
        { id: 'vdb', kind: 'cylinder', x: 335, y: 295, label: ragHybrid ? 'BM25 + Vector' : 'Vector Only', tone: ragHybrid ? 'violet' : 'sand', icon: 'vector' },
        { id: 'rr', kind: 'box', x: 525, y: 295, label: 'Reranker', sublabel: `chunk ${ragChunk}`, tone: ragRerank ? 'blue' : 'muted', icon: 'search', dimmed: !ragRerank },
        { id: 'llm', kind: 'box', x: 655, y: 175, label: 'LLM Generator', sublabel: `top-${ragTopK}`, tone: won ? 'green' : 'orange', icon: 'ai', glow: won ? 'good' : undefined },
      ],
      links: [
        { id: 'l1', from: 'u', to: 'sc', dashed: !ragCache, dimmed: !ragCache, flow: ragCache ? { kind: 'response', rate: 1.2, speed: 1.6 } : undefined },
        { id: 'l2', from: 'u', to: 'vdb', flow: { kind: 'vector', rate: 1.3, speed: 1.4 } },
        { id: 'l3', from: 'vdb', to: 'rr', flow: { kind: 'vector', rate: 1.1, speed: 1.4 } },
        { id: 'l4', from: 'rr', to: 'llm', flow: { kind: 'request', rate: 1.1, speed: 1.4 } },
        { id: 'l5', from: 'llm', to: 'u', bend: -55, flow: { kind: 'stream', rate: 1.5, speed: 1.6 } },
      ],
      legend: [{ kind: 'vector', label: 'retrieval' }, { kind: 'stream', label: 'grounded answer' }],
    };
    return { metrics, scene, won };
  }, [ragChunk, ragTopK, ragHybrid, ragRerank, ragCache]);

  // Evaluate Game 3: Big-O Bottleneck Duel
  const bigoEval = useMemo(() => {
    const info: Record<typeof bigoPick, { ops: string; ms: number; cpu: number; ok: boolean; bigo: string }> = {
      brute: { ops: '12,500,000', ms: 1420, cpu: 98, ok: false, bigo: 'O(n²)' },
      sort: { ops: '61,000', ms: 42, cpu: 35, ok: false, bigo: 'O(n log n)' },
      hashmap: { ops: '5,000', ms: 4, cpu: 9, ok: true, bigo: 'O(n) + Hash' },
      window: { ops: '5,000', ms: 5, cpu: 11, ok: false, bigo: 'O(n) Window' },
    };
    const cur = info[bigoPick];
    const won = bigoTested && bigoPick === 'hashmap';

    const metrics: MetricSpec[] = [
      { id: 'bigo', label: 'Complexity', value: cur.bigo, level: cur.ok ? 'good' : bigoPick === 'brute' ? 'bad' : 'warn' },
      { id: 'ops', label: 'Ops (N=5000)', value: cur.ops, level: cur.ok ? 'good' : 'bad' },
      { id: 'cpu', label: 'Worker CPU', value: `${cur.cpu}%`, level: cur.cpu > 70 ? 'bad' : 'good' },
    ];

    const scene: SceneSpec = {
      nodes: [
        {
          id: 'code',
          kind: 'codeCard',
          x: 255,
          y: 215,
          label: 'Find Pair With Sum = Target (Unsorted)',
          codeStatus: won ? 'good' : 'alert',
          lines:
            bigoPick === 'hashmap'
              ? ['const seen = new Map();', 'for (const x of nums) {', '  if (seen.has(target - x)) return true;', '  seen.set(x, true);', '✓ Passes in 4 ms (O(n))']
              : bigoPick === 'brute'
              ? ['for (let i = 0; i < n; i++)', '  for (let j = i+1; j < n; j++)', '    if (a[i] + a[j] === target)...', '! 1,420 ms TIMEOUT on N=5000']
              : bigoPick === 'sort'
              ? ['nums.sort((a, b) => a - b);', '// O(n log n) mutates input &', '! loses original indices!']
              : ['// Sliding Window requires', '! contiguous subarray or sorted', '! Fails on unsorted negatives'],
        },
        {
          id: 'cpu',
          kind: 'box',
          x: 605,
          y: 215,
          label: 'API Worker',
          sublabel: cur.bigo,
          tone: won ? 'green' : bigoPick === 'brute' ? 'red' : 'orange',
          icon: 'server',
          load: cur.cpu,
          glow: won ? 'good' : bigoPick === 'brute' ? 'bad' : undefined,
        },
      ],
      links: [
        { id: 'l1', from: 'code', to: 'cpu', flow: { kind: won ? 'response' : 'heavy', rate: 1.2, speed: won ? 1.7 : 0.7 } },
      ],
      legend: [{ kind: won ? 'response' : 'heavy', label: won ? 'O(n) HashMap pass' : 'suboptimal / timeout' }],
    };

    return { metrics, scene, won };
  }, [bigoPick, bigoTested]);

  // Evaluate Game 4: Pipeline Builder
  const pipeEval = useMemo(() => {
    const expected = ['Rate Limiter', 'API Gateway', 'Async Queue', 'Worker + VectorDB'];
    const correctCount = slots.filter((s, idx) => s === expected[idx]).length;
    const allFilled = slots.every(Boolean);
    const won = pipelineLaunched && correctCount === 4;

    const metrics: MetricSpec[] = [
      { id: 'placed', label: 'Slots Wired', value: `${slots.filter(Boolean).length} / 4`, level: allFilled ? 'good' : 'neutral' },
      { id: 'ord', label: 'Pipeline Order', value: pipelineLaunched ? `${correctCount} / 4 OK` : 'Ready to Test', level: won ? 'good' : pipelineLaunched ? 'bad' : 'neutral' },
    ];

    const scene: SceneSpec = {
      nodes: [
        { id: 'u', kind: 'users', x: 105, y: 235, label: 'Webhook Burst' },
        { id: 's0', kind: 'box', x: 250, y: 155, label: slots[0] || '[ Slot 1 ]', tone: slots[0] === expected[0] ? 'green' : slots[0] ? 'orange' : 'muted', icon: 'shield' },
        { id: 's1', kind: 'box', x: 400, y: 245, label: slots[1] || '[ Slot 2 ]', tone: slots[1] === expected[1] ? 'green' : slots[1] ? 'orange' : 'muted', icon: 'server' },
        { id: 's2', kind: 'box', x: 545, y: 155, label: slots[2] || '[ Slot 3 ]', tone: slots[2] === expected[2] ? 'green' : slots[2] ? 'orange' : 'muted', icon: 'queue' },
        { id: 's3', kind: 'cylinder', x: 685, y: 245, label: slots[3] || '[ Slot 4 ]', tone: slots[3] === expected[3] ? 'green' : slots[3] ? 'orange' : 'muted', icon: 'vector', glow: won ? 'good' : undefined },
      ],
      links: [
        { id: 'l1', from: 'u', to: 's0', flow: pipelineLaunched ? { kind: won ? 'request' : 'heavy', rate: 1.5, speed: 1.5 } : undefined },
        { id: 'l2', from: 's0', to: 's1', dashed: !slots[0] || !slots[1], flow: pipelineLaunched && won ? { kind: 'request', rate: 1.5, speed: 1.5 } : undefined },
        { id: 'l3', from: 's1', to: 's2', dashed: !slots[1] || !slots[2], flow: pipelineLaunched && won ? { kind: 'vector', rate: 1.4, speed: 1.5 } : undefined },
        { id: 'l4', from: 's2', to: 's3', dashed: !slots[2] || !slots[3], flow: pipelineLaunched && won ? { kind: 'response', rate: 1.4, speed: 1.5 } : undefined },
      ],
      legend: [{ kind: 'response', label: 'zero-drop pipeline' }],
    };
    return { metrics, scene, won, expected };
  }, [slots, pipelineLaunched]);

  // Evaluate Game 5: ACID Ticket Race & Idempotency
  const acidEval = useMemo(() => {
    const noOversell = acidLock === 'for-update';
    const noDoubleCharge = acidIdem;
    const won = acidTested && noOversell && noDoubleCharge;
    const stockRemaining = noOversell ? '0 (Exact!)' : '-3 (OVERSOLD!)';
    const metrics: MetricSpec[] = [
      { id: 'stk', label: 'Final Stock', value: stockRemaining, level: noOversell ? 'good' : 'bad' },
      { id: 'chg', label: 'Retry Charges', value: noDoubleCharge ? '1× Safe' : '3× DOUBLE!', level: noDoubleCharge ? 'good' : 'bad' },
      { id: 'sts', label: 'Audit Status', value: won ? 'ACID Verified' : acidTested ? 'Failed Burst Test' : 'Not Tested', level: won ? 'good' : acidTested ? 'bad' : 'neutral' },
    ];
    const scene: SceneSpec = {
      nodes: [
        { id: 'u', kind: 'users', x: 135, y: 220, label: '500 Concurrent Buyers' },
        { id: 'api', kind: 'box', x: 385, y: 220, label: 'Checkout API', sublabel: noDoubleCharge ? 'Idempotency-Key ON' : 'NO IDEM KEY', tone: noDoubleCharge ? 'green' : 'red', icon: 'shield', glow: noDoubleCharge ? 'good' : 'bad' },
        { id: 'db', kind: 'cylinder', x: 645, y: 220, label: 'Postgres Tickets', sublabel: noOversell ? 'SELECT FOR UPDATE' : 'Race Condition!', tone: noOversell ? 'green' : 'red', glow: won ? 'good' : 'bad' },
      ],
      links: [
        { id: 'l1', from: 'u', to: 'api', flow: { kind: noDoubleCharge ? 'request' : 'heavy', rate: 1.6, speed: 1.5 } },
        { id: 'l2', from: 'api', to: 'db', flow: { kind: noOversell ? 'response' : 'heavy', rate: 1.3, speed: 1.4 } },
      ],
      legend: [{ kind: won ? 'response' : 'heavy', label: won ? 'ACID + Idempotent' : 'race / duplicate risk' }],
    };
    return { metrics, scene, won };
  }, [acidLock, acidIdem, acidTested]);

  // Evaluate Game 6: AI Gateway Cost & TTFT Router
  const routerEval = useMemo(() => {
    const monthlyCost = Math.round(
      (1 - (routerSemCache ? 0.35 : 0)) *
        (4800 * (1 - routerMiniPct / 100) + 650 * (routerMiniPct / 100))
    );
    const ttft = Math.round((routerKv ? 220 : 1200) * (routerSemCache ? 0.72 : 1) + (100 - routerMiniPct) * 2.1);
    const quality = routerMiniPct <= 80 ? 93 : 82;
    const won = monthlyCost <= 1600 && ttft <= 320 && quality >= 90;
    const metrics: MetricSpec[] = [
      { id: 'cost', label: 'Monthly <= $1600', value: `$${monthlyCost}`, level: monthlyCost <= 1600 ? 'good' : 'bad' },
      { id: 'ttft', label: 'P95 TTFT <= 320ms', value: `${ttft} ms`, level: ttft <= 320 ? 'good' : 'bad' },
      { id: 'qual', label: 'Eval >= 90%', value: `${quality}%`, level: quality >= 90 ? 'good' : 'bad' },
    ];
    const scene: SceneSpec = {
      nodes: [
        { id: 'gw', kind: 'box', x: 175, y: 220, label: 'AI Router', sublabel: `${routerMiniPct}% Mini / ${100 - routerMiniPct}% Pro`, tone: 'violet', icon: 'lb' },
        { id: 'sc', kind: 'box', x: 425, y: 120, label: 'Semantic Cache', sublabel: routerSemCache ? '35% instant $0' : 'OFF', tone: routerSemCache ? 'green' : 'muted', icon: 'cache', dimmed: !routerSemCache },
        { id: 'gpu', kind: 'box', x: 645, y: 235, label: 'Inference Tier', sublabel: routerKv ? 'KV Cache + Prefill' : 'NO KV CACHE', tone: won ? 'green' : 'orange', icon: 'ai', glow: won ? 'good' : undefined },
      ],
      links: [
        { id: 'l1', from: 'gw', to: 'sc', dashed: !routerSemCache, flow: routerSemCache ? { kind: 'cache', rate: 1.2, speed: 1.6 } : undefined },
        { id: 'l2', from: 'gw', to: 'gpu', flow: { kind: routerKv ? 'ai' : 'heavy', rate: 1.3, speed: routerKv ? 1.5 : 0.6 } },
      ],
      legend: [{ kind: 'ai', label: 'routed AI traffic' }],
    };
    return { metrics, scene, won };
  }, [routerMiniPct, routerKv, routerSemCache]);

  const currentEval =
    activeGame === 'outage'
      ? outageEval
      : activeGame === 'rag-sla'
      ? ragEval
      : activeGame === 'bigo-duel'
      ? bigoEval
      : activeGame === 'pipeline'
      ? pipeEval
      : activeGame === 'acid-race'
      ? acidEval
      : routerEval;

  const isSolved = solvedGames.includes(activeGame) || currentEval.won;

  const claimReward = (id: GameId) => {
    if (!solvedGames.includes(id)) onSolveGame(id, 150);
  };

  return (
    <div className="workspace-wide">
      <div className="wide-grid">
        {/* Left Game Selector */}
        <aside className="card wide-panel">
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={15} />
            Learn Through Game
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            Solve live engineering challenges by updating parameters, debugging Big-O code, and wiring resilient pipelines.
          </p>

          <div className="game-card-list">
            {[
              { id: 'outage' as GameId, title: '1. Outage Firefighter', tag: 'System Design · +150 XP', desc: '12k req/s crash! Save Postgres inside a $250 budget.' },
              { id: 'rag-sla' as GameId, title: '2. RAG SLA Tuner', tag: 'AI Engineering · +150 XP', desc: 'Hit 90% recall, <=450ms TTFT, and <=$0.004/query.' },
              { id: 'bigo-duel' as GameId, title: '3. Big-O Bottleneck Duel', tag: 'DSA · +150 XP', desc: 'Fix an O(n²) API timeout with the right data structure.' },
              { id: 'pipeline' as GameId, title: '4. Pipeline Builder', tag: 'Full-Stack · +150 XP', desc: 'Wire 4 components in order for burst-proof ingestion.' },
              { id: 'acid-race' as GameId, title: '5. Ticket Race Defender', tag: 'Backend DB · +150 XP', desc: 'Stop last-seat oversells & flaky mobile double charges.' },
              { id: 'llm-router' as GameId, title: '6. AI Gateway Optimizer', tag: 'LLM Infra · +150 XP', desc: 'Cut monthly LLM burn <=$1600 & TTFT <=320ms at 90%+ eval.' },
            ].map((g) => {
              const done = solvedGames.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`game-pick ${activeGame === g.id ? 'is-active' : ''}`}
                  onClick={() => setActiveGame(g.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 12.5 }}>
                    <span>{g.title}</span>
                    {done && <CheckCircle2 size={14} />}
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700 }}>{g.tag}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>{g.desc}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Interactive Isometric Game Stage */}
        <IsometricStage
          metrics={currentEval.metrics}
          scene={currentEval.scene}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          replayKey={replayKey}
          onReplay={() => setReplayKey((k) => k + 1)}
          stepKey={`game-${activeGame}`}
        />

        {/* Right Challenge Controls & Mission Judge */}
        <aside className="card wide-panel">
          {activeGame === 'outage' && (
            <>
              <span className="chapter chapter--problem">MISSION · OUTAGE FIREFIGHTER</span>
              <h3 className="guide__title" style={{ marginTop: 4 }}>Stabilize the 12,000 req/s spike</h3>
              <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                Target: <b>P95 ≤ 180 ms</b>, <b>Errors 0%</b>, <b>Budget ≤ $250</b>. Toggle fixes below:
              </p>
              {[
                { id: 'redis', label: 'Add Redis Cache (-46% DB load)', price: '$80' },
                { id: 'replica', label: 'Postgres Read Replica', price: '$90' },
                { id: 'leastConns', label: 'Switch LB → Least Connections', price: '$40' },
                { id: 'rateLimit', label: 'Edge Rate Limiter', price: '$30' },
                { id: 'pgbouncer', label: 'PgBouncer Connection Pool', price: '$35' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`toggle-tile ${fixes[item.id] ? 'is-on' : ''}`}
                  onClick={() => setFixes((f) => ({ ...f, [item.id]: !f[item.id] }))}
                >
                  <span>{item.label}</span>
                  <span>{item.price}</span>
                </button>
              ))}
            </>
          )}

          {activeGame === 'rag-sla' && (
            <>
              <span className="chapter chapter--insight">MISSION · RAG SLA TUNER</span>
              <h3 className="guide__title" style={{ marginTop: 4 }}>Balance Recall, Speed & Cost</h3>
              <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                Hit all 3 targets: <b>Recall ≥ 90%</b>, <b>TTFT ≤ 450 ms</b>, <b>Cost ≤ $0.004</b>.
              </p>
              <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
                <span>Chunk Size: {ragChunk} tok</span>
                <input type="range" min={256} max={1536} step={128} value={ragChunk} onChange={(e) => setRagChunk(Number(e.target.value))} />
              </label>
              <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
                <span>Top-K: {ragTopK} chunks</span>
                <input type="range" min={2} max={20} step={2} value={ragTopK} onChange={(e) => setRagTopK(Number(e.target.value))} />
              </label>
              <button type="button" className={`toggle-tile ${ragHybrid ? 'is-on' : ''}`} onClick={() => setRagHybrid((v) => !v)}>
                <span>Hybrid Search (BM25 + Vector)</span>
                <span>{ragHybrid ? 'ON' : 'OFF'}</span>
              </button>
              <button type="button" className={`toggle-tile ${ragRerank ? 'is-on' : ''}`} onClick={() => setRagRerank((v) => !v)}>
                <span>Cross-Encoder Reranker</span>
                <span>{ragRerank ? 'ON' : 'OFF'}</span>
              </button>
              <button type="button" className={`toggle-tile ${ragCache ? 'is-on' : ''}`} onClick={() => setRagCache((v) => !v)}>
                <span>Semantic Cache (0.94 sim)</span>
                <span>{ragCache ? 'ON' : 'OFF'}</span>
              </button>
            </>
          )}

          {activeGame === 'bigo-duel' && (
            <>
              <span className="chapter chapter--technique">MISSION · BIG-O BOTTLENECK DUEL</span>
              <h3 className="guide__title" style={{ marginTop: 4 }}>Fix the O(n²) API Timeout</h3>
              <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                Problem: Given an unsorted array <code className="inline-code">nums</code> (N=5,000), return true if any two numbers add to <code className="inline-code">target</code> without mutating input.
              </p>
              {[
                { id: 'brute' as const, label: 'Keep Nested Loop — O(n²)' },
                { id: 'sort' as const, label: 'In-Place Sort + Two Pointers — O(n log n)' },
                { id: 'hashmap' as const, label: 'Hash Map Complement Lookup — O(n)' },
                { id: 'window' as const, label: 'Contiguous Sliding Window — O(n)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`toggle-tile ${bigoPick === opt.id ? 'is-on' : ''}`}
                  onClick={() => {
                    setBigoPick(opt.id);
                    setBigoTested(false);
                  }}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
              <button type="button" className="btn-pop" style={{ height: 36, padding: '0 14px' }} onClick={() => setBigoTested(true)}>
                Run Benchmark Suite
              </button>
            </>
          )}

          {activeGame === 'pipeline' && (
            <>
              <span className="chapter chapter--setup">MISSION · ARCHITECTURE BUILDER</span>
              <h3 className="guide__title" style={{ marginTop: 4 }}>Wire a Burst-Proof AI Webhook Pipeline</h3>
              <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                Click blocks in order from <b>Slot 1 → Slot 4</b> so burst traffic is protected, queued, and embedded without drops:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Worker + VectorDB', 'Rate Limiter', 'Async Queue', 'API Gateway'].map((block) => {
                  const used = slots.includes(block);
                  return (
                    <button
                      key={block}
                      type="button"
                      disabled={used}
                      className={`btn-ghost`}
                      style={{ height: 30, fontSize: 11.5, opacity: used ? 0.45 : 1 }}
                      onClick={() => {
                        const emptyIdx = slots.findIndex((s) => s === null);
                        if (emptyIdx !== -1) {
                          const next = [...slots];
                          next[emptyIdx] = block;
                          setSlots(next);
                          setPipelineLaunched(false);
                        }
                      }}
                    >
                      + {block}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setSlots([null, null, null, null]);
                    setPipelineLaunched(false);
                  }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
                <button
                  type="button"
                  className="btn-pop"
                  style={{ flex: 1, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => setPipelineLaunched(true)}
                >
                  <Play size={13} /> Launch Traffic
                </button>
              </div>
            </>
          )}

          {activeGame === 'acid-race' && (
            <>
              <span className="chapter chapter--problem">MISSION · TICKET RACE DEFENDER</span>
              <h3 className="guide__title" style={{ marginTop: 4 }}>Zero Oversells &amp; Zero Double Charges</h3>
              <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                500 buyers hit Checkout for 1 remaining seat while 4G retries fire 3×. Pick the right SQL locking + API guard:
              </p>
              {[
                { id: 'none' as const, label: 'No Lock (Direct UPDATE stock = stock - 1)' },
                { id: 'js-check' as const, label: 'Read stock in JS first, then UPDATE' },
                { id: 'for-update' as const, label: 'SQL Transaction + SELECT FOR UPDATE / WHERE stock>=1' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`toggle-tile ${acidLock === opt.id ? 'is-on' : ''}`}
                  onClick={() => { setAcidLock(opt.id); setAcidTested(false); }}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
              <button type="button" className={`toggle-tile ${acidIdem ? 'is-on' : ''}`} onClick={() => { setAcidIdem((v) => !v); setAcidTested(false); }}>
                <span>Enforce Redis Idempotency-Key</span>
                <span>{acidIdem ? 'ON' : 'OFF'}</span>
              </button>
              <button type="button" className="btn-pop" style={{ height: 36, padding: '0 14px' }} onClick={() => setAcidTested(true)}>
                Simulate 500 Concurrent Buyers
              </button>
            </>
          )}

          {activeGame === 'llm-router' && (
            <>
              <span className="chapter chapter--insight">MISSION · AI GATEWAY OPTIMIZER</span>
              <h3 className="guide__title" style={{ marginTop: 4 }}>Cut LLM Burn Without Hurting Evals</h3>
              <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                Hit <b>Cost ≤ $1,600/mo</b>, <b>TTFT ≤ 320 ms</b>, and <b>Eval ≥ 90%</b>:
              </p>
              <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
                <span>Route Easy Prompts → Mini: {routerMiniPct}%</span>
                <input type="range" min={0} max={95} step={5} value={routerMiniPct} onChange={(e) => setRouterMiniPct(Number(e.target.value))} />
              </label>
              <button type="button" className={`toggle-tile ${routerKv ? 'is-on' : ''}`} onClick={() => setRouterKv((v) => !v)}>
                <span>Enable GPU KV + Prompt Cache</span>
                <span>{routerKv ? 'ON' : 'OFF'}</span>
              </button>
              <button type="button" className={`toggle-tile ${routerSemCache ? 'is-on' : ''}`} onClick={() => setRouterSemCache((v) => !v)}>
                <span>Semantic Answer Cache (cos ≥ 0.94)</span>
                <span>{routerSemCache ? 'ON' : 'OFF'}</span>
              </button>
            </>
          )}

          {/* Live Win Banner */}
          <div style={{ marginTop: 'auto' }}>
            {currentEval.won ? (
              <div className="callout callout--tip">
                <div className="callout__icon">
                  <Award size={15} />
                </div>
                <div>
                  <div className="callout__title">MISSION PASSED!</div>
                  <p style={{ marginBottom: 8 }}>All production SLA & architecture checks are green.</p>
                  <button
                    type="button"
                    className="btn-pop"
                    style={{ height: 30, padding: '0 12px', fontSize: 11.5 }}
                    onClick={() => claimReward(activeGame)}
                  >
                    {solvedGames.includes(activeGame) ? '✓ +150 XP Claimed' : 'Claim +150 XP'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="callout callout--insight">
                <div className="callout__icon">
                  {isSolved ? <Sparkles size={15} /> : <Flame size={15} />}
                </div>
                <div>
                  <div className="callout__title">LIVE VERIFICATION</div>
                  <p>Adjust controls on this panel until every HUD metric turns green.</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
