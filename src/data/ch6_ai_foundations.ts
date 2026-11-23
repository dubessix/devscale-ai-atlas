import type { Lesson } from '../types/course';

export const CH6_AI_FOUNDATIONS: Lesson[] = [
  {
    id: 'ai-tokens-embeddings',
    moduleId: 'ai-foundations',
    num: 1,
    title: 'Tokenization, Embeddings & Cosine Similarity',
    subtitle: 'How words turn into BPE subword tokens, 1536-dim meaning vectors, and semantic similarity scores.',
    duration: '11 min',
    level: 'Beginner',
    goals: [
      'Why LLMs read subword BPE tokens (~0.75 words/token) rather than whole words',
      'Turning sentences into dense float arrays (Embeddings) where close meaning = close direction',
      'Measuring semantic match with Cosine Similarity',
    ],
    controls: [
      { id: 'queryKind', label: 'Query Pair', type: 'segmented', options: [{ label: '"reset password" ↔ "forgot login"', value: 'close' }, { label: '"reset password" ↔ "pizza dough"', value: 'far' }], defaultValue: 'close' },
    ],
    codeTrace: {
      title: 'Embedding + Cosine Similarity Math',
      ts: [
        'const vecA = await embed("How do I reset my password?");',
        'const vecB = await embed("Forgot login credentials");',
        'const cosine = dot(vecA, vecB) / (norm(vecA) * norm(vecB));',
        '// close meaning => 0.91 · unrelated => 0.12',
      ],
      py: [
        'vec_a = await embed("How do I reset my password?")',
        'vec_b = await embed("Forgot login credentials")',
        'cosine = np.dot(vec_a, vec_b) / (norm(vec_a) * norm(vec_b))',
        '# 0.91 semantic match even with zero shared words!',
      ],
    },
    feynman: {
      prompt: 'How can Cosine Similarity match "forgot login" to "reset password" even though they share zero exact words?',
      checkpoints: [
        { label: 'Embedding models map similar meanings to nearby vector directions', keywords: ['embed', 'vector', 'meaning', 'semantic', 'direction', 'angle'] },
        { label: 'Cosine measures angle closeness regardless of sentence length', keywords: ['cosine', 'angle', 'dot', '0.9', 'similar'] },
      ],
      sampleAnswer:
        'An embedding model converts text into high-dimensional vectors where semantically related ideas point in nearly the same direction. Cosine similarity measures the angle between two vectors, yielding a score near 0.91 for "forgot login" and "reset password" even without overlapping keywords.',
    },
    steps: [
      {
        id: 'tok-1',
        short: 'BPE Tokens',
        chapter: 'setup',
        title: 'Why LLMs chop words into BPE subword chunks',
        paragraphs: [
          'Characters alone make sequences too long; whole words fail on typos & code identifiers. <span class="term">Byte-Pair Encoding (BPE)</span> splits frequent roots cleanly (<code class="inline-code">"pass" + "word"</code>) so 1 token ≈ 4 English characters.',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 2], py: [1, 2] },
        evaluate: () => ({
          metrics: [
            { id: 'ratio', label: 'Avg Token', value: '~0.75 words / tok', level: 'good' },
            { id: 'vocab', label: 'Vocab Size', value: '100k–128k IDs', level: 'neutral' },
          ],
          scene: {
            nodes: [
              { id: 'txt', kind: 'box', x: 185, y: 220, label: 'Raw Prompt Text', sublabel: '"resetting passwords"', tone: 'sand', icon: 'code' },
              { id: 'arr', kind: 'arrayViz', x: 525, y: 220, label: 'BPE Tokenizer Output IDs', arrayData: { cells: ['reset', 'ting', ' pass', 'word', 's'], pointers: [{ index: 0, label: 'subword', color: '#e7ddf5' }], highlights: [0, 2], summary: '5 tokens → [1842, 812, 1209, 2765, 82]' } },
            ],
            links: [{ id: 'l1', from: 'txt', to: 'arr', flow: { kind: 'ai', rate: 1, speed: 1.5 } }],
            legend: [{ kind: 'ai', label: 'subword tokenization' }],
          },
        }),
      },
      {
        id: 'tok-2',
        short: 'Cosine Match',
        chapter: 'technique',
        title: 'From subword tokens to semantic meaning vectors',
        paragraphs: [
          'An <span class="term">Embedding Model</span> maps tokens into a 1,536-dim float vector so <code class="inline-code">"reset password"</code> and <code class="inline-code">"forgot login"</code> score <code class="inline-code">0.91</code>!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 4], py: [1, 4] },
        evaluate: (p) => {
          const isClose = p.queryKind !== 'far';
          return {
            metrics: [
              { id: 'cos', label: 'Cosine Sim', value: isClose ? '0.91 (Match!)' : '0.12 (Unrelated)', level: isClose ? 'good' : 'warn' },
              { id: 'dims', label: 'Vector Dims', value: '1,536 floats', level: 'neutral' },
            ],
            scene: {
              nodes: [
                { id: 'tok', kind: 'arrayViz', x: 245, y: 215, label: 'BPE Subword Tokens', arrayData: { cells: ['How', 'do', 'I', 'reset', 'pass', 'word'], pointers: [{ index: 4, label: 'sub', color: '#e7ddf5' }], highlights: [3, 4, 5], summary: '6 tokens · ~4 chars/tok' } },
                { id: 'vec', kind: 'box', x: 585, y: 215, label: 'Cosine Match', sublabel: isClose ? 'cos(θ) = 0.91!' : 'cos(θ) = 0.12', tone: isClose ? 'green' : 'orange', icon: 'vector', glow: isClose ? 'good' : undefined },
              ],
              links: [{ id: 'l1', from: 'tok', to: 'vec', label: 'embed(1536-d)', flow: { kind: 'ai', rate: 1.2, speed: 1.5 } }],
              legend: [{ kind: 'ai', label: 'semantic embedding' }],
            },
          };
        },
      },
      {
        id: 'tok-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Normalize Vectors for Dot-Product Speed',
        paragraphs: [
          '✓ Most modern embeddings are unit-length (<code class="inline-code">norm = 1</code>), making <b>Cosine Similarity</b> identical to a single super-fast SIMD <b>Dot Product</b>!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [3, 4], py: [3, 4] },
        evaluate: () => ({
          metrics: [{ id: 'dot', label: 'Unit Vectors', value: 'Cosine == Dot(A, B)', level: 'good' }],
          scene: {
            nodes: [{ id: 'v', kind: 'box', x: 400, y: 220, label: 'BPE + Normalized Embeddings', sublabel: 'Powering Search, Clustering & RAG', tone: 'green', icon: 'vector', glow: 'good' }],
            links: [],
            legend: [{ kind: 'ai', label: 'semantic vectors' }],
          },
        }),
      },
    ],
  },

  {
    id: 'ai-transformers-attention',
    moduleId: 'ai-foundations',
    num: 2,
    title: 'Transformers & Self-Attention Grid',
    subtitle: 'How Q, K, V matrices let every token attend to relevant context — and why context costs O(N²).',
    duration: '13 min',
    level: 'Intermediate',
    goals: [
      'Query (what I look for), Key (what I offer), Value (what I pass on)',
      'Causal masking so tokens only attend to earlier tokens during generation',
      'Why self-attention computes an N×N matrix (explaining long-context latency/cost)',
    ],
    controls: [
      { id: 'focus', label: 'Active Token', type: 'segmented', options: [{ label: '"it" → "bank"', value: 'bank' }, { label: '"sat" → "cat"', value: 'cat' }], defaultValue: 'bank' },
    ],
    codeTrace: {
      title: 'Scaled Dot-Product Attention: Softmax(QKᵀ / √d) · V',
      ts: [
        'const scores = matmul(Q, transpose(K)).map(s => s / Math.sqrt(d_k));',
        'const causal = applyCausalMask(scores); // block future tokens = -Infinity',
        'const weights = softmax(causal);      // each row sums to 1.00',
        'const out = matmul(weights, V);       // blend attended Values!',
      ],
      py: [
        'scores = (Q @ K.transpose(-2, -1)) / math.sqrt(d_k)',
        'scores = scores.masked_fill(causal_mask == 0, float("-inf"))',
        'weights = F.softmax(scores, dim=-1)',
        'out = weights @ V',
      ],
    },
    feynman: {
      prompt: 'In Transformer Self-Attention, what are Query, Key, and Value, and why does long context get expensive?',
      checkpoints: [
        { label: 'Q matches against K to compute softmax weights, then blends V', keywords: ['query', 'key', 'value', 'softmax', 'weight', 'dot'] },
        { label: 'Computes N×N token pairs -> O(N²) quadratic scaling with sequence length', keywords: ['n²', 'n^2', 'quadratic', 'context', 'length', 'pair'] },
      ],
      sampleAnswer:
        'Each token produces a Query (what context it needs), Key (what label it advertises), and Value (its payload). Dot-products of Q and K followed by softmax determine attention weights over all earlier Values. Because every token scores against every prior token, standard attention scales O(N²) with context length.',
    },
    steps: [
      {
        id: 'att-1',
        short: 'Q, K, V Roles',
        chapter: 'setup',
        title: 'How tokens search each other with Query, Key & Value',
        paragraphs: [
          'Think of a library database inside every Transformer layer: each token emits a <span class="term">Query</span> (“what context clarifies me?”), a <span class="term">Key</span> (“what topic am I?”), and a <span class="term">Value</span> (“here is my meaning payload”).',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 1], py: [1, 1] },
        evaluate: () => ({
          metrics: [
            { id: 'heads', label: 'Multi-Head', value: '32–96 Heads/Layer', level: 'good' },
            { id: 'scale', label: 'Scaling', value: '÷ √d_k prevents saturation', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'q', kind: 'box', x: 175, y: 145, label: 'Query (Q)', sublabel: '"it" asks: noun?', tone: 'violet', icon: 'search' },
              { id: 'k', kind: 'box', x: 175, y: 295, label: 'Key (K)', sublabel: '"bank" / "cat"', tone: 'blue', icon: 'code' },
              { id: 'sm', kind: 'box', x: 430, y: 220, label: 'Softmax(QKᵀ/√d)', tone: 'amber', icon: 'ai' },
              { id: 'v', kind: 'box', x: 660, y: 220, label: 'Blended Value (V)', tone: 'green', icon: 'vector', glow: 'good' },
            ],
            links: [
              { id: 'l1', from: 'q', to: 'sm', flow: { kind: 'ai', rate: 1, speed: 1.4 } },
              { id: 'l2', from: 'k', to: 'sm', flow: { kind: 'request', rate: 1, speed: 1.4 } },
              { id: 'l3', from: 'sm', to: 'v', flow: { kind: 'response', rate: 1.2, speed: 1.5 } },
            ],
            legend: [{ kind: 'ai', label: 'Q·K attention match' }],
          },
        }),
      },
      {
        id: 'att-2',
        short: 'Attention Grid',
        chapter: 'insight',
        title: 'Watch Self-Attention resolve pronouns in a 2D weight grid',
        paragraphs: [
          'In <i>"The cat sat by the river bank because <b>it</b>..."</i>, token <code class="inline-code">"it"</code> assigns high softmax weight to <code class="inline-code">"bank"</code>! Notice the <code class="inline-code">—</code> upper triangle: causal masking forbids peeking ahead.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 4], py: [1, 4] },
        evaluate: (p) => {
          const isBank = p.focus === 'bank';
          return {
            metrics: [
              { id: 'ops', label: 'Attention Cost', value: 'O(N² tokens)', level: 'warn' },
              { id: 'att', label: 'Strongest Link', value: isBank ? '"it" → "bank" (0.78)' : '"sat" → "cat" (0.81)', level: 'good' },
            ],
            scene: {
              nodes: [
                {
                  id: 'att',
                  kind: 'matrixViz',
                  x: 400,
                  y: 225,
                  label: 'Causal Self-Attention Weights (Softmax Row = 1.0)',
                  matrixData: {
                    rowLabels: ['cat', 'sat', 'bank', 'it'],
                    colLabels: ['cat', 'sat', 'bank', 'it'],
                    values: [
                      ['1.0', '—', '—', '—'],
                      ['0.81', '0.19', '—', '—'],
                      ['0.15', '0.10', '0.75', '—'],
                      ['0.12', '0.05', '0.78', '0.05'],
                    ],
                    active: isBank ? [3, 2] : [1, 0],
                    deps: isBank ? [[2, 2]] : [[0, 0]],
                    formula: isBank ? 'Attn("it", "bank") = softmax(Q_it · K_bank / √d) = 0.78' : 'Attn("sat", "cat") = softmax(Q_sat · K_cat / √d) = 0.81',
                  },
                },
              ],
              links: [],
              legend: [{ kind: 'ai', label: 'O(N²) attention matrix' }],
            },
          };
        },
      },
      {
        id: 'att-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Why Context Windows Have Cost & "Lost in the Middle"',
        paragraphs: [
          '✓ Doubling prompt length quadruples raw attention math (<code class="inline-code">O(N²)</code>), and models often pay sharpest attention to the start and end of giant prompts—making sharp RAG retrieval beat dumping 100k noisy tokens!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 4], py: [1, 4] },
        evaluate: () => ({
          metrics: [{ id: 'fa', label: 'Hardware Trick', value: 'FlashAttention IO-Tiling', level: 'good' }],
          scene: {
            nodes: [{ id: 'tf', kind: 'box', x: 400, y: 220, label: 'Causal Transformer Layer', sublabel: 'O(N²) context → retrieve sharp chunks!', tone: 'violet', icon: 'ai', glow: 'good' }],
            links: [],
            legend: [{ kind: 'ai', label: 'transformer intuition' }],
          },
        }),
      },
    ],
  },

  {
    id: 'ai-kv-cache-routing',
    moduleId: 'ai-foundations',
    num: 3,
    title: 'KV Cache, TTFT, Quantization & Routing',
    subtitle: 'Why LLM decoding starts with a Prefill spike, how KV Cache saves O(N²), and LLM Router economics.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'Prefill phase (TTFT) vs Token-by-token Decode phase (TPS)',
      'How KV Cache stores past Key/Value tensors in GPU VRAM',
      'Model Routing: sending 75% simple tasks to fast/cheap small models & 25% hard tasks to frontier models',
    ],
    controls: [
      { id: 'kv', label: 'KV Cache', type: 'toggle', defaultValue: true },
      { id: 'route', label: 'Model Router', type: 'toggle', defaultValue: true },
    ],
    codeTrace: {
      title: 'Semantic Complexity Model Router',
      ts: [
        'const tier = classifyDifficulty(prompt);',
        'const model = tier === "simple"',
        '  ? "gpt-4o-mini"       // $0.15/1M · 180ms TTFT',
        '  : "claude-sonnet-4";  // deep reasoning for 25% hard tasks',
        'return streamLLM(model, { prompt, promptCache: true });',
      ],
      py: [
        'tier = classify_difficulty(prompt)',
        'model = "gpt-4o-mini" if tier == "simple" else "claude-sonnet-4"',
        'return await stream_llm(model, prompt=prompt, prompt_cache=True)',
      ],
    },
    feynman: {
      prompt: 'What does the KV Cache actually store in GPU memory, and how does Prompt Caching + Model Routing cut AI costs by 70%+?',
      checkpoints: [
        { label: 'KV Cache saves Key & Value tensors of previous tokens so decode does not recompute prefix', keywords: ['kv', 'key', 'value', 'recomput', 'vram', 'decode', 'prefix'] },
        { label: 'Router sends easy requests to cheap fast models and hard ones to frontier models', keywords: ['rout', 'cheap', 'small', 'mini', 'frontier', 'cost'] },
      ],
      sampleAnswer:
        'During token-by-token generation, the KV Cache keeps the Key and Value tensors of all earlier tokens in GPU VRAM so each new token only computes attention against cached tensors instead of reprocessing the whole prompt. Paired with Prompt Caching and routing 75% of easy queries to small fast models, latency and LLM spend drop over 70%.',
    },
    steps: [
      {
        id: 'kv-1',
        short: 'Prefill vs Decode',
        chapter: 'setup',
        title: 'Two phases inside every LLM API call',
        paragraphs: [
          '1. <span class="term">Prefill (Compute-bound)</span>: processes your whole system+RAG prompt in parallel → determines <b>TTFT</b>.',
          '2. <span class="term">Decode (Memory-bandwidth-bound)</span>: generates 1 token at a time reading the <b>KV Cache</b> from GPU HBM VRAM!',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 5], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'pre', label: 'Prefill Drives', value: 'TTFT (~220 ms)', level: 'good' },
            { id: 'dec', label: 'Decode Drives', value: '95 tokens/sec', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'pre', kind: 'box', x: 205, y: 220, label: '1. Prefill (Parallel)', sublabel: 'Prompt → KV Tensors', tone: 'amber', icon: 'ai' },
              { id: 'vram', kind: 'cylinder', x: 445, y: 220, label: 'GPU KV Cache', sublabel: 'HBM VRAM (FP8/INT8)', tone: 'violet' },
              { id: 'dec', kind: 'box', x: 675, y: 220, label: '2. Decode Loop', sublabel: '1 tok/step → SSE', tone: 'green', icon: 'stream' as 'ai', glow: 'good' },
            ],
            links: [
              { id: 'l1', from: 'pre', to: 'vram', flow: { kind: 'ai', rate: 1.2, speed: 1.5 } },
              { id: 'l2', from: 'vram', to: 'dec', flow: { kind: 'response', rate: 1.4, speed: 1.7 } },
            ],
            legend: [{ kind: 'ai', label: 'prefill → KV → decode' }],
          },
        }),
      },
      {
        id: 'kv-2',
        short: 'KV + Routing',
        chapter: 'solution',
        title: 'Slash Time-To-First-Token and LLM spend together',
        paragraphs: [
          'Toggle <b>KV Cache</b> and <b>Model Router</b> to see GPU VRAM efficiency, TTFT, and monthly cost transform!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 3] },
        evaluate: (p) => {
          const kv = Boolean(p.kv);
          const rt = Boolean(p.route);
          const ttft = (kv ? 220 : 1850) - (rt ? 60 : 0);
          const cost = rt ? '$1,450/mo' : '$6,200/mo';
          return {
            metrics: [
              { id: 'ttft', label: 'TTFT', value: `${ttft} ms`, level: ttft > 500 ? 'bad' : 'good' },
              { id: 'tps', label: 'Decode Speed', value: kv ? '95 tok/s' : '11 tok/s!', level: kv ? 'good' : 'bad' },
              { id: 'cost', label: 'Monthly Bill', value: cost, level: rt ? 'good' : 'warn' },
            ],
            scene: {
              nodes: [
                { id: 'rt', kind: 'box', x: 185, y: 220, label: 'AI Router', sublabel: rt ? '75% Mini / 25% Pro' : '100% Frontier', tone: rt ? 'green' : 'amber', icon: 'lb' },
                { id: 'fast', kind: 'box', x: 485, y: 135, label: 'Fast Tier (Mini)', sublabel: '160ms TTFT', tone: 'green', icon: 'ai', dimmed: !rt, glow: rt ? 'good' : undefined },
                { id: 'pro', kind: 'box', x: 485, y: 310, label: 'Frontier + KV Cache', sublabel: kv ? '95 tok/s' : 'NO KV CACHE', tone: kv ? 'violet' : 'red', icon: 'ai', glow: !kv ? 'bad' : undefined },
              ],
              links: [
                ...(rt ? [{ id: 'l1', from: 'rt', to: 'fast', label: '75% easy', flow: { kind: 'ai' as const, rate: 1.5, speed: 1.8 } }] : []),
                { id: 'l2', from: 'rt', to: 'pro', label: rt ? '25% hard' : '100% traffic', flow: { kind: kv ? 'ai' : 'heavy', rate: rt ? 0.8 : 1.8, speed: kv ? 1.4 : 0.6 } },
              ],
              legend: [{ kind: kv ? 'ai' : 'heavy', label: kv ? 'KV-cached streaming' : 'O(N²) prefix recompute' }],
            },
          };
        },
      },
      {
        id: 'kv-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Prompt Caching & Quantization (INT4 / FP8)',
        paragraphs: [
          '✓ Put static instructions & schemas at the TOP of your system prompt so providers hit <b>Prompt Prefix Caching</b> (50–90% cheaper prefill!).',
          '✓ Self-hosting? Quantizing weights from FP16 → INT4/FP8 halves VRAM bandwidth needs and doubles token/s!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 3] },
        evaluate: () => ({
          metrics: [{ id: 'pc', label: 'Prefix Cache Rule', value: 'Static Top · Dynamic End', level: 'good' }],
          scene: {
            nodes: [{ id: 'q', kind: 'box', x: 400, y: 220, label: 'Prompt Cache + Quantization + Router', tone: 'green', icon: 'ai', glow: 'good' }],
            links: [],
            legend: [{ kind: 'ai', label: 'low-cost fast inference' }],
          },
        }),
      },
    ],
  },

  {
    id: 'ai-structured-tools',
    moduleId: 'ai-foundations',
    num: 4,
    title: 'Structured Outputs, Schemas & Tool Calling',
    subtitle: 'Force LLMs to emit guaranteed Zod/JSON schemas and safely execute typed backend tools.',
    duration: '11 min',
    level: 'Intermediate',
    goals: [
      'Why raw regex parsing of LLM prose fails in production',
      'Constrained JSON Schema / Zod decoding for 100% valid payloads',
      'Validating & permission-checking LLM tool calls before hitting databases',
    ],
    controls: [
      { id: 'schema', label: 'JSON Schema Lock', type: 'toggle', defaultValue: true },
    ],
    codeTrace: {
      title: 'Type-Safe Tool Calling with Zod Validation',
      ts: [
        'const RefundArgs = z.object({ orderId: z.string(), cents: z.number().max(5000) });',
        'const call = await llm.generate({ schema: RefundArgs, tools: [issueRefund] });',
        'const safeArgs = RefundArgs.parse(call.arguments); // strict runtime check!',
        'await authorizeUser(session.userId, safeArgs.orderId);',
      ],
      py: [
        'class RefundArgs(BaseModel):',
        '    order_id: str',
        '    cents: int = Field(le=5000)',
        'args = RefundArgs.model_validate_json(tool_call.arguments)',
        'await authorize_user(current_user.id, args.order_id)',
      ],
    },
    feynman: {
      prompt: 'How do Constrained Decoding (Structured Outputs) and Runtime Auth checks make AI Tool Calling safe?',
      checkpoints: [
        { label: 'Constrained decoding masks invalid tokens so JSON matches Zod/Pydantic 100%', keywords: ['schema', 'json', 'zod', 'pydantic', 'constrain', 'valid'] },
        { label: 'Backend must still enforce permissions & limits (never trust raw model args)', keywords: ['auth', 'permiss', 'limit', 'validat', 'inject', 'safe'] },
      ],
      sampleAnswer:
        'Structured Outputs mask out tokens that violate your JSON Schema during decoding so every output parses cleanly into Zod or Pydantic. Even then, the backend must validate arguments and check user permissions before executing any database mutation, preventing prompt injection from triggering unauthorized refunds.',
    },
    steps: [
      {
        id: 'st-1',
        short: 'Prose Failures',
        chapter: 'problem',
        title: 'Why asking "Please reply ONLY in JSON" fails 15% of the time',
        paragraphs: [
          'Without constrained decoding, models wrap payloads in <code class="inline-code">```json</code> fences, omit commas, or add chatty explanations like <i>"Sure! Here is..."</i>—crashing <code class="inline-code">JSON.parse()</code>.',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 2], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'p', label: 'Unconstrained Parse', value: '84% (Fragile!)', level: 'bad' },
            { id: 'c', label: 'Constrained Schema', value: '100% Valid JSON', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'llm', kind: 'box', x: 205, y: 220, label: 'Unconstrained LLM', sublabel: '"Sure! ```json {bad"', tone: 'red', icon: 'ai' },
              { id: 'par', kind: 'box', x: 545, y: 220, label: 'JSON.parse()', sublabel: 'SyntaxError Crash!', tone: 'red', icon: 'code', glow: 'bad' },
            ],
            links: [{ id: 'l1', from: 'llm', to: 'par', flow: { kind: 'heavy', rate: 1.3, speed: 1.2 } }],
            legend: [{ kind: 'heavy', label: 'unparseable markdown prose' }],
          },
        }),
      },
      {
        id: 'st-2',
        short: 'Schema + Auth',
        chapter: 'solution',
        title: 'Turn unpredictable prose into reliable typed API calls',
        paragraphs: [
          'With <b>JSON Schema Lock</b>, the decoder masks invalid tokens at generation time; then Zod/Pydantic and backend RBAC guard every tool execution.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 4], py: [1, 5] },
        evaluate: (p) => {
          const locked = Boolean(p.schema);
          return {
            metrics: [
              { id: 'parse', label: 'JSON Parse Rate', value: locked ? '100% Valid' : '84% (Broken Markdown)', level: locked ? 'good' : 'bad' },
              { id: 'auth', label: 'Tool Security', value: 'RBAC + Max Cents Check', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'llm', kind: 'box', x: 175, y: 220, label: 'LLM Decoder', sublabel: locked ? 'Grammar Masked' : 'Free Prose', tone: locked ? 'violet' : 'red', icon: 'ai' },
                { id: 'zod', kind: 'box', x: 435, y: 220, label: 'Zod / Pydantic', sublabel: 'AuthZ + Bounds', tone: 'green', icon: 'shield', glow: locked ? 'good' : undefined },
                { id: 'db', kind: 'cylinder', x: 675, y: 220, label: 'Orders Tool', tone: locked ? 'green' : 'amber' },
              ],
              links: [
                { id: 'l1', from: 'llm', to: 'zod', label: locked ? 'strict JSON' : 'syntax err!', flow: { kind: locked ? 'ai' : 'heavy', rate: 1, speed: 1.5 } },
                { id: 'l2', from: 'zod', to: 'db', label: 'authorized RPC', flow: { kind: 'response', rate: 1, speed: 1.5 } },
              ],
              legend: [{ kind: locked ? 'ai' : 'heavy', label: locked ? 'schema-locked JSON' : 'unparsed prose error' }],
            },
          };
        },
      },
      {
        id: 'st-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Never Trust Model-Provided IDs Without AuthZ',
        paragraphs: [
          '✓ Even with 100% valid JSON, always re-derive <code class="inline-code">userId</code> from the verified session cookie—never let the LLM pass <code class="inline-code">userId</code> inside tool arguments!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [3, 4], py: [4, 5] },
        evaluate: () => ({
          metrics: [{ id: 'sec', label: 'Session Rule', value: 'Server-Injected UserID', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'box', x: 400, y: 220, label: 'Schema + Zod + Session AuthZ', tone: 'green', icon: 'lock', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'zero-trust tool boundary' }],
          },
        }),
      },
    ],
  },

  {
    id: 'ai-finetune-context',
    moduleId: 'ai-foundations',
    num: 5,
    title: 'Context Engineering vs RAG vs Fine-Tuning (LoRA)',
    subtitle: 'Deciding when to optimize prompts, retrieve fresh knowledge with RAG, or fine-tune style/format via LoRA.',
    duration: '12 min',
    level: 'Mastery',
    goals: [
      'Why Fine-Tuning is terrible for fresh facts (and RAG solves knowledge updates instantly)',
      'When LoRA Fine-Tuning wins: strict tone/domain syntax, latency compression & distillation',
      'Context Engineering: packing the right few-shot examples, tools & state without bloat',
    ],
    controls: [
      { id: 'goal', label: 'Need', type: 'segmented', options: [{ label: 'Live Docs & Facts', value: 'rag' }, { label: 'Strict Format / Tiny Model', value: 'lora' }], defaultValue: 'rag' },
    ],
    codeTrace: {
      title: 'Context Engineering + Selective Distillation',
      ts: [
        'const sysPrompt = buildContext({',
        '  role: "SQL Assistant", schema: dbDDL,',
        '  fewShot: selectClosestExamples(userQuery, 3), // dynamic few-shot!',
        '});',
        '// Tip: Distill 10k GPT-4o traces -> fine-tune 8B LoRA for 10x cheaper speed!',
      ],
      py: [
        '# Use RAG for changing facts; LoRA for learned behavior/style/distillation',
        'context = pack_context(ddl=db_ddl, few_shot=top3_examples, rag_docs=top5)',
        'return await llm.generate(model="fine-tuned-8b-lora", messages=context)',
      ],
    },
    feynman: {
      prompt: 'When should a team build RAG vs Fine-Tuning (LoRA), and what is Model Distillation?',
      checkpoints: [
        { label: 'RAG injects fresh/private citations dynamically without retraining', keywords: ['rag', 'fresh', 'fact', 'citat', 'up-to-date', 'retriev'] },
        { label: 'LoRA fine-tuning adapts tone/format/skill or distills large model into smaller fast model', keywords: ['lora', 'fine-tun', 'style', 'format', 'distill', 'small', 'cheap'] },
      ],
      sampleAnswer:
        'RAG excels whenever the model needs changing, private, or citable facts—updating a document updates answers immediately. LoRA fine-tuning modifies a tiny fraction of weights to teach consistent style, SQL/domain patterns, or to distill a big expensive frontier model’s accuracy into a tiny 8B fast model.',
    },
    steps: [
      {
        id: 'ft-1',
        short: 'Context First',
        chapter: 'setup',
        title: 'Start with Context Engineering before touching GPU training',
        paragraphs: [
          '90% of AI quality gains come from clean <span class="term">Context Engineering</span>: clear constraints, dynamic top-3 <code class="inline-code">few-shot</code> examples, and uncluttered tool definitions.',
        ],
        goalHits: [2],
        activeCodeLines: { ts: [1, 4], py: [1, 2] },
        evaluate: () => ({
          metrics: [
            { id: 'cost', label: 'Iteration Speed', value: 'Minutes ($0 GPU)', level: 'good' },
            { id: 'acc', label: 'Dynamic Few-Shot', value: '+18% Accuracy', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'ctx', kind: 'box', x: 205, y: 220, label: 'Context Assembler', sublabel: 'Role + DDL + 3-Shot', tone: 'sand', icon: 'code' },
              { id: 'llm', kind: 'box', x: 545, y: 220, label: 'Frontier / Mid LLM', tone: 'violet', icon: 'ai', glow: 'good' },
            ],
            links: [{ id: 'l1', from: 'ctx', to: 'llm', flow: { kind: 'ai', rate: 1.2, speed: 1.5 } }],
            legend: [{ kind: 'ai', label: 'structured context window' }],
          },
        }),
      },
      {
        id: 'ft-2',
        short: 'RAG vs LoRA',
        chapter: 'compare',
        title: 'Knowledge lives in RAG; Behavior & Distillation live in LoRA',
        paragraphs: [
          'Toggle <b>Need</b> between <b>Live Docs &amp; Facts</b> (RAG wins cleanly) and <b>Strict Format / Tiny Model</b> (LoRA wins!).',
        ],
        compare: {
          headers: ['Criterion', 'RAG + Context', 'LoRA Fine-Tuning'],
          rows: [
            ['Freshness', 'Instant (update DB)', 'Stale until retrained'],
            ['Hallucination / Citations', 'High grounding + source URLs', 'Can hallucinate memorized facts'],
            ['Latency & Cost Compression', 'Long input prompt cost', 'Short prompt on tiny 8B model!'],
          ],
        },
        goalHits: [0, 1],
        activeCodeLines: { ts: [3, 5], py: [1, 3] },
        evaluate: (p) => {
          const isLora = p.goal === 'lora';
          return {
            metrics: [
              { id: 'pick', label: 'Best Architecture', value: isLora ? 'LoRA / Distilled 8B' : 'Hybrid RAG + Context', level: 'good' },
              { id: 'fresh', label: 'Fact Freshness', value: isLora ? 'Static Weights' : 'Real-Time Live Docs', level: isLora ? 'warn' : 'good' },
            ],
            scene: {
              nodes: [
                { id: 'q', kind: 'box', x: 165, y: 220, label: isLora ? '10k Golden Traces' : 'Live PDFs & Docs', tone: 'sand', icon: 'db' },
                { id: 'mid', kind: 'box', x: 425, y: 220, label: isLora ? 'LoRA Adapters (1% wts)' : 'Vector + BM25 Index', tone: isLora ? 'violet' : 'green', icon: isLora ? 'ai' : 'vector', glow: 'good' },
                { id: 'out', kind: 'box', x: 665, y: 220, label: isLora ? '8B Fast Specialist' : 'Grounded Answer', tone: 'green', icon: 'ai' },
              ],
              links: [
                { id: 'l1', from: 'q', to: 'mid', flow: { kind: 'ai', rate: 1.1, speed: 1.5 } },
                { id: 'l2', from: 'mid', to: 'out', flow: { kind: 'response', rate: 1.2, speed: 1.5 } },
              ],
              legend: [{ kind: 'ai', label: isLora ? 'LoRA weight adaptation' : 'dynamic RAG grounding' }],
            },
          };
        },
      },
      {
        id: 'ft-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: The Golden AI Engineering Ladder',
        paragraphs: [
          '1️⃣ Prompt + Structured Outputs → 2️⃣ Dynamic Few-Shot Context → 3️⃣ Hybrid RAG → 4️⃣ LoRA Distillation only once evals prove what you need!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 3] },
        evaluate: () => ({
          metrics: [{ id: 'lad', label: 'Rule', value: 'Prompt → RAG → LoRA', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'box', x: 400, y: 220, label: 'Context + RAG + LoRA Ladder', tone: 'green', icon: 'ai', glow: 'good' }],
            links: [],
            legend: [{ kind: 'ai', label: 'pragmatic AI stack' }],
          },
        }),
      },
    ],
  },
];
