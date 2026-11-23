import type { Lesson } from '../types/course';

export const CH7_AI_PRODUCTION: Lesson[] = [
  {
    id: 'ai-vector-hnsw',
    moduleId: 'ai-production',
    num: 1,
    title: 'Vector Databases & HNSW Graph Index',
    subtitle: 'Why exact O(n) cosine scans crawl on 5M embeddings — and how HNSW leaps across multi-layer graphs in 12ms.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'Why Brute-Force Flat vector scans stall at 1M+ embeddings',
      'Hierarchical Navigable Small World (HNSW) highway layers for O(log n) ANN',
      'Recall vs Memory/Speed tuning with efSearch and Product Quantization (PQ)',
    ],
    controls: [
      { id: 'vecs', label: 'Vectors (M)', type: 'slider', min: 1, max: 10, step: 1, unit: 'M', defaultValue: 5 },
      { id: 'index', label: 'Index Type', type: 'segmented', options: [{ label: 'Flat Scan O(n)', value: 'flat' }, { label: 'HNSW Graph', value: 'hnsw' }], defaultValue: 'hnsw' },
    ],
    codeTrace: {
      title: 'pgvector HNSW Index + Pre-Filtered Metadata Query',
      ts: [
        'CREATE INDEX idx_chunks_hnsw ON chunks',
        '  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);',
        '',
        'const hits = await db.execute(sql`SELECT text FROM chunks',
        '  WHERE org_id = ${orgId} ORDER BY embedding <=> ${qVec} LIMIT 8`);',
      ],
      py: [
        'hits = qdrant.search(',
        '    collection_name="docs", query_vector=q_vec,',
        '    query_filter=Filter(must=[FieldCondition(key="org_id", match=org_id)]),',
        '    search_params=SearchParams(hnsw_ef=64), limit=8',
        ')',
      ],
    },
    feynman: {
      prompt: 'How does an HNSW Vector Index find nearest neighbors in 12ms among 5,000,000 vectors instead of scanning every vector?',
      checkpoints: [
        { label: 'Builds multi-layer proximity graph with express long-range top layers', keywords: ['layer', 'graph', 'express', 'skip', 'highway', 'hierarchical'] },
        { label: 'Zooms down to dense bottom layer for O(log n) approximate nearest neighbors', keywords: ['bottom', 'local', 'ann', 'approx', 'o(log', '12'] },
      ],
      sampleAnswer:
        'HNSW builds a layered proximity graph like a highway system: sparse top layers hold long-range jumps to rapidly enter the right semantic neighborhood, then search drops down to dense lower layers to pinpoint the closest vectors in ~O(log n) time instead of comparing all 5M vectors.',
    },
    steps: [
      {
        id: 'hv-1',
        short: 'Flat Scan Wall',
        chapter: 'problem',
        title: 'Why brute-force vector search collapses past 1 Million chunks',
        paragraphs: [
          'Comparing a 1,536-dim query vector against 5,000,000 stored vectors requires 7.6 billion floating-point operations on EVERY query (<code class="inline-code">1.5 s+</code> latency)!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [4, 5], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'op', label: 'Flat Scan (5M)', value: '1,550 ms!', level: 'bad' },
            { id: 'mem', label: 'Raw Float32 RAM', value: '30 GB for 5M', level: 'warn' },
          ],
          scene: {
            nodes: [
              { id: 'q', kind: 'device', x: 165, y: 220, label: 'Search Query', icon: 'search' },
              { id: 'db', kind: 'cylinder', x: 525, y: 220, label: 'Flat Table (5M Rows)', sublabel: '7.6B float muls/req', tone: 'red', load: 96, glow: 'bad' },
            ],
            links: [{ id: 'l1', from: 'q', to: 'db', flow: { kind: 'heavy', rate: 2, speed: 0.7 } }],
            legend: [{ kind: 'heavy', label: 'O(N×D) brute scan' }],
          },
        }),
      },
      {
        id: 'hv-2',
        short: 'HNSW Layers',
        chapter: 'technique',
        title: 'Skip-list highways across 5 million semantic vectors',
        paragraphs: [
          'Compare <b>Flat Scan</b> against <b>HNSW Graph</b>: sparse express layers zoom straight into the right neighborhood in <code class="inline-code">12 ms</code>!',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: (p) => {
          const m = Number(p.vecs ?? 5);
          const isHnsw = p.index === 'hnsw';
          const lat = isHnsw ? 10 + m : m * 310;
          return {
            metrics: [
              { id: 'lat', label: 'Vector Search', value: `${lat} ms`, level: isHnsw ? 'good' : 'bad' },
              { id: 'rec', label: 'Recall@10', value: isHnsw ? '98.4% (ef=64)' : '100% Exact', level: 'good' },
              { id: 'cplx', label: 'Complexity', value: isHnsw ? 'O(log N)' : 'O(N × D)', level: isHnsw ? 'good' : 'bad' },
            ],
            scene: {
              nodes: [
                { id: 'q', kind: 'graphNode', x: 165, y: 120, label: 'Query', sublabel: 'Layer 2 Entry', graphState: { status: 'frontier', badge: 'start' } },
                { id: 'h1', kind: 'graphNode', x: 390, y: 120, label: 'Hub 7', sublabel: 'Express Jump', graphState: { status: isHnsw ? 'path' : 'visited' } },
                { id: 'h2', kind: 'graphNode', x: 390, y: 270, label: 'Node 42', sublabel: 'Layer 1', graphState: { status: isHnsw ? 'path' : 'visited' } },
                { id: 'hit', kind: 'graphNode', x: 615, y: 270, label: 'Doc #9', sublabel: 'cos=0.92!', graphState: { status: 'path', badge: 'top-1' } },
                { id: 'far', kind: 'graphNode', x: 205, y: 315, label: 'Noise', sublabel: isHnsw ? 'skipped!' : 'scanned!', graphState: { status: isHnsw ? 'unvisited' : 'frontier' } },
              ],
              links: [
                { id: 'e1', from: 'q', to: 'h1', label: 'long hop', flow: { kind: 'ai', rate: 1, speed: 1.5 } },
                { id: 'e2', from: 'h1', to: 'h2', label: 'drop layer', flow: { kind: 'ai', rate: 1, speed: 1.5 } },
                { id: 'e3', from: 'h2', to: 'hit', label: 'nearest!', flow: { kind: 'response', rate: 1, speed: 1.6 } },
                { id: 'e4', from: 'q', to: 'far', dashed: true, dimmed: isHnsw },
              ],
              legend: [{ kind: 'ai', label: 'HNSW express path' }],
            },
          };
        },
      },
      {
        id: 'hv-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Quantization & Multi-Tenant Filtering',
        paragraphs: [
          '✓ Always filter by <code class="inline-code">org_id</code> cleanly using <b>iterative / pre-filtered HNSW</b> (so post-filtering doesn’t drop results down to 0 hits!).',
          '✓ Enable Scalar (INT8) or Binary Quantization to shrink Vector RAM by 4–32×!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [4, 5], py: [3, 4] },
        evaluate: () => ({
          metrics: [{ id: 'q', label: 'INT8 Quantization', value: '4× Smaller RAM', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'cylinder', x: 400, y: 220, label: 'HNSW + INT8 + org_id Filter', sublabel: '12ms · 98.4% Recall', tone: 'green', glow: 'good' }],
            links: [],
            legend: [{ kind: 'ai', label: 'fast vector retrieval' }],
          },
        }),
      },
    ],
  },

  {
    id: 'ai-production-rag',
    moduleId: 'ai-production',
    num: 2,
    title: 'Production RAG: Chunking, Hybrid & Rerank',
    subtitle: 'Why naive Top-5 vector search misses error codes — and how BM25 + Vector + Reranker hits 94% precision.',
    duration: '14 min',
    level: 'Intermediate',
    goals: [
      'Semantic chunking with overlap (~400 tokens + 15% overlap + metadata headers)',
      'Hybrid Search combining Dense Vector + Sparse BM25 via Reciprocal Rank Fusion (RRF)',
      'Cross-Encoder Reranker compressing Top-40 candidates down to the sharpest Top-5 chunks',
    ],
    controls: [
      { id: 'hybrid', label: 'BM25 + Vector (RRF)', type: 'toggle', defaultValue: true },
      { id: 'rerank', label: 'Cross-Encoder Rerank', type: 'toggle', defaultValue: true },
    ],
    codeTrace: {
      title: 'Hybrid RRF + Cross-Encoder Rerank Pipeline',
      ts: [
        'const [dense, sparse] = await Promise.all([',
        '  qdrant.search(embed(q), { limit: 30 }),',
        '  bm25.search(q, { limit: 30 }), // catches exact SKUs & error codes!',
        ']);',
        'const merged = reciprocalRankFusion(dense, sparse).slice(0, 40);',
        'const top5 = await cohere.rerank({ query: q, docs: merged, topN: 5 });',
      ],
      py: [
        'dense, sparse = await asyncio.gather(vec_search(q, 30), bm25_search(q, 30))',
        'fused = rrf_merge(dense, sparse)[:40]',
        'top5 = await reranker.rerank(query=q, documents=fused, top_n=5)',
      ],
    },
    feynman: {
      prompt: 'Why do production RAG systems pair Vector Search with BM25 keyword search and a Cross-Encoder Reranker?',
      checkpoints: [
        { label: 'BM25 catches exact error codes/names/IDs that dense embeddings blur', keywords: ['bm25', 'keyword', 'exact', 'code', 'id', 'hybrid', 'rrf'] },
        { label: 'Cross-Encoder jointly reads query + chunk to score true relevance accurately', keywords: ['rerank', 'cross', 'precision', 'top', 'relevant', 'joint'] },
      ],
      sampleAnswer:
        'Dense vectors capture paraphrased meaning, but often miss exact identifiers like error code `ERR_PG_4091` or product SKUs—BM25 catches those exact matches, and Reciprocal Rank Fusion blends both lists. Then a Cross-Encoder Reranker reads query and document side-by-side to promote the truly relevant Top-5 before prompting the LLM.',
    },
    steps: [
      {
        id: 'rag-1',
        short: 'Smart Chunking',
        chapter: 'setup',
        title: 'Garbage chunks in = hallucinated answers out',
        paragraphs: [
          'Blind 500-char splits slice tables and headings in half. Use <span class="term">Markdown/Structure Chunking</span> (~400 tokens + 15% overlap) and prepend the document title + section heading to every chunk!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 2], py: [1, 1] },
        evaluate: () => ({
          metrics: [
            { id: 'sz', label: 'Sweet Spot', value: '384–512 tok + 15%', level: 'good' },
            { id: 'ctx', label: 'Header Prefix', value: '[Doc > Section]', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'doc', kind: 'box', x: 185, y: 220, label: 'Raw PDF / Docs', tone: 'sand', icon: 'code' },
              { id: 'chk', kind: 'arrayViz', x: 525, y: 220, label: 'Overlapping Semantic Chunks', arrayData: { cells: ['H1+P1', 'P1+P2', 'P2+Tbl', 'Tbl+P3'], pointers: [{ index: 1, label: '15% overlap', color: '#cfe3b2' }], highlights: [1, 2], summary: 'Heading attached to every chunk!' } },
            ],
            links: [{ id: 'l1', from: 'doc', to: 'chk', flow: { kind: 'ai', rate: 1.1, speed: 1.5 } }],
            legend: [{ kind: 'ai', label: 'context-preserving chunks' }],
          },
        }),
      },
      {
        id: 'rag-2',
        short: 'Hybrid + Rerank',
        chapter: 'solution',
        title: 'From 62% naive vector accuracy to 94% grounded RAG precision',
        paragraphs: [
          'Toggle <b>BM25 + Vector</b> and <b>Cross-Encoder Rerank</b> to watch exact precision and hallucination risk shift live!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 3] },
        evaluate: (p) => {
          const hyb = Boolean(p.hybrid);
          const rr = Boolean(p.rerank);
          const prec = 62 + (hyb ? 16 : 0) + (rr ? 16 : 0);
          return {
            metrics: [
              { id: 'pr', label: 'Context Precision', value: `${prec}%`, level: prec > 88 ? 'good' : prec > 72 ? 'warn' : 'bad' },
              { id: 'tok', label: 'Context Tokens', value: rr ? '2.1k sharp tokens' : '8.5k noisy tokens', level: rr ? 'good' : 'warn' },
              { id: 'hall', label: 'Hallucination Risk', value: prec > 88 ? 'Low (<3%)' : 'High', level: prec > 88 ? 'good' : 'bad' },
            ],
            scene: {
              nodes: [
                { id: 'q', kind: 'box', x: 120, y: 220, label: 'User Query', sublabel: 'ERR_4091 reset', tone: 'sand', icon: 'search' },
                { id: 'vec', kind: 'cylinder', x: 315, y: 135, label: 'Vector DB', sublabel: 'semantic top-30', tone: 'violet' },
                { id: 'bm', kind: 'cylinder', x: 315, y: 310, label: 'BM25 Keyword', sublabel: hyb ? 'exact ERR_4091' : 'DISABLED', tone: hyb ? 'blue' : 'red', dimmed: !hyb },
                { id: 'rr', kind: 'box', x: 525, y: 220, label: 'Reranker', sublabel: rr ? 'Top-40 → Top-5' : 'BYPASSED', tone: rr ? 'green' : 'amber', icon: 'filter', glow: rr ? 'good' : undefined },
                { id: 'llm', kind: 'box', x: 705, y: 220, label: 'LLM Stream', sublabel: `${prec}% precision`, tone: prec > 88 ? 'green' : 'red', icon: 'ai' },
              ],
              links: [
                { id: 'l1', from: 'q', to: 'vec', flow: { kind: 'ai', rate: 1, speed: 1.5 } },
                { id: 'l2', from: 'q', to: 'bm', dashed: !hyb, flow: hyb ? { kind: 'request', rate: 1, speed: 1.5 } : undefined },
                { id: 'l3', from: 'vec', to: 'rr', flow: { kind: 'ai', rate: 1, speed: 1.4 } },
                { id: 'l4', from: 'bm', to: 'rr', dashed: !hyb, flow: hyb ? { kind: 'response', rate: 1, speed: 1.4 } : undefined },
                { id: 'l5', from: 'rr', to: 'llm', flow: { kind: prec > 88 ? 'ai' : 'heavy', rate: 1.1, speed: 1.5 } },
              ],
              legend: [{ kind: 'ai', label: 'hybrid retrieval + rerank' }],
            },
          };
        },
      },
      {
        id: 'rag-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Grounding & Inline Citations',
        paragraphs: [
          '✓ Instruct your model to cite chunk IDs (<code class="inline-code">[doc#2]</code>) and say <i>“I don’t have that in the docs”</i> when Top-5 rerank scores fall below threshold!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [5, 6], py: [2, 3] },
        evaluate: () => ({
          metrics: [{ id: 'cit', label: 'Groundedness', value: '94% + Inline Citations', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'box', x: 400, y: 220, label: 'Chunk → Hybrid RRF → Rerank → Cite', tone: 'green', icon: 'ai', glow: 'good' }],
            links: [],
            legend: [{ kind: 'ai', label: 'citation-grounded RAG' }],
          },
        }),
      },
    ],
  },

  {
    id: 'ai-agents-guardrails',
    moduleId: 'ai-production',
    num: 3,
    title: 'AI Agents: Loops, Memory & Guardrails',
    subtitle: 'Design bounded Reason → Act → Observe loops with short/long memory, circuit breakers, and HITL.',
    duration: '13 min',
    level: 'Mastery',
    goals: [
      'Reason → Tool Call → Observe loops with strict maxSteps & token budgets',
      'Short-term sliding thread memory vs long-term semantic memory',
      'Prompt-injection defense, PII scrubbing, and Human-in-the-Loop (HITL) approvals',
    ],
    controls: [
      { id: 'maxSteps', label: 'Max Steps', type: 'slider', min: 2, max: 12, step: 1, defaultValue: 5 },
      { id: 'guard', label: 'Guardrails + HITL', type: 'toggle', defaultValue: true },
    ],
    codeTrace: {
      title: 'Bounded ReAct Agent Loop with HITL Gate',
      ts: [
        'for (let step = 0; step < MAX_STEPS && costCents < BUDGET; step++) {',
        '  const act = await llm.nextAction(state);',
        '  if (act.type === "final") return guardrails.checkPII(act.answer);',
        '  if (act.tool.isDestructive) await requestHumanApproval(act);',
        '  state.observe(await runToolSandboxed(act));',
        '}',
      ],
      py: [
        'for step in range(MAX_STEPS):',
        '    act = await llm.next_action(state)',
        '    if act.is_final: return scrub_pii(act.answer)',
        '    if act.tool in DESTRUCTIVE_TOOLS: await hitl_confirm(act)',
        '    state.observe(await sandbox_exec(act))',
      ],
    },
    feynman: {
      prompt: 'Why must production AI Agents enforce maxSteps/cost budgets and Human-in-the-Loop (HITL) checks?',
      checkpoints: [
        { label: 'Agents can loop infinitely on bad tool errors and burn huge token bills', keywords: ['loop', 'infin', 'budget', 'max', 'step', 'cost', 'runaway'] },
        { label: 'Prompt injection in retrieved text makes HITL/RBAC vital before destructive writes', keywords: ['inject', 'hitl', 'human', 'approv', 'destruct', 'sandbox'] },
      ],
      sampleAnswer:
        'Because an autonomous agent can get stuck retrying broken tool errors endlessly and burn hundreds of dollars, every agent loop needs hard `maxSteps` and cost caps. Moreover, untrusted web or email text can carry prompt injections—so destructive actions must pass strict schema auth and Human-in-the-Loop approval.',
    },
    steps: [
      {
        id: 'ag-1',
        short: 'Agent Memory',
        chapter: 'setup',
        title: 'Workflows vs Autonomous Agents — and 2-Tier Memory',
        paragraphs: [
          'Keep deterministic pipelines as simple code graphs; use an autonomous <span class="term">Agent Loop</span> only when steps depend dynamically on tool outputs.',
          'Give agents <b>Short-Term Memory</b> (summarized thread window) + <b>Long-Term Memory</b> (vector preferences/facts).',
        ],
        goalHits: [1],
        activeCodeLines: { ts: [1, 2], py: [1, 2] },
        evaluate: () => ({
          metrics: [
            { id: 'mem1', label: 'Short-Term', value: 'Sliding Thread + Summary', level: 'good' },
            { id: 'mem2', label: 'Long-Term', value: 'User Vector Store', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'st', kind: 'box', x: 225, y: 150, label: 'Working Memory', sublabel: 'Last 10 msgs + summary', tone: 'blue', icon: 'code' },
              { id: 'lt', kind: 'cylinder', x: 225, y: 300, label: 'Long-Term Vector', sublabel: 'Cross-session facts', tone: 'violet' },
              { id: 'ag', kind: 'box', x: 565, y: 225, label: 'ReAct Agent Core', sublabel: 'Reason → Act → Observe', tone: 'green', icon: 'ai', glow: 'good' },
            ],
            links: [
              { id: 'l1', from: 'st', to: 'ag', flow: { kind: 'request', rate: 1, speed: 1.4 } },
              { id: 'l2', from: 'lt', to: 'ag', flow: { kind: 'ai', rate: 0.9, speed: 1.4 } },
            ],
            legend: [{ kind: 'ai', label: 'memory retrieval' }],
          },
        }),
      },
      {
        id: 'ag-2',
        short: 'Agent Loop',
        chapter: 'technique',
        title: 'Bound the Reason → Tool → Observe cycle safely',
        paragraphs: [
          'Every iteration runs through a <span class="term">Guardrail + Sandbox</span> layer before writing to real databases or external APIs.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 5] },
        evaluate: (p) => {
          const safe = Boolean(p.guard);
          const steps = Number(p.maxSteps ?? 5);
          return {
            metrics: [
              { id: 'cap', label: 'Loop Cap', value: `≤ ${steps} steps`, level: steps > 8 ? 'warn' : 'good' },
              { id: 'sec', label: 'Injection Guard', value: safe ? 'HITL + PII Active' : 'UNSAFE AUTONOMY!', level: safe ? 'good' : 'bad' },
            ],
            scene: {
              nodes: [
                { id: 'pl', kind: 'box', x: 175, y: 220, label: 'Planner LLM', sublabel: `step ≤ ${steps}`, tone: 'violet', icon: 'ai' },
                { id: 'gd', kind: 'box', x: 420, y: 220, label: safe ? 'Guardrail + HITL' : 'Direct Unchecked', tone: safe ? 'green' : 'red', icon: 'shield', glow: safe ? 'good' : 'bad' },
                { id: 'tl', kind: 'box', x: 660, y: 220, label: 'Sandboxed Tools', sublabel: 'SQL / Search / API', tone: 'blue', icon: 'code' },
              ],
              links: [
                { id: 'l1', from: 'pl', to: 'gd', label: '1. Reason', flow: { kind: 'ai', rate: 1, speed: 1.4 } },
                { id: 'l2', from: 'gd', to: 'tl', label: '2. Act', flow: { kind: safe ? 'response' : 'heavy', rate: 1, speed: 1.4 } },
              ],
              legend: [{ kind: 'ai', label: 'bounded agent loop' }],
            },
          };
        },
      },
      {
        id: 'ag-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Untrusted Data Needs Strict Capability Limits',
        paragraphs: [
          '✓ Treat scraped web pages, emails, and user docs as <b>untrusted input</b>—use read-only SQL roles, strict domain allowlists, and HITL prompts before refunds, deletes, or sending emails!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [3, 5], py: [3, 5] },
        evaluate: () => ({
          metrics: [{ id: 'safe', label: 'Safety Model', value: 'Least-Privilege + HITL', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'box', x: 400, y: 220, label: 'Bounded Agent + HITL Gate', tone: 'green', icon: 'lock', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'safe tool execution' }],
          },
        }),
      },
    ],
  },

  {
    id: 'ai-evals-observability',
    moduleId: 'ai-production',
    num: 4,
    title: 'AI Evals, Semantic Caching & Tracing',
    subtitle: 'Ship prompt/model changes with CI golden eval datasets, LLM-as-a-Judge, and OpenTelemetry spans.',
    duration: '12 min',
    level: 'Mastery',
    goals: [
      'Why "vibe-checking" breaks whenever models or prompts change',
      'CI Golden Datasets + LLM-as-a-Judge scoring Groundedness & Correctness',
      'Semantic Cache returning instant 25ms cached answers for cosine ≥ 0.94 queries',
    ],
    controls: [
      { id: 'semCache', label: 'Semantic Cache', type: 'toggle', defaultValue: true },
    ],
    codeTrace: {
      title: 'Semantic Cache + OpenTelemetry Span Trace',
      ts: [
        'const simHit = await redisVector.findNearest(qVec, { minCosine: 0.94 });',
        'if (simHit) return simHit.answer; // 24ms · $0 LLM cost!',
        'const span = tracer.startSpan("rag.pipeline");',
        'const answer = await runRagAndLogEval(query, span);',
      ],
      py: [
        'if hit := await sem_cache.match(q_vec, threshold=0.94):',
        '    return hit.answer  # 24ms · $0 cost',
        'with tracer.start_as_current_span("rag.pipeline") as span:',
        '    return await run_rag_with_judge(query, span)',
      ],
    },
    feynman: {
      prompt: 'How do AI Evals (CI golden datasets) and Semantic Caching work together in production?',
      checkpoints: [
        { label: 'Golden evals + LLM-as-a-Judge catch accuracy/hallucination regressions on every PR', keywords: ['eval', 'golden', 'judge', 'regress', 'ci', 'grounded'] },
        { label: 'Semantic cache serves repeated/paraphrased queries by vector similarity at $0 & ~25ms', keywords: ['semantic', 'cache', 'cosine', 'paraphras', 'cost', 'fast'] },
      ],
      sampleAnswer:
        'CI AI Evals run 100+ golden test queries on every prompt or retrieval tweak and score faithfulness/accuracy automatically with an LLM-as-a-Judge so you never ship a silent regression. Meanwhile, a Semantic Cache embeds incoming queries and returns cached answers when cosine similarity exceeds ~0.94, saving 30–50% of LLM spend at 25ms latency.',
    },
    steps: [
      {
        id: 'ev-1',
        short: 'Stop Vibe-Checks',
        chapter: 'problem',
        title: 'Why changing 1 prompt line can silently break 20% of edge cases',
        paragraphs: [
          'Without automated <span class="term">AI Evals</span>, fixing one customer ticket by editing a prompt silently degrades formatting, citations, or latency elsewhere!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [3, 4], py: [3, 4] },
        evaluate: () => ({
          metrics: [
            { id: 'vb', label: 'Manual Vibe-Check', value: 'Silent Regressions!', level: 'bad' },
            { id: 'ci', label: '100-Row CI Eval', value: 'Pass/Fail Gate ✓', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'pr', kind: 'box', x: 185, y: 220, label: 'Prompt / Model PR', tone: 'sand', icon: 'code' },
              { id: 'ev', kind: 'box', x: 525, y: 220, label: 'CI Eval Runner', sublabel: '100 Golden Cases + Judge', tone: 'green', icon: 'shield', glow: 'good' },
            ],
            links: [{ id: 'l1', from: 'pr', to: 'ev', flow: { kind: 'ai', rate: 1, speed: 1.5 } }],
            legend: [{ kind: 'ai', label: 'automated CI eval gate' }],
          },
        }),
      },
      {
        id: 'ev-2',
        short: 'Cache + Trace',
        chapter: 'solution',
        title: 'Measure every span and cache paraphrased repeat questions',
        paragraphs: [
          'Toggle <b>Semantic Cache</b> on: repeat questions like <i>"How do I reset my key?"</i> and <i>"Forgot API key reset steps"</i> match at <code class="inline-code">cos ≥ 0.94</code> in 24ms!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 4], py: [1, 4] },
        evaluate: (p) => {
          const sc = Boolean(p.semCache);
          return {
            metrics: [
              { id: 'hit', label: 'Repeat Query', value: sc ? '24 ms ($0)' : '1,400 ms ($0.02)', level: sc ? 'good' : 'warn' },
              { id: 'ci', label: 'CI Eval Gate', value: '94% Faithfulness', level: 'good' },
              { id: 'obs', label: 'OTel Spans', value: 'Embed→Vec→Rerank→LLM', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'in', kind: 'box', x: 145, y: 220, label: 'AI Gateway', icon: 'shield', tone: 'sand' },
                { id: 'sc', kind: 'box', x: 380, y: 135, label: 'Semantic Cache', sublabel: sc ? 'cos ≥ 0.94 → 24ms!' : 'BYPASSED', tone: sc ? 'green' : 'red', icon: 'cache', glow: sc ? 'good' : undefined, dimmed: !sc },
                { id: 'rag', kind: 'box', x: 380, y: 310, label: 'RAG + LLM', sublabel: 'OTel Span Traced', tone: 'violet', icon: 'ai' },
                { id: 'eval', kind: 'box', x: 645, y: 220, label: 'Eval & Judge', sublabel: 'CI + Online Faithfulness', tone: 'blue', icon: 'code' },
              ],
              links: [
                { id: 'l1', from: 'in', to: 'sc', dashed: !sc, flow: sc ? { kind: 'cache', rate: 1.4, speed: 1.8 } : undefined },
                { id: 'l2', from: 'in', to: 'rag', flow: { kind: 'ai', rate: sc ? 0.6 : 1.5, speed: 1.4 } },
                { id: 'l3', from: 'rag', to: 'eval', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              ],
              legend: [{ kind: 'cache', label: '24ms semantic cache hit' }, { kind: 'ai', label: 'traced LLM span' }],
            },
          };
        },
      },
      {
        id: 'ev-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: The RAG Triad & Trace Hierarchy',
        paragraphs: [
          '✓ Measure the <b>RAG Triad</b>: 1) Context Relevance (did retrieval find the answer?), 2) Faithfulness (did the LLM stick to context?), 3) Answer Accuracy!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 4], py: [1, 4] },
        evaluate: () => ({
          metrics: [{ id: 'tri', label: 'RAG Triad', value: 'Relevance · Faithfulness · Accuracy', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'box', x: 400, y: 220, label: 'Evals + OTel + Semantic Cache', tone: 'green', icon: 'ai', glow: 'good' }],
            links: [],
            legend: [{ kind: 'ai', label: 'observable production AI' }],
          },
        }),
      },
    ],
  },
];
