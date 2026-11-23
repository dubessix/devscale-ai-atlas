# AI Full-Stack Visual Learning & Simulation Platform — Master Plan (0 → Launch)

## 1. Core Concept & Differentiation
Inspired by the tactile engineering-notebook aesthetic of `designed-to-scale.vercel.app`, this platform is built specifically for the **0 → Production AI Full-Stack Developer** journey—covering **DSA, Backend Architecture, Full-Stack Systems, System Design, and AI/LLM Engineering**—and upgrades static step diagrams into an **interactive, value-tunable, gamified simulator**.

### 3 Upgrades Over the Reference Site
1. **Static Diagrams → Live Value Controls ("Update & Change Values")**: Sliders, toggles, and traffic presets directly change latency, throughput, Big-O ops, token cost, and bottlenecks in real time on the SVG canvas.
2. **"Coming Soon" Modes → Real Interactive Modes ("Learn Through Game")**:
   - **Learn**: Guided step-by-step stories with live value tuning & synced code traces.
   - **Arcade / Game**: Timed outage firefighting, SLA tuning puzzles, Big-O optimization duels, and pipeline-wiring levels.
   - **Design Lab**: Open sandbox to drag/connect nodes (LB, Cache, DB, Queue, Vector Store, LLM), set traffic/load values, and inject failures.
   - **Cheatsheets**: Interactive calculators (Napkin Math, LLM Token/Cost/Latency estimator, Big-O & DB quick reference).
3. **"Understand by Saying" (Voice & Feynman Mode)**:
   - **Read-Aloud Sync**: Highlighting each sentence/block in real time as it narrates.
   - **Explain-It-Back Mode**: Speak or type your mental model of a step/system and get instant feedback on what concepts you covered or missed.

---

## 2. Curriculum Architecture (6 Tracks)
1. **01. DSA & Core CS Visualized**
   - Memory, Stack vs. Heap & Big-O Intuition
   - Arrays, Hash Maps & Sliding Window (editable live input!)
   - Stacks, Queues & Rate-Limiting Buffers
   - Trees, Tries & Graph Search (BFS / DFS / Dijkstra)
   - Dynamic Programming & Memoization Tables
   - Embeddings & Vector Similarity / HNSW Graph Search (DSA → AI bridge)
2. **02. Backend Engineering Internals**
   - Event Loop (Async I/O) vs. Thread/Worker Pools
   - HTTP Lifecycle, Middleware, Auth (Sessions vs. JWT vs. OAuth2) & Rate Limiting
   - Storage Engines (B-Trees vs. LSM-Trees), Indexing & Query Plans
   - Connection Pools, Transactions, Locks & Isolation Levels
   - Background Jobs, Message Queues, Retries, DLQs & Idempotent Webhooks
3. **03. Full-Stack & Real-Time Web**
   - Browser Rendering, SSR vs. CSR vs. Server Components
   - Caching Layers (Browser, CDN/Edge, API, DB)
   - Streaming Protocols: HTTP Polling vs. SSE (LLM streaming) vs. WebSockets
4. **04. System Design & Scale**
   - Load Balancing & Consistent Hashing
   - Caching Patterns & Cache Stampede Defense
   - Replication, Sharding, CAP Theorem & Consensus
   - Observability: Logs, Metrics & Distributed Traces
5. **05. AI & LLM Systems Engineering**
   - Tokens, Context Windows, KV Cache & TTFT vs. Generation Speed
   - Structured Outputs & Tool/Function Calling Loops
   - Production RAG: Chunking, Embeddings, Hybrid Search & Reranking
   - AI Agents: ReAct Loops, Memory, Human-in-the-Loop & Guardrails
   - AI Ops: Semantic Caching, Model Routing, Prompt Evals & Cost Control
6. **06. Whole-System Capstone Blueprints**
   - End-to-End AI RAG + Streaming Chat App
   - Autonomous Tool-Calling Agent Backend
   - High-Throughput Webhook / URL Shortener Engine

---

## 3. UI/UX & Developer Experience (DX) Blueprint
- **Visual Design System**: Warm paper/ink palette (`#f4ebe0` / dark espresso `#211e1a`), `JetBrains Mono`, hairline borders, `.btn-pop` tactile offset-shadow CTAs, marker-pen term highlights, and crisp `28×14` isometric SVG grid.
- **Desktop / Tablet / Mobile Layouts**: Locked 3-column IDE cockpit on desktop; drawer + 2-column on tablet; vertical flow with fullscreen diagram modal + sticky bottom nav on mobile.
- **Stage Live Parameter Dock**: Compact floating controls inside the canvas (`Requests/s`, `Cache Hit %`, `Top-K`, `Worker Count`, `Fault Injection`).
- **Dual Diagram + Code Trace Toggle**: Inspect either the isometric architecture or step-synced TypeScript/Python execution code with highlighted active lines.
- **Node Inspector Popover**: Click any node (`Redis`, `Postgres`, `LLM Router`, `Queue`) to inspect real-time internal state, queue depth, and stack tradeoffs.
- **Command Palette (`Ctrl+K`)**: Jump instantly to any Lesson, Concept, Calculator, or Game Challenge.

---

## 4. Technical Architecture & Phased Build Plan
- **Frontend Stack**: TypeScript + Vite/React (or Next.js App Router for optional AI voice/explanation backend routes) + custom CSS Design Tokens matching the tactile notebook aesthetic.
- **Declarative Isometric + Simulation Engine**:
  - `isoProjection` math + reusable SVG node/cylinder/device/crowd/code-card primitives.
  - Real-time `simLoop` recalculating HUD chips, packet speed, queue overflows, and node heat states from user-tuned parameter values.
  - Data-driven lesson/game schemas so new topics drop in cleanly.

### Build Phases
- **Phase 1 — Design System, App Shell & SVG Isometric Sim Engine**: Tokens, light/dark theme, 3-column cockpit, `Ctrl+K` palette, zoom/pan stage, particle + slider simulation loop.
- **Phase 2 — Flagship Interactive Lessons (4 Pillars)**: 1 DSA lesson, 1 Backend Internals lesson, 1 System Design lesson, 1 AI/RAG lesson—each with live value sliders + synced code view.
- **Phase 3 — "Through Game" & Design Lab**: Outage Firefighter scenarios, SLA Value-Tuner levels, Big-O optimizer challenges, and freeform node-wiring sandbox.
- **Phase 4 — Voice ("Understand by Saying") + Expansion + Vercel Deploy**: Synced audio narration, spoken/typed Feynman explanation check, remaining modules, and live deployment on Vercel.
