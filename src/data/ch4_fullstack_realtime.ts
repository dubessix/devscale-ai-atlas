import type { Lesson } from '../types/course';

export const CH4_FULLSTACK_REALTIME: Lesson[] = [
  {
    id: 'fs-dns-tls-sse',
    moduleId: 'fullstack-rt',
    num: 1,
    title: 'From URL to Bytes: DNS, TLS, HTTP & SSE',
    subtitle: 'Every millisecond from pressing Enter (DNS + TCP + TLS 1.3) to streaming tokens over SSE.',
    duration: '10 min',
    level: 'Beginner',
    goals: [
      'DNS resolution, TCP 3-way handshake, and TLS 1.3 1-RTT encryption',
      'Why HTTP/2 multiplexing eliminates head-of-line request queues',
      'How Server-Sent Events (SSE) stream ChatGPT/Claude tokens word by word',
    ],
    controls: [
      { id: 'tls', label: 'Protocol', type: 'segmented', options: [{ label: 'HTTP/1.1 Cold', value: 'h1' }, { label: 'HTTP/2 + TLS 1.3', value: 'h2' }], defaultValue: 'h2' },
    ],
    codeTrace: {
      title: 'Streaming AI Tokens with SSE (text/event-stream)',
      ts: [
        'res.setHeader("Content-Type", "text/event-stream");',
        'res.setHeader("Cache-Control", "no-cache");',
        'for await (const chunk of llmStream) {',
        '  res.write(`data: ${JSON.stringify({ token: chunk })}\\n\\n`);',
        '}',
        'res.end("data: [DONE]\\n\\n");',
      ],
      py: [
        'async def event_stream():',
        '    async for chunk in llm_stream:',
        '        yield f"data: {json.dumps({\'token\': chunk})}\\n\\n"',
        'return StreamingResponse(event_stream(), media_type="text/event-stream")',
      ],
    },
    feynman: {
      prompt: 'Why do LLM apps stream answers via Server-Sent Events (SSE) instead of waiting for the full JSON response or opening WebSockets?',
      checkpoints: [
        { label: 'SSE streams incrementally over plain HTTP so TTFT drops from seconds to ~250ms', keywords: ['ttft', 'stream', 'http', 'first', 'chunk', 'sse'] },
        { label: 'Simpler than WebSocket for 1-way server->browser token streaming', keywords: ['one-way', 'unidirectional', 'simpler', 'proxy', 'reconnect'] },
      ],
      sampleAnswer:
        'Generating 500 tokens takes 5–10 seconds, so waiting for full JSON freezes the UI. SSE keeps a standard HTTP response open (`text/event-stream`) and pushes tokens as they generate—giving ~250ms time-to-first-token without WebSocket state complexity.',
    },
    steps: [
      {
        id: 'net-1',
        short: 'DNS & TLS 1.3',
        chapter: 'setup',
        title: 'Shaving 140ms off every connection with TLS 1.3 + HTTP/2',
        paragraphs: [
          'Old HTTP/1.1 + TLS 1.2 needed 3 extra network round-trips before sending 1 byte. <span class="term">TLS 1.3</span> merges key exchange into 1-RTT, and <span class="term">HTTP/2</span> multiplexes assets over one socket.',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 2], py: [1, 1] },
        evaluate: (p) => {
          const fast = p.tls === 'h2';
          return {
            metrics: [
              { id: 'hs', label: 'Connect + TLS', value: fast ? '42 ms (TLS 1.3)' : '185 ms (Cold)', level: fast ? 'good' : 'warn' },
              { id: 'mux', label: 'Parallel Streams', value: fast ? 'Multiplexed H2/H3' : '6-conn HoL Queue', level: fast ? 'good' : 'warn' },
            ],
            scene: {
              nodes: [
                { id: 'b', kind: 'device', x: 155, y: 220, label: 'Browser', icon: 'laptop' },
                { id: 'dns', kind: 'box', x: 400, y: 220, label: 'DNS + Edge TLS 1.3', sublabel: fast ? '1-RTT Encrypted' : '3-RTT Slow', tone: fast ? 'green' : 'amber', icon: 'lock', glow: fast ? 'good' : undefined },
                { id: 'ori', kind: 'box', x: 645, y: 220, label: 'HTTP/2 API', tone: 'blue', icon: 'server' },
              ],
              links: [
                { id: 'l1', from: 'b', to: 'dns', flow: { kind: 'request', rate: 1, speed: fast ? 1.7 : 0.8 } },
                { id: 'l2', from: 'dns', to: 'ori', flow: { kind: 'response', rate: 1.2, speed: fast ? 1.7 : 0.8 } },
              ],
              legend: [{ kind: 'response', label: '1-RTT encrypted stream' }],
            },
          };
        },
      },
      {
        id: 'net-2',
        short: 'SSE Tokens',
        chapter: 'solution',
        title: 'Stream LLM tokens chunk-by-chunk over plain HTTP',
        paragraphs: [
          'Instead of letting the user stare at a 6-second spinner, <span class="term">Server-Sent Events (SSE)</span> pushes each generated word immediately over standard HTTP.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 4] },
        evaluate: (p) => {
          const fast = p.tls === 'h2';
          return {
            metrics: [
              { id: 'ttft', label: 'Stream TTFT', value: fast ? '210 ms' : '490 ms', level: fast ? 'good' : 'warn' },
              { id: 'wait', label: 'Perceived Wait', value: 'Instant Typing!', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'b', kind: 'device', x: 155, y: 220, label: 'Chat UI', icon: 'laptop' },
                { id: 'srv', kind: 'box', x: 545, y: 220, label: 'API SSE Stream', sublabel: 'data: {"token":"Hi"}', tone: 'violet', icon: 'ai', glow: 'good' },
              ],
              links: [{ id: 'l1', from: 'srv', to: 'b', label: 'SSE stream →', flow: { kind: 'ai', rate: 1.7, speed: 1.8 } }],
              legend: [{ kind: 'ai', label: 'chunked SSE tokens' }],
            },
          };
        },
      },
      {
        id: 'net-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Always Flush Headers & Handle AbortSignal',
        paragraphs: [
          '✓ Pass <code class="inline-code">req.signal</code> to your LLM client so if the user closes the browser tab, your backend immediately stops generating & burning tokens!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [3, 6], py: [2, 4] },
        evaluate: () => ({
          metrics: [{ id: 'ab', label: 'Cancel Guard', value: 'AbortSignal Wired', level: 'good' }],
          scene: {
            nodes: [{ id: 'sse', kind: 'box', x: 400, y: 220, label: 'SSE + AbortController', sublabel: '210ms TTFT · Zero Wasted Tokens', tone: 'green', icon: 'ai', glow: 'good' }],
            links: [],
            legend: [{ kind: 'ai', label: 'safe token stream' }],
          },
        }),
      },
    ],
  },

  {
    id: 'fs-rendering-edge',
    moduleId: 'fullstack-rt',
    num: 2,
    title: 'Browser Rendering, SSR, RSC & Edge CDN',
    subtitle: 'CSR vs SSR vs Streaming React Server Components — and why CDN Edge caching shrinks LCP.',
    duration: '11 min',
    level: 'Intermediate',
    goals: [
      'Critical Rendering Path: DOM + CSSOM → Layout → Paint',
      'CSR blank spinner vs SSR HTML-first vs RSC zero-bundle server fetches',
      'CDN Stale-While-Revalidate caching at the Edge',
    ],
    controls: [
      { id: 'render', label: 'Mode', type: 'segmented', options: [{ label: 'Client SPA', value: 'csr' }, { label: 'SSR + Edge CDN', value: 'ssr' }], defaultValue: 'ssr' },
    ],
    codeTrace: {
      title: 'CDN Cache-Control + Streaming Server Render',
      ts: [
        'export const revalidate = 60; // ISR / Edge SWR window',
        'res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");',
        'return <ProductPage data={await db.query.products.findFirst()} />;',
      ],
      py: [
        '# Edge Reverse Proxy / FastAPI Cache Header',
        'response.headers["Cache-Control"] = "public, s-maxage=60, stale-while-revalidate=300"',
        'return templates.TemplateResponse("product.html", {"data": product})',
      ],
    },
    feynman: {
      prompt: 'Why does SSR + Edge CDN give a much faster Largest Contentful Paint (LCP) than a heavy Client-Side SPA?',
      checkpoints: [
        { label: 'CSR ships blank HTML + waits to download/run JS before fetching data', keywords: ['csr', 'blank', 'bundle', 'waterfall', 'download', 'wait'] },
        { label: 'SSR/Edge delivers ready HTML from a nearby PoP immediately', keywords: ['html', 'ssr', 'cdn', 'edge', 'lcp', 'immediate'] },
      ],
      sampleAnswer:
        'A Client SPA serves an empty HTML shell, waits to download and execute the JS bundle, and only then fetches API data (a request waterfall). SSR renders HTML on the server, and an Edge CDN caches it right next to the user so the browser paints real content on the very first response.',
    },
    steps: [
      {
        id: 'rn-1',
        short: 'Paint Path',
        chapter: 'setup',
        title: 'How a browser turns HTML bytes into pixels at 60fps',
        paragraphs: [
          'The browser parses <span class="term">DOM</span> + <span class="term">CSSOM</span> → computes <span class="term">Layout</span> → <span class="term">Paint</span>. Blocking JS or sequential fetches delay that first paint!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 3], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'fps', label: 'Frame Budget', value: '16.6 ms (60fps)', level: 'good' },
            { id: 'cwv', label: 'Target LCP', value: '< 1.2 s', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'd', kind: 'box', x: 175, y: 220, label: 'DOM + CSSOM', tone: 'sand', icon: 'code' },
              { id: 'ly', kind: 'box', x: 400, y: 220, label: 'Layout Tree', tone: 'blue', icon: 'server' },
              { id: 'px', kind: 'box', x: 635, y: 220, label: 'GPU Composite', sublabel: '16ms pixels', tone: 'green', icon: 'laptop', glow: 'good' },
            ],
            links: [
              { id: 'l1', from: 'd', to: 'ly', flow: { kind: 'request', rate: 1, speed: 1.5 } },
              { id: 'l2', from: 'ly', to: 'px', flow: { kind: 'response', rate: 1, speed: 1.5 } },
            ],
            legend: [{ kind: 'response', label: 'critical render path' }],
          },
        }),
      },
      {
        id: 'rn-2',
        short: 'CSR vs Edge SSR',
        chapter: 'compare',
        title: 'Eliminate the JS download waterfall',
        paragraphs: [
          'Compare <b>Client SPA</b> (empty shell → JS download → API fetch → Paint) against <b>SSR + Edge CDN</b> (instant HTML from edge PoP!).',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 3], py: [1, 3] },
        evaluate: (p) => {
          const isSsr = p.render === 'ssr';
          return {
            metrics: [
              { id: 'lcp', label: 'Browser LCP', value: isSsr ? '0.42 s' : '2.35 s', level: isSsr ? 'good' : 'bad' },
              { id: 'js', label: 'Client JS Bundle', value: isSsr ? '48 KB (RSC)' : '480 KB (SPA)', level: isSsr ? 'good' : 'warn' },
            ],
            scene: {
              nodes: [
                { id: 'u', kind: 'device', x: 155, y: 220, label: 'Browser', icon: 'laptop' },
                { id: 'cdn', kind: 'box', x: 400, y: 220, label: isSsr ? 'Edge CDN (PoP)' : 'Static Bucket', sublabel: isSsr ? 'HTML Hit · 18ms' : 'Empty <div id=root>', tone: isSsr ? 'green' : 'orange', icon: 'cdn', glow: isSsr ? 'good' : undefined },
                { id: 'ori', kind: 'box', x: 645, y: 220, label: 'Origin Server', sublabel: isSsr ? 'RSC + SWR' : 'API Waterfall', tone: 'blue', icon: 'server' },
              ],
              links: [
                { id: 'l1', from: 'u', to: 'cdn', flow: { kind: isSsr ? 'cache' : 'request', rate: 1.3, speed: isSsr ? 1.8 : 0.9 } },
                { id: 'l2', from: 'cdn', to: 'ori', dashed: isSsr, flow: !isSsr ? { kind: 'heavy', rate: 1.3, speed: 0.9 } : undefined },
              ],
              legend: [{ kind: isSsr ? 'cache' : 'heavy', label: isSsr ? 'edge HTML hit' : 'JS + API waterfall' }],
            },
          };
        },
      },
      {
        id: 'rn-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Stale-While-Revalidate at the Edge',
        paragraphs: [
          '✓ Public marketing/catalog pages: Edge CDN <code class="inline-code">s-maxage=60, stale-while-revalidate=300</code> gives global 20ms loads.',
          '✓ Interactive workspaces & AI chats: stream shell SSR + hydrate fast client interactions!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 3], py: [1, 3] },
        evaluate: () => ({
          metrics: [{ id: 'swr', label: 'Edge SWR', value: '20 ms Global Hit', level: 'good' }],
          scene: {
            nodes: [{ id: 'cdn', kind: 'box', x: 400, y: 220, label: 'Edge SWR + Streaming RSC', tone: 'green', icon: 'cdn', glow: 'good' }],
            links: [],
            legend: [{ kind: 'cache', label: 'edge cached' }],
          },
        }),
      },
    ],
  },

  {
    id: 'fs-websockets-realtime',
    moduleId: 'fullstack-rt',
    num: 3,
    title: 'Real-Time: Polling, WebSockets & Pub/Sub',
    subtitle: 'Full-duplex chat/presence with Redis Pub/Sub fanout — without blowing up memory.',
    duration: '11 min',
    level: 'Intermediate',
    goals: [
      'Short Polling waste vs Long Polling vs true WebSockets',
      'Scaling WebSockets horizontally using Redis Pub/Sub between pods',
      'Handling slow consumers with backpressure & bounded queues',
    ],
    controls: [
      { id: 'proto', label: 'Transport', type: 'segmented', options: [{ label: '1s Polling', value: 'poll' }, { label: 'WS + Redis PubSub', value: 'ws' }], defaultValue: 'ws' },
    ],
    codeTrace: {
      title: 'Cross-Server WebSocket Fanout via Redis Pub/Sub',
      ts: [
        'sub.subscribe("room:42", (msg) => {',
        '  for (const ws of localSockets.get("room:42") ?? []) {',
        '    if (ws.bufferedAmount < MAX_BUF) ws.send(msg);',
        '  }',
        '});',
      ],
      py: [
        'async for msg in pubsub.listen():',
        '    for ws in room_sockets["room:42"]:',
        '        await ws.send_text(msg["data"])',
      ],
    },
    feynman: {
      prompt: 'If you have 3 WebSocket server pods behind a load balancer, how does a message on Pod A reach a user connected to Pod B?',
      checkpoints: [
        { label: 'Pod A cannot push directly to sockets held in Pod B RAM', keywords: ['ram', 'memory', 'different', 'pod', 'server'] },
        { label: 'Use Redis Pub/Sub (or Kafka/NATS) broker to fanout across pods', keywords: ['redis', 'pub', 'sub', 'broker', 'fanout', 'broadcast'] },
      ],
      sampleAnswer:
        'A WebSocket TCP connection is pinned to a single server pod’s RAM. To reach users connected to other pods, Pod A publishes the message to a shared Redis Pub/Sub channel, and all pods subscribed to that room push the message down their own local sockets.',
    },
    steps: [
      {
        id: 'ws-1',
        short: 'Polling Trap',
        chapter: 'problem',
        title: 'Why 1-second HTTP Polling melts API servers',
        paragraphs: [
          'If 50,000 users poll <code class="inline-code">GET /messages</code> every second, you burn <b>50,000 QPS</b> on auth + DB lookups even when 98% of replies are empty <code class="inline-code">[]</code>!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 3], py: [1, 2] },
        evaluate: () => ({
          metrics: [
            { id: 'qps', label: 'Wasted QPS', value: '49,000 empty/s', level: 'bad' },
            { id: 'hdr', label: 'HTTP Overhead', value: '800 B/req headers', level: 'warn' },
          ],
          scene: {
            nodes: [
              { id: 'u', kind: 'users', x: 165, y: 220, label: '50k Pollers' },
              { id: 'api', kind: 'box', x: 525, y: 220, label: 'API Cluster', sublabel: '98% empty 200 []', tone: 'red', icon: 'server', load: 94, glow: 'bad' },
            ],
            links: [{ id: 'l1', from: 'u', to: 'api', flow: { kind: 'heavy', rate: 2.3, speed: 1.4 } }],
            legend: [{ kind: 'heavy', label: 'empty polling flood' }],
          },
        }),
      },
      {
        id: 'ws-2',
        short: 'Pub/Sub Fanout',
        chapter: 'solution',
        title: 'Connect multi-pod WebSockets with Redis Pub/Sub',
        paragraphs: [
          'With <b>WebSockets + Redis Pub/Sub</b>, each pod holds open TCP sockets locally and shares room events across pods in 14ms!',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 5], py: [1, 3] },
        evaluate: (p) => {
          const isWs = p.proto === 'ws';
          return {
            metrics: [
              { id: 'lat', label: 'Delivery Latency', value: isWs ? '14 ms' : '500 ms avg', level: isWs ? 'good' : 'warn' },
              { id: 'wasted', label: 'Empty Requests', value: isWs ? '0%' : '98% Wasted!', level: isWs ? 'good' : 'bad' },
            ],
            scene: {
              nodes: [
                { id: 'ua', kind: 'device', x: 135, y: 150, label: 'User A', icon: 'phone' },
                { id: 'ub', kind: 'device', x: 135, y: 310, label: 'User B', icon: 'laptop' },
                { id: 'pa', kind: 'box', x: 375, y: 150, label: 'WS Pod 1', tone: isWs ? 'green' : 'red', icon: 'server' },
                { id: 'pb', kind: 'box', x: 375, y: 310, label: 'WS Pod 2', tone: isWs ? 'green' : 'red', icon: 'server' },
                { id: 'pub', kind: 'box', x: 635, y: 230, label: 'Redis Pub/Sub', sublabel: 'room:42 fanout', tone: 'violet', icon: 'queue', glow: isWs ? 'good' : undefined },
              ],
              links: [
                { id: 'a1', from: 'ua', to: 'pa', flow: { kind: isWs ? 'response' : 'heavy', rate: isWs ? 0.9 : 2.2, speed: 1.6 } },
                { id: 'b1', from: 'pb', to: 'ub', flow: { kind: isWs ? 'response' : 'heavy', rate: isWs ? 0.9 : 2.2, speed: 1.6 } },
                { id: 'p1', from: 'pa', to: 'pub', flow: { kind: 'request', rate: 1, speed: 1.6 } },
                { id: 'p2', from: 'pub', to: 'pb', flow: { kind: 'response', rate: 1, speed: 1.6 } },
              ],
              legend: [{ kind: isWs ? 'response' : 'heavy', label: isWs ? 'full-duplex + Pub/Sub' : 'polling spam' }],
            },
          };
        },
      },
      {
        id: 'ws-3',
        short: 'Backpressure',
        chapter: 'recap',
        title: 'Recap: Protect Pod RAM from Slow Consumers',
        paragraphs: [
          '✓ Check <code class="inline-code">ws.bufferedAmount &lt; MAX_BUF</code> before pushing live ticks—never let one stalled subway phone OOM-crash the server!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [2, 4], py: [1, 3] },
        evaluate: () => ({
          metrics: [{ id: 'bp', label: 'Buffer Cap', value: 'Bounded RAM ✓', level: 'good' }],
          scene: {
            nodes: [{ id: 'bp', kind: 'box', x: 400, y: 220, label: 'Backpressure + Heartbeats', sublabel: 'ws.bufferedAmount guard', tone: 'green', icon: 'shield', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'OOM-safe sockets' }],
          },
        }),
      },
    ],
  },
];
