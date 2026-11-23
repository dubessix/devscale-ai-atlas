import type { Lesson } from '../types/course';

export const CH8_CAPSTONES: Lesson[] = [
  {
    id: 'cap-ai-copilot',
    moduleId: 'capstones',
    num: 1,
    title: 'Capstone: End-to-End AI RAG Copilot',
    subtitle: 'Assemble Edge SSE, Rate Limits, Hybrid Vector+BM25, Reranker, Semantic Cache, and Eval Tracing into one system.',
    duration: '15 min',
    level: 'Mastery',
    goals: [
      'Connecting Frontend SSE Streaming → API Gateway → Semantic Cache → Hybrid RAG',
      'Background Async Worker + Queue ingesting updated PDFs without blocking chat',
      'End-to-end observability: Token Cost, TTFT, and Faithfulness Evals',
    ],
    controls: [
      { id: 'cache', label: 'Semantic Cache', type: 'toggle', defaultValue: true },
      { id: 'rerank', label: 'Hybrid + Rerank', type: 'toggle', defaultValue: true },
      { id: 'traffic', label: 'Concurrent Users', type: 'slider', min: 100, max: 5000, step: 100, defaultValue: 1200 },
    ],
    codeTrace: {
      title: 'Full AI Full-Stack Copilot Request Handler',
      ts: [
        'export async function POST(req: Request) {',
        '  await rateLimit(userId);                      // Ch1 Sliding Window',
        '  const qVec = await embed(prompt);             // Ch6 Embeddings',
        '  if (const hit = await semCache.get(qVec)) return sseText(hit); // Ch7',
        '  const ctx = await hybridRerankSearch(prompt, qVec); // Ch7 BM25+HNSW',
        '  return streamSSE(router.pickModel(prompt), { prompt, ctx });   // Ch4+Ch6',
        '}',
      ],
      py: [
        '@app.post("/chat")',
        'async def chat(req: ChatReq):',
        '    await sliding_window_limit(req.user_id)',
        '    q_vec = await embed(req.prompt)',
        '    if hit := await sem_cache.get(q_vec): return sse(hit)',
        '    ctx = await hybrid_rerank(req.prompt, q_vec)',
        '    return StreamingResponse(route_and_stream(req.prompt, ctx))',
      ],
    },
    feynman: {
      prompt: 'Walk through the complete architecture of a production AI RAG Copilot from browser click to streamed answer and background PDF ingestion.',
      checkpoints: [
        { label: 'Ingestion runs async via Queue + Workers into Hybrid Vector/BM25 store', keywords: ['ingest', 'queue', 'worker', 'async', 'chunk', 'vector'] },
        { label: 'Query checks rate limit -> Semantic Cache -> Hybrid+Rerank -> Routed SSE stream', keywords: ['rate', 'cache', 'hybrid', 'rerank', 'stream', 'sse', 'rout'] },
      ],
      sampleAnswer:
        'Uploaded docs flow into an async Queue and Workers that chunk, embed, and index into Postgres+BM25+HNSW without blocking live users. On the read path, requests pass Edge TLS and Sliding-Window rate limits, check the Redis Semantic Cache, fetch Hybrid+Reranked Top-5 chunks if needed, and stream the routed LLM response back over SSE while logging OTel traces.',
    },
    steps: [
      {
        id: 'cp-1',
        short: 'Async Ingest',
        chapter: 'setup',
        title: 'Write Path: Upload → Queue → Chunk → Hybrid Vector/BM25 Index',
        paragraphs: [
          'When admins upload updated PDFs or Notion docs, the API returns <code class="inline-code">202 Accepted</code> immediately while workers chunk, embed, and atomically swap index versions!',
        ],
        goalHits: [1],
        activeCodeLines: { ts: [1, 3], py: [1, 4] },
        evaluate: () => ({
          metrics: [
            { id: 'ing', label: 'Upload Reply', value: '15 ms (Async)', level: 'good' },
            { id: 'idx', label: 'Dual Index', value: 'HNSW + BM25', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'up', kind: 'device', x: 135, y: 220, label: 'Admin Upload', icon: 'laptop' },
              { id: 'q', kind: 'box', x: 355, y: 220, label: 'Ingest Queue', tone: 'amber', icon: 'queue' },
              { id: 'wk', kind: 'box', x: 545, y: 220, label: 'Chunk + Embed', tone: 'violet', icon: 'ai' },
              { id: 'db', kind: 'cylinder', x: 710, y: 220, label: 'HNSW + BM25', tone: 'green', glow: 'good' },
            ],
            links: [
              { id: 'l1', from: 'up', to: 'q', flow: { kind: 'request', rate: 1.2, speed: 1.5 } },
              { id: 'l2', from: 'q', to: 'wk', flow: { kind: 'ai', rate: 1.2, speed: 1.5 } },
              { id: 'l3', from: 'wk', to: 'db', flow: { kind: 'db', rate: 1.2, speed: 1.5 } },
            ],
            legend: [{ kind: 'ai', label: 'async indexing pipeline' }],
          },
        }),
      },
      {
        id: 'cp-2',
        short: 'Full Stack E2E',
        chapter: 'insight',
        title: 'Everything you learned working together as one production engine',
        paragraphs: [
          'Every block on this canvas comes directly from Chapters 01–07: <span class="term">Sliding Window Rate Limit</span>, <span class="term">Semantic Cache</span>, <span class="term">Hybrid HNSW + BM25</span>, and <span class="term">SSE Streaming</span>.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 7], py: [1, 7] },
        evaluate: (p) => {
          const sc = Boolean(p.cache);
          const rr = Boolean(p.rerank);
          const u = Number(p.traffic ?? 1200);
          const ttft = (sc ? 190 : 390) + Math.round(u / 40);
          return {
            metrics: [
              { id: 'ttft', label: 'Stream TTFT', value: `${ttft} ms`, level: ttft > 450 ? 'warn' : 'good' },
              { id: 'qual', label: 'Grounded Eval', value: rr ? '94% Precision' : '64% Precision', level: rr ? 'good' : 'bad' },
              { id: 'save', label: 'Cache Savings', value: sc ? '-38% GPU Cost' : '0%', level: sc ? 'good' : 'warn' },
            ],
            scene: {
              nodes: [
                { id: 'ai-zone', kind: 'zone', x: 520, y: 225, w: 465, h: 335, label: 'AI COPILOT BACKEND CLUSTER', tone: 'violet' },
                { id: 'b', kind: 'device', x: 120, y: 225, label: `${u} Users (SSE)`, icon: 'laptop' },
                { id: 'gw', kind: 'box', x: 340, y: 225, label: 'Edge Gateway', sublabel: 'Rate Limit + Auth', tone: 'green', icon: 'shield' },
                { id: 'sc', kind: 'box', x: 525, y: 125, label: 'Redis SemCache', sublabel: sc ? '38% hit · 24ms' : 'OFF', tone: sc ? 'green' : 'red', icon: 'cache', dimmed: !sc },
                { id: 'rag', kind: 'cylinder', x: 525, y: 298, label: 'HNSW + BM25', sublabel: rr ? '+ Rerank Top-5' : 'Raw Top-5', tone: rr ? 'blue' : 'amber' },
                { id: 'llm', kind: 'box', x: 700, y: 225, label: 'LLM Router', sublabel: 'KV-Cached SSE', tone: 'violet', icon: 'ai', glow: 'good' },
              ],
              links: [
                { id: 'l1', from: 'b', to: 'gw', flow: { kind: 'request', rate: 1.4, speed: 1.6 } },
                { id: 'l2', from: 'gw', to: 'sc', dashed: !sc, flow: sc ? { kind: 'cache', rate: 1.1, speed: 1.7 } : undefined },
                { id: 'l3', from: 'gw', to: 'rag', flow: { kind: 'db', rate: 1, speed: 1.5 } },
                { id: 'l4', from: 'rag', to: 'llm', flow: { kind: 'ai', rate: 1.1, speed: 1.5 } },
              ],
              legend: [{ kind: 'cache', label: '24ms cache' }, { kind: 'ai', label: 'grounded LLM stream' }],
            },
          };
        },
      },
      {
        id: 'cp-3',
        short: 'Observability',
        chapter: 'recap',
        title: 'Recap: Tracing, Evals & Cost Caps in Production',
        paragraphs: [
          '✓ Log every request trace (<code class="inline-code">embed_ms</code>, <code class="inline-code">rerank_ms</code>, <code class="inline-code">ttft_ms</code>, <code class="inline-code">tokens_used</code>) + run nightly Judge evals on sampled chats!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 7], py: [1, 7] },
        evaluate: () => ({
          metrics: [{ id: 'obs', label: 'Full Copilot SLA', value: '220ms TTFT · 94% Eval', level: 'good' }],
          scene: {
            nodes: [{ id: 'done', kind: 'box', x: 400, y: 220, label: 'Production AI RAG Copilot', sublabel: 'DSA + Backend + Scale + AI E2E', tone: 'green', icon: 'ai', glow: 'good' }],
            links: [],
            legend: [{ kind: 'ai', label: 'complete E2E architecture' }],
          },
        }),
      },
    ],
  },

  {
    id: 'cap-url-shortener',
    moduleId: 'capstones',
    num: 2,
    title: 'Capstone: Billion-Scale URL Shortener',
    subtitle: 'Classic system-design masterclass: Base62 counters, Redis hot-key caching, and 302 analytics.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'Back-of-envelope QPS math: 100:1 read/write ratio',
      'Generating collision-free 7-char Base62 short codes (3.5 Trillion URLs!)',
      'Caching viral links in Redis + async Kafka click-analytics',
    ],
    controls: [
      { id: 'redis', label: 'Redis Hot Cache', type: 'toggle', defaultValue: true },
    ],
    codeTrace: {
      title: 'Base62 Encoder + O(1) Cache Redirect',
      ts: [
        'const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";',
        'function toBase62(id: bigint): string { /* 62^7 = 3.52T unique codes! */ }',
        'const longUrl = await redis.get(`u:${code}`) ?? await db.findUrl(code);',
        'res.redirect(302, longUrl); // 302 keeps click analytics flowing!',
      ],
      py: [
        'ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"',
        '# 62**7 = 3.52 Trillion collision-free short codes from Snowflake IDs',
        'long_url = await redis.get(f"u:{code}") or await db.find_url(code)',
        'return RedirectResponse(long_url, status_code=302)',
      ],
    },
    feynman: {
      prompt: 'How do you generate 7-character short URLs without hash collisions, and why use HTTP 302 instead of 301 if you track analytics?',
      checkpoints: [
        { label: 'Encode unique distributed counter/Snowflake ID into Base62 (62^7 = 3.5T)', keywords: ['base62', 'counter', 'snowflake', 'id', 'collision', 'unique'] },
        { label: '301 gets permanently cached by browsers so future clicks skip your analytics', keywords: ['301', '302', 'browser', 'cache', 'analytic', 'track'] },
      ],
      sampleAnswer:
        'Assign each URL a unique distributed sequence or Snowflake ID and encode it into 7 Base62 characters (62^7 ≈ 3.5 trillion unique links, zero collisions). Returning HTTP 302 (Temporary Redirect) instead of 301 stops browsers from caching the redirect permanently so your server continues counting click analytics.',
    },
    steps: [
      {
        id: 'url-1',
        short: 'Napkin Math',
        chapter: 'setup',
        title: 'Start with Back-of-the-Envelope Scale & Base62 Math',
        paragraphs: [
          'At 100M new URLs/mo and 100:1 read/write ratio → ~40 writes/s and 4,000–100k peak redirects/s. Encoding a 64-bit <span class="term">Snowflake ID</span> in Base62 (<code class="inline-code">62⁷ = 3.52T</code>) guarantees <b>zero hash collisions</b> without checking DB uniqueness first!',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 2], py: [1, 2] },
        evaluate: () => ({
          metrics: [
            { id: 'rw', label: 'Read:Write Ratio', value: '100 : 1', level: 'good' },
            { id: 'b62', label: '7-Char Base62', value: '3.52 Trillion IDs', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'id', kind: 'box', x: 205, y: 220, label: 'Snowflake ID', sublabel: '1099511627776', tone: 'sand', icon: 'code' },
              { id: 'b62', kind: 'box', x: 545, y: 220, label: 'Base62 Encode', sublabel: '→ "f8K9p2A" (Zero Collision)', tone: 'green', icon: 'shield', glow: 'good' },
            ],
            links: [{ id: 'l1', from: 'id', to: 'b62', flow: { kind: 'response', rate: 1, speed: 1.5 } }],
            legend: [{ kind: 'response', label: 'collision-free encoding' }],
          },
        }),
      },
      {
        id: 'url-2',
        short: 'Base62 + 302',
        chapter: 'solution',
        title: '100,000 redirects/sec with Base62 + Redis + Async Analytics',
        paragraphs: [
          'Every click resolves from <b>Redis</b> in 0.8ms (<code class="inline-code">302 Found</code>) while emitting a non-blocking click event to Kafka!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 4], py: [1, 4] },
        evaluate: (p) => {
          const red = Boolean(p.redis);
          return {
            metrics: [
              { id: 'lat', label: 'Redirect P95', value: red ? '4 ms' : '115 ms (DB Hit!)', level: red ? 'good' : 'bad' },
              { id: 'space', label: '7-Char Base62', value: '3.52T Codes', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'c', kind: 'users', x: 140, y: 220, label: '100k RPS Clicks' },
                { id: 'api', kind: 'box', x: 350, y: 220, label: 'Redirect API', sublabel: '302 + Async Kafka', tone: 'blue', icon: 'server' },
                { id: 'red', kind: 'box', x: 580, y: 135, label: 'Redis Cluster', sublabel: red ? '96% Hot Links' : 'OFF', tone: red ? 'green' : 'red', icon: 'cache', dimmed: !red, glow: red ? 'good' : undefined },
                { id: 'db', kind: 'cylinder', x: 580, y: 310, label: 'Sharded Postgres', sublabel: 'Snowflake → Base62', tone: red ? 'sand' : 'red', load: red ? 12 : 95 },
              ],
              links: [
                { id: 'l1', from: 'c', to: 'api', flow: { kind: 'request', rate: 1.6, speed: 1.7 } },
                { id: 'l2', from: 'api', to: 'red', dashed: !red, flow: red ? { kind: 'cache', rate: 1.5, speed: 1.8 } : undefined },
                { id: 'l3', from: 'api', to: 'db', flow: { kind: red ? 'db' : 'heavy', rate: red ? 0.4 : 1.9, speed: 1.4 } },
              ],
              legend: [{ kind: 'cache', label: '0.8ms Redis redirect' }],
            },
          };
        },
      },
      {
        id: 'url-3',
        short: '301 vs 302',
        chapter: 'recap',
        title: 'Recap: 301 Permanent vs 302 Temporary Redirect',
        paragraphs: [
          '✓ Need maximum Edge/CDN offload with no per-click tracking? <b>301</b>.',
          '✓ Need click analytics, geo stats, or A/B target swaps? <b>302</b> so browsers keep hitting your edge redirector!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [3, 4], py: [3, 4] },
        evaluate: () => ({
          metrics: [{ id: 'rd', label: 'Analytics Mode', value: 'HTTP 302 + Async Log', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'box', x: 400, y: 220, label: 'Base62 + Redis + Async Clicks', tone: 'green', icon: 'cdn', glow: 'good' }],
            links: [],
            legend: [{ kind: 'cache', label: 'sub-5ms redirect' }],
          },
        }),
      },
    ],
  },

  {
    id: 'cap-deploy-slo',
    moduleId: 'capstones',
    num: 3,
    title: 'Docker, CI/CD, Blue-Green Deploys & SLOs',
    subtitle: 'Ship safely with multi-stage Docker images, zero-downtime Blue/Green rollouts, and Error Budgets.',
    duration: '11 min',
    level: 'Intermediate',
    goals: [
      'Multi-stage Docker builds shrinking containers from 1.2GB down to 95MB',
      'Blue-Green / Canary rollouts with instant 1-second rollback on 5xx spikes',
      'SLIs, SLOs (99.9% = 43.8m/mo budget), and graceful SIGTERM draining',
    ],
    controls: [
      { id: 'rollout', label: 'Canary / Blue-Green', type: 'segmented', options: [{ label: 'Green Healthy (100%)', value: 'green' }, { label: 'Canary 5xx → Rollback!', value: 'rollback' }], defaultValue: 'green' },
    ],
    codeTrace: {
      title: 'Zero-Downtime Graceful SIGTERM Drain',
      ts: [
        'process.on("SIGTERM", async () => {',
        '  isShuttingDown = true;           // /healthz immediately returns 503',
        '  await server.close();            // finish active SSE/HTTP requests!',
        '  await Promise.all([db.end(), redis.quit()]);',
        '  process.exit(0);',
        '});',
      ],
      py: [
        '@asynccontextmanager',
        'async def lifespan(app: FastAPI):',
        '    yield  # Serve live traffic',
        '    # On SIGTERM: drain active requests before closing DB pools',
        '    await db_engine.dispose(); await redis.aclose()',
      ],
    },
    feynman: {
      prompt: 'How do Blue-Green / Canary deployments and SIGTERM graceful shutdown prevent users from seeing 502 errors during deploys?',
      checkpoints: [
        { label: 'Blue-Green warms new pods and shifts LB traffic only after /healthz passes', keywords: ['blue', 'green', 'canary', 'health', 'shift', 'rollback'] },
        { label: 'SIGTERM stops new traffic while letting in-flight requests finish cleanly', keywords: ['sigterm', 'drain', 'flight', 'finish', '502', 'graceful'] },
      ],
      sampleAnswer:
        'Blue-Green boots the new Green cluster, waits for `/healthz` probes to turn green, and flips Load Balancer traffic cleanly (rolling back in 1 second if 5xx spikes in a Canary slice). Meanwhile, handling `SIGTERM` stops accepting new connections while letting in-flight requests finish—eliminating deploy-time 502 errors.',
    },
    steps: [
      {
        id: 'dp-ops-1',
        short: 'Docker Slim',
        chapter: 'setup',
        title: 'Shrink Docker deploys 10× with Multi-Stage Builds',
        paragraphs: [
          'Shipping build tools + devDependencies bloats images to 1.2GB. A 2-stage <code class="inline-code">Dockerfile</code> compiles in Stage 1 and copies ONLY <code class="inline-code">dist/</code> into an Alpine/Distroless Stage 2 (~95MB) for fast autoscaling & zero compiler CVEs!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 2], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'img', label: 'Image Size', value: '1.2 GB → 95 MB', level: 'good' },
            { id: 'boot', label: 'Cold Autoscale', value: '2.1 s Boot', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 's1', kind: 'box', x: 205, y: 220, label: 'Stage 1: Builder', sublabel: 'tsc + vite build (1.2GB)', tone: 'sand', icon: 'code' },
              { id: 's2', kind: 'box', x: 545, y: 220, label: 'Stage 2: Runtime', sublabel: 'dist/ only (95MB Alpine)', tone: 'green', icon: 'server', glow: 'good' },
            ],
            links: [{ id: 'l1', from: 's1', to: 's2', label: 'COPY --from=builder', flow: { kind: 'response', rate: 1, speed: 1.5 } }],
            legend: [{ kind: 'response', label: 'slim runtime image' }],
          },
        }),
      },
      {
        id: 'dp-ops-2',
        short: 'Zero-Downtime',
        chapter: 'solution',
        title: 'Canary protection & instant 1-second LB rollback',
        paragraphs: [
          'Flip to <b>Canary 5xx → Rollback!</b> to watch the Load Balancer immediately snap traffic back to healthy Blue pods before 95% of users notice!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 5] },
        evaluate: (p) => {
          const rb = p.rollout === 'rollback';
          return {
            metrics: [
              { id: 'err', label: 'User 5xx Rate', value: rb ? '0.02% (Auto-Reverted!)' : '0.00% Clean', level: rb ? 'warn' : 'good' },
              { id: 'slo', label: '99.9% Budget Left', value: rb ? '98.8% Safe' : '100% Intact', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'lb', kind: 'box', x: 185, y: 220, label: 'Edge Router', sublabel: rb ? 'Reverted → Blue!' : '100% → Green v2', tone: 'violet', icon: 'lb' },
                { id: 'blue', kind: 'box', x: 525, y: 135, label: 'Blue v1 (Stable)', sublabel: rb ? '100% RESCUED' : 'Warm Standby', tone: 'green', icon: 'server', glow: rb ? 'good' : undefined },
                { id: 'green', kind: 'box', x: 525, y: 310, label: 'Green v2 (New)', sublabel: rb ? '5xx Canary Halted!' : '100% Healthy', tone: rb ? 'red' : 'green', icon: 'server', glow: rb ? 'bad' : 'good', dimmed: rb },
              ],
              links: [
                { id: 'l1', from: 'lb', to: 'blue', dashed: !rb, flow: rb ? { kind: 'response', rate: 1.4, speed: 1.6 } : undefined },
                { id: 'l2', from: 'lb', to: 'green', dashed: rb, flow: !rb ? { kind: 'response', rate: 1.4, speed: 1.6 } : undefined },
              ],
              legend: [{ kind: 'response', label: 'zero-downtime traffic' }],
            },
          };
        },
      },
      {
        id: 'dp-ops-3',
        short: 'SLOs & Recap',
        chapter: 'recap',
        title: 'Recap: Error Budgets & SIGTERM Draining',
        paragraphs: [
          '✓ A <b>99.9% SLO</b> gives you <b>43.8 minutes/month</b> of Error Budget. Pair CI checks + Canary Rollbacks + <code class="inline-code">SIGTERM</code> connection draining to ship daily without fear!',
        ],
        compare: {
          headers: ['SLO Target', 'Monthly Downtime Budget', 'Typical Tier'],
          rows: [
            ['99.9% (Three 9s)', '43.8 min / mo', 'Standard SaaS / AI App'],
            ['99.99% (Four 9s)', '4.38 min / mo', 'Multi-AZ HA Core API'],
          ],
        },
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'slo', label: '99.9% Budget', value: '43.8 min/mo', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'box', x: 400, y: 220, label: 'CI/CD + Blue-Green + SLOs', sublabel: 'Ship Fearlessly', tone: 'green', icon: 'shield', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'zero-502 shipping' }],
          },
        }),
      },
    ],
  },
];
