import { describe, expect, it } from 'vitest';
import { bootcampDays, getActivity } from '@/content/bootcamp';
import {
  activeItems, blindPicks, budgetMinutes, canComplete, completeActivity, continueTarget, currentDay, dayCardStatus, dayPlan,
  daysUntilInterview, hoursFor, nextActivity, planContext, previousActivity, setHours, setPosition, skipActivity, targetedReviewPlan,
  type DayPlan,
} from '@/lib/bootcamp';
import {
  emptyProgress, normalizeProgress, parseProgress, problemReviewQueue, recordPracticeOutcome, revealPractice, setLesson, setProblemStatus,
  type Progress,
} from '@/lib/progress';
import { problems } from '@/content/problems';

const D1 = '2026-11-25';
const D2 = '2026-11-26';
const ids = (plan: DayPlan) => activeItems(plan).map((i) => i.activity.id);
const item = (plan: DayPlan, id: string) => plan.items.find((i) => i.activity.id === id)!;

/** Walk a day by completing (or skipping) every item, the way the player does. */
function walk(progress: Progress, n: number, today: string, act: (p: Progress, id: string) => Progress): { progress: Progress; visited: string[] } {
  let p = progress;
  let plan = dayPlan(n, p, today);
  let cur = continueTarget(plan, p.bootcamp.position);
  const visited: string[] = [];
  while (cur && visited.length < 200) {
    visited.push(cur.activity.id);
    p = act(setPosition(p, cur.activity.id), cur.activity.id);
    plan = dayPlan(n, p, today);
    cur = nextActivity(plan, cur.activity.id);
  }
  return { progress: p, visited };
}

describe('current day and countdown', () => {
  it('maps dates to bootcamp days', () => {
    expect(currentDay('2026-11-20')).toEqual({ day: 1, phase: 'before' });
    expect(currentDay(D1)).toEqual({ day: 1, phase: 'during' });
    expect(currentDay('2026-11-28')).toEqual({ day: 4, phase: 'during' });
    expect(currentDay('2026-12-01')).toEqual({ day: 7, phase: 'during' });
    expect(currentDay('2026-12-02')).toEqual({ day: 7, phase: 'interview' });
    expect(currentDay('2026-12-09')).toEqual({ day: 7, phase: 'after' });
    expect(daysUntilInterview(D1)).toBe(7);
  });

  it('hours default to 8, are configurable, and the final day is lighter', () => {
    expect(hoursFor(emptyProgress())).toBe(8);
    expect(hoursFor(setHours(emptyProgress(), 6))).toBe(6);
    expect(budgetMinutes(1, 8)).toBe(480);
    expect(budgetMinutes(7, 8)).toBeLessThan(budgetMinutes(6, 8));
  });
});

