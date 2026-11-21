/**
 * Learner progress model and pure functions over it.
 * Everything here is framework-free so it can be unit tested (tests/progress.test.ts).
 */
import { addDays, isDateKey } from './dates';
import type { Problem } from '@/content/types';

export const PROBLEM_STATUSES = ['not-started', 'attempted', 'with-help', 'independent', 'needs-review'] as const;
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

export const STATUS_LABELS: Record<ProblemStatus, string> = {
  'not-started': 'Not Started',
  attempted: 'Attempted',
  'with-help': 'Solved With Help',
  independent: 'Solved Independently',
  'needs-review': 'Needs Review',
};

export type StatusEvent = { date: string; status: ProblemStatus };

export type ProblemRecord = {
  status: ProblemStatus;
  notes: string;
  approach: string;
  time: string;
  space: string;
  lastAttempted: string | null;
  /** Manual reschedule date; null = use the plan's date. */
  reschedule: string | null;
  /** Learner explicitly asked for another attempt. */
  retry: boolean;
  history: StatusEvent[];
};

export type LessonRecord = { done: boolean; unfamiliar: boolean; at: string };
/** `misses` counts every incorrect attempt ever made, so retrying never erases the history of a gap. */
export type CheckRecord = { correct: boolean; attempts: number; misses: number; at: string };
export type DrillRecord = { time: boolean; space: boolean; dominant: boolean; explanation: string; attempts: number; misses: number; at: string };
export type PatternRecord = { correct: boolean; reason: string; attempts: number; misses: number; at: string };
export type DecoderRecord = { at: string; matched: number; total: number };

export type MockSession = {
  id: string;
  problemId: string;
  startedAt: number;
  minutes: number;
  answers: Record<string, string>;
  rubric: Record<string, number>;
  completedAt: number | null;
};

export type Story = {
  id: string;
  promptId: string;
  title: string;
  fields: Record<string, string>;
  updatedAt: number;
};

export type Progress = {
  version: 1;
  problems: Record<string, ProblemRecord>;
  lessons: Record<string, LessonRecord>;
  checks: Record<string, CheckRecord>;
  drills: Record<string, DrillRecord>;
  patterns: Record<string, PatternRecord>;
  decoder: Record<string, DecoderRecord>;
  terms: Record<string, string>;
  mocks: MockSession[];
  stories: Story[];
  projects: Record<string, Record<string, string>>;
};

export function emptyProgress(): Progress {
  return { version: 1, problems: {}, lessons: {}, checks: {}, drills: {}, patterns: {}, decoder: {}, terms: {}, mocks: [], stories: [], projects: {} };
}

export function emptyProblemRecord(): ProblemRecord {
  return { status: 'not-started', notes: '', approach: '', time: '', space: '', lastAttempted: null, reschedule: null, retry: false, history: [] };
}

// ------------------------------------------------------------------
// Validation: coerce unknown JSON into a well-formed Progress, dropping bad entries.
// ------------------------------------------------------------------

const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function str(value: unknown, max = 20_000): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}
function bool(value: unknown): boolean {
  return value === true;
}
function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function dateOr(value: unknown, fallback: string | null): string | null {
  return isDateKey(value) ? value : fallback;
}
function mapEntries<T>(value: unknown, parse: (v: unknown) => T | null): Record<string, T> {
  const out: Record<string, T> = Object.create(null);
  if (!isRecord(value)) return out;
  for (const [key, raw] of Object.entries(value)) {
    if (UNSAFE_KEYS.has(key) || key.length > 200) continue;
    const parsed = parse(raw);
    if (parsed !== null) out[key] = parsed;
  }
  return out;
}
function isStatus(value: unknown): value is ProblemStatus {
  return typeof value === 'string' && (PROBLEM_STATUSES as readonly string[]).includes(value);
}

