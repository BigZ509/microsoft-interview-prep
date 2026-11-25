/**
 * The seven-day bootcamp engine: pure functions from (content, progress, today) to "what do I do next?".
 * Framework-free so it can be unit tested (tests/bootcamp-engine.test.ts).
 *
 * Rules
 *  - The current day comes from today's date (before Nov 25 → Day 1 preview; Dec 2 and later → Day 7).
 *  - A day's plan = carried-over core work from earlier days (problems, blind assessments, OOP challenges
 *    not completed) + that day's activities, in sequence order. Carried items sit just before the
 *    mistake review so new concepts are still learned first.
 *  - Lessons already completed on an earlier day become short recaps at reinforcement tier; problems
 *    already solved independently on an earlier day become short retention checks.
 *  - Over the hours budget, pending stretch items are deferred first (last first), then reinforcement.
 *    Core items are never deferred.
 *  - Continue order: pending items after the current one, then pending items before it, then skipped
 *    items, then the end-of-day review.
 */
import {
  bootcampDays, DEFAULT_HOURS, FINAL_DAY_SHARE, getActivity, type BootcampActivity, type BootcampDay, type Tier,
} from '@/content/bootcamp';
import { getLesson } from '@/content/modules';
import { INTERVIEW_DATE } from '@/content/schedule';
import { daysBetween } from './dates';
import { reviewQueuesFor, weakAreasFor } from './insights';
import {
  markTermReviewed, mistakeLog, practiceRecord, problemRecord, setLesson, type BootcampMark, type MistakeEntry, type Progress, type WeakArea,
} from './progress';

export type ActivityStatus = 'done' | 'skipped' | 'pending' | 'deferred';
export type ActivityMode = 'full' | 'recap' | 'retention';

export type PlanItem = {
  activity: BootcampActivity;
  title: string;
  minutes: number;
  tier: Tier;
  mode: ActivityMode;
  /** Brought forward from an earlier day because it is unfinished core work. */
  carried: boolean;
  status: ActivityStatus;
  /** Blind assessments: the item served for this activity. */
  blindId?: string;
  /** Blind assessments: every candidate had been attempted before, so this is a repeat. */
  reattempt?: boolean;
};

export type DayPlan = {
  day: BootcampDay;
  items: PlanItem[];
  /** Minutes available today (hours budget; lighter on the final day). */
  budget: number;
  /** Minutes of everything that is not deferred. */
  planned: number;
  doneMinutes: number;
  deferredCount: number;
  /** Share of non-deferred items marked done, 0–100. */
  percent: number;
};

export type DayPhase = 'before' | 'during' | 'interview' | 'after';

// ------------------------------------------------------------------ days

export function currentDay(today: string): { day: number; phase: DayPhase } {
  if (today < bootcampDays[0].date) return { day: 1, phase: 'before' };
  const match = bootcampDays.find((d) => d.date === today);
  if (match) return { day: match.day, phase: 'during' };
  return { day: bootcampDays.length, phase: today === INTERVIEW_DATE ? 'interview' : 'after' };
}

export function daysUntilInterview(today: string): number {
  return daysBetween(today, INTERVIEW_DATE);
}

export function hoursFor(progress: Progress): number {
  return progress.bootcamp.hours ?? DEFAULT_HOURS;
}

export function budgetMinutes(day: number, hours: number): number {
  return Math.round(hours * 60 * (day === bootcampDays.length ? FINAL_DAY_SHARE : 1));
}

// ------------------------------------------------------------------ blind picks

/**
 * Which blind item each blind activity serves. Walks every day in order; each activity takes its first
 * candidate that was not attempted before ITS day and not already served by an earlier activity.
 * Attempts made on or after the day never change that day's pick, so the pick is stable all day.
 * If every candidate was attempted, the first one not served elsewhere is repeated (marked reattempt).
 */
export function blindPicks(progress: Progress): Record<string, { id: string; reattempt: boolean }> {
  const out: Record<string, { id: string; reattempt: boolean }> = {};
  const served = new Set<string>();
  for (const day of bootcampDays) {
    for (const a of day.activities) {
      if (a.kind !== 'blind') continue;
      const seenBefore = (id: string) => practiceRecord(progress, `blind:${id}`).attempts.some((x) => x.date < day.date);
      const fresh = a.refs.find((id) => !served.has(id) && !seenBefore(id));
      const id = fresh ?? a.refs.find((x) => !served.has(x)) ?? a.refs[0];
      served.add(id);
      out[a.id] = { id, reattempt: !fresh };
    }
  }
  return out;
}

// ------------------------------------------------------------------ modes