describe('ordering and navigation', () => {
  it("lists the day's activities in sequence order", () => {
    const plan = dayPlan(1, emptyProgress(), D1, 12);
    expect(plan.items.map((i) => i.activity.id)).toEqual(bootcampDays[0].activities.map((a) => a.id));
    expect(plan.items.every((i) => i.status === 'pending')).toBe(true);
    expect(plan.percent).toBe(0);
  });

  it('next and previous step through the day; the first item has no previous', () => {
    const plan = dayPlan(1, emptyProgress(), D1);
    const list = ids(plan);
    expect(continueTarget(plan, null)!.activity.id).toBe(list[0]);
    expect(nextActivity(plan, list[0])!.activity.id).toBe(list[1]);
    expect(previousActivity(plan, list[1])!.activity.id).toBe(list[0]);
    expect(previousActivity(plan, list[0])).toBeNull();
  });

  it('skipped items come back at the end of the day, before the end-of-day review', () => {
    let p = emptyProgress();
    const first = dayPlan(1, p, D1);
    const skipId = ids(first)[0];
    p = skipActivity(p, item(first, skipId), D1);
    const { visited } = walk(p, 1, D1, (pr, id) => completeActivity(pr, item(dayPlan(1, pr, D1), id), D1));
    expect(visited.at(-1)).toBe('d1-wrap-end-of-day');
    expect(visited.at(-2)).toBe(skipId);
    expect(visited.filter((v) => v === skipId)).toHaveLength(1);
  });

  it('skipping skipped items again moves forward to the review instead of cycling', () => {
    // Skip everything once, then skip again on the second pass: each item is visited at most twice.
    const { visited } = walk(emptyProgress(), 1, D1, (pr, id) => skipActivity(pr, item(dayPlan(1, pr, D1), id), D1));
    const counts = new Map<string, number>();
    for (const v of visited) counts.set(v, (counts.get(v) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
    expect(visited).toContain('d1-wrap-end-of-day');
  });

  it('completing every item reaches 100% and then there is nothing next', () => {
    const { progress, visited } = walk(emptyProgress(), 1, D1, (pr, id) => completeActivity(pr, item(dayPlan(1, pr, D1), id), D1));
    const plan = dayPlan(1, progress, D1);
    expect(visited).toEqual(ids(dayPlan(1, emptyProgress(), D1)));
    expect(plan.percent).toBe(100);
    expect(continueTarget(plan, progress.bootcamp.position)).toBeNull();
    expect(dayCardStatus(plan, D1)).toBe('complete');
  });

  it('resume: Continue goes to the saved position while it is unfinished, else to the next unfinished item', () => {
    let p = emptyProgress();
    const plan = dayPlan(1, p, D1);
    const third = ids(plan)[2];
    p = setPosition(p, third);
    expect(continueTarget(dayPlan(1, p, D1), p.bootcamp.position)!.activity.id).toBe(third);
    p = completeActivity(p, item(plan, third), D1);
    expect(continueTarget(dayPlan(1, p, D1), p.bootcamp.position)!.activity.id).toBe(ids(plan)[3]);
    // An unfinished item before the position comes after the ones after it.
    expect(nextActivity(dayPlan(1, p, D1), ids(plan).at(-2)!)!.activity.id).toBe(ids(plan)[0]);
  });

  it('revisiting a completed activity and pressing Skip never erases it', () => {
    let p = emptyProgress();
    const it0 = item(dayPlan(1, p, D1), 'd1-lesson-hashing-frequency-maps');
    p = completeActivity(p, it0, D1);
    p = skipActivity(p, item(dayPlan(1, p, D1), it0.activity.id), D1);
    expect(item(dayPlan(1, p, D1), it0.activity.id).status).toBe('done');
    expect(p.lessons['hashing/frequency-maps'].done).toBe(true);
  });

  it('planContext uses today’s plan for carried work and the activity’s own day otherwise', () => {
    const ctx = planContext('d3-lc-20', emptyProgress(), D1)!;
    expect(ctx.plan.day.day).toBe(3);
    const carried = planContext('d1-lc-13', emptyProgress(), D2)!;
    expect(carried.plan.day.day).toBe(2);
    expect(carried.item.carried).toBe(true);
    expect(planContext('nope', emptyProgress(), D1)).toBeNull();
  });
});

describe('carry-over and deferral', () => {
  it('carries unfinished core problems, blind assessments and OOP from earlier days, before the mistake review', () => {
    let p = setProblemStatus(emptyProgress(), 13, 'with-help', D1);
    const plan = dayPlan(2, p, D2);
    const carried = plan.items.filter((i) => i.carried).map((i) => i.activity.id);
    expect(carried).toEqual(expect.arrayContaining(['d1-lc-1', 'd1-lc-344', 'd1-oop-phone-book', 'd1-blind-unseen']));
    expect(carried).not.toContain('d1-lc-13'); // recorded on Day 1
    expect(carried.every((id) => ['problem', 'blind', 'oop'].includes(getActivity(id)!.kind))).toBe(true);
    const order = plan.items.map((i) => i.activity.id);
    expect(order.indexOf('d1-lc-1')).toBeLessThan(order.indexOf('d2-review-mistakes'));
    expect(order.indexOf('d1-lc-1')).toBeGreaterThan(order.indexOf('d2-lc-3'));
    // Marked done → not carried.
    p = completeActivity(p, item(dayPlan(1, p, D1), 'd1-lc-1'), D1);
    expect(dayPlan(2, p, D2).items.some((i) => i.activity.id === 'd1-lc-1')).toBe(false);
  });

  it('does not carry into a day that has not been reached', () => {
    expect(dayPlan(3, emptyProgress(), D1).items.some((i) => i.carried)).toBe(false);
  });

  it('defers stretch before reinforcement when over budget, never core', () => {
    const plan = dayPlan(2, emptyProgress(), D2, 8);
    const deferred = plan.items.filter((i) => i.status === 'deferred');
    expect(deferred.length).toBeGreaterThan(0);
    const stretch = plan.items.filter((i) => i.tier === 'stretch');
    expect(stretch.every((i) => i.status === 'deferred')).toBe(true); // carry-over pushes Day 2 past 8 h
    expect(plan.items.filter((i) => i.tier === 'core').every((i) => i.status !== 'deferred')).toBe(true);
    expect(plan.planned).toBeLessThanOrEqual(plan.budget + plan.items.filter((i) => i.tier === 'core').reduce((s, i) => s + i.minutes, 0));

    const roomy = dayPlan(2, emptyProgress(), D2, 14);
    expect(roomy.deferredCount).toBe(0);
    const tight = dayPlan(1, emptyProgress(), D1, 4);
    expect(tight.items.filter((i) => i.tier !== 'core').every((i) => i.status === 'deferred')).toBe(true);
    expect(tight.items.filter((i) => i.tier === 'core').every((i) => i.status === 'pending')).toBe(true);
    // Deferred items are not part of the Continue sequence.
    expect(ids(tight).some((id) => tight.items.find((i) => i.activity.id === id)!.tier !== 'core')).toBe(false);
  });

  it('completed stretch work is never deferred', () => {
    let p = emptyProgress();
    p = completeActivity(p, item(dayPlan(2, p, D2, 14), 'd2-lc-560'), D2);
    expect(item(dayPlan(2, p, D2, 4), 'd2-lc-560').status).toBe('done');
  });
});

describe('intelligent problem and lesson modes', () => {
  it('a problem solved independently earlier becomes a short retention check', () => {
    const p = setProblemStatus(emptyProgress(), 1, 'independent', '2026-11-21');
    const it1 = item(dayPlan(1, p, D1), 'd1-lc-1');
    expect(it1.mode).toBe('retention');
    expect(it1.minutes).toBeLessThanOrEqual(15);
    expect(it1.title).toMatch(/^Retention check/);
    // Solved with help earlier: still a full attempt.
    expect(item(dayPlan(1, setProblemStatus(emptyProgress(), 1, 'with-help', '2026-11-21'), D1), 'd1-lc-1').mode).toBe('full');
  });

  it('a failed retention check flows into the next day’s mistake review through the review queue', () => {
    let p = setProblemStatus(emptyProgress(), 1, 'independent', '2026-11-21');
    p = setProblemStatus(p, 1, 'with-help', D1);
    expect(problemReviewQueue(p, problems, D2).map((r) => r.id)).toContain(1);
    // The retention check itself is satisfied (it was recorded), so it is not also carried.
    p = completeActivity(p, item(dayPlan(1, p, D1), 'd1-lc-1'), D1);
    expect(dayPlan(2, p, D2).items.some((i) => i.activity.id === 'd1-lc-1')).toBe(false);
  });

  it('a lesson completed earlier becomes a short recap at reinforcement tier; one completed today stays a lesson', () => {
    const before = setLesson(emptyProgress(), 'hashing/frequency-maps', { done: true }, '2026-11-21');
    const recap = item(dayPlan(1, before, D1), 'd1-lesson-hashing-frequency-maps');
    expect([recap.mode, recap.tier]).toEqual(['recap', 'reinforcement']);
    expect(recap.minutes).toBeLessThanOrEqual(10);
    const today = completeActivity(emptyProgress(), item(dayPlan(1, emptyProgress(), D1), 'd1-lesson-hashing-frequency-maps'), D1);
    expect(item(dayPlan(1, today, D1), 'd1-lesson-hashing-frequency-maps').mode).toBe('full');
    // Completing a recap does not touch the original completion date.
    const done = completeActivity(before, recap, D1);
    expect(done.lessons['hashing/frequency-maps'].at).toBe('2026-11-21');
  });
});

describe('completion gating', () => {
  it('a problem needs a status recorded that day', () => {
    const it13 = item(dayPlan(1, emptyProgress(), D1), 'd1-lc-13');
    expect(canComplete(it13, emptyProgress(), D1).ok).toBe(false);
    expect(canComplete(it13, setProblemStatus(emptyProgress(), 13, 'independent', '2026-11-24'), D1).ok).toBe(false);
    expect(canComplete(it13, setProblemStatus(emptyProgress(), 13, 'attempted', D1), D1).ok).toBe(true);
  });

  it('blind, OOP and code reading need an attempt recorded that day; revealing a solution is not enough', () => {
    const plan = dayPlan(1, emptyProgress(), D1);
    const blind = item(plan, 'd1-blind-unseen');
    const key = `blind:${blind.blindId}`;
    let p = revealPractice(emptyProgress(), key);
    expect(canComplete(blind, p, D1).ok).toBe(false);
    p = recordPracticeOutcome(p, key, 'missed', 'did not count first', D1);
    expect(canComplete(blind, p, D1).ok).toBe(true);
    const oop = item(plan, 'd1-oop-phone-book');
    expect(canComplete(oop, revealPractice(emptyProgress(), 'oop:phone-book'), D1).ok).toBe(false);
    expect(canComplete(oop, recordPracticeOutcome(emptyProgress(), 'oop:phone-book', 'independent', '', D1), D1).ok).toBe(true);
    const read = item(plan, 'd1-read-sum-evens');
    expect(canComplete(read, emptyProgress(), D1).ok).toBe(false);
    expect(canComplete(read, recordPracticeOutcome(emptyProgress(), 'read:sum-evens', 'independent', '', D1), D1).ok).toBe(true);
    // Lessons and vocabulary can always be completed, and completing records the learning.
    const terms = item(plan, 'd1-vocab-hashing');
    expect(canComplete(terms, emptyProgress(), D1).ok).toBe(true);
    const done = completeActivity(emptyProgress(), terms, D1);
    for (const t of terms.activity.refs) expect(done.terms[t]).toBe(D1);
  });
});

describe('blind picks are stable and unseen', () => {
  it('an attempt made on the day does not change that day’s pick; an earlier attempt moves to the next candidate', () => {
    const day1 = recordPracticeOutcome(emptyProgress(), 'blind:first-solo', 'independent', '', D1);
    expect(blindPicks(day1)['d1-blind-unseen'].id).toBe('first-solo');
    const earlier = recordPracticeOutcome(emptyProgress(), 'blind:first-solo', 'independent', '', '2026-11-24');
    expect(blindPicks(earlier)['d1-blind-unseen'].id).toBe('sensor-repeat');
    // Day 2 then cannot serve sensor-repeat again.
    expect(blindPicks(earlier)['d2-blind-unseen'].id).not.toBe('sensor-repeat');
  });
});

describe('persistence', () => {
  it('old saves without a bootcamp key load untouched, with an empty bootcamp state', () => {
    const old = { version: 1, problems: { 1: { status: 'independent', notes: 'n', approach: '', time: '', space: '', lastAttempted: '2026-11-21', reschedule: null, retry: false, history: [{ date: '2026-11-21', status: 'independent' }] } }, lessons: { 'hashing/frequency-maps': { done: true, unfamiliar: false, at: '2026-11-21' } }, checks: {}, drills: {}, patterns: {}, decoder: {}, terms: {}, mocks: [], stories: [], projects: {}, practice: {} };
    const p = normalizeProgress(old);
    expect(p.bootcamp).toEqual({ position: null, activities: {}, hours: null });
    expect(p.problems['1'].notes).toBe('n');
    expect(p.lessons['hashing/frequency-maps']).toEqual(old.lessons['hashing/frequency-maps']);
    expect(dayPlan(1, p, D1).items.length).toBeGreaterThan(0);
  });

  it('round-trips bootcamp state and drops invalid entries', () => {
    let p = setHours(emptyProgress(), 6.5);
    p = setPosition(p, 'd1-lc-13');
    p = completeActivity(p, item(dayPlan(1, p, D1), 'd1-lesson-hashing-frequency-maps'), D1);
    const back = parseProgress(JSON.stringify(p));
    expect(back.bootcamp).toEqual(p.bootcamp);
    const bad = normalizeProgress({ ...p, bootcamp: { position: 5, hours: 99, activities: { a: { status: 'weird', at: D1 }, b: { status: 'done', at: 'x' }, c: { status: 'skipped', at: D1 } } } });
    expect(bad.bootcamp).toEqual({ position: null, hours: null, activities: { c: { status: 'skipped', at: D1 } } });
  });
});

describe('targeted review plan', () => {
  it('is built from recorded weaknesses, review queues and the mistake log', () => {
    let p = recordPracticeOutcome(emptyProgress(), 'blind:trail-total', 'missed', 'forgot the endpoint check', '2026-11-28');
    p = setProblemStatus(p, 98, 'with-help', '2026-11-28');
    const plan = targetedReviewPlan(p, '2026-11-30');
    expect(plan.focus[0].id).toBe('trees');
    expect(plan.focus[0].lessons).toContain('trees/dfs');
    expect(plan.mistakes[0].mistake).toMatch(/endpoint/);
    expect(plan.queues.problems.map((q) => q.id)).toContain(98);
    expect(plan.steps.length).toBeGreaterThan(1);
    expect(targetedReviewPlan(emptyProgress(), '2026-11-30').steps).toHaveLength(1);
  });
});