export function normalizeProgress(raw: unknown): Progress {
  if (!isRecord(raw)) throw new Error('Saved progress is not an object.');
  if (raw.version !== 1) throw new Error(`Unsupported progress version: ${String(raw.version)}`);
  return {
    version: 1,
    problems: mapEntries(raw.problems, (v) => {
      if (!isRecord(v)) return null;
      const history = Array.isArray(v.history)
        ? v.history.filter((e): e is StatusEvent => isRecord(e) && isDateKey(e.date) && isStatus(e.status)).slice(-200)
        : [];
      return {
        status: isStatus(v.status) ? v.status : 'not-started',
        notes: str(v.notes), approach: str(v.approach), time: str(v.time, 200), space: str(v.space, 200),
        lastAttempted: dateOr(v.lastAttempted, null), reschedule: dateOr(v.reschedule, null),
        retry: bool(v.retry), history,
      };
    }),
    lessons: mapEntries(raw.lessons, (v) => (isRecord(v) ? { done: bool(v.done), unfamiliar: bool(v.unfamiliar), at: dateOr(v.at, '1970-01-01')! } : null)),
    checks: mapEntries(raw.checks, (v) => (isRecord(v) ? { correct: bool(v.correct), attempts: num(v.attempts, 1), misses: num(v.misses, v.correct === true ? 0 : 1), at: dateOr(v.at, '1970-01-01')! } : null)),
    drills: mapEntries(raw.drills, (v) => (isRecord(v) ? { time: bool(v.time), space: bool(v.space), dominant: bool(v.dominant), explanation: str(v.explanation), attempts: num(v.attempts, 1), misses: num(v.misses, v.time === true && v.space === true ? 0 : 1), at: dateOr(v.at, '1970-01-01')! } : null)),
    patterns: mapEntries(raw.patterns, (v) => (isRecord(v) ? { correct: bool(v.correct), reason: str(v.reason), attempts: num(v.attempts, 1), misses: num(v.misses, v.correct === true ? 0 : 1), at: dateOr(v.at, '1970-01-01')! } : null)),
    decoder: mapEntries(raw.decoder, (v) => (isRecord(v) ? { at: dateOr(v.at, '1970-01-01')!, matched: num(v.matched), total: num(v.total) } : null)),
    terms: mapEntries(raw.terms, (v) => (isDateKey(v) ? v : null)),
    mocks: Array.isArray(raw.mocks)
      ? raw.mocks.filter(isRecord).slice(-100).map((m) => ({
          id: str(m.id, 100), problemId: str(m.problemId, 100), startedAt: num(m.startedAt), minutes: num(m.minutes, 45),
          answers: mapEntries(m.answers, (v) => (typeof v === 'string' ? v.slice(0, 20_000) : null)),
          rubric: mapEntries(m.rubric, (v) => (typeof v === 'number' && v >= 0 && v <= 4 ? v : null)),
          completedAt: typeof m.completedAt === 'number' ? m.completedAt : null,
        })).filter((m) => m.id && m.problemId)
      : [],
    stories: Array.isArray(raw.stories)
      ? raw.stories.filter(isRecord).slice(-200).map((s) => ({
          id: str(s.id, 100), promptId: str(s.promptId, 100), title: str(s.title, 300),
          fields: mapEntries(s.fields, (v) => (typeof v === 'string' ? v.slice(0, 20_000) : null)), updatedAt: num(s.updatedAt),
        })).filter((s) => s.id)
      : [],
    projects: mapEntries(raw.projects, (v) => {
      if (!isRecord(v)) return null;
      return mapEntries(v, (f) => (typeof f === 'string' ? f.slice(0, 20_000) : null));
    }),
  };
}

export function parseProgress(json: string): Progress {
  return normalizeProgress(JSON.parse(json));
}

// ------------------------------------------------------------------
// Problem tracking
// ------------------------------------------------------------------

export function problemRecord(progress: Progress, id: number): ProblemRecord {
  return progress.problems[String(id)] ?? emptyProblemRecord();
}