export function modeFor(a: BootcampActivity, progress: Progress, dayDate: string): ActivityMode {
  if (a.kind === 'lesson') {
    if (a.recap) return 'recap';
    const rec = progress.lessons[a.refs[0]];
    // `at` < dayDate: completed on an earlier day. Completing it today keeps it a full lesson.
    return rec?.done && rec.at < dayDate ? 'recap' : 'full';
  }
  if (a.kind === 'problem') {
    const rec = problemRecord(progress, Number(a.refs[0]));
    return rec.history.some((e) => e.status === 'independent' && e.date < dayDate) ? 'retention' : 'full';
  }
  return 'full';
}

const RECAP_MINUTES = 10;
const RETENTION_MINUTES = 15;

function shape(a: BootcampActivity, mode: ActivityMode): Pick<PlanItem, 'title' | 'minutes' | 'tier'> {
  if (mode === 'recap') {
    return {
      title: a.title.startsWith('Recap: ') ? a.title : `Recap: ${getLesson(a.refs[0])?.lesson.title ?? a.title}`,
      minutes: Math.min(RECAP_MINUTES, a.minutes),
      tier: a.recap ? a.tier : a.tier === 'core' ? 'reinforcement' : a.tier,
    };
  }
  if (mode === 'retention') return { title: `Retention check: ${a.title}`, minutes: Math.min(RETENTION_MINUTES, a.minutes), tier: a.tier };
  return { title: a.title, minutes: a.minutes, tier: a.tier };
}

// ------------------------------------------------------------------ plan

const CARRY_KINDS = new Set(['problem', 'blind', 'oop']);

/** True once the underlying work was recorded on or after `since` (used to decide carry-over). */
function recordedSince(a: BootcampActivity, progress: Progress, since: string, blindId?: string): boolean {
  if (a.kind === 'problem') return problemRecord(progress, Number(a.refs[0])).history.some((e) => e.date >= since);
  if (a.kind === 'blind') return practiceRecord(progress, `blind:${blindId ?? a.refs[0]}`).attempts.some((x) => x.date >= since);
  if (a.kind === 'oop') return practiceRecord(progress, `oop:${a.refs[0]}`).attempts.some((x) => x.date >= since);
  return false;
}

function markOf(progress: Progress, id: string): BootcampMark | undefined {
  return progress.bootcamp.activities[id];
}

export const isTail = (a: BootcampActivity) => a.kind === 'day-review' || a.kind === 'review-plan';

/**
 * The plan for bootcamp day `n` as seen on `today`. Carry-over is added only once the day has been
 * reached (n ≤ today's day), so previewing a future day shows just its own work.
 */
export function dayPlan(n: number, progress: Progress, today: string, hours = hoursFor(progress)): DayPlan {
  const day = bootcampDays.find((d) => d.day === n);
  if (!day) throw new Error(`No bootcamp day ${n}`);
  const picks = blindPicks(progress);
  const reached = n <= currentDay(today).day;

  const build = (a: BootcampActivity, origin: BootcampDay, carried: boolean): PlanItem => {
    const mode = modeFor(a, progress, origin.date);
    const mark = markOf(progress, a.id);
    // A carried item skipped on an earlier day starts fresh (pending) on the new day.
    const status: ActivityStatus = mark?.status === 'done' ? 'done' : mark?.status === 'skipped' && (!carried || mark.at >= day.date) ? 'skipped' : 'pending';
    const pick = picks[a.id];
    return { activity: a, ...shape(a, mode), mode, carried, status, blindId: pick?.id, reattempt: pick?.reattempt };
  };

  const carried: PlanItem[] = [];
  if (reached) {
    for (const earlier of bootcampDays.filter((d) => d.day < n)) {
      for (const a of earlier.activities) {
        if (!CARRY_KINDS.has(a.kind)) continue;
        const item = build(a, earlier, true);
        if (item.tier !== 'core' || markOf(progress, a.id)?.status === 'done') continue;
        if (recordedSince(a, progress, earlier.date, item.blindId)) continue;
        carried.push(item);
      }
    }
  }

  const own = day.activities.map((a) => build(a, day, false));
  const at = own.findIndex((i) => i.activity.step >= 8);
  const insert = at < 0 ? own.length : at;
  const items = [...own.slice(0, insert), ...carried, ...own.slice(insert)];

  // Defer pending/skipped stretch work first, then reinforcement, latest items first, until within budget.
  const budget = budgetMinutes(n, hours);
  let total = items.reduce((sum, i) => sum + i.minutes, 0);
  for (const tier of ['stretch', 'reinforcement'] as const) {
    for (let k = items.length - 1; k >= 0 && total > budget; k--) {
      const i = items[k];
      if (i.tier !== tier || i.status === 'done') continue;
      i.status = 'deferred';
      total -= i.minutes;
    }
  }

  const active = items.filter((i) => i.status !== 'deferred');
  const done = active.filter((i) => i.status === 'done');
  return {
    day, items, budget,
    planned: active.reduce((s, i) => s + i.minutes, 0),
    doneMinutes: done.reduce((s, i) => s + i.minutes, 0),
    deferredCount: items.length - active.length,
    percent: active.length ? Math.round((done.length / active.length) * 100) : 100,
  };
}

