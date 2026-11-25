import { describe, expect, it } from 'vitest';
import { addDays, countdown, daysBetween, isDateKey } from '@/lib/dates';
import { assignmentsFor, studyDayFor } from '@/lib/plan';
import { emptyProgress, setProblemStatus, updateProblemFields } from '@/lib/progress';
import { search } from '@/lib/search';
import { INTERVIEW_DATE } from '@/content/schedule';

describe('dates and countdown', () => {
  it('counts days to the Dec 2 interview using calendar dates', () => {
    expect(countdown('2026-11-21', INTERVIEW_DATE)).toEqual({ kind: 'before', days: 11 });
    expect(countdown('2026-12-01', INTERVIEW_DATE)).toEqual({ kind: 'before', days: 1 });
    expect(countdown('2026-12-02', INTERVIEW_DATE)).toEqual({ kind: 'today' });
    expect(countdown('2026-12-05', INTERVIEW_DATE)).toEqual({ kind: 'after', days: 3 });
  });

  it('handles month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-11-21', '2027-01-01')).toBe(41);
  });

  it('validates date keys', () => {
    expect(isDateKey('2026-11-21')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('11/21/2026')).toBe(false);
  });
});

describe('daily plan', () => {
  it('maps calendar dates to study days, clamping before/after the plan', () => {
    expect(studyDayFor('2026-11-24')).toMatchObject({ position: 'during', day: { date: '2026-11-24' } });
    expect(studyDayFor('2026-11-01')).toMatchObject({ position: 'before', day: { date: '2026-11-21' } });
    expect(studyDayFor('2026-12-20')).toMatchObject({ position: 'after', day: { date: '2026-12-02' } });
  });

  it("assigns today's exact plan problems with the planned daily target", () => {
    const a = assignmentsFor('2026-11-21', emptyProgress());
    expect(a.coreAssigned.map((p) => p.id).sort((x, y) => x - y)).toEqual([1, 49, 242]);
    expect(a.plannedTarget).toBe(3);
    // From Nov 25 the dates follow the seven-day bootcamp (content/bootcamp.ts).
    const nov28 = assignmentsFor('2026-11-28', emptyProgress());
    expect(nov28.coreAssigned.map((p) => p.id).sort((x, y) => x - y)).toEqual([98, 100, 102, 104, 226]);
    const nov29 = assignmentsFor('2026-11-29', emptyProgress());
    expect(nov29.coreAssigned.map((p) => p.id).sort((x, y) => x - y)).toEqual([35, 46, 78, 268, 704]);
    expect(nov29.assigned.filter((p) => p.wave === 'Stretch').map((p) => p.id).sort((x, y) => x - y)).toEqual([2, 9, 23, 53, 56, 70, 200, 207, 215, 415, 733, 994, 1344]);
    const nov25 = assignmentsFor('2026-11-25', emptyProgress());
    expect(nov25.coreAssigned.map((p) => p.id).sort((x, y) => x - y)).toEqual([13, 344]);
    expect(assignmentsFor('2026-11-30', emptyProgress()).assigned).toEqual([]); // Day 6 is a simulation day
  });

  it('carries over incomplete earlier problems and honors rescheduling', () => {
    let p = setProblemStatus(emptyProgress(), 242, 'independent', '2026-11-21');
    p = updateProblemFields(p, 49, { reschedule: '2026-11-22' });
    const nov22 = assignmentsFor('2026-11-22', p);
    expect(nov22.carried.map((x) => x.id)).toEqual([1]);
    expect(nov22.coreAssigned.map((x) => x.id)).toContain(49);
    expect(nov22.plannedTarget).toBe(5); // planned target is preserved
  });
});

describe('global search', () => {
  it('"permutation" finds the definition, lessons, problem 46, drills, and patterns', () => {
    const results = search('permutation');
    const kinds = new Set(results.map((r) => r.kind));
    expect(results[0]).toMatchObject({ kind: 'Term', href: '/dictionary/permutation' });
    for (const k of ['Term', 'Lesson', 'Problem', 'Big-O drill', 'Pattern exercise', 'Decoder', 'Mock interview'] as const) expect(kinds.has(k), k).toBe(true);
    const hrefs = results.map((r) => r.href);
    expect(hrefs).toContain('/learn/recursion/permutations');
    expect(hrefs).toContain('/tracker/46');
    expect(hrefs).toContain('/big-o/permutations-enum');
  });

  it('matches plurals and multiple words', () => {
    expect(search('permutations').some((r) => r.href === '/dictionary/permutation')).toBe(true);
    const sw = search('sliding window');
    expect(sw.some((r) => r.href === '/learn/sliding-window/variable')).toBe(true);
    expect(search('').length).toBe(0);
    expect(search('zzzqqq').length).toBe(0);
  });

  it('finds problems by number', () => {
    expect(search('49')[0]?.href === '/tracker/49' || search('49').some((r) => r.href === '/tracker/49')).toBe(true);
  });
});
