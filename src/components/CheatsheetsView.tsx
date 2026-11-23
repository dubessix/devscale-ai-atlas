import React, { useMemo, useState } from 'react';
import { Calculator, Cpu, Layers, Search } from 'lucide-react';

const BIG_O_ROWS = [
  { ds: 'Hash Map / Set', lookup: 'O(1)', insert: 'O(1)', range: 'N/A', use: 'Exact user lookup, caching, deduping, rate limits' },
  { ds: 'Array / Sliding Window', lookup: 'O(1) by idx', insert: 'O(n) mid', range: 'O(n)', use: 'Contiguous streams, two-pointer scans, ring buffers' },
  { ds: 'Monotonic Stack / Deque', lookup: 'O(1) top', insert: 'O(n) total', range: 'O(n)', use: 'Next-greater spans, sliding-window max, undo stacks' },
  { ds: 'LRU (HashMap + DLL)', lookup: 'O(1)', insert: 'O(1) evict', range: 'N/A', use: 'Hot key caches, Redis eviction, browser memory' },
  { ds: 'B-Tree / SQL Index', lookup: 'O(log n)', insert: 'O(log n)', range: 'O(log n + k)', use: 'Sorted DB queries, pagination, timestamp ranges' },
  { ds: 'Heap / Priority Queue', lookup: 'O(1) top', insert: 'O(log n)', range: 'N/A', use: 'Top-K ranking, task schedulers, Dijkstra shortest paths' },
  { ds: 'Trie (Prefix Tree)', lookup: 'O(L)', insert: 'O(L)', range: 'O(L + k)', use: 'Autocomplete, URL router matching, IP prefix routing' },
  { ds: 'Graph BFS / Dijkstra', lookup: 'O(V + E)', insert: 'O((V+E) log V)', range: 'Shortest', use: 'Social hops, DAG dependency order, network latency routes' },
  { ds: 'DP Table / Memoization', lookup: 'O(n·W) states', insert: 'O(1)/cell', range: 'Optimal', use: 'Knapsack quotas, edit distance, sequence alignment' },
  { ds: 'HNSW Vector Graph', lookup: '~O(log n)', insert: 'O(log n)', range: 'ANN top-K', use: 'AI RAG embeddings, semantic search, dedup' },
];