/** Items in the order they are shown and stepped through (deferred items excluded). */
export function activeItems(plan: DayPlan): PlanItem[] {
  return plan.items.filter((i) => i.status !== 'deferred');
}

/**
 * The activity after `currentId`, assuming the current one is completed or skipped:
 * pending items after it → pending items before it → skipped items → end-of-day review.
 * On the second pass (the current item was already skipped) only skipped items AFTER it come next,
 * so skipping again always moves forward to the review instead of cycling. Returns null when nothing is left.
 */
export function nextActivity(plan: DayPlan, currentId: string | null): PlanItem | null {
  const active = activeItems(plan);
  const idx = active.findIndex((i) => i.activity.id === currentId);
  const secondPass = active[idx]?.status === 'skipped';
  const others = active.filter((i) => i.activity.id !== currentId && i.status !== 'done');
  const main = others.filter((i) => !isTail(i.activity));
  const pending = main.filter((i) => i.status === 'pending');
  const after = (list: PlanItem[]) => list.filter((i) => active.indexOf(i) > idx);
  const before = (list: PlanItem[]) => list.filter((i) => active.indexOf(i) < idx);
  const skipped = main.filter((i) => i.status === 'skipped');
  const tail = others.filter((i) => isTail(i.activity));
  return [...after(pending), ...before(pending), ...after(skipped), ...(secondPass ? [] : before(skipped)), ...tail][0] ?? null;
}

export function previousActivity(plan: DayPlan, currentId: string): PlanItem | null {
  const active = activeItems(plan);
  const idx = active.findIndex((i) => i.activity.id === currentId);
  return idx > 0 ? active[idx - 1] : null;
}

/** Where Continue Studying goes: the saved position if it is still pending, else the next incomplete item. */
export function continueTarget(plan: DayPlan, position: string | null): PlanItem | null {
  const saved = activeItems(plan).find((i) => i.activity.id === position);
  if (saved && saved.status === 'pending') return saved;
  return nextActivity(plan, saved ? position : null);
}

/**
 * Which plan an activity page belongs to: today's plan if it contains the activity (including carried
 * work), otherwise the plan of the activity's own day.
 */
export function planContext(activityId: string, progress: Progress, today: string): { plan: DayPlan; item: PlanItem } | null {
  const a = getActivity(activityId);
  if (!a) return null;
  const now = dayPlan(currentDay(today).day, progress, today);
  const hit = now.items.find((i) => i.activity.id === activityId);
  if (hit) return { plan: now, item: hit };
  const own = dayPlan(a.day, progress, today);
  return { plan: own, item: own.items.find((i) => i.activity.id === activityId)! };
}

// ------------------------------------------------------------------ completion

export type Gate = { ok: true } | { ok: false; reason: string };

/**
 * Problems need a status recorded today; blind assessments, OOP challenges and code readings need an
 * attempt recorded today. Opening hints or a reference solution records nothing, so it never satisfies
 * a gate. Everything else can be completed directly. Skip for now is always allowed.
 */
export function canComplete(item: PlanItem, progress: Progress, today: string): Gate {
  const a = item.activity;
  if (a.kind === 'problem') {
    return problemRecord(progress, Number(a.refs[0])).history.some((e) => e.date === today)
      ? { ok: true } : { ok: false, reason: 'Record how it went (Attempted, Solved With Help or Solved Independently) to continue.' };
  }
  const practiceKey = a.kind === 'blind' ? `blind:${item.blindId ?? a.refs[0]}` : a.kind === 'oop' ? `oop:${a.refs[0]}` : a.kind === 'reading' ? `read:${a.refs[0]}` : null;
  if (practiceKey && !practiceRecord(progress, practiceKey).attempts.some((x) => x.date === today)) {
    return { ok: false, reason: a.kind === 'reading' ? 'Compare with the model answer and record whether you covered it.' : 'Reveal the reference and record how the attempt went.' };
  }
  return { ok: true };
}

