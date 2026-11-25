import { describe, expect, it } from 'vitest';
import { allActivities, bootcampDays, BOOTCAMP_START, BOOTCAMP_END, SEQUENCE_STEPS, type BootcampActivity } from '@/content/bootcamp';
import { getLesson, allLessons, lessonPhase } from '@/content/modules';
import { getProblem, problems } from '@/content/problems';
import { getTerm } from '@/content/glossary';
import { getDrill } from '@/content/drills';
import { decoderProblems, scenarios } from '@/content/patterns';
import { behavioralPrompts, mockProblems, productPrompts } from '@/content/mocks';
import { getOopChallenge } from '@/content/oop-challenges';
import { getCodeReading } from '@/content/code-reading';
import { getProject } from '@/content/projects';
import { getBlindItem } from '@/content/blind';
import { schedule, studyAllocation } from '@/content/schedule';
import { addDays } from '@/lib/dates';
import { allocationMinutes, blindPicks, budgetMinutes } from '@/lib/bootcamp';
import { emptyProgress } from '@/lib/progress';

const studiedBefore = new Set(schedule.filter((d) => d.date < BOOTCAMP_START).flatMap((d) => d.lessons));
const planned = (acts: BootcampActivity[]) => acts.filter((a) => a.tier !== 'stretch');
const minutes = (acts: BootcampActivity[]) => acts.reduce((s, a) => s + a.minutes, 0);

/** Lessons available by position `index` of day `n`: everything studied before, earlier days, and earlier on the same day. */
function taughtBy(n: number, index: number): Set<string> {
  const out = new Set(studiedBefore);
  for (const d of bootcampDays) {
    if (d.day > n) break;
    d.activities.forEach((a, i) => { if (a.kind === 'lesson' && (d.day < n || i < index)) out.add(a.refs[0]); });
  }
  return out;
}

describe('bootcamp structure', () => {
  it('has 7 consecutive days from Nov 25 to Dec 1', () => {
    expect(bootcampDays.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(bootcampDays[0].date).toBe(BOOTCAMP_START);
    expect(bootcampDays.at(-1)!.date).toBe(BOOTCAMP_END);
    bootcampDays.forEach((d, i) => expect(d.date).toBe(addDays(BOOTCAMP_START, i)));
    for (const d of bootcampDays) {
      expect(d.topics.length, `day ${d.day}`).toBeGreaterThan(2);
      expect(d.objectives.length, `day ${d.day}`).toBeGreaterThan(2);
    }
  });

  it('activity ids are unique, stable and prefixed with their day', () => {
    const ids = allActivities.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of allActivities) {
      expect(a.id, a.id).toMatch(new RegExp(`^d${a.day}-[a-z]+-[a-z0-9-]+$`));
      expect(a.step).toBeGreaterThanOrEqual(1);
      expect(a.step).toBeLessThanOrEqual(SEQUENCE_STEPS.length);
      expect(a.minutes, a.id).toBeGreaterThan(0);
    }
    expect(ids).toContain('d1-lesson-hashing-frequency-maps');
  });

  it('every activity references real content', () => {
    for (const a of allActivities) {
      const r = a.refs;
      switch (a.kind) {
        case 'lesson': expect(getLesson(r[0]), a.id).toBeDefined(); break;
        case 'visual': expect(getLesson(r[0])?.lesson.visual, a.id).toBeDefined(); break;
        case 'terms': expect(r.length).toBeGreaterThan(0); for (const t of r) expect(getTerm(t), `${a.id} ${t}`).toBeDefined(); break;
        case 'reading': expect(getCodeReading(r[0]), a.id).toBeDefined(); break;
        case 'drill': expect(getDrill(r[0]), a.id).toBeDefined(); break;
        case 'patterns': expect(r.length).toBeGreaterThan(0); for (const s of r) expect(scenarios.some((x) => x.id === s), `${a.id} ${s}`).toBe(true); break;
        case 'decoder': expect(decoderProblems.some((x) => x.id === r[0]), a.id).toBe(true); break;
        case 'mock': expect(mockProblems.some((x) => x.id === r[0]), a.id).toBe(true); break;
        case 'problem': expect(getProblem(Number(r[0])), a.id).toBeDefined(); break;
        case 'oop': expect(getOopChallenge(r[0]), a.id).toBeDefined(); break;
        case 'blind': expect(r.length).toBeGreaterThan(0); for (const b of r) expect(getBlindItem(b), `${a.id} ${b}`).toBeDefined(); break;
        case 'behavioral': expect(behavioralPrompts.some((x) => x.id === r[0]), a.id).toBe(true); break;
        case 'product': expect(productPrompts.some((x) => x.id === r[0]), a.id).toBe(true); break;
        case 'project': expect(getProject(r[0]), a.id).toBeDefined(); break;
        case 'review': case 'stories': case 'day-review': case 'review-plan': expect(r).toEqual([]); break;
        default: throw new Error(`unknown kind ${a.kind}`);
      }
    }
  });

  it('days 1–5 follow the 12-step sequence and every day ends with its review', () => {
    for (const d of bootcampDays.slice(0, 5)) {
      const steps = d.activities.map((a) => a.step);
      expect(steps, `day ${d.day}`).toEqual([...steps].sort((x, y) => x - y));
      for (const s of [1, 2, 3, 7, 8, 10, 11, 12]) expect(steps, `day ${d.day} step ${s}`).toContain(s);
    }
    for (const d of bootcampDays) {
      const last = d.activities.at(-1)!;
      expect(last.kind, `day ${d.day}`).toBe(d.day === 6 ? 'review-plan' : 'day-review');
      expect(d.activities.some((a) => a.kind === 'review'), `day ${d.day} mistake review`).toBe(true);
    }
  });
});

