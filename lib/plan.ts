/** Derives "what should I do today?" from the schedule, content and progress. */
import { schedule, PLAN_START, INTERVIEW_DATE, BLIND_PER_DAY } from '@/content/schedule';
import { problems } from '@/content/problems';
import { blindItems } from '@/content/blind';
import type { BlindItem, Problem, StudyDay } from '@/content/types';
import { effectiveDate, everCompleted, practiceRecord, problemRecord, type Progress } from './progress';

export type PlanPosition = 'before' | 'during' | 'after';

/** The study day to show for a date. Before the plan → first day; after → last day. */
export function studyDayFor(today: string): { day: StudyDay; position: PlanPosition } {
  if (today < PLAN_START) return { day: schedule[0], position: 'before' };
  if (today > INTERVIEW_DATE) return { day: schedule[schedule.length - 1], position: 'after' };
  return { day: schedule.find((d) => d.date === today) ?? schedule[0], position: 'during' };
}

export type DayAssignments = {
  /** Problems whose effective date is this day. */
  assigned: Problem[];
  /** Earlier-dated core problems not yet completed (carried over). */
  carried: Problem[];
  /** Core (first wave + supporting) problems effectively assigned this day. */
  coreAssigned: Problem[];
  completedToday: Problem[];
  /** Planned count from the study plan for this date. */
  plannedTarget: number;
};

export function assignmentsFor(date: string, progress: Progress, list: Problem[] = problems): DayAssignments {
  const assigned = list.filter((p) => effectiveDate(p, progress) === date);
  const coreAssigned = assigned.filter((p) => p.wave !== 'Stretch');
  const carried = list.filter((p) => p.wave !== 'Stretch' && effectiveDate(p, progress) < date && !everCompleted(problemRecord(progress, p.id)));
  const completedToday = assigned.filter((p) => everCompleted(problemRecord(progress, p.id)));
  const plannedTarget = schedule.find((d) => d.date === date)?.target ?? 0;
  return { assigned, carried, coreAssigned, completedToday, plannedTarget };
}

// ------------------------------------------------------------------
// Blind assessments
// ------------------------------------------------------------------

const EVIDENCE_RANK: Record<string, number> = { 'colorstack-reported': 0, 'github-historical': 1, 'colorstack-recommended': 2 };

/** Small deterministic string hash (FNV-1a) so the daily pick is stable but varied. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/**
 * The blind assessments for a day. Rules:
 *  - Only items whose concepts were taught on an EARLIER day (unlock < date): retrieval, not repetition.
 *  - Items attempted before this day are skipped (they come back through the review queue instead).
 *    Attempts made ON this day do not change the pick, so the day's set stays stable.
 *  - Slot 1 prefers reported / historical questions; slot 2 is an interleaved pick from any topic.
 *  - No blind items on interview day.
 */
export function blindForDay(date: string, progress: Progress, pool: BlindItem[] = blindItems, count = BLIND_PER_DAY): BlindItem[] {
  if (date >= INTERVIEW_DATE) return [];
  const fresh = pool.filter((b) => b.unlock < date && !practiceRecord(progress, `blind:${b.id}`).attempts.some((a) => a.date < date));
  const byEvidence = [...fresh].sort((a, b) => (EVIDENCE_RANK[a.evidence ?? ''] ?? 3) - (EVIDENCE_RANK[b.evidence ?? ''] ?? 3) || hash(date + a.id) - hash(date + b.id));
  const picked: BlindItem[] = [];
  if (byEvidence[0]) picked.push(byEvidence[0]);
  const rest = fresh.filter((b) => !picked.includes(b)).sort((a, b) => hash(date + a.id) - hash(date + b.id));
  for (const b of rest) {
    if (picked.length >= count) break;
    picked.push(b);
  }
  return picked.slice(0, count);
}
