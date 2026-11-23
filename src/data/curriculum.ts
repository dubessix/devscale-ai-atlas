import type { ConceptEntry, CourseModule, Lesson } from '../types/course';
import { CH1_DSA_BASICS } from './ch1_dsa_basics';
import { CH2_DSA_STRUCTURES } from './ch2_dsa_structures';
import { CH3_BACKEND_DB } from './ch3_backend_db';
import { CH4_FULLSTACK_REALTIME } from './ch4_fullstack_realtime';
import { CH5_SYSTEM_DESIGN } from './ch5_system_design';
import { CH6_AI_FOUNDATIONS } from './ch6_ai_foundations';
import { CH7_AI_PRODUCTION } from './ch7_ai_production';
import { CH8_CAPSTONES } from './ch8_capstones';

const ALL_RAW: Lesson[] = [
  ...CH1_DSA_BASICS,
  ...CH2_DSA_STRUCTURES,
  ...CH3_BACKEND_DB,
  ...CH4_FULLSTACK_REALTIME,
  ...CH5_SYSTEM_DESIGN,
  ...CH6_AI_FOUNDATIONS,
  ...CH7_AI_PRODUCTION,
  ...CH8_CAPSTONES,
];

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 'dsa-basics',
    num: '01',
    title: 'DSA Foundations',
    color: '#e6b87d',
    lessons: ALL_RAW.filter((l) => l.moduleId === 'dsa-basics'),
  },
  {
    id: 'dsa-structures',
    num: '02',
    title: 'DSA Structures & Graphs',
    color: '#df9965',
    lessons: ALL_RAW.filter((l) => l.moduleId === 'dsa-structures'),
  },
  {
    id: 'backend-db',
    num: '03',
    title: 'Backend & DB Mastery',
    color: '#7cc47f',
    lessons: ALL_RAW.filter((l) => l.moduleId === 'backend-db'),
  },
  {
    id: 'fullstack-rt',
    num: '04',
    title: 'Full-Stack & Real-Time',
    color: '#e5925d',
    lessons: ALL_RAW.filter((l) => l.moduleId === 'fullstack-rt'),
  },
  {
    id: 'system-design',
    num: '05',
    title: 'Distributed System Design',
    color: '#8f7ae6',
    lessons: ALL_RAW.filter((l) => l.moduleId === 'system-design'),
  },
  {
    id: 'ai-foundations',
    num: '06',
    title: 'AI Foundations & LLMs',
    color: '#5ca9e6',
    lessons: ALL_RAW.filter((l) => l.moduleId === 'ai-foundations'),
  },
  {
    id: 'ai-production',
    num: '07',
    title: 'Production AI & RAG',
    color: '#4ea3c8',
    lessons: ALL_RAW.filter((l) => l.moduleId === 'ai-production'),
  },
  {
    id: 'capstones',
    num: '08',
    title: 'Capstones & Shipping',
    color: '#d96f8f',
    lessons: ALL_RAW.filter((l) => l.moduleId === 'capstones'),
  },
];

export const ALL_LESSONS: Lesson[] = COURSE_MODULES.flatMap((m) => m.lessons);

