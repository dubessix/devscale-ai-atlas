export type AppMode = 'learn' | 'play' | 'lab' | 'cheatsheets';

export type ChapterKind =
  | 'setup'
  | 'problem'
  | 'solution'
  | 'technique'
  | 'tradeoff'
  | 'compare'
  | 'insight'
  | 'recap';

export type MetricLevel = 'good' | 'warn' | 'bad' | 'neutral';

export interface MetricSpec {
  id: string;
  label: string;
  value: string;
  level?: MetricLevel;
  icon?: string;
}

export type NodeKind =
  | 'box'
  | 'cylinder'
  | 'device'
  | 'users'
  | 'zone'
  | 'codeCard'
  | 'arrayViz'
  | 'graphNode'
  | 'matrixViz';

export type NodeTone = 'blue' | 'orange' | 'amber' | 'violet' | 'green' | 'red' | 'sand' | 'muted';

export interface SceneNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  tone?: NodeTone;
  icon?:
    | 'server'
    | 'lb'
    | 'db'
    | 'cache'
    | 'ai'
    | 'vector'
    | 'queue'
    | 'cdn'
    | 'shield'
    | 'lock'
    | 'filter'
    | 'code'
    | 'loop'
    | 'laptop'
    | 'phone'
    | 'search'
    | 'globe';
  load?: number;
  tag?: {
    text: string;
    tone?: 'green' | 'red' | 'amber' | 'violet' | 'neutral';
  };
  glow?: 'good' | 'bad' | 'warn';
  dimmed?: boolean;
  w?: number;
  h?: number;
  lines?: string[];
  codeStatus?: 'normal' | 'alert' | 'good';
  arrayData?: {
    cells: (string | number)[];
    pointers?: { index: number; label: string; color?: string }[];
    highlights?: number[];
    summary?: string;
    hashEntries?: [string, string][];
  };
  graphState?: {
    badge?: string;
    status?: 'unvisited' | 'frontier' | 'visited' | 'path';
  };
  matrixData?: {
    rowLabels: string[];
    colLabels: string[];
    values: (string | number)[][];
    active?: [number, number];
    deps?: [number, number][];
    formula?: string;
  };
  inspect?: {
    role: string;
    latency: string;
    throughput: string;
    stack: string;
  };
}

export type FlowKind =
  | 'request'
  | 'response'
  | 'heavy'
  | 'failed'
  | 'health'
  | 'stream'
  | 'vector'
  | 'ai'
  | 'cache'
  | 'db';

export interface SceneLink {
  id: string;
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  bidirectional?: boolean;
  bend?: number;
  flow?: {
    kind: FlowKind;
    rate?: number;
    speed?: number;
    reverse?: boolean;
  };
  dimmed?: boolean;
}

export interface LegendItem {
  kind: FlowKind;
  label: string;
}

export interface SceneSpec {
  nodes: SceneNode[];
  links: SceneLink[];
  legend: LegendItem[];
}

export type ParamValues = Record<string, number | string | boolean>;

export interface SimControl {
  id: string;
  label: string;
  type: 'slider' | 'segmented' | 'toggle';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string }[];
  defaultValue: number | string | boolean;
}

export interface CalloutSpec {
  kind: 'warn' | 'tip' | 'insight' | 'next';
  title: string;
  text: string;
}

export interface CompareSpec {
  headers: [string, string, string];
  rows: [string, string, string][];
}

export interface DiffChange {
  kind: 'add' | 'mod' | 'warn';
  text: string;
}

export interface LessonStep {
  id: string;
  short: string;
  chapter: ChapterKind;
  title: string;
  paragraphs: string[];
  callout?: CalloutSpec;
  compare?: CompareSpec;
  changes?: DiffChange[];
  goalHits: number[];
  activeCodeLines?: {
    ts: [number, number];
    py: [number, number];
  };
  evaluate: (params: ParamValues) => {
    metrics: MetricSpec[];
    scene: SceneSpec;
  };
}

export interface Lesson {
  id: string;
  moduleId: string;
  num: number;
  title: string;
  subtitle: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Mastery';
  goals: string[];
  controls: SimControl[];
  codeTrace: {
    title: string;
    ts: string[];
    py: string[];
  };
  feynman: {
    prompt: string;
    checkpoints: { label: string; keywords: string[] }[];
    sampleAnswer: string;
  };
  steps: LessonStep[];
}

export interface CourseModule {
  id: string;
  num: string;
  title: string;
  color: string;
  lessons: Lesson[];
}

export interface ConceptEntry {
  term: string;
  lessonId: string;
  stepIndex: number;
  summary: string;
}
