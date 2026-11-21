/**
 * Content schema for the Explore prep platform.
 * All educational content lives in typed data files under /content so it can be
 * validated by tests (see tests/content.test.ts) instead of being buried in JSX.
 *
 * Text fields support a tiny markdown subset rendered by components/rich.tsx:
 *   `code`, **bold**, blank-line paragraphs, and lines starting with "- " as bullets.
 */

export type Priority = 'P0' | 'P1' | 'P2';
export type Phase = 1 | 2 | 3;
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** A multiple-choice knowledge check. `answer` is the index into `options`. */
export type Check = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

// ---------- Visualizations (rendered by components/visualizer.tsx) ----------

export type ArrayStep = {
  cells: (string | number)[];
  /** Pointer name -> index it points at. */
  pointers?: Record<string, number>;
  /** Indices to emphasize. */
  highlight?: number[];
  /** Inclusive [left, right] window to shade. */
  window?: [number, number];
  /** Extra named values to display under the array (e.g. seen = {2: 0}). */
  vars?: Record<string, string>;
  note: string;
};

export type ListStep = {
  /** Node labels in display order. */
  nodes: string[];
  /** next[i] = index of the node that nodes[i].next points to, or null for None. */
  next: (number | null)[];
  /** Pointer name -> node index (or null for None). */
  pointers: Record<string, number | null>;
  note: string;
};

export type TreeNode = { label: string; id: string; children?: TreeNode[] };
export type TreeStep = { active: string[]; done?: string[]; note: string };

export type BucketStep = {
  incoming?: string;
  buckets: { key: string; items: string[] }[];
  note: string;
};

export type StackStep = {
  /** Bottom -> top for a stack, front -> back for a queue. */
  items: string[];
  input?: string;
  vars?: Record<string, string>;
  note: string;
};

export type GridStep = { grid: string[][]; highlight?: [number, number][]; vars?: Record<string, string>; note: string };

export type VarsStep = { vars: Record<string, string>; note: string };

export type Visual =
  | { kind: 'array'; title: string; steps: ArrayStep[] }
  | { kind: 'list'; title: string; steps: ListStep[] }
  | { kind: 'tree'; title: string; root: TreeNode; steps: TreeStep[] }
  | { kind: 'buckets'; title: string; steps: BucketStep[] }
  | { kind: 'stack' | 'queue'; title: string; steps: StackStep[] }
  | { kind: 'grid'; title: string; steps: GridStep[] }
  | { kind: 'vars'; title: string; steps: VarsStep[] }
  | { kind: 'growth'; title: string };

// ---------- Lessons ----------

export type Lesson = {
  id: string;
  title: string;
  /** Overrides the module's phase for lessons that are long-term material. */
  phase?: Phase;
  summary: string;
  /** 1. What is this concept? */
  what: string;
  /** 2. Why does it exist? */
  why: string;
  /** 3. How does it work? Step-by-step. */
  how: string[];
  /** 4. Visualization (optional; only when it genuinely helps). */
  visual?: Visual;
  /** 5. Python implementation. Must run as-is with python3 (asserts included). */
  code: string;
  /** Explanations of non-obvious syntax in `code`. */
  codeNotes: string[];
  /** 6. Time and space complexity with derivation. */
  complexity: { time: string; space: string; derivation: string[] };
  /** 7. When should I use it? */
  whenToUse: string[];
  /** 8. Common mistakes and edge cases. */
  mistakes: string[];
  /** 9. Knowledge check. */
  checks: Check[];
  /** 10. LeetCode application: problem IDs from the study plan. */
  problems: number[];
  /** Glossary term IDs referenced by this lesson. */
  terms: string[];
  /** A short template for explaining this out loud in an interview. */
  verbal: string;
};

export type Module = {
  id: string;
  number: number;
  title: string;
  priority: Priority;
  phase: Phase;
  blurb: string;
  /** Module IDs that should be studied first. */
  prerequisites: string[];
  lessons: Lesson[];
};

// ---------- Interview dictionary ----------

