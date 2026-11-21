/** Derives "what should I do today?" from the schedule, content and progress. */
import { schedule, PLAN_START, INTERVIEW_DATE } from '@/content/schedule';
import { problems } from '@/content/problems';
import type { Problem, StudyDay } from '@/content/types';
import { effectiveDate, everCompleted, problemRecord, problemReviewQueue, type Progress } from './progress';

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

export type SequenceStep = {
  id: 'learn' | 'vocab' | 'bigo' | 'pattern' | 'solve' | 'review';
  label: string;
  done: number;
  total: number;
  href: string;
};

/** Learn → Vocabulary → Big-O → Pattern → Solve → Review, with completion counts for the day. */
export function daySequence(day: StudyDay, progress: Progress, today: string): SequenceStep[] {
  const { coreAssigned, assigned } = assignmentsFor(day.date, progress);
  const solveList = coreAssigned.length ? coreAssigned : assigned;
  const review = problemReviewQueue(progress, problems, today);
  return [
    { id: 'learn', label: 'Learn', done: day.lessons.filter((k) => progress.lessons[k]?.done).length, total: day.lessons.length, href: '#today-lessons' },
    { id: 'vocab', label: 'Understand vocabulary', done: day.terms.filter((t) => progress.terms[t] || progress.checks[`term:${t}`]).length, total: day.terms.length, href: '#today-terms' },
    { id: 'bigo', label: 'Analyze complexity', done: day.drills.filter((d) => progress.drills[d]).length, total: day.drills.length, href: '#today-drills' },
    { id: 'pattern', label: 'Recognize pattern', done: day.patterns.filter((s) => progress.patterns[s]).length, total: day.patterns.length, href: '#today-patterns' },
    { id: 'solve', label: 'Solve on LeetCode', done: solveList.filter((p) => everCompleted(problemRecord(progress, p.id))).length, total: solveList.length, href: '#today-problems' },
    { id: 'review', label: 'Review', done: review.length === 0 ? 1 : 0, total: 1, href: '#review' },
  ];
}