/** Record a new status for a problem on a given date. Returns a new Progress. */
export function setProblemStatus(progress: Progress, id: number, status: ProblemStatus, date: string): Progress {
  const prev = problemRecord(progress, id);
  const history = status === 'not-started' ? prev.history : [...prev.history, { date, status }];
  const next: ProblemRecord = {
    ...prev,
    status,
    history,
    lastAttempted: status === 'not-started' ? prev.lastAttempted : date,
    // A new solve clears an explicit "attempt again" request.
    retry: status === 'with-help' || status === 'independent' ? false : prev.retry,
  };
  return { ...progress, problems: { ...progress.problems, [String(id)]: next } };
}

export function updateProblemFields(progress: Progress, id: number, fields: Partial<Pick<ProblemRecord, 'notes' | 'approach' | 'time' | 'space' | 'reschedule' | 'retry'>>): Progress {
  const prev = problemRecord(progress, id);
  return { ...progress, problems: { ...progress.problems, [String(id)]: { ...prev, ...fields } } };
}

export function effectiveDate(problem: Problem, progress: Progress): string {
  return progress.problems[String(problem.id)]?.reschedule ?? problem.date;
}

export function isCompleted(status: ProblemStatus): boolean {
  return status === 'with-help' || status === 'independent';
}

/**
 * True if the problem was ever solved (with help or independently). Marking a solved problem
 * "Needs Review" or "Attempted" later sends it to the review queue but must not erase the fact
 * that the day's assignment was done.
 */
export function everCompleted(record: ProblemRecord): boolean {
  return isCompleted(record.status) || record.history.some((e) => isCompleted(e.status));
}

/** Distinct days on which the learner solved the problem independently. */
export function independentDays(record: ProblemRecord): number {
  return new Set(record.history.filter((e) => e.status === 'independent').map((e) => e.date)).size;
}

/**
 * Mastery is NOT a single completion: the problem must be solved independently on at least
 * two different days, currently be "Solved Independently", and not be flagged for retry.
 */
export function isMastered(record: ProblemRecord): boolean {
  return record.status === 'independent' && !record.retry && independentDays(record) >= 2;
}

/**
 * Light spaced repetition (1, 3 days):
 *  - Needs Review / retry flag → due now (last attempt date).
 *  - Attempted or Solved With Help → due 1 day later.
 *  - Solved Independently once → due 3 days later for a second independent solve.
 *  - Mastered or Not Started → not in the review queue.
 */
export function reviewDue(record: ProblemRecord): string | null {
  if (record.status === 'not-started' || !record.lastAttempted) return null;
  if (record.retry || record.status === 'needs-review') return record.lastAttempted;
  if (record.status === 'attempted' || record.status === 'with-help') return addDays(record.lastAttempted, 1);
  if (record.status === 'independent') return isMastered(record) ? null : addDays(record.lastAttempted, 3);
  return null;
}

export type ReviewItem =
  | { kind: 'problem'; id: number; due: string; reason: string }
  | { kind: 'lesson'; key: string; reason: string }
  | { kind: 'drill'; id: string; reason: string }
  | { kind: 'pattern'; id: string; reason: string };

export function problemReviewQueue(progress: Progress, problems: Problem[], today: string): Extract<ReviewItem, { kind: 'problem' }>[] {
  const out: Extract<ReviewItem, { kind: 'problem' }>[] = [];
  for (const p of problems) {
    const rec = progress.problems[String(p.id)];
    if (!rec) continue;
    const due = reviewDue(rec);
    if (!due || due > today) continue;
    const reason = rec.retry ? 'Marked for another attempt'
      : rec.status === 'needs-review' ? 'Marked Needs Review'
      : rec.status === 'with-help' ? 'Solved with help — try again on your own'
      : rec.status === 'attempted' ? 'Attempted but not solved'
      : 'Solved independently once — solve again to confirm mastery';
    out.push({ kind: 'problem', id: p.id, due, reason });
  }
  return out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.id - b.id));
}