describe('time and allocation', () => {
  const share = Object.fromEntries(studyAllocation.map((s) => [s.id, s.share]));
  const bounds: Record<string, [number, number]> = { dsa: [55, 75], oop: [5, 20], behavioral: [5, 15], resume: [2, 12], vocab: [2, 10] };

  it('each day stays within reasonable bounds of the 65/15/10/5/5 split (core + reinforcement)', () => {
    expect(share).toEqual({ dsa: 65, oop: 15, behavioral: 10, resume: 5, vocab: 5 });
    for (const d of bootcampDays) {
      const al = allocationMinutes(planned(d.activities));
      const total = Object.values(al).reduce((x, y) => x + y, 0);
      for (const [k, [lo, hi]] of Object.entries(bounds)) {
        const pct = (100 * al[k as keyof typeof al]) / total;
        expect(pct, `day ${d.day} ${k} ${pct.toFixed(1)}%`).toBeGreaterThanOrEqual(lo);
        expect(pct, `day ${d.day} ${k} ${pct.toFixed(1)}%`).toBeLessThanOrEqual(hi);
      }
    }
    // Across days 1–6 the split is close to the target.
    const all = allocationMinutes(planned(bootcampDays.slice(0, 6).flatMap((d) => d.activities)));
    const total = Object.values(all).reduce((x, y) => x + y, 0);
    expect(Math.abs((100 * all.dsa) / total - 65)).toBeLessThan(5);
    expect(Math.abs((100 * all.oop) / total - 15)).toBeLessThan(5);
  });

  it('full days are about 8 hours; the final day is clearly lighter and fits its budget', () => {
    for (const d of bootcampDays.slice(0, 5)) {
      const m = minutes(planned(d.activities));
      expect(m, `day ${d.day}`).toBeGreaterThanOrEqual(420);
      expect(m, `day ${d.day}`).toBeLessThanOrEqual(500);
    }
    expect(minutes(planned(bootcampDays[5].activities))).toBeLessThanOrEqual(500);
    const day7 = minutes(bootcampDays[6].activities);
    expect(day7).toBeLessThan(Math.min(...bootcampDays.slice(0, 5).map((d) => minutes(d.activities))) * 0.6);
    expect(day7).toBeLessThanOrEqual(budgetMinutes(7, 8));
  });
});