export type TermCategory =
  | 'Counting & arrangements'
  | 'Arrays & sequences'
  | 'Searching & optimization'
  | 'Data structures'
  | 'Recursion & graphs'
  | 'Complexity & implementation';

export type Term = {
  id: string;
  term: string;
  aliases?: string[];
  category: TermCategory;
  definition: string;
  example: string;
  implies: string;
  /** Which constraints / input characteristics change the right approach. */
  decide: string;
  approaches: string[];
  misconception: string;
  structures: string[];
  complexity: string;
  problem: number;
  /** Lesson IDs ("module/lesson") that teach this term in depth. */
  lessons: string[];
  check: Check;
};

// ---------- Big-O lab ----------

export type Drill = {
  id: string;
  title: string;
  module: string;
  /** Original Python snippet. */
  code: string;
  /** Defines the size variables used in the answers. */
  sizes: string;
  timeOptions: string[];
  time: string;
  spaceOptions: string[];
  space: string;
  /** Which operation dominates the running time? */
  dominantOptions: string[];
  dominant: number;
  /** Step-by-step derivation shown after submitting. */
  derivation: string[];
  /** Space derivation. */
  spaceWhy: string;
  optimization: string;
  /** A tempting wrong answer and why it is wrong. */
  trap?: string;
  problem?: number;
  tags: string[];
};

// ---------- Pattern recognition ----------

export type PatternId =
  | 'hash-map'
  | 'hash-set'
  | 'frequency-count'
  | 'sorting'
  | 'two-pointers'
  | 'fast-slow'
  | 'sliding-window'
  | 'prefix-sum'
  | 'binary-search'
  | 'stack'
  | 'monotonic-stack'
  | 'queue'
  | 'heap'
  | 'backtracking'
  | 'bfs'
  | 'dfs'
  | 'dynamic-programming'
  | 'greedy'
  | 'intervals'
  | 'kadane'
  | 'linked-list'
  | 'brute-force';

export type PatternScenario = {
  id: string;
  wording: string;
  constraints: string;
  options: PatternId[];
  /** Patterns that are good answers. */
  best: PatternId[];
  clues: string[];
  why: string;
  alternative: string;
  /** When the obvious keyword-based guess would be a bad fit. */
  badFit: string;
  problem?: number;
};

export type DecoderProblem = {
  id: string;
  title: string;
  /** Original problem statement (not copied from LeetCode). */
  statement: string;
  /** Words/phrases in the statement that carry meaning, with what each signals. */
  keyTerms: { text: string; meaning: string; term?: string }[];
  input: string;
  output: string;
  constraints: string[];
  structureOptions: string[];
  structure: number;
  patternOptions: string[];
  pattern: number;
  timeOptions: string[];
  time: number;
  space: string;
  guided: string[];
  problem?: number;
  label?: string;
};

// ---------- LeetCode problems & schedule ----------

export type ProblemWave = 'First wave' | 'Supporting' | 'Stretch';

export type Problem = {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topic: string;
  pattern: string;
  priority: Priority;
  wave: ProblemWave;
  /** Original assigned date (YYYY-MM-DD) from the study plan. */
  date: string;
  /** Why this problem was selected (from the study plan). */
  why: string;
  /** Reference optimal complexity. */
  time: string;
  space: string;
  /** Lesson IDs ("module/lesson") to review before solving. */
  prereqs: string[];
  /** Glossary term IDs to review before solving. */
  terms: string[];
  /** Short, original hint ladder (no solutions). */
  hints: string[];
  candidateReport?: string;
};

export type StudyDay = {
  date: string;
  theme: string;
  focus: string;
  lessons: string[];
  terms: string[];
  drills: string[];
  patterns: string[];
  /** Planned LeetCode problem count from the study plan (first wave + supporting). */
  target: number;
  extras: string[];
};

export type Source = {
  title: string;
  url: string;
  label: 'OFFICIAL' | 'EDUCATIONAL' | 'ANECDOTAL' | 'CURATED';
  note: string;
};
