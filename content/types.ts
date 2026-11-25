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

/**
 * Where the evidence for a problem comes from (see sources/colorstack-explore-research.md).
 * - colorstack-reported: a ColorStack member reported it (or its follow-up) in an Explore interview.
 * - github-historical: listed in the historical CourtneyThurston/microsoft-internships reports.
 * - colorstack-recommended: recommended for practice by ColorStack members; not a confirmed question.
 * All of these are anecdotal, not official Microsoft information.
 */
export type Evidence = 'colorstack-reported' | 'github-historical' | 'colorstack-recommended';

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
  /**
   * 'plan' = imported from the original study-plan file; 'colorstack' = added from the ColorStack research;
   * 'bootcamp' = requested by the learner in the seven-day bootcamp plan (sources/seven-day-bootcamp-request.md).
   * Bootcamp additions are not interview evidence, so they carry no `evidence`.
   */
  origin?: 'plan' | 'colorstack' | 'bootcamp';
  evidence?: Evidence[];
  /** Why a problem was made optional (scope correction or bootcamp: secondary topic, reinforcement, advanced). */
  demoted?: string;
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
  /** Non-LeetCode practice for the day, sized by the study allocation. */
  practice?: DayPractice;
};

export type DayPractice = {
  /** OOP challenge id (content/oop-challenges.ts). */
  oop?: string;
  /** Code-reading exercise ids (content/code-reading.ts). */
  reading?: string[];
  /** Behavioral prompt ids (content/mocks.ts). */
  behavioral?: string[];
  /** Product/testing prompt id (content/mocks.ts). */
  product?: string;
  /** Project id for the résumé explanation drill (content/projects.ts). */
  project?: string;
};

// ---------- Blind assessments ----------

/**
 * An unlabeled coding question. The title, pattern, difficulty and solution stay hidden until the
 * learner commits to an approach. `statement` must not name the pattern or the data structure.
 */
export type BlindItem = {
  id: string;
  /** Neutral display name shown before the reveal (e.g. "Seat finder"). */
  codename: string;
  statement: string;
  examples: string[];
  constraints: string[];
  /** Date (YYYY-MM-DD) from which the needed concepts have been taught; selection never serves it earlier. */
  unlock: string;
  evidence?: Evidence;
  /** Short evidence note, e.g. "ColorStack-reported: Two Sum follow-up". */
  evidenceNote?: string;
  /** Hidden until reveal. */
  answer: {
    pattern: string;
    difficulty: Difficulty;
    /** The characteristics of the statement that point at the approach. */
    signals: string[];
    structure: string;
    brute: { idea: string; time: string; space: string };
    bottleneck: string;
    optimized: { idea: string; time: string; space: string };
    edgeCases: string[];
    /** Python reference solution with asserts; run by tests/python-samples.test.ts. */
    solution: string;
    /** LeetCode problem this is based on, if any. */
    problem?: number;
    /** Lesson keys to revisit if this was missed. */
    lessons: string[];
  };
  /** Interviewer-style nudges, weakest first. Using one is recorded. */
  hints: string[];
  /** A follow-up an interviewer might ask after a working solution. */
  followUp: string;
};

// ---------- Code reading (comprehension) ----------

export type CodeReading = {
  id: string;
  title: string;
  evidence?: Evidence;
  evidenceNote?: string;
  /** Python function to read; must be valid Python and its asserts must pass. */
  code: string;
  /** Prompts the learner answers in writing before the reveal. */
  prompts: string[];
  model: {
    purpose: string;
    inputs: string;
    outputs: string;
    edgeCases: string[];
    complexity: string;
    /** Bugs or risky behavior an interviewer may want you to spot (may be empty). */
    issues: string[];
    /** How to say it in ~30 seconds. */
    explain: string;
  };
};

// ---------- OOP challenges ----------

export type OopChallenge = {
  id: string;
  order: number;
  title: string;
  evidence?: Evidence;
  evidenceNote?: string;
  /** Lesson keys that must be studied first. */
  prereqs: string[];
  concepts: string[];
  brief: string;
  /** Requirements stated by the source (or by this app for original challenges). */
  requirements: string[];
  /** Requirements the app had to infer because the source was incomplete. Shown labeled. */
  inferred: string[];
  /** Build it in small steps, each testable. */
  stages: string[];
  /** Clarifying questions worth asking before coding. */
  clarify: string[];
  /** Python skeleton the learner starts from. */
  starter: string;
  /** Reference solution including asserts; run by tests. Hidden until the learner commits. */
  solution: string;
  followUps: string[];
};

// ---------- Résumé projects ----------

export type ProjectBrief = {
  id: string;
  name: string;
  /** Résumé stack line, verbatim. */
  stack: string;
  /** Résumé bullets, verbatim (the claims an interviewer will read). */
  resumeClaims: string[];
  /** Facts grounded in repository / portfolio evidence, with where they came from. */
  facts: { text: string; source: string }[];
  /** Simple boxes-and-arrows: each entry is one box; arrows connect consecutive boxes. */
  diagram: { label: string; detail: string }[];
  /** Notes that keep the explanation honest: gaps or mismatches between the résumé and the evidence. */
  verify: string[];
  /** The nine explanation fields: guidance text per field (what the evidence supports). */
  prompts: Record<ProjectPromptId, string>;
  followUps: string[];
};

export type ProjectPromptId = 'problem' | 'architecture' | 'dataflow' | 'technologies' | 'contribution' | 'challenge' | 'tradeoff' | 'measurement' | 'improve';

export type Source = {
  title: string;
  url: string;
  label: 'OFFICIAL' | 'EDUCATIONAL' | 'ANECDOTAL' | 'CURATED';
  note: string;
};