/** Lessons, drills and pattern exercises whose latest attempt shows a gap. */
export function conceptReviewQueue(progress: Progress, lessonKeys: string[]): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const key of lessonKeys) {
    const rec = progress.lessons[key];
    const wrong = Object.entries(progress.checks).some(([k, c]) => k.startsWith(`lesson:${key}:`) && !c.correct);
    if (rec?.unfamiliar) out.push({ kind: 'lesson', key, reason: 'Marked unfamiliar' });
    else if (wrong) out.push({ kind: 'lesson', key, reason: 'Missed a knowledge check' });
  }
  for (const [id, d] of Object.entries(progress.drills)) {
    if (!d.time || !d.space) out.push({ kind: 'drill', id, reason: !d.time && !d.space ? 'Time and space were off' : !d.time ? 'Time complexity was off' : 'Space complexity was off' });
  }
  for (const [id, p] of Object.entries(progress.patterns)) {
    if (!p.correct) out.push({ kind: 'pattern', id, reason: 'Chose a weaker pattern' });
  }
  return out;
}

// ------------------------------------------------------------------
// Weak topics
// ------------------------------------------------------------------

export type WeakArea = { id: string; label: string; score: number; reasons: string[] };

export type WeaknessInputs = {
  problems: Problem[];
  /** Module id → title. */
  moduleTitles: Record<string, string>;
  /** Drill id → module id. */
  drillModules: Record<string, string>;
  /** Pattern scenario id → module id of its best pattern. */
  patternModules: Record<string, string>;
};