export const CONCEPT_INDEX: ConceptEntry[] = [
  { term: 'Stack vs Heap & Big-O', lessonId: 'dsa-bigo-memory', stepIndex: 0, summary: 'Stack LIFO frames vs Heap pointers and O(log n) vs O(n²) curves.' },
  { term: 'Sliding Window', lessonId: 'dsa-sliding-window', stepIndex: 0, summary: 'Shrink O(n²) subarray scans down to O(n) via L/R pointers.' },
  { term: 'Binary Search', lessonId: 'dsa-binary-search', stepIndex: 0, summary: 'Halve sorted arrays and monotonic capacity answers in O(log n).' },
  { term: 'Hash Map Buckets', lessonId: 'dsa-hashmaps', stepIndex: 0, summary: 'O(1) key lookups, load factors, and Two-Sum frequency counters.' },
  { term: 'Monotonic Stack', lessonId: 'dsa-stacks-queues', stepIndex: 1, summary: 'Solve Next-Greater / span problems in a single O(n) stack pass.' },
  { term: 'LRU Cache (Map + DLL)', lessonId: 'dsa-lru-linked', stepIndex: 0, summary: 'O(1) get/put/evict by pairing a Hash Map with a Doubly Linked List.' },
  { term: 'BST & Prefix Trie', lessonId: 'dsa-trees-tries', stepIndex: 1, summary: 'O(log n) sorted trees and O(L) prefix autocomplete Tries.' },
  { term: 'Heaps & Top-K Streams', lessonId: 'dsa-heaps-topk', stepIndex: 1, summary: 'Size-K Min-Heap finding Top-K streams in O(n log k) without full sort.' },
  { term: 'BFS & Dijkstra', lessonId: 'dsa-graphs-bfs-dijkstra', stepIndex: 1, summary: 'Level-order shortest hops vs Min-Heap weighted pathfinding.' },
  { term: 'Backtracking & Union-Find', lessonId: 'dsa-backtracking-unionfind', stepIndex: 0, summary: 'Choose/Explore/Unchoose pruning and near-O(1) DSU connectivity.' },
  { term: '2D Dynamic Programming', lessonId: 'dsa-dp-memo', stepIndex: 1, summary: 'Collapse O(2ⁿ) recursion trees into cached DP state grids.' },
  { term: 'Event Loop & Workers', lessonId: 'be-event-loop', stepIndex: 1, summary: 'Keep single-threaded Node/FastAPI fast by offloading CPU tasks.' },
  { term: 'Idempotency Keys', lessonId: 'be-api-idempotency', stepIndex: 1, summary: 'Prevent duplicate charges on flaky mobile/network POST retries.' },
  { term: 'JWT + HttpOnly Refresh', lessonId: 'be-auth-oauth', stepIndex: 1, summary: 'Short-lived stateless access tokens paired with XSS-safe refresh rotation.' },
  { term: 'B-Tree Indexes & N+1', lessonId: 'be-db-indexes', stepIndex: 0, summary: 'Replace sequential scans and ORM query storms with batched joins.' },
  { term: 'ACID & Row Locks', lessonId: 'be-transactions-acid', stepIndex: 1, summary: 'Eliminate inventory double-sell races via atomic SQL / FOR UPDATE.' },
  { term: 'TLS 1.3 & SSE Streaming', lessonId: 'fs-dns-tls-sse', stepIndex: 1, summary: 'From DNS/TLS handshake to real-time LLM token streaming over SSE.' },
  { term: 'SSR, RSC & Edge CDN', lessonId: 'fs-rendering-edge', stepIndex: 1, summary: 'Eliminate SPA waterfalls with server HTML and Edge SWR caching.' },
  { term: 'WebSockets & Redis Pub/Sub', lessonId: 'fs-websockets-realtime', stepIndex: 1, summary: 'Scale stateful real-time sockets horizontally across server pods.' },
  { term: 'Load Balancing & Healthz', lessonId: 'sd-load-balancing', stepIndex: 1, summary: 'Least-Connections routing and instant failover around dead pods.' },
  { term: 'Cache Stampede / Singleflight', lessonId: 'sd-caching-stampede', stepIndex: 1, summary: 'Coalesce thundering-herd misses with Singleflight locks & jitter.' },
  { term: 'Async Queues & DLQ', lessonId: 'sd-queues-dlq', stepIndex: 1, summary: 'Buffer burst ingestion with backoff retries and Dead-Letter Queues.' },
  { term: 'Sharding & CAP Theorem', lessonId: 'sd-sharding-cap', stepIndex: 1, summary: 'Consistent hash partitions and choosing CP vs AP during splits.' },
  { term: 'BPE Tokens & Cosine Sim', lessonId: 'ai-tokens-embeddings', stepIndex: 1, summary: 'Subword tokenization and high-dimensional semantic similarity.' },
  { term: 'Self-Attention Matrix', lessonId: 'ai-transformers-attention', stepIndex: 1, summary: 'Q/K/V causal attention weights and why context scales O(N²).' },
  { term: 'KV Cache & Model Routing', lessonId: 'ai-kv-cache-routing', stepIndex: 1, summary: 'Cache prefix tensors for fast decoding and route 75% easy prompts.' },
  { term: 'Structured Outputs & Tools', lessonId: 'ai-structured-tools', stepIndex: 1, summary: 'Grammar-locked JSON schemas + backend RBAC validation.' },
  { term: 'Context vs RAG vs LoRA', lessonId: 'ai-finetune-context', stepIndex: 1, summary: 'When to engineer context, retrieve live docs, or distill via LoRA.' },
  { term: 'HNSW Vector Index', lessonId: 'ai-vector-hnsw', stepIndex: 1, summary: 'Express multi-layer graph search finding top-k embeddings in 12ms.' },
  { term: 'Hybrid RAG + Reranker', lessonId: 'ai-production-rag', stepIndex: 1, summary: 'Fuse BM25 + Vector search with RRF and Cross-Encoder reranking.' },
  { term: 'AI Agents & Guardrails', lessonId: 'ai-agents-guardrails', stepIndex: 1, summary: 'Bounded ReAct loops, PII scrubbing, and Human-in-the-Loop gates.' },
  { term: 'AI Evals & Semantic Cache', lessonId: 'ai-evals-observability', stepIndex: 1, summary: 'CI golden datasets, OTel spans, and 24ms cosine answer caching.' },
  { term: 'AI RAG Copilot Capstone', lessonId: 'cap-ai-copilot', stepIndex: 1, summary: 'End-to-end streaming AI assistant tying together all 8 chapters.' },
  { term: 'Billion-Scale URL Shortener', lessonId: 'cap-url-shortener', stepIndex: 1, summary: 'Base62 Snowflake IDs, Redis hot-link cache, and 302 click events.' },
  { term: 'Blue-Green & SIGTERM Drain', lessonId: 'cap-deploy-slo', stepIndex: 1, summary: 'Zero-downtime deploys, Canary rollbacks, and 99.9% SLO budgets.' },
];
