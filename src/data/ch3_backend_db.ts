import type { Lesson } from '../types/course';

export const CH3_BACKEND_DB: Lesson[] = [
  {
    id: 'be-event-loop',
    moduleId: 'backend-db',
    num: 1,
    title: 'Event Loop, Async I/O & Worker Threads',
    subtitle: 'Why Node.js & FastAPI handle 10k network sockets on one thread — and how one CPU loop freezes everyone.',
    duration: '11 min',
    level: 'Beginner',
    goals: [
      'Non-blocking I/O via OS epoll/kqueue while the Call Stack stays free',
      'Microtask Queue (Promises) vs Macrotask Queue (timers, I/O)',
      'Offloading heavy CPU jobs (PDFs, crypto, embeddings) to Worker Threads',
    ],
    controls: [
      { id: 'cpuTask', label: 'Heavy CPU Work', type: 'segmented', options: [{ label: 'On Main Thread', value: 'block' }, { label: 'Worker Pool', value: 'worker' }], defaultValue: 'worker' },
    ],
    codeTrace: {
      title: 'Offloading Blocking CPU off the Event Loop',
      ts: [
        'app.post("/embed", async (req, res) => {',
        '  // NEVER run heavy synchronous crypto/ML on the event loop!',
        '  const vec = await workerPool.run("embedText", req.body.text);',
        '  res.json({ vec }); // event loop served 5,000 reqs meanwhile!',
        '});',
      ],
      py: [
        '@app.post("/embed")',
        'async def embed(req: EmbedReq):',
        '    # Offload CPU-bound inference off asyncio event loop',
        '    vec = await run_in_threadpool(compute_embed, req.text)',
        '    return {"vec": vec}',
      ],
    },
    feynman: {
      prompt: 'How does a single-threaded Event Loop handle thousands of concurrent requests, and what breaks it?',
      checkpoints: [
        { label: 'Delegates slow network/DB I/O to OS kernel async APIs', keywords: ['non-blocking', 'async', 'os', 'kernel', 'i/o', 'epoll', 'await'] },
        { label: 'Synchronous CPU loops block all other requests', keywords: ['block', 'cpu', 'freeze', 'worker', 'thread', 'sync'] },
      ],
      sampleAnswer:
        'The Event Loop delegates slow DB and network I/O to the OS kernel (epoll/kqueue) and keeps running other callbacks until I/O finishes. However, a heavy synchronous CPU computation hogs that single thread and freezes every user—so CPU work must go to Worker Threads or background queues.',
    },
    steps: [
      {
        id: 'el-1',
        short: 'Non-Blocking I/O',
        chapter: 'setup',
        title: 'How 1 thread juggles 10,000 waiting sockets',
        paragraphs: [
          'Network and Postgres queries spend 99% of their time <i>waiting</i> on bytes. The Event Loop hands sockets to the OS kernel (<code class="inline-code">epoll/kqueue</code>) so the thread instantly serves the next user.',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 4], py: [1, 5] },
        evaluate: () => ({
          metrics: [
            { id: 'sock', label: 'Open Sockets', value: '10,000', level: 'good' },
            { id: 'ram', label: 'Thread RAM', value: '~45 MB total', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'u', kind: 'users', x: 145, y: 220, label: '10k Async Reqs' },
              { id: 'el', kind: 'box', x: 400, y: 220, label: 'Event Loop', sublabel: 'Microtasks → I/O Poll', tone: 'green', icon: 'loop', glow: 'good' },
              { id: 'os', kind: 'cylinder', x: 645, y: 220, label: 'OS epoll + DB', sublabel: 'non-blocking callbacks', tone: 'blue' },
            ],
            links: [
              { id: 'l1', from: 'u', to: 'el', flow: { kind: 'request', rate: 1.5, speed: 1.6 } },
              { id: 'l2', from: 'el', to: 'os', bidirectional: true, flow: { kind: 'response', rate: 1.4, speed: 1.6 } },
            ],
            legend: [{ kind: 'response', label: 'non-blocking async I/O' }],
          },
        }),
      },
      {
        id: 'el-2',
        short: 'Loop vs Workers',
        chapter: 'problem',
        title: 'Keep heavy CPU loops off the Event Loop',
        paragraphs: [
          'Toggle <b>Heavy CPU Work</b> between <b>Main Thread</b> (410ms stall for everyone!) and <b>Worker Pool</b> (main thread stays free at 1.4ms!).',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: (p) => {
          const blocked = p.cpuTask === 'block';
          return {
            metrics: [
              { id: 'lag', label: 'Event Loop Lag', value: blocked ? '410 ms!' : '1.4 ms', level: blocked ? 'bad' : 'good' },
              { id: 'p95', label: 'Health Check P95', value: blocked ? '425 ms' : '4 ms', level: blocked ? 'bad' : 'good' },
              { id: 'rps', label: 'Throughput', value: blocked ? '48 req/s' : '6,200 req/s', level: blocked ? 'bad' : 'good' },
            ],
            scene: {
              nodes: [
                { id: 'u', kind: 'users', x: 140, y: 220, label: '5k Clients' },
                { id: 'loop', kind: 'box', x: 390, y: 220, label: 'Event Loop', sublabel: blocked ? 'BLOCKED!' : 'non-blocking', tone: blocked ? 'red' : 'green', icon: 'server', load: blocked ? 99 : 14, glow: blocked ? 'bad' : 'good' },
                { id: 'wrk', kind: 'box', x: 645, y: 220, label: blocked ? 'Idle Workers' : 'Worker Threads', sublabel: blocked ? 'unused' : '4 CPU cores', tone: blocked ? 'sand' : 'violet', icon: 'queue', dimmed: blocked },
              ],
              links: [
                { id: 'l1', from: 'u', to: 'loop', flow: { kind: blocked ? 'heavy' : 'request', rate: 1.5, speed: blocked ? 0.4 : 1.7 } },
                { id: 'l2', from: 'loop', to: 'wrk', dashed: blocked, flow: !blocked ? { kind: 'ai', rate: 1.2, speed: 1.4 } : undefined },
              ],
              legend: [{ kind: blocked ? 'heavy' : 'ai', label: blocked ? 'main-thread freeze' : 'offloaded CPU work' }],
            },
          };
        },
      },
      {
        id: 'el-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Rule of Thumb for Async Backends',
        paragraphs: [
          '✓ Never call <code class="inline-code">JSON.parse</code> on 50MB blobs, <code class="inline-code">bcryptSync</code>, or synchronous Python loops inside an async route.',
          '✓ Keep Promise Microtasks bounded and offload CPU jobs to Worker Threads / Celery.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'lag', label: 'Target Loop Lag', value: '< 5 ms', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'box', x: 400, y: 220, label: 'Fast Async Core + Workers', sublabel: 'I/O stays async · CPU runs in pool', tone: 'green', icon: 'loop', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'healthy event loop' }],
          },
        }),
      },
    ],
  },

  {
    id: 'be-api-idempotency',
    moduleId: 'backend-db',
    num: 2,
    title: 'REST, GraphQL, gRPC & Idempotent APIs',
    subtitle: 'Choosing the right API wire protocol — and preventing double charges with Idempotency Keys.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'When to pick REST (HTTP cacheable), GraphQL (flexible UI graphs), or gRPC (fast microservices)',
      'Preventing duplicate Stripe/order writes on network retries with Idempotency-Key',
      'Cursor pagination vs broken Offset pagination on changing tables',
    ],
    controls: [
      { id: 'idemp', label: 'Idempotency Key', type: 'toggle', defaultValue: true },
      { id: 'retries', label: 'Client Retries', type: 'slider', min: 1, max: 5, step: 1, defaultValue: 3 },
    ],
    codeTrace: {
      title: 'Idempotent Payment Endpoint',
      ts: [
        'const key = req.headers["idempotency-key"];',
        'const cached = await redis.get(`idem:${key}`);',
        'if (cached) return res.status(200).json(JSON.parse(cached));',
        'const charge = await stripe.charges.create({ amount: 4900 });',
        'await redis.set(`idem:${key}`, JSON.stringify(charge), { EX: 86400 });',
      ],
      py: [
        'key = request.headers.get("Idempotency-Key")',
        'if cached := await redis.get(f"idem:{key}"):',
        '    return Response(cached, media_type="application/json")',
        'charge = await charge_card(amount=4900)',
        'await redis.set(f"idem:{key}", charge.model_dump_json(), ex=86400)',
      ],
    },
    feynman: {
      prompt: 'Why is an Idempotency Key critical for POST payment/order endpoints, and when do you use gRPC vs REST?',
      checkpoints: [
        { label: 'Retries after timeout can re-execute POST without idempotency key', keywords: ['retry', 'timeout', 'double', 'duplicate', 'once', 'key'] },
        { label: 'REST = public HTTP/cache; GraphQL = client-driven graph; gRPC = fast Protobuf RPC', keywords: ['rest', 'graphql', 'grpc', 'protobuf', 'microservice'] },
      ],
      sampleAnswer:
        'If a mobile client times out right after the server charged the card and retries the POST, an Idempotency-Key tells the server to return the saved receipt instead of charging twice. For protocols: REST shines for public cacheable APIs, GraphQL fits multi-entity UIs, and gRPC excels for low-latency binary internal services.',
    },
    steps: [
      {
        id: 'api-1',
        short: 'Protocols',
        chapter: 'compare',
        title: 'REST vs GraphQL vs gRPC: pick the right wire format',
        paragraphs: [
          'Every protocol trades off human readability, schema strictness, and browser cacheability.',
        ],
        compare: {
          headers: ['Protocol', 'Payload & Speed', 'Best For'],
          rows: [
            ['REST (JSON)', 'HTTP Verbs · CDN Cacheable', 'Public APIs, Webhooks, CRUD'],
            ['GraphQL', 'Single Endpoint · Exact Fields', 'Complex UI dashboards, Mobile'],
            ['gRPC', 'HTTP/2 Protobuf Binary · 5× smaller', 'Internal microservices, AI workers'],
          ],
        },
        goalHits: [0],
        activeCodeLines: { ts: [1, 3], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'rest', label: 'REST', value: 'Public + CDN', level: 'good' },
            { id: 'grpc', label: 'gRPC', value: 'Binary Microservice', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'pub', kind: 'device', x: 165, y: 220, label: 'Browser / Mobile', icon: 'phone' },
              { id: 'gw', kind: 'box', x: 400, y: 220, label: 'REST / GraphQL Edge', tone: 'blue', icon: 'globe' },
              { id: 'int', kind: 'box', x: 645, y: 220, label: 'gRPC Internal Mesh', sublabel: 'Protobuf HTTP/2', tone: 'violet', icon: 'server', glow: 'good' },
            ],
            links: [
              { id: 'l1', from: 'pub', to: 'gw', label: 'JSON', flow: { kind: 'request', rate: 1, speed: 1.4 } },
              { id: 'l2', from: 'gw', to: 'int', label: 'Protobuf', flow: { kind: 'response', rate: 1.3, speed: 1.7 } },
            ],
            legend: [{ kind: 'response', label: 'binary gRPC hop' }],
          },
        }),
      },
      {
        id: 'api-2',
        short: 'Retries',
        chapter: 'problem',
        title: 'Flaky 4G retries can double-charge without an Idempotency Key',
        paragraphs: [
          'Toggle <b>Idempotency Key</b> off while <b>Client Retries = 3</b>: watch how every retry executes another DB write!',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: (p) => {
          const safe = Boolean(p.idemp);
          const r = Number(p.retries ?? 3);
          return {
            metrics: [
              { id: 'ret', label: 'Network Retries', value: `${r}×`, level: 'neutral' },
              { id: 'charges', label: 'Card Charges', value: safe ? '1 (Safe!)' : `${r}× DOUBLE!`, level: safe ? 'good' : 'bad' },
              { id: 'mode', label: 'Replay Cache', value: safe ? 'Redis Idem Hit' : 'None', level: safe ? 'good' : 'bad' },
            ],
            scene: {
              nodes: [
                { id: 'c', kind: 'device', x: 155, y: 220, label: `Client (${r}× retry)`, icon: 'phone' },
                { id: 'api', kind: 'box', x: 400, y: 220, label: 'POST /checkout', sublabel: safe ? 'Idempotency-Key OK' : 'NO IDEM KEY', tone: safe ? 'green' : 'red', icon: 'shield', glow: safe ? 'good' : 'bad' },
                { id: 'db', kind: 'cylinder', x: 650, y: 220, label: 'Ledger DB', sublabel: safe ? '1 row written' : `${r} duplicate rows!`, tone: safe ? 'green' : 'red' },
              ],
              links: [
                { id: 'l1', from: 'c', to: 'api', label: `${r}× POST`, flow: { kind: safe ? 'request' : 'heavy', rate: 1.4, speed: 1.5 } },
                { id: 'l2', from: 'api', to: 'db', label: safe ? '1 write' : `${r} writes!`, flow: { kind: safe ? 'response' : 'heavy', rate: safe ? 0.6 : 1.6, speed: 1.5 } },
              ],
              legend: [{ kind: safe ? 'response' : 'heavy', label: safe ? 'exactly-once effect' : 'duplicate charges!' }],
            },
          };
        },
      },
      {
        id: 'api-3',
        short: 'Pagination',
        chapter: 'recap',
        title: 'Cursor Pagination + Recap',
        paragraphs: [
          '✓ Never use <code class="inline-code">OFFSET 100000</code> on active feeds (slow DB scans & duplicate rows when new items arrive). Use <b>Cursor / Keyset Pagination</b> (<code class="inline-code">WHERE id &lt; cursor LIMIT 20</code>) for <code class="inline-code">O(log n)</code> index speed!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'pg', label: 'Keyset Page', value: 'O(log n) Index', level: 'good' }],
          scene: {
            nodes: [{ id: 'ok', kind: 'box', x: 400, y: 220, label: 'Idempotent + Keyset API', sublabel: 'Safe retries · Fast cursors', tone: 'green', icon: 'shield', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'production API design' }],
          },
        }),
      },
    ],
  },

  {
    id: 'be-auth-oauth',
    moduleId: 'backend-db',
    num: 3,
    title: 'Authentication: Sessions, JWT & OAuth2',
    subtitle: 'Stateful Redis cookies vs stateless signed JWTs, refresh token rotation, and PKCE.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'HttpOnly Secure cookies vs XSS-vulnerable localStorage tokens',
      'Short-lived JWT access tokens + revocable Redis refresh tokens',
      'OAuth2 Authorization Code + PKCE flow for modern login',
    ],
    controls: [
      { id: 'auth', label: 'Strategy', type: 'segmented', options: [{ label: 'Stateful Session', value: 'session' }, { label: 'JWT + Refresh', value: 'jwt' }], defaultValue: 'jwt' },
    ],
    codeTrace: {
      title: 'Signed Access JWT + HttpOnly Refresh Rotation',
      ts: [
        'res.cookie("rt", refreshToken, {',
        '  httpOnly: true, secure: true, sameSite: "lax"',
        '});',
        'const accessJwt = sign({ sub: user.id, role: user.role }, PRIVATE_KEY, {',
        '  expiresIn: "15m", algorithm: "RS256"',
        '});',
      ],
      py: [
        'response.set_cookie(',
        '    key="rt", value=refresh_token, httponly=True, secure=True, samesite="lax"',
        ')',
        'access_jwt = jwt.encode({"sub": user.id, "exp": now + 900}, PRIV_KEY, "RS256")',
      ],
    },
    feynman: {
      prompt: 'Why should JWT access tokens stay short-lived (15m) with HttpOnly refresh tokens instead of storing long JWTs in localStorage?',
      checkpoints: [
        { label: 'JWT cannot be instantly revoked until expiry', keywords: ['revok', 'expir', 'stateless', 'short'] },
        { label: 'localStorage is readable by XSS JS; HttpOnly cookies are protected', keywords: ['httponly', 'xss', 'localstorage', 'cookie'] },
      ],
      sampleAnswer:
        'Because stateless JWTs are valid until they expire and cannot be easily revoked on logout or compromise, keeping them short-lived (5–15 min) limits risk while an HttpOnly refresh token in Redis handles revocation safely away from XSS scripts.',
    },
    steps: [
      {
        id: 'au-1',
        short: 'Cookies vs Storage',
        chapter: 'problem',
        title: 'Why localStorage auth tokens fail against XSS scripts',
        paragraphs: [
          'Any third-party npm script or XSS bug can read <code class="inline-code">localStorage.getItem("token")</code> and steal a user’s session.',
          'Setting <code class="inline-code">HttpOnly; Secure; SameSite=Lax</code> cookies hides credentials completely from JavaScript!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 3], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'ls', label: 'localStorage JWT', value: 'Exposed to XSS!', level: 'bad' },
            { id: 'ck', label: 'HttpOnly Cookie', value: 'JS-Invisible ✓', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'js', kind: 'box', x: 205, y: 220, label: 'Browser JS / XSS', tone: 'red', icon: 'code' },
              { id: 'ck', kind: 'box', x: 545, y: 220, label: 'HttpOnly Cookie Jar', sublabel: 'Browser sends automatically', tone: 'green', icon: 'lock', glow: 'good' },
            ],
            links: [{ id: 'l1', from: 'js', to: 'ck', label: 'document.cookie BLOCKED', dashed: true }],
            legend: [{ kind: 'response', label: 'XSS-isolated cookie' }],
          },
        }),
      },
      {
        id: 'au-2',
        short: 'JWT vs Session',
        chapter: 'compare',
        title: 'Compare Stateful Session vs Stateless JWT + Refresh',
        paragraphs: [
          'A <span class="term">Stateful Session</span> lets you ban a compromised user in 1ms via Redis. A <span class="term">JWT</span> saves a DB lookup on every microservice hop via cryptographic signature.',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 6], py: [1, 4] },
        evaluate: (p) => {
          const isJwt = p.auth === 'jwt';
          return {
            metrics: [
              { id: 'ver', label: 'Verify Cost', value: isJwt ? '0 DB calls (RS256)' : '1 Redis Lookup', level: 'good' },
              { id: 'rev', label: 'Instant Revoke', value: isJwt ? 'Via 15m Refresh' : 'Immediate DEL', level: isJwt ? 'warn' : 'good' },
              { id: 'xss', label: 'XSS Safe', value: 'HttpOnly Cookie', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'b', kind: 'device', x: 165, y: 220, label: 'Browser', sublabel: 'HttpOnly Cookie', icon: 'laptop' },
                { id: 'api', kind: 'box', x: 420, y: 220, label: 'Auth Gateway', sublabel: isJwt ? 'verify RS256 sig' : 'GET sess:id', tone: 'violet', icon: 'lock', glow: 'good' },
                { id: 'red', kind: 'cylinder', x: 660, y: 220, label: isJwt ? 'Refresh Allowlist' : 'Session Store', tone: 'green' },
              ],
              links: [
                { id: 'l1', from: 'b', to: 'api', label: isJwt ? 'Bearer JWT' : 'sid cookie', flow: { kind: 'request', rate: 1, speed: 1.5 } },
                { id: 'l2', from: 'api', to: 'red', label: isJwt ? 'on /refresh' : 'every req', dashed: isJwt, flow: !isJwt ? { kind: 'response', rate: 1, speed: 1.5 } : undefined },
              ],
              legend: [{ kind: 'response', label: 'verified identity' }],
            },
          };
        },
      },
      {
        id: 'au-3',
        short: 'OAuth2 PKCE',
        chapter: 'recap',
        title: 'Recap: Modern OAuth2 + PKCE Flow',
        paragraphs: [
          '✓ Never put client secrets inside SPAs/mobile apps. Use <b>Authorization Code + PKCE</b> (<code class="inline-code">code_verifier</code> + SHA-256 <code class="inline-code">code_challenge</code>) + Refresh Token Rotation!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [4, 6], py: [4, 4] },
        evaluate: () => ({
          metrics: [{ id: 'oa', label: 'OAuth2 Spec', value: 'Auth Code + PKCE', level: 'good' }],
          scene: {
            nodes: [{ id: 'pk', kind: 'box', x: 400, y: 220, label: 'OAuth2 + PKCE + Rotation', sublabel: 'Zero stolen-code replay', tone: 'green', icon: 'shield', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'PKCE verified' }],
          },
        }),
      },
    ],
  },

  {
    id: 'be-db-indexes',
    moduleId: 'backend-db',
    num: 4,
    title: 'SQL Indexes, B-Trees & N+1 Queries',
    subtitle: 'Turn 900ms sequential table scans and 101-query loops into crisp 3ms index lookups.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'Why sequential table scans collapse past 100k rows without B-Tree indexes',
      'Composite index column order (leftmost prefix rule)',
      'Catching and crushing ORM N+1 query storms with JOIN / WHERE IN batching',
    ],
    controls: [
      { id: 'indexed', label: 'B-Tree Index', type: 'toggle', defaultValue: true },
      { id: 'n1', label: 'Fix N+1 Queries', type: 'toggle', defaultValue: true },
    ],
    codeTrace: {
      title: 'Eliminating N+1 with Batched JOIN / IN',
      ts: [
        '// BAD N+1: 1 query for 50 posts + 50 queries for authors!',
        '// GOOD: 2 queries or 1 JOIN using an index on users(id)',
        'const posts = await db.select().from(postsTable).limit(50);',
        'const authors = await db.select().from(users).where(inArray(users.id, ids));',
      ],
      py: [
        '# BAD: for p in posts: db.get(User, p.author_id)  # N+1!',
        '# GOOD: Eager load with selectinload / JOIN',
        'posts = await session.scalars(',
        '    select(Post).options(selectinload(Post.author)).limit(50)',
        ')',
      ],
    },
    feynman: {
      prompt: 'What is the N+1 query problem, and why should you not add a B-Tree index to every single column?',
      checkpoints: [
        { label: 'N+1 executes 1 parent query + N loop queries for children', keywords: ['loop', 'n+1', 'each', 'join', 'batch', 'selectin'] },
        { label: 'Indexes speed reads via B-Tree but slow writes & use disk/RAM', keywords: ['write', 'insert', 'update', 'b-tree', 'slow', 'overhead'] },
      ],
      sampleAnswer:
        'An N+1 query fetches N parent rows and then fires N separate queries inside a loop for related children—solved by eager loading via JOIN or WHERE IN. Indexes make reads O(log n) via a B-Tree, but every INSERT/UPDATE must update every index on that table, hurting write speed.',
    },
    steps: [
      {
        id: 'db-1',
        short: 'B-Tree + N+1',
        chapter: 'problem',
        title: 'Watch query latency plunge from 940ms to 3ms',
        paragraphs: [
          'Flip off <b>B-Tree Index</b> or <b>Fix N+1 Queries</b> to see database IOPS saturate instantly.',
        ],
        goalHits: [0, 2],
        activeCodeLines: { ts: [1, 4], py: [1, 5] },
        evaluate: (p) => {
          const idx = Boolean(p.indexed);
          const batch = Boolean(p.n1);
          const qCount = batch ? 2 : 51;
          const ms = (idx ? 2 : 420) * (batch ? 1 : 2.3);
          return {
            metrics: [
              { id: 'q', label: 'SQL Queries/Req', value: `${qCount}`, level: batch ? 'good' : 'bad' },
              { id: 'lat', label: 'DB Query Time', value: `${Math.round(ms)} ms`, level: ms > 50 ? 'bad' : 'good' },
              { id: 'scan', label: 'Scan Plan', value: idx ? 'B-Tree Index' : 'Seq Table Scan!', level: idx ? 'good' : 'bad' },
            ],
            scene: {
              nodes: [
                { id: 'api', kind: 'box', x: 210, y: 220, label: 'ORM / API', sublabel: `${qCount} SQL roundtrips`, tone: batch ? 'blue' : 'red', icon: 'code' },
                { id: 'db', kind: 'cylinder', x: 560, y: 220, label: 'PostgreSQL', sublabel: idx ? 'B-Tree O(log n)' : 'Full 5M Row Scan', tone: idx && batch ? 'green' : 'red', load: idx && batch ? 14 : 96, glow: idx && batch ? 'good' : 'bad' },
              ],
              links: [{ id: 'l1', from: 'api', to: 'db', label: `${Math.round(ms)} ms`, flow: { kind: idx && batch ? 'db' : 'heavy', rate: batch ? 0.7 : 2.2, speed: idx ? 1.6 : 0.6 } }],
              legend: [{ kind: idx && batch ? 'db' : 'heavy', label: idx && batch ? 'indexed batch query' : 'table scan / N+1 flood' }],
            },
          };
        },
      },
      {
        id: 'db-2',
        short: 'Composite Order',
        chapter: 'technique',
        title: 'Composite Index Rule: Equality first, Range second',
        paragraphs: [
          'An index on <code class="inline-code">(org_id, created_at)</code> speeds up <code class="inline-code">WHERE org_id = ? AND created_at &gt; ?</code> cleanly—but does NOT speed up filtering only by <code class="inline-code">created_at</code>!',
        ],
        goalHits: [1],
        activeCodeLines: { ts: [3, 4], py: [3, 4] },
        evaluate: () => ({
          metrics: [
            { id: 'lft', label: 'Leftmost Prefix', value: '(org_id, created_at)', level: 'good' },
            { id: 'pool', label: 'Conn Pooler', value: 'PgBouncer Transaction', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'eq', kind: 'box', x: 220, y: 220, label: '1. Equality Filter', sublabel: 'org_id = 42', tone: 'green', icon: 'filter' },
              { id: 'rng', kind: 'box', x: 550, y: 220, label: '2. Range Sort', sublabel: 'created_at DESC', tone: 'blue', icon: 'search', glow: 'good' },
            ],
            links: [{ id: 'l1', from: 'eq', to: 'rng', label: 'Index Only Scan', flow: { kind: 'db', rate: 1.2, speed: 1.5 } }],
            legend: [{ kind: 'db', label: '3-hop B-Tree scan' }],
          },
        }),
      },
      {
        id: 'db-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: EXPLAIN ANALYZE & PgBouncer',
        paragraphs: [
          '✓ Always run <code class="inline-code">EXPLAIN ANALYZE</code> before shipping new queries.',
          '✓ Pair B-Tree indexes with <b>PgBouncer</b> connection pooling so serverless bursts never exhaust Postgres `max_connections`!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 4], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'p', label: 'Indexed P95', value: '2.8 ms', level: 'good' }],
          scene: {
            nodes: [{ id: 'pg', kind: 'cylinder', x: 400, y: 220, label: 'PgBouncer + B-Tree Postgres', sublabel: 'Zero N+1 · Pooled connections', tone: 'green', glow: 'good' }],
            links: [],
            legend: [{ kind: 'db', label: 'fast SQL path' }],
          },
        }),
      },
    ],
  },

  {
    id: 'be-transactions-acid',
    moduleId: 'backend-db',
    num: 5,
    title: 'Transactions, ACID & Isolation Levels',
    subtitle: 'Preventing race conditions, lost inventory, and double-spends with MVCC & Row Locks.',
    duration: '12 min',
    level: 'Mastery',
    goals: [
      'Atomicity & Rollbacks keeping multi-table writes all-or-nothing',
      'Why Read-Then-Write without SELECT FOR UPDATE causes race-condition over-selling',
      'Atomic conditional SQL UPDATE vs Optimistic Locking (version column)',
    ],
    controls: [
      { id: 'lock', label: 'Concurrency Fix', type: 'segmented', options: [{ label: 'Naive Read+Write', value: 'naive' }, { label: 'FOR UPDATE / Atomic', value: 'atomic' }], defaultValue: 'atomic' },
    ],
    codeTrace: {
      title: 'Atomic Conditional Update (Zero Oversell)',
      ts: [
        'const [seat] = await db.execute(sql`',
        '  UPDATE inventory SET stock = stock - 1',
        '  WHERE sku = ${sku} AND stock >= 1',
        '  RETURNING stock;',
        '`); // Single atomic row-locked statement!',
      ],
      py: [
        'async with session.begin():',
        '    res = await session.execute(',
        '        update(Inventory).where(Inventory.sku == sku, Inventory.stock >= 1)',
        '        .values(stock=Inventory.stock - 1).returning(Inventory.stock)',
        '    )',
      ],
    },
    feynman: {
      prompt: 'Why can two users buy the last 1 concert ticket if you check stock in JavaScript before updating SQL?',
      checkpoints: [
        { label: 'Both read stock=1 concurrently before either writes (TOCTOU race)', keywords: ['both', 'concurrent', 'race', 'read', 'same time', 'negative'] },
        { label: 'Atomic SQL WHERE stock>=1 or SELECT FOR UPDATE serializes row access', keywords: ['atomic', 'lock', 'for update', 'transaction', 'where', 'acid'] },
      ],
      sampleAnswer:
        'If two requests both read stock=1 simultaneously in app memory, both think the ticket is available and both decrement stock to -1. Wrapping the check in an atomic SQL `UPDATE ... WHERE stock >= 1` or `SELECT ... FOR UPDATE` inside a transaction forces the DB row lock to let only one succeed.',
    },
    steps: [
      {
        id: 'tx-1',
        short: 'ACID Basics',
        chapter: 'setup',
        title: 'All-or-Nothing writes with Database Transactions',
        paragraphs: [
          'Transferring $50 needs two statements: debit Alice and credit Bob. Inside <code class="inline-code">BEGIN ... COMMIT</code>, if step 2 crashes, Postgres rolls back step 1 automatically (<span class="term">Atomicity</span>).',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: () => ({
          metrics: [
            { id: 'ac', label: 'Atomicity', value: 'All or Nothing', level: 'good' },
            { id: 'mvcc', label: 'Postgres Engine', value: 'MVCC Snapshots', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'a', kind: 'box', x: 205, y: 220, label: '1. Debit -$50', tone: 'blue', icon: 'code' },
              { id: 'b', kind: 'box', x: 465, y: 220, label: '2. Credit +$50', tone: 'green', icon: 'code' },
              { id: 'wal', kind: 'cylinder', x: 675, y: 220, label: 'WAL Commit', tone: 'green', glow: 'good' },
            ],
            links: [
              { id: 'l1', from: 'a', to: 'b', flow: { kind: 'db', rate: 1, speed: 1.4 } },
              { id: 'l2', from: 'b', to: 'wal', flow: { kind: 'response', rate: 1, speed: 1.4 } },
            ],
            legend: [{ kind: 'response', label: 'atomic commit' }],
          },
        }),
      },
      {
        id: 'tx-2',
        short: 'Race Fix',
        chapter: 'problem',
        title: 'Last Ticket Remaining: stop the double-sell race condition',
        paragraphs: [
          'Two buyers click Checkout in the exact same millisecond when <code class="inline-code">stock = 1</code>.',
          'Under <b>Naive Read+Write</b>, both read <code class="inline-code">1</code> and sell the same ticket twice! With <b>Atomic / FOR UPDATE</b>, the DB serializes row access cleanly.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: (p) => {
          const safe = p.lock === 'atomic';
          return {
            metrics: [
              { id: 'stock', label: 'Final Stock', value: safe ? '0 (Exact!)' : '-1 (OVERSELL!)', level: safe ? 'good' : 'bad' },
              { id: 'acid', label: 'Isolation', value: safe ? 'Row Lock ACID' : 'Lost Update Race', level: safe ? 'good' : 'bad' },
            ],
            scene: {
              nodes: [
                { id: 'u1', kind: 'device', x: 165, y: 145, label: 'Buyer A (t=0ms)', icon: 'phone' },
                { id: 'u2', kind: 'device', x: 165, y: 315, label: 'Buyer B (t=0ms)', icon: 'phone' },
                { id: 'db', kind: 'cylinder', x: 545, y: 225, label: 'Inventory Row', sublabel: safe ? 'stock = 0 · B got 409' : 'stock = -1 · BOTH WON!', tone: safe ? 'green' : 'red', glow: safe ? 'good' : 'bad' },
              ],
              links: [
                { id: 'l1', from: 'u1', to: 'db', label: '200 OK', flow: { kind: 'response', rate: 1, speed: 1.5 } },
                { id: 'l2', from: 'u2', to: 'db', label: safe ? '409 Sold Out' : '200 DOUBLE!', flow: { kind: safe ? 'request' : 'heavy', rate: 1, speed: 1.5 } },
              ],
              legend: [{ kind: safe ? 'response' : 'heavy', label: safe ? 'ACID row lock' : 'lost-update race!' }],
            },
          };
        },
      },
      {
        id: 'tx-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Pessimistic vs Optimistic Locking',
        paragraphs: [
          '✓ High contention (tickets, flash sales): use <b>Atomic SQL <code class="inline-code">WHERE stock &gt;= 1</code></b> or <code class="inline-code">SELECT FOR UPDATE</code>.',
          '✓ Low contention (document edits): use <b>Optimistic Locking</b> (<code class="inline-code">WHERE version = old_ver</code>) without holding DB locks.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'l', label: 'Race Guard', value: 'Atomic SQL + Version', level: 'good' }],
          scene: {
            nodes: [{ id: 'ac', kind: 'cylinder', x: 400, y: 220, label: 'ACID Postgres Guard', sublabel: 'Zero double-spends', tone: 'green', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'ACID safe' }],
          },
        }),
      },
    ],
  },
];