/** Scores modules by recorded struggles. Higher = weaker. Only modules with evidence are returned. */
export function weakAreas(progress: Progress, inputs: WeaknessInputs): WeakArea[] {
  const areas = new Map<string, WeakArea>();
  const bump = (moduleId: string, points: number, reason: string) => {
    if (!inputs.moduleTitles[moduleId]) return;
    const area = areas.get(moduleId) ?? { id: moduleId, label: inputs.moduleTitles[moduleId], score: 0, reasons: [] };
    area.score += points;
    if (!area.reasons.includes(reason)) area.reasons.push(reason);
    areas.set(moduleId, area);
  };

  for (const p of inputs.problems) {
    const rec = progress.problems[String(p.id)];
    if (!rec) continue;
    const moduleId = p.prereqs[0]?.split('/')[0];
    if (!moduleId) continue;
    if (rec.status === 'needs-review') bump(moduleId, 2, `${p.id}. ${p.title}: needs review`);
    else if (rec.status === 'with-help') bump(moduleId, 1, `${p.id}. ${p.title}: solved with help`);
    else if (rec.status === 'attempted') bump(moduleId, 1, `${p.id}. ${p.title}: attempted, not solved`);
    if (rec.retry) bump(moduleId, 1, `${p.id}. ${p.title}: marked for retry`);
  }
  for (const [key, c] of Object.entries(progress.checks)) {
    if (c.correct || !key.startsWith('lesson:')) continue;
    const moduleId = key.split(':')[1]?.split('/')[0];
    if (moduleId) bump(moduleId, 1, 'Missed lesson knowledge checks');
  }
  for (const [key, rec] of Object.entries(progress.lessons)) {
    if (rec.unfamiliar) bump(key.split('/')[0], 1, 'Lessons marked unfamiliar');
  }
  for (const [id, d] of Object.entries(progress.drills)) {
    const moduleId = inputs.drillModules[id];
    if (moduleId && (!d.time || !d.space)) bump(moduleId, 1, 'Big-O drills answered incorrectly');
  }
  for (const [id, p] of Object.entries(progress.patterns)) {
    const moduleId = inputs.patternModules[id];
    if (moduleId && !p.correct) bump(moduleId, 1, 'Pattern-recognition misses');
  }
  return [...areas.values()].sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

// ------------------------------------------------------------------
// Schedule tracking
// ------------------------------------------------------------------

export type TrackStatus = {
  /** Problems planned (first wave + supporting) on or before today. */
  plannedSoFar: number;
  completedOfPlanned: number;
  /** Incomplete core problems from days BEFORE today (today's work is not "behind" yet). */
  behind: number;
  /** Incomplete core problems scheduled for today. */
  dueToday: number;
  totalPlanned: number;
  totalCompleted: number;
  independent: number;
  withHelp: number;
  mastered: number;
  state: 'not-started-yet' | 'on-track' | 'behind' | 'finished';
};

export function trackStatus(progress: Progress, problems: Problem[], today: string, planStart: string): TrackStatus {
  const core = problems.filter((p) => p.wave !== 'Stretch');
  let plannedSoFar = 0, completedOfPlanned = 0, totalCompleted = 0, independent = 0, withHelp = 0, mastered = 0, behind = 0, dueToday = 0;
  for (const p of problems) {
    const rec = problemRecord(progress, p.id);
    if (rec.status === 'independent') independent += 1;
    if (rec.status === 'with-help') withHelp += 1;
    if (isMastered(rec)) mastered += 1;
  }
  for (const p of core) {
    const rec = problemRecord(progress, p.id);
    const done = everCompleted(rec);
    if (done) totalCompleted += 1;
    const date = effectiveDate(p, progress);
    if (date <= today) {
      plannedSoFar += 1;
      if (done) completedOfPlanned += 1;
      else if (date < today) behind += 1;
      else dueToday += 1;
    }
  }
  const state = today < planStart ? 'not-started-yet'
    : totalCompleted === core.length ? 'finished'
    : behind > 0 ? 'behind' : 'on-track';
  return { plannedSoFar, completedOfPlanned, behind, dueToday, totalPlanned: core.length, totalCompleted, independent, withHelp, mastered, state };
}

// ------------------------------------------------------------------
// Small recorders used by the UI
// ------------------------------------------------------------------

export function recordCheck(progress: Progress, key: string, correct: boolean, date: string): Progress {
  const prev = progress.checks[key];
  return { ...progress, checks: { ...progress.checks, [key]: { correct, attempts: (prev?.attempts ?? 0) + 1, misses: (prev?.misses ?? 0) + (correct ? 0 : 1), at: date } } };
}

export function setLesson(progress: Progress, key: string, fields: Partial<LessonRecord>, date: string): Progress {
  const prev = progress.lessons[key] ?? { done: false, unfamiliar: false, at: date };
  return { ...progress, lessons: { ...progress.lessons, [key]: { ...prev, ...fields, at: date } } };
}

export function recordDrill(progress: Progress, id: string, result: Omit<DrillRecord, 'attempts' | 'misses' | 'at'>, date: string): Progress {
  const prev = progress.drills[id];
  const missed = !result.time || !result.space;
  return { ...progress, drills: { ...progress.drills, [id]: { ...result, attempts: (prev?.attempts ?? 0) + 1, misses: (prev?.misses ?? 0) + (missed ? 1 : 0), at: date } } };
}

export function recordPattern(progress: Progress, id: string, correct: boolean, reason: string, date: string): Progress {
  const prev = progress.patterns[id];
  return { ...progress, patterns: { ...progress.patterns, [id]: { correct, reason, attempts: (prev?.attempts ?? 0) + 1, misses: (prev?.misses ?? 0) + (correct ? 0 : 1), at: date } } };
}

export type RecoveredItem = { kind: 'check' | 'drill' | 'pattern'; id: string; misses: number };

/** Items you once got wrong and have since answered correctly — evidence that revisiting worked. */
export function recoveredItems(progress: Progress): RecoveredItem[] {
  const out: RecoveredItem[] = [];
  for (const [id, c] of Object.entries(progress.checks)) if (c.correct && c.misses > 0) out.push({ kind: 'check', id, misses: c.misses });
  for (const [id, d] of Object.entries(progress.drills)) if (d.time && d.space && d.misses > 0) out.push({ kind: 'drill', id, misses: d.misses });
  for (const [id, p] of Object.entries(progress.patterns)) if (p.correct && p.misses > 0) out.push({ kind: 'pattern', id, misses: p.misses });
  return out;
}

export function markTermReviewed(progress: Progress, id: string, date: string): Progress {
  return { ...progress, terms: { ...progress.terms, [id]: date } };
}