describe('curriculum content per day', () => {
  const problemIds = (n: number, tier?: string) => bootcampDays[n - 1].activities.filter((a) => a.kind === 'problem' && (!tier || a.tier === tier)).map((a) => Number(a.refs[0]));

  it("uses the requested priority problems as core work", () => {
    expect(problemIds(1, 'core')).toEqual([1, 13, 217, 242, 49, 344]);
    expect(problemIds(2, 'core')).toEqual([125, 283, 26, 167, 121, 3]);
    expect(problemIds(3, 'core')).toEqual(expect.arrayContaining([206, 21, 141, 237, 20, 232]));
    expect(problemIds(4, 'core')).toEqual([104, 226, 100, 98, 102]);
    expect(problemIds(5, 'core')).toEqual([78, 46, 704, 35, 268]);
    // Day 5 secondary topics are stretch only.
    expect(problemIds(5, 'stretch')).toEqual(expect.arrayContaining([733, 200, 70, 53]));
    expect(problemIds(6)).toEqual([]);
    expect(problemIds(7)).toEqual([]);
  });

  it('problem tiers agree with the catalog, and the catalog dates agree with the bootcamp day', () => {
    for (const d of bootcampDays) {
      for (const a of d.activities.filter((x) => x.kind === 'problem')) {
        const p = getProblem(Number(a.refs[0]))!;
        expect(a.tier === 'core', `${a.id} tier ${a.tier} vs wave ${p.wave}`).toBe(p.wave !== 'Stretch');
        if (p.date >= BOOTCAMP_START) expect(p.date, a.id).toBe(d.date); // earlier-dated ones are retention checks
      }
      for (const p of problems.filter((x) => x.date === d.date && x.wave !== 'Stretch')) {
        expect(problemIds(d.day, 'core'), `${p.id} dated ${d.date}`).toContain(p.id);
      }
    }
  });

  it("every problem's prerequisites are taught on or before its bootcamp day, ahead of it in the day", () => {
    for (const d of bootcampDays) {
      d.activities.forEach((a, i) => {
        if (a.kind !== 'problem') return;
        const taught = taughtBy(d.day, i);
        for (const k of getProblem(Number(a.refs[0]))!.prereqs) expect(taught.has(k), `${a.id} needs ${k}`).toBe(true);
      });
    }
  });

  it('OOP challenges come after their prerequisite lessons, and blind items after theirs', () => {
    for (const d of bootcampDays) {
      d.activities.forEach((a, i) => {
        const taught = taughtBy(d.day, i);
        if (a.kind === 'oop') for (const k of getOopChallenge(a.refs[0])!.prereqs) expect(taught.has(k), `${a.id} needs ${k}`).toBe(true);
        if (a.kind === 'blind') {
          for (const id of a.refs) {
            const b = getBlindItem(id)!;
            expect(b.unlock <= d.date, `${a.id}: ${id} unlocks ${b.unlock}`).toBe(true);
            expect(taught.has(b.answer.lessons[0]), `${a.id}: ${id} needs ${b.answer.lessons[0]}`).toBe(true);
          }
        }
      });
    }
  });

  it("blind candidates never repeat that day's LeetCode problems and the default picks are all different", () => {
    for (const d of bootcampDays) {
      const ids = new Set(problemIds(d.day));
      for (const a of d.activities.filter((x) => x.kind === 'blind')) {
        for (const id of a.refs) {
          const p = getBlindItem(id)!.answer.problem;
          if (p) expect(ids.has(p), `${a.id}: ${id} is LC ${p}, assigned the same day`).toBe(false);
        }
      }
    }
    const picks = blindPicks(emptyProgress());
    const served = Object.values(picks).map((p) => p.id);
    expect(new Set(served).size).toBe(served.length);
    expect(Object.values(picks).every((p) => !p.reattempt)).toBe(true);
    expect(picks['d1-blind-unseen'].id).toBe('first-solo');
    expect(picks['d2-blind-unseen'].id).toBe('sensor-repeat');
    expect(picks['d4-blind-unseen'].id).toBe('trail-total');
  });

  it('Day 4 teaches recursion with visual call-stack traces', () => {
    const d4 = bootcampDays[3].activities;
    const callStack = getLesson('recursion/call-stack')!.lesson;
    expect(callStack.visual?.kind).toBe('stack');
    expect(callStack.visual!.kind === 'stack' && callStack.visual!.steps.length).toBeGreaterThanOrEqual(12);
    expect(d4.filter((a) => a.kind === 'lesson').map((a) => a.refs[0])).toEqual(expect.arrayContaining(['recursion/basics', 'recursion/call-stack', 'big-o/recursion-space', 'trees/dfs', 'trees/bfs']));
    expect(d4.some((a) => a.kind === 'visual' && a.refs[0] === 'recursion/call-stack' && a.tier === 'core')).toBe(true);
    expect(d4.some((a) => a.kind === 'project' && a.refs[0] === 'road-report' && a.tier === 'core')).toBe(true);
  });

  it('Day 6 is two simulated rounds with no new lessons; Day 7 has only recaps', () => {
    const d6 = bootcampDays[5].activities;
    for (const round of ['Round 1', 'Round 2']) {
      const kinds = new Set(d6.filter((a) => a.group === round).map((a) => a.kind));
      for (const k of ['blind', 'reading', 'drill', 'behavioral', 'product'] as const) expect(kinds.has(k), `${round} ${k}`).toBe(true);
    }
    expect(d6.some((a) => a.group === 'Round 2' && a.kind === 'oop')).toBe(true);
    expect(d6.some((a) => a.kind === 'lesson')).toBe(false);
    // Coding titles on Day 6 never reveal pattern, difficulty or source.
    for (const a of d6.filter((x) => x.kind === 'blind')) expect(a.title).toMatch(/^(Round \d · Coding question \d|Extra coding question( \(stretch\))?)$/);
    for (const a of bootcampDays[6].activities.filter((x) => x.kind === 'lesson')) expect(a.recap, a.id).toBe(true);
  });

  it('the schedule for Nov 25 – Dec 1 lists exactly the lessons the bootcamp teaches for the first time', () => {
    const seen = new Set(studiedBefore);
    for (const d of bootcampDays) {
      const fresh = [...new Set(d.activities.filter((a) => a.kind === 'lesson' && !a.recap && !seen.has(a.refs[0])).map((a) => a.refs[0]))];
      expect(schedule.find((s) => s.date === d.date)!.lessons, d.date).toEqual(fresh);
      for (const k of fresh) seen.add(k);
    }
    // ...and together with Nov 21–24 that covers every Phase 1 and Phase 2 lesson.
    for (const l of allLessons.filter((x) => lessonPhase(x) < 3)) expect(seen.has(l.key), l.key).toBe(true);
  });
});
