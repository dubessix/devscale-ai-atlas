import type { Lesson } from '../types/course';

export const CH5_SYSTEM_DESIGN: Lesson[] = [
  {
    id: 'sd-load-balancing',
    moduleId: 'system-design',
    num: 1,
    title: 'Load Balancing, Health Checks & Multi-AZ HA',
    subtitle: 'Eliminate single points of failure with L4/L7 Load Balancers, active health probes, and auto-failover.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'Round-Robin vs Least-Connections routing under uneven AI/API work',
      'Active /healthz checks draining dead pods in <5s',
      'Consistent Hashing for stateful caches & sticky partitions',
    ],
    controls: [
      { id: 'servers', label: 'App Servers', type: 'slider', min: 1, max: 4, step: 1, defaultValue: 3 },
      { id: 'pod2Down', label: 'Kill Pod 2', type: 'toggle', defaultValue: false },
    ],
    codeTrace: {
      title: 'Health Probe + Graceful Drain Handler',
      ts: [
        'app.get("/healthz", async (_req, res) => {',
        '  const dbOk = await db.ping();',
        '  if (!dbOk || isShuttingDown) return res.status(503).send("draining");',
        '  res.status(200).send("ok");',
        '});',
      ],
      py: [
        '@app.get("/healthz")',
        'async def healthz():',
        '    if shutting_down or not await db_ping():',
        '        raise HTTPException(status_code=503, detail="draining")',
        '    return {"status": "ok"}',
      ],
    },
    feynman: {
      prompt: 'How does a Load Balancer keep users online when a server crashes, and why is Least-Connections great for AI APIs?',
      checkpoints: [
        { label: 'Health checks detect failed pods and remove them from rotation', keywords: ['health', 'check', 'remov', 'drain', '503', 'fail'] },
        { label: 'Least-Connections routes to least-busy pod since LLM requests vary widely', keywords: ['least', 'connect', 'uneven', 'duration', 'busy'] },
      ],
      sampleAnswer:
        'A Load Balancer continuously probes `/healthz` and stops sending traffic to dead pods within seconds so users see zero errors. Least-Connections is ideal for AI APIs because one prompt might take 200ms and another 12s—round-robin would pile slow streams onto one unlucky server.',
    },
    steps: [
      {
        id: 'lb-1',
        short: 'SPOF Risk',
        chapter: 'problem',
        title: 'Why 1 server guarantees 100% outage during deploys or crashes',
        paragraphs: [
          'Slide <b>App Servers</b> down to <code class="inline-code">1</code> or kill Pod 2 when you have no redundancy: one hardware blip takes your entire product offline!',
        ],
        goalHits: [1],
        activeCodeLines: { ts: [1, 3], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'spof', label: 'Availability (1 Pod)', value: 'SPOF · Outage Risk!', level: 'bad' },
            { id: 'ha', label: 'With 3 Pods + LB', value: '99.99% Multi-AZ', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'u', kind: 'users', x: 155, y: 220, label: 'Live Users' },
              { id: 's1', kind: 'box', x: 525, y: 220, label: 'Single Server (SPOF)', sublabel: '1 crash = 100% down!', tone: 'red', icon: 'server', load: 95, glow: 'bad' },
            ],
            links: [{ id: 'l1', from: 'u', to: 's1', flow: { kind: 'heavy', rate: 1.8, speed: 1.3 } }],
            legend: [{ kind: 'heavy', label: 'single point of failure' }],
          },
        }),
      },
      {
        id: 'lb-2',
        short: 'LB Failover',
        chapter: 'solution',
        title: 'Route around dead pods automatically',
        paragraphs: [
          'Adjust <b>App Servers</b> and flip <b>Kill Pod 2</b> on: the Load Balancer drains traffic cleanly to healthy pods!',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: (p) => {
          const n = Number(p.servers ?? 3);
          const dead = Boolean(p.pod2Down);
          const alive = Math.max(1, dead && n > 1 ? n - 1 : n);
          const spof = n === 1 || (dead && n === 1);
          const load = spof ? 96 : Math.round(110 / alive);
          return {
            metrics: [
              { id: 'alive', label: 'Healthy Pods', value: `${dead && n > 1 ? n - 1 : dead ? 0 : n} / ${n}`, level: dead && n === 1 ? 'bad' : 'good' },
              { id: 'podcpu', label: 'CPU / Pod', value: `${Math.min(99, load)}%`, level: load > 80 ? 'bad' : 'good' },
            ],
            scene: {
              nodes: [
                { id: 'u', kind: 'users', x: 135, y: 220, label: 'Clients' },
                { id: 'lb', kind: 'box', x: 350, y: 220, label: 'L7 Load Balancer', sublabel: 'Least-Connections', tone: 'violet', icon: 'lb', glow: 'good' },
                { id: 'p1', kind: 'box', x: 615, y: 120, label: 'API Pod 1', tone: spof ? 'red' : 'green', icon: 'server', load },
                ...(n >= 2 ? [{ id: 'p2', kind: 'box' as const, x: 615, y: 235, label: 'API Pod 2', sublabel: dead ? 'UNHEALTHY' : 'healthy', tone: (dead ? 'red' : 'green') as 'red' | 'green', icon: 'server' as const, load: dead ? 0 : load, dimmed: dead }] : []),
                ...(n >= 3 ? [{ id: 'p3', kind: 'box' as const, x: 615, y: 350, label: n === 4 ? 'API Pods 3–4' : 'API Pod 3', tone: 'green' as const, icon: 'server' as const, load }] : []),
              ],
              links: [
                { id: 'l0', from: 'u', to: 'lb', flow: { kind: 'request', rate: 1.5, speed: 1.5 } },
                { id: 'l1', from: 'lb', to: 'p1', flow: { kind: 'response', rate: 1.1, speed: 1.5 } },
                ...(n >= 2 ? [{ id: 'l2', from: 'lb', to: 'p2', dashed: dead, dimmed: dead, flow: !dead ? { kind: 'response' as const, rate: 1.1, speed: 1.5 } : undefined }] : []),
                ...(n >= 3 ? [{ id: 'l3', from: 'lb', to: 'p3', flow: { kind: 'response' as const, rate: 1.1, speed: 1.5 } }] : []),
              ],
              legend: [{ kind: 'response', label: 'healthy LB routing' }],
            },
          };
        },
      },
      {
        id: 'lb-3',
        short: 'Consistent Hash',
        chapter: 'recap',
        title: 'Recap: Least-Connections & Consistent Hashing',
        paragraphs: [
          '✓ Stateless AI/API pods: use <b>Least-Connections</b>.',
          '✓ Stateful caches or sharded KV stores: use <b>Consistent Hashing</b> so adding or dropping 1 node only moves <code class="inline-code">1/N</code> of keys!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'ch', label: 'Rebalance Churn', value: 'Only 1/N keys', level: 'good' }],
          scene: {
            nodes: [{ id: 'ha', kind: 'box', x: 400, y: 220, label: 'Multi-AZ LB + Healthz', sublabel: 'Consistent Hash + Auto-Failover', tone: 'green', icon: 'lb', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'resilient HA routing' }],
          },
        }),
      },
    ],
  },

  {
    id: 'sd-caching-stampede',
    moduleId: 'system-design',
    num: 2,
    title: 'Caching Layers, TTL & Stampede Protection',
    subtitle: 'Cut DB load by 95% with Redis Cache-Aside — and survive cold-key thundering herds.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'Cache-Aside read/write pattern + TTL invalidation tradeoffs',
      'Thundering Herd (Cache Stampede) when a viral key expires at once',
      'Preventing stampedes with Singleflight mutex locks & jittered TTLs',
    ],
    controls: [
      { id: 'hitRate', label: 'Cache Hit %', type: 'slider', min: 10, max: 98, step: 5, unit: '%', defaultValue: 90 },
      { id: 'sf', label: 'Singleflight Lock', type: 'toggle', defaultValue: true },
    ],
    codeTrace: {
      title: 'Cache-Aside + Singleflight Coalescing',
      ts: [
        'const hit = await redis.get(key);',
        'if (hit) return JSON.parse(hit);',
        'return singleflight(key, async () => { // 1 DB query for 1,000 callers!',
        '  const fresh = await db.queryProduct(id);',
        '  await redis.set(key, JSON.stringify(fresh), { EX: 60 + rand(10) });',
        '  return fresh;',
        '});',
      ],
      py: [
        'if hit := await redis.get(key): return json.loads(hit)',
        'async with singleflight_lock(key):  # coalesce thundering herd',
        '    fresh = await db.fetch_product(id)',
        '    await redis.set(key, json.dumps(fresh), ex=60 + randint(0, 10))',
        '    return fresh',
      ],
    },
    feynman: {
      prompt: 'What causes a Cache Stampede (Thundering Herd), and how do Singleflight + TTL jitter stop it?',
      checkpoints: [
        { label: 'Popular key expires and thousands of concurrent misses slam the DB simultaneously', keywords: ['expir', 'miss', 'herd', 'stampede', 'db', 'simultaneous'] },
        { label: 'Singleflight lets only 1 request recompute while others wait; jitter staggers expiry', keywords: ['singleflight', 'lock', 'one', 'coalesce', 'jitter', 'random'] },
      ],
      sampleAnswer:
        'When a viral key’s TTL expires, 1,000 requests miss Redis in the same millisecond and all query Postgres at once (a Cache Stampede). Adding a Singleflight lock lets only 1 request hit the DB and shares its answer, while TTL jitter spreads expiration times apart.',
    },
    steps: [
      {
        id: 'cs-1',
        short: 'Cache-Aside',
        chapter: 'setup',
        title: 'Why 1ms RAM hits multiply database headroom by 10×',
        paragraphs: [
          'In <span class="term">Cache-Aside</span>, the API checks Redis first (~0.8ms). On a miss, it queries Postgres once, stores the JSON in Redis with a <code class="inline-code">TTL</code>, and serves subsequent readers from RAM.',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 5], py: [1, 4] },
        evaluate: () => ({
          metrics: [
            { id: 'ram', label: 'Redis Hit', value: '0.8 ms', level: 'good' },
            { id: 'off', label: 'DB Load Saved', value: '90% Offloaded', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'api', kind: 'box', x: 185, y: 220, label: 'API Server', tone: 'blue', icon: 'server' },
              { id: 'red', kind: 'box', x: 465, y: 135, label: '1. Redis (0.8ms)', tone: 'green', icon: 'cache', glow: 'good' },
              { id: 'db', kind: 'cylinder', x: 645, y: 280, label: '2. Postgres (On Miss)', tone: 'sand' },
            ],
            links: [
              { id: 'l1', from: 'api', to: 'red', flow: { kind: 'cache', rate: 1.5, speed: 1.7 } },
              { id: 'l2', from: 'api', to: 'db', dashed: true, flow: { kind: 'db', rate: 0.4, speed: 1.3 } },
            ],
            legend: [{ kind: 'cache', label: '0.8ms RAM hit' }],
          },
        }),
      },
      {
        id: 'cs-2',
        short: 'Stampede Fix',
        chapter: 'problem',
        title: 'Shield your database from 10× traffic & key expirations',
        paragraphs: [
          'Slide <b>Cache Hit %</b> down or turn off <b>Singleflight Lock</b> to see cold misses hammer Postgres!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 7], py: [1, 5] },
        evaluate: (p) => {
          const hit = Number(p.hitRate ?? 90);
          const sf = Boolean(p.sf);
          const dbLoad = sf ? Math.max(4, Math.round((100 - hit) * 0.6)) : Math.min(99, Math.round((100 - hit) * 1.6 + 25));
          return {
            metrics: [
              { id: 'hr', label: 'Cache Hit Ratio', value: `${hit}%`, level: hit > 80 ? 'good' : 'warn' },
              { id: 'dbl', label: 'Postgres Load', value: `${dbLoad}%`, level: dbLoad > 70 ? 'bad' : 'good' },
              { id: 'sf', label: 'Stampede Guard', value: sf ? 'Singleflight ON' : 'OFF (Herd Risk)', level: sf ? 'good' : 'bad' },
            ],
            scene: {
              nodes: [
                { id: 'api', kind: 'box', x: 185, y: 220, label: 'API Tier', tone: 'blue', icon: 'server' },
                { id: 'red', kind: 'box', x: 430, y: 135, label: 'Redis Cache', sublabel: `${hit}% hits · 0.6ms`, tone: 'green', icon: 'cache', glow: hit > 75 ? 'good' : undefined },
                { id: 'db', kind: 'cylinder', x: 645, y: 280, label: 'Postgres Primary', sublabel: sf ? 'protected by singleflight' : 'THUNDERING HERD!', tone: dbLoad > 70 ? 'red' : 'sand', load: dbLoad, glow: dbLoad > 70 ? 'bad' : undefined },
              ],
              links: [
                { id: 'l1', from: 'api', to: 'red', label: `${hit}% hit`, flow: { kind: 'cache', rate: 1.5, speed: 1.7 } },
                { id: 'l2', from: 'api', to: 'db', label: sf ? '1 coalesced miss' : 'stampede!', flow: { kind: dbLoad > 70 ? 'heavy' : 'db', rate: sf ? 0.5 : 2, speed: 1.3 } },
              ],
              legend: [{ kind: 'cache', label: '0.6ms Redis hit' }, { kind: dbLoad > 70 ? 'heavy' : 'db', label: 'DB miss traffic' }],
            },
          };
        },
      },
      {
        id: 'cs-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Cache Policies & Stampede Checklist',
        paragraphs: [
          '✓ Always add <b>TTL Jitter</b> (<code class="inline-code">60 + rand(10)</code>) so keys don’t expire in unison.',
          '✓ Coalesce hot misses with <b>Singleflight</b>, and delete/invalidate cache keys when source rows mutate!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [3, 6], py: [2, 5] },
        evaluate: () => ({
          metrics: [{ id: 's', label: 'Stampede Proof', value: 'Singleflight + Jitter', level: 'good' }],
          scene: {
            nodes: [{ id: 'rd', kind: 'box', x: 400, y: 220, label: 'Redis + Singleflight + Jitter', tone: 'green', icon: 'cache', glow: 'good' }],
            links: [],
            legend: [{ kind: 'cache', label: 'protected cache' }],
          },
        }),
      },
    ],
  },

  {
    id: 'sd-queues-dlq',
    moduleId: 'system-design',
    num: 3,
    title: 'Async Queues, Pub/Sub, Retries & DLQ',
    subtitle: 'Never make a user wait for PDFs, emails, or 20-page RAG ingestion — buffer spikes safely.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'Decoupling instant 202 Accepted APIs from slow background work',
      'Exponential Backoff + Jitter so retries do not DDoS your own downstream APIs',
      'Dead-Letter Queues (DLQ) for inspecting poison-pill jobs without blocking workers',
    ],
    controls: [
      { id: 'workers', label: 'Workers', type: 'slider', min: 1, max: 6, step: 1, defaultValue: 3 },
      { id: 'spike', label: 'Upload Burst', type: 'toggle', defaultValue: true },
    ],
    codeTrace: {
      title: 'Exponential Backoff + Dead-Letter Queue Policy',
      ts: [
        'await jobQueue.add("ingest-pdf", { docId }, {',
        '  attempts: 5,',
        '  backoff: { type: "exponential", delay: 2000 }, // 2s, 4s, 8s...',
        '  removeOnFail: false, // moves to DLQ after 5 fails',
        '});',
      ],
      py: [
        '@celery.task(bind=True, max_retries=5)',
        'def ingest_pdf(self, doc_id: str):',
        '    try: return process_doc(doc_id)',
        '    except Exception as exc:',
        '        raise self.retry(exc=exc, countdown=2 ** self.request.retries)',
      ],
    },
    feynman: {
      prompt: 'Why use Exponential Backoff with Jitter + a Dead-Letter Queue (DLQ) in background job systems?',
      checkpoints: [
        { label: 'Exponential backoff spaces out retries so flaky downstreams can recover', keywords: ['backoff', 'exponential', 'jitter', 'recover', 'retry', 'storm'] },
        { label: 'DLQ isolates permanently failing jobs so they do not block healthy queue items', keywords: ['dlq', 'dead', 'poison', 'isolat', 'inspect', 'block'] },
      ],
      sampleAnswer:
        'If a downstream service blinks, instant retries create a retry storm that keeps it down. Exponential backoff + jitter spreads retries out nicely, and after max attempts a Dead-Letter Queue captures broken poison-pill jobs for inspection instead of clogging healthy workers.',
    },
    steps: [
      {
        id: 'qu-1',
        short: 'Sync Timeout',
        chapter: 'problem',
        title: 'Why synchronous PDF parsing & embeddings cause 504 Timeouts',
        paragraphs: [
          'Parsing a 50-page PDF and embedding 200 chunks takes ~18 seconds—triggering browser/CDN 504 Gateway Timeouts if done inside the HTTP request!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 2], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'sync', label: 'Sync Wait', value: '18 s → 504 Timeout!', level: 'bad' },
            { id: 'async', label: '202 Queued', value: '12 ms Instant!', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'u', kind: 'device', x: 165, y: 220, label: 'Upload PDF', icon: 'laptop' },
              { id: 'api', kind: 'box', x: 525, y: 220, label: 'Blocking Sync Route', sublabel: '18s embed → 504!', tone: 'red', icon: 'server', load: 96, glow: 'bad' },
            ],
            links: [{ id: 'l1', from: 'u', to: 'api', flow: { kind: 'heavy', rate: 1.5, speed: 0.7 } }],
            legend: [{ kind: 'heavy', label: '504 request timeout' }],
          },
        }),
      },
      {
        id: 'qu-2',
        short: 'Backpressure & DLQ',
        chapter: 'solution',
        title: 'Absorb bursts smoothly and isolate poison-pill failures',
        paragraphs: [
          'The API replies <code class="inline-code">202 Accepted</code> in 12ms while workers drain the queue at a steady, safe pace.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: (p) => {
          const w = Number(p.workers ?? 3);
          const burst = Boolean(p.spike);
          const lag = burst ? Math.max(2, Math.round(35 / w)) : 1;
          return {
            metrics: [
              { id: 'api', label: 'API Reply', value: '12 ms (202 OK)', level: 'good' },
              { id: 'lag', label: 'Queue Drain', value: `${lag} s`, level: lag > 15 ? 'warn' : 'good' },
              { id: 'dlq', label: 'Poison Jobs', value: 'Isolated in DLQ', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'api', kind: 'box', x: 165, y: 220, label: 'Ingest API', sublabel: '202 Accepted', tone: 'green', icon: 'server' },
                { id: 'q', kind: 'box', x: 395, y: 220, label: 'BullMQ / Kafka', sublabel: burst ? 'Spike Buffered' : 'Steady', tone: 'amber', icon: 'queue' },
                { id: 'wk', kind: 'box', x: 635, y: 145, label: `${w}× Workers`, sublabel: 'backoff + jitter', tone: 'violet', icon: 'ai', glow: 'good' },
                { id: 'dlq', kind: 'box', x: 635, y: 315, label: 'Dead-Letter Queue', sublabel: 'after 5 fails', tone: 'red', icon: 'shield' },
              ],
              links: [
                { id: 'l1', from: 'api', to: 'q', flow: { kind: 'request', rate: burst ? 1.8 : 0.8, speed: 1.5 } },
                { id: 'l2', from: 'q', to: 'wk', flow: { kind: 'response', rate: 1.1, speed: 1.4 } },
                { id: 'l3', from: 'wk', to: 'dlq', label: 'poison msg', dashed: true },
              ],
              legend: [{ kind: 'response', label: 'steady async drain' }],
            },
          };
        },
      },
      {
        id: 'qu-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Make Workers Idempotent!',
        paragraphs: [
          '✓ Queues guarantee <b>at-least-once delivery</b>—meaning a worker could run a job twice after a crash. Always make job handlers idempotent (e.g., <code class="inline-code">ON CONFLICT DO NOTHING</code>)!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'del', label: 'Delivery', value: 'At-Least-Once + Idem', level: 'good' }],
          scene: {
            nodes: [{ id: 'dl', kind: 'box', x: 400, y: 220, label: 'Queue + Backoff + DLQ', tone: 'green', icon: 'queue', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'zero-drop buffering' }],
          },
        }),
      },
    ],
  },

  {
    id: 'sd-sharding-cap',
    moduleId: 'system-design',
    num: 4,
    title: 'Sharding, Read Replicas & CAP Theorem',
    subtitle: 'Scaling databases beyond one disk — Read Replicas vs Horizontal Shards and the CP/AP tradeoff.',
    duration: '13 min',
    level: 'Mastery',
    goals: [
      'Read Replicas for read-heavy scaling (and handling replication lag)',
      'Horizontal Sharding by shard key (user_id / tenant_id) for write scale',
      'CAP Theorem: choosing Consistency (CP) vs Availability (AP) during a network split',
    ],
    controls: [
      { id: 'cap', label: 'Partition Mode', type: 'segmented', options: [{ label: 'CP (Consistency)', value: 'cp' }, { label: 'AP (Availability)', value: 'ap' }], defaultValue: 'cp' },
    ],
    codeTrace: {
      title: 'Consistent Shard Routing + Read/Write Split',
      ts: [
        'const shardId = consistentHash(tenantId) % SHARD_COUNT;',
        '// Writes -> Shard Primary (Strong Consistency)',
        'await shards[shardId].primary.insert(orders).values(order);',
        '// Analytics Reads -> Read Replica (Eventually Consistent)',
        'return shards[shardId].replica.select().from(orders);',
      ],
      py: [
        'shard = shards[consistent_hash(tenant_id) % len(shards)]',
        '# Strong-consistency writes go to Primary',
        'await shard.primary.execute(insert_order)',
        '# Heavy reads offload to Replica (~50ms lag OK)',
        'return await shard.replica.fetch_all(select_orders)',
      ],
    },
    feynman: {
      prompt: 'When do Read Replicas stop being enough (forcing Sharding), and what does CAP Theorem force during a network partition?',
      checkpoints: [
        { label: 'Read replicas scale reads only; Sharding splits data/writes across independent primaries', keywords: ['shard', 'write', 'split', 'partition', 'replica', 'read'] },
        { label: 'During a network partition (P), you must choose Consistency (reject stale) or Availability (serve possibly stale)', keywords: ['cap', 'consisten', 'availab', 'partition', 'stale', 'reject'] },
      ],
      sampleAnswer:
        'Read Replicas multiply read throughput, but all writes still hit one Primary—so once write IOPS or single-machine storage maxes out, you must horizontally Shard rows across nodes. Under CAP, when a network partition breaks communication between nodes, a system must either halt writes to protect Consistency (CP, like banking) or keep responding with potentially stale state for Availability (AP, like social feeds).',
    },
    steps: [
      {
        id: 'cap-1',
        short: 'Replicas vs Shards',
        chapter: 'setup',
        title: 'Scale reads with Replicas; scale writes & storage with Sharding',
        paragraphs: [
          'Always start with <b>Read Replicas</b> (1 Primary → N Replicas). Only add <b>Horizontal Sharding</b> when writes or multi-TB tables outgrow one machine—because cross-shard JOINs are painful!',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: () => ({
          metrics: [
            { id: 'rep', label: 'Read Replicas', value: '10× Read Scale', level: 'good' },
            { id: 'shd', label: 'Sharding', value: 'N× Write + Disk Scale', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'p', kind: 'cylinder', x: 245, y: 220, label: 'Primary (Writes)', tone: 'green', glow: 'good' },
              { id: 'r1', kind: 'cylinder', x: 545, y: 135, label: 'Read Replica 1', sublabel: '~40ms async lag', tone: 'blue' },
              { id: 'r2', kind: 'cylinder', x: 545, y: 310, label: 'Read Replica 2', sublabel: 'Analytics / Dashboards', tone: 'blue' },
            ],
            links: [
              { id: 'l1', from: 'p', to: 'r1', label: 'WAL stream', flow: { kind: 'db', rate: 1, speed: 1.5 } },
              { id: 'l2', from: 'p', to: 'r2', label: 'WAL stream', flow: { kind: 'db', rate: 1, speed: 1.5 } },
            ],
            legend: [{ kind: 'db', label: 'async WAL replication' }],
          },
        }),
      },
      {
        id: 'cap-2',
        short: 'CP vs AP Split',
        chapter: 'tradeoff',
        title: 'When cables split: CP vs AP in real life',
        paragraphs: [
          'Toggle <b>Partition Mode</b> between <b>CP</b> (banking ledger refuses stale reads) and <b>AP</b> (social feed stays online while replicas catch up).',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: (p) => {
          const isCp = p.cap === 'cp';
          return {
            metrics: [
              { id: 'c', label: 'Consistency', value: isCp ? 'Strong (No Stale)' : 'Eventual (~80ms)', level: isCp ? 'good' : 'warn' },
              { id: 'a', label: 'Partition Uptime', value: isCp ? 'Writes Paused (503)' : '100% Writable', level: isCp ? 'warn' : 'good' },
            ],
            scene: {
              nodes: [
                { id: 'r', kind: 'box', x: 185, y: 220, label: 'Shard Router', sublabel: 'hash(tenant_id)', tone: 'violet', icon: 'lb' },
                { id: 's1', kind: 'cylinder', x: 465, y: 140, label: 'Shard A Primary', tone: 'green', glow: 'good' },
                { id: 's2', kind: 'cylinder', x: 465, y: 310, label: 'Shard B Replica', sublabel: isCp ? 'Fenced (CP)' : 'Serving Stale (AP)', tone: isCp ? 'red' : 'amber' },
              ],
              links: [
                { id: 'l1', from: 'r', to: 's1', flow: { kind: 'db', rate: 1.2, speed: 1.5 } },
                { id: 'l2', from: 's1', to: 's2', label: 'LINK BROKEN (P)', dashed: true },
              ],
              legend: [{ kind: 'db', label: 'sharded traffic' }],
            },
          };
        },
      },
      {
        id: 'cap-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Pick Shard Keys Without Hotspots',
        paragraphs: [
          '✓ Never shard by monotonically increasing ID or a celebrity tenant alone—use <code class="inline-code">tenant_id</code> / <code class="inline-code">user_id</code> consistent hashing so traffic distributes evenly!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 5], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'sh', label: 'Shard Key', value: 'Even Hash Distribution', level: 'good' }],
          scene: {
            nodes: [{ id: 'sh', kind: 'box', x: 400, y: 220, label: 'Replicas + Consistent Shards', tone: 'green', icon: 'db', glow: 'good' }],
            links: [],
            legend: [{ kind: 'db', label: 'horizontal DB scale' }],
          },
        }),
      },
    ],
  },
];