export const CheatsheetsView: React.FC = () => {
  // Napkin Math State
  const [dau, setDau] = useState(100000);
  const [reqPerUser, setReqPerUser] = useState(25);
  const [kbPerReq, setKbPerReq] = useState(4);

  // LLM Token Cost State
  const [inTok, setInTok] = useState(3500);
  const [outTok, setOutTok] = useState(450);
  const [dailyPrompts, setDailyPrompts] = useState(20000);
  const [cachePct, setCachePct] = useState(50);

  const [filter, setFilter] = useState('');

  const napkin = useMemo(() => {
    const dailyReqs = dau * reqPerUser;
    const avgQps = Math.round(dailyReqs / 86400);
    const peakQps = avgQps * 3;
    const bandwidthMbps = +((peakQps * kbPerReq * 8) / 1000).toFixed(1);
    const dailyGb = +((dailyReqs * kbPerReq) / (1024 * 1024)).toFixed(1);
    const fiveYrTb = +((dailyGb * 365 * 5) / 1024).toFixed(1);
    return { dailyReqs, avgQps, peakQps, bandwidthMbps, dailyGb, fiveYrTb };
  }, [dau, reqPerUser, kbPerReq]);

  const llmMath = useMemo(() => {
    const cacheDiscount = 1 - (cachePct / 100) * 0.75;
    const smallPerDay = dailyPrompts * ((inTok * cacheDiscount * 0.15 + outTok * 0.6) / 1_000_000);
    const frontierPerDay = dailyPrompts * ((inTok * cacheDiscount * 2.5 + outTok * 10.0) / 1_000_000);
    return {
      smallMo: Math.round(smallPerDay * 30),
      frontierMo: Math.round(frontierPerDay * 30),
      tokensPerSecTotal: Math.round((dailyPrompts * (inTok + outTok)) / 86400),
    };
  }, [inTok, outTok, dailyPrompts, cachePct]);

  const filteredRows = BIG_O_ROWS.filter((r) =>
    `${r.ds} ${r.use} ${r.lookup}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="workspace-wide">
      <div className="cheatsheet-grid">
        {/* Card 1: Napkin Math Scale Estimator */}
        <section className="card wide-panel">
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={15} />
            1. Napkin Math &amp; Scale Estimator
          </div>
          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>Daily Active Users: {dau.toLocaleString()}</span>
            <input type="range" min={1000} max={2000000} step={10000} value={dau} onChange={(e) => setDau(Number(e.target.value))} />
          </label>
          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>Requests / User / Day: {reqPerUser}</span>
            <input type="range" min={5} max={200} step={5} value={reqPerUser} onChange={(e) => setReqPerUser(Number(e.target.value))} />
          </label>
          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>Avg Payload Size: {kbPerReq} KB</span>
            <input type="range" min={1} max={100} step={1} value={kbPerReq} onChange={(e) => setKbPerReq(Number(e.target.value))} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
            <div className="chip" data-level="good"><span className="chip__label">Avg QPS</span><span className="chip__value">{napkin.avgQps.toLocaleString()}/s</span></div>
            <div className="chip" data-level="warn"><span className="chip__label">Peak QPS (3×)</span><span className="chip__value">{napkin.peakQps.toLocaleString()}/s</span></div>
            <div className="chip" data-level="neutral"><span className="chip__label">Peak Bandwidth</span><span className="chip__value">{napkin.bandwidthMbps} Mbps</span></div>
            <div className="chip" data-level="neutral"><span className="chip__label">5-Year Storage</span><span className="chip__value">{napkin.fiveYrTb} TB</span></div>
          </div>
        </section>

        {/* Card 2: LLM Token & Cost Estimator */}
        <section className="card wide-panel">
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={15} />
            2. AI / LLM Token &amp; Monthly Burn Estimator
          </div>
          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>Input + RAG Context: {inTok.toLocaleString()} tok</span>
            <input type="range" min={500} max={32000} step={500} value={inTok} onChange={(e) => setInTok(Number(e.target.value))} />
          </label>
          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>Output Tokens: {outTok} tok</span>
            <input type="range" min={100} max={4000} step={50} value={outTok} onChange={(e) => setOutTok(Number(e.target.value))} />
          </label>
          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>Daily AI Requests: {dailyPrompts.toLocaleString()}</span>
            <input type="range" min={1000} max={200000} step={1000} value={dailyPrompts} onChange={(e) => setDailyPrompts(Number(e.target.value))} />
          </label>
          <label className="sim-ctrl" style={{ justifyContent: 'space-between' }}>
            <span>Prompt Cache Hit: {cachePct}%</span>
            <input type="range" min={0} max={90} step={5} value={cachePct} onChange={(e) => setCachePct(Number(e.target.value))} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            <div className="chip" data-level="good"><span className="chip__label">Fast Mini / mo</span><span className="chip__value">${llmMath.smallMo.toLocaleString()}</span></div>
            <div className="chip" data-level="bad"><span className="chip__label">Frontier / mo</span><span className="chip__value">${llmMath.frontierMo.toLocaleString()}</span></div>
          </div>
        </section>

        {/* Card 3: Big-O & Data Structure Selector */}
        <section className="card wide-panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={15} />
              3. DSA → Backend → AI Structure Cheatsheet
            </div>
            <div className="search" style={{ width: 250, height: 30 }}>
              <Search size={13} />
              <input
                type="text"
                placeholder="Filter structure or use case…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 12 }}
              />
            </div>
          </div>
          <table className="compare">
            <thead>
              <tr>
                <th>Structure</th>
                <th>Lookup</th>
                <th>Insert / Range</th>
                <th>Production AI &amp; Backend Use</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.ds}>
                  <td style={{ color: 'var(--ink)', fontWeight: 700 }}>{r.ds}</td>
                  <td><code className="inline-code">{r.lookup}</code></td>
                  <td>{r.insert} · {r.range}</td>
                  <td>{r.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Card 4: Quick Latency Numbers Every Dev Should Know */}
        <section className="card wide-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="eyebrow">4. Latency Numbers Every AI Full-Stack Engineer Uses</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 8 }}>
            {[
              ['L1 / RAM Read', '~0.0001 ms', 'good'],
              ['Redis Cache Hit', '~0.8 ms', 'good'],
              ['Indexed SQL Query', '~2–5 ms', 'good'],
              ['HNSW Vector Search', '~10–25 ms', 'good'],
              ['Cross-Ocean RTT', '~120–180 ms', 'warn'],
              ['LLM First Token (TTFT)', '~250–600 ms', 'warn'],
              ['Full Uncached LLM Reply', '~4–12 s', 'bad'],
            ].map(([lbl, val, lvl]) => (
              <div key={lbl} className="chip" data-level={lvl}>
                <span className="chip__label">{lbl}</span>
                <span className="chip__value">{val}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