function putMark(progress: Progress, id: string, mark: BootcampMark): Progress {
  return { ...progress, bootcamp: { ...progress.bootcamp, activities: { ...progress.bootcamp.activities, [id]: mark } } };
}

/** Mark done and record the matching learning progress (lesson read, terms reviewed). Never removes anything. */
export function completeActivity(progress: Progress, item: PlanItem, today: string): Progress {
  const a = item.activity;
  let next = progress;
  if (a.kind === 'lesson' && !progress.lessons[a.refs[0]]?.done) next = setLesson(next, a.refs[0], { done: true }, today);
  if (a.kind === 'terms') for (const t of a.refs) if (!next.terms[t]) next = markTermReviewed(next, t, today);
  return putMark(next, a.id, { status: 'done', at: today });
}

/** Skip for now. A completed activity stays completed: revisiting never erases progress. */
export function skipActivity(progress: Progress, item: PlanItem, today: string): Progress {
  if (markOf(progress, item.activity.id)?.status === 'done') return progress;
  return putMark(progress, item.activity.id, { status: 'skipped', at: today });
}

export function setPosition(progress: Progress, id: string): Progress {
  return progress.bootcamp.position === id ? progress : { ...progress, bootcamp: { ...progress.bootcamp, position: id } };
}

export function setHours(progress: Progress, hours: number): Progress {
  return { ...progress, bootcamp: { ...progress.bootcamp, hours } };
}

// ------------------------------------------------------------------ day cards

export type DayCardStatus = 'complete' | 'today' | 'behind' | 'upcoming' | 'in-progress';

export function dayCardStatus(plan: DayPlan, today: string): DayCardStatus {
  const { day } = currentDay(today);
  if (activeItems(plan).every((i) => i.status === 'done')) return 'complete';
  if (plan.day.day === day) return 'today';
  if (plan.day.day > day) return plan.percent > 0 ? 'in-progress' : 'upcoming';
  return 'behind';
}

/** Minutes per allocation category for a list of activities (the 65/15/10/5/5 check). */
export function allocationMinutes(activities: Pick<BootcampActivity, 'category' | 'minutes'>[]): Record<BootcampActivity['category'], number> {
  const out = { dsa: 0, oop: 0, behavioral: 0, resume: 0, vocab: 0 };
  for (const a of activities) out[a.category] += a.minutes;
  return out;
}

// ------------------------------------------------------------------ targeted review plan (Day 6)

export type ReviewPlan = {
  /** Weakest modules first, each with the bootcamp lessons that teach it. */
  focus: (WeakArea & { lessons: string[] })[];
  queues: ReturnType<typeof reviewQueuesFor>;
  mistakes: MistakeEntry[];
  /** Core activities from earlier days that were skipped and never completed. */
  skipped: BootcampActivity[];
  /** Plain-language plan, in the order to do it. */
  steps: string[];
};

/** Builds the review plan from demonstrated weaknesses: weak areas, the review queues and the mistake log. */
export function targetedReviewPlan(progress: Progress, today: string): ReviewPlan {
  const lessonActivities = bootcampDays.flatMap((d) => d.activities).filter((a) => a.kind === 'lesson');
  const focus = weakAreasFor(progress).slice(0, 4).map((w) => ({
    ...w,
    lessons: [...new Set(lessonActivities.map((a) => a.refs[0]).filter((k) => k.startsWith(`${w.id}/`)))],
  }));
  const queues = reviewQueuesFor(progress, today);
  const mistakes = mistakeLog(progress).slice(0, 8);
  const skipped = bootcampDays.flatMap((d) => d.activities).filter((a) => a.tier === 'core' && markOf(progress, a.id)?.status === 'skipped');
  const due = queues.problems.length + queues.practice.length;
  const steps: string[] = [];
  if (due) steps.push(`Reattempt the ${due} problem${due === 1 ? '' : 's'} and assessment${due === 1 ? '' : 's'} due for review, cold and timed. Day 7 starts with these.`);
  for (const f of focus.slice(0, 3)) steps.push(`${f.label}: ${f.reasons[0]}. Recap ${f.lessons.length ? `“${getLesson(f.lessons[0])?.lesson.title}”` : 'its lessons'} and explain the pattern out loud.`);
  if (mistakes.length) steps.push(`Reread your ${mistakes.length} most recent mistake notes and say what signal you will look for next time.`);
  if (skipped.length) steps.push(`${skipped.length} core activit${skipped.length === 1 ? 'y was' : 'ies were'} skipped earlier. Do the problems and assessments among them first.`);
  if (!steps.length) steps.push('No weaknesses recorded yet. Record honest outcomes on the simulation rounds, then reopen this plan.');
  return { focus, queues, mistakes, skipped, steps };
}
