import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { problems, getProblem } from '@/content/problems';
import { schedule } from '@/content/schedule';
import { allLessons, getLesson, lessonPhase, modules } from '@/content/modules';
import { BLIND_APPROACHES, blindItems } from '@/content/blind';
import { getOopChallenge, oopChallenges } from '@/content/oop-challenges';
import { codeReadings, getCodeReading } from '@/content/code-reading';
import { behavioralPrompts, productPrompts, storySlots } from '@/content/mocks';
import { getProject, projects } from '@/content/projects';
import { bootcampDayByDate } from '@/content/bootcamp';

/** First date on which a lesson appears in the schedule, or undefined. */
function lessonDate(key: string): string | undefined {
  return schedule.find((d) => d.lessons.includes(key))?.date;
}

/**
 * Lessons studied on a date: the schedule's new lessons plus, on bootcamp days, the recaps the
 * bootcamp schedules that day (recaps are not re-listed in the schedule, which keeps each lesson once).
 */
function lessonsStudiedOn(date: string): string[] {
  const day = schedule.find((d) => d.date === date)!;
  const recaps = bootcampDayByDate(date)?.activities.filter((a) => a.kind === 'lesson').map((a) => a.refs[0]) ?? [];
  return [...day.lessons, ...recaps];
}

describe('catalog matches the source study-plan file exactly', () => {
  const src = readFileSync('microsoft_explore_study_guide_agent_prompt.md', 'utf8');
  const firstBlock = src.split('**P0 first-wave (~18)**')[1].split('**Add supporting problems**')[0];
  const suppBlock = src.split('**Add supporting problems**')[1].split('**Original mock task**')[0];
  const parse = (block: string, re: RegExp) => [...block.matchAll(re)].map((m) => ({ id: Number(m[1]), title: m[2].trim(), diff: m[3] }));
  const first = parse(firstBlock, /- (\d+) (.+?) \(([EMH])\)/g);
  const supp = parse(suppBlock, /(\d+) ([^;()]+?) \(([EMH])\)/g);
  const norm = (s: string) => s.replace(/[–—]/g, '-').toLowerCase();
  const D = { E: 'Easy', M: 'Medium', H: 'Hard' } as const;

  it('has 18 first-wave and 17 supporting plan problems; everything else is a labeled ColorStack or bootcamp addition', () => {
    expect(first).toHaveLength(18);
    expect(supp).toHaveLength(17);
    const plan = problems.filter((p) => p.origin !== 'colorstack' && p.origin !== 'bootcamp');
    expect(plan.map((p) => p.id).sort((a, b) => a - b)).toEqual([...first, ...supp].map((p) => p.id).sort((a, b) => a - b));
    for (const p of problems.filter((x) => x.origin === 'colorstack')) expect(p.evidence?.length, String(p.id)).toBeGreaterThan(0);
    // Learner-requested bootcamp additions are not interview evidence and must not claim any.
    const bootcamp = problems.filter((x) => x.origin === 'bootcamp');
    expect(bootcamp.map((p) => p.id)).toEqual([102]);
    for (const p of bootcamp) expect(p.evidence, String(p.id)).toBeUndefined();
  });

  it('titles, difficulties and priority tiers match', () => {
    const finalThree = supp.slice(-3).map((p) => p.id);
    expect(finalThree).toEqual([994, 215, 207]); // "Tag final three as P1"
    // A plan problem may only leave its tier through a documented demotion (Nov 25 scope correction).
    const tier = (id: number, wave: string, priority: string) => (getProblem(id)!.demoted ? ['Stretch', 'P1'] : [wave, priority]);
    for (const s of first) {
      const p = getProblem(s.id)!;
      expect([norm(p.title), p.difficulty, p.wave, p.priority]).toEqual([norm(s.title), D[s.diff as keyof typeof D], ...tier(s.id, 'First wave', 'P0')]);
    }
    for (const s of supp) {
      const p = getProblem(s.id)!;
      const stretch = finalThree.includes(s.id);
      expect([norm(p.title), p.difficulty, p.wave, p.priority]).toEqual([norm(s.title), D[s.diff as keyof typeof D], ...tier(s.id, stretch ? 'Stretch' : 'Supporting', stretch ? 'P1' : 'P0')]);
    }
  });
});

describe('daily assignments are teachable in order', () => {
  it('every prerequisite lesson is scheduled on or before the problem date', () => {
    for (const p of problems) {
      for (const key of p.prereqs) {
        const d = lessonDate(key);
        expect(d, `${p.id} → ${key} is never scheduled`).toBeDefined();
        expect(d! <= p.date, `${p.id} (${p.date}) needs ${key} (${d})`).toBe(true);
      }
    }
  });

  it("each problem matches its day's concepts (a prerequisite or its primary module is studied that day)", () => {
    for (const p of problems) {
      const studied = lessonsStudiedOn(p.date);
      const primary = p.prereqs[0].split('/')[0];
      const sameDayPrereq = p.prereqs.some((k) => studied.includes(k));
      const primaryTaught = studied.some((k) => k.startsWith(`${primary}/`));
      expect(sameDayPrereq || primaryTaught, `${p.id} (${primary}) on ${p.date}`).toBe(true);
    }
  });

  it('days already studied (Nov 21–24) keep their original problems', () => {
    const past: Record<string, number[]> = {
      '2026-11-21': [1, 49, 242], '2026-11-22': [14, 121, 169, 217, 1768], '2026-11-23': [88, 167, 1200], '2026-11-24': [21, 141, 206],
    };
    for (const [date, ids] of Object.entries(past)) {
      expect(problems.filter((p) => p.date === date).map((p) => p.id).sort((a, b) => a - b), date).toEqual(ids);
    }
  });

  it('most problems are taught by a lesson (or a bootcamp recap) on the same day', () => {
    const same = problems.filter((p) => p.prereqs.some((k) => lessonsStudiedOn(p.date).includes(k)));
    expect(problems.length - same.length).toBeLessThanOrEqual(1);
  });

  it('every Phase 1 and Phase 2 lesson is scheduled exactly once', () => {
    for (const ref of allLessons.filter((l) => lessonPhase(l) < 3)) {
      const count = schedule.filter((d) => d.lessons.includes(ref.key)).length;
      expect(count, ref.key).toBe(1);
    }
  });

  it("a module's prerequisite modules start no later than the module itself", () => {
    const first = (moduleId: string) => schedule.find((d) => d.lessons.some((k) => k.startsWith(`${moduleId}/`)))?.date;
    for (const m of modules) {
      const start = first(m.id);
      if (!start) continue;
      for (const pre of m.prerequisites) expect(first(pre)! <= start, `${m.id} (${start}) needs ${pre} (${first(pre)})`).toBe(true);
    }
  });

  it('within a day, lessons follow module order where they depend on each other', () => {
    for (const day of schedule) {
      const idx = (k: string) => day.lessons.indexOf(k);
      if (idx('recursion/basics') >= 0 && idx('recursion/backtracking') >= 0) expect(idx('recursion/basics')).toBeLessThan(idx('recursion/backtracking'));
      if (idx('trees/terminology') >= 0 && idx('trees/dfs') >= 0) expect(idx('trees/terminology')).toBeLessThan(idx('trees/dfs'));
    }
  });

  it('every lesson referenced exists', () => {
    for (const d of schedule) for (const k of d.lessons) expect(getLesson(k), k).toBeDefined();
  });
});

describe('scope correction (Nov 25): practice content is wired correctly', () => {
  const lessonDate = (key: string) => schedule.find((d) => d.lessons.includes(key))?.date;

  it('every day-practice reference resolves', () => {
    for (const d of schedule) {
      const pr = d.practice;
      if (!pr) continue;
      if (pr.oop) expect(getOopChallenge(pr.oop), `${d.date} oop`).toBeDefined();
      for (const r of pr.reading ?? []) expect(getCodeReading(r), `${d.date} ${r}`).toBeDefined();
      for (const b of pr.behavioral ?? []) expect(behavioralPrompts.some((x) => x.id === b), `${d.date} ${b}`).toBe(true);
      if (pr.product) expect(productPrompts.some((x) => x.id === pr.product), `${d.date} product`).toBe(true);
      if (pr.project) expect(getProject(pr.project), `${d.date} project`).toBeDefined();
    }
  });

  it('an OOP challenge is assigned only after its prerequisite lessons are scheduled', () => {
    for (const d of schedule) {
      const c = d.practice?.oop ? getOopChallenge(d.practice.oop)! : undefined;
      if (!c) continue;
      for (const k of c.prereqs) {
        expect(getLesson(k), k).toBeDefined();
        expect(lessonDate(k)! <= d.date, `${c.id} on ${d.date} needs ${k} (${lessonDate(k)})`).toBe(true);
      }
    }
  });

  it('OOP challenges are progressive and end with the reported Canva question', () => {
    expect(oopChallenges.map((c) => c.order)).toEqual([1, 2, 3, 4, 5]);
    expect(oopChallenges.map((c) => c.id)).toEqual(['phone-book', 'bank-account', 'library', 'parking-lot', 'canva']);
    const canva = getOopChallenge('canva')!;
    expect(canva.evidence).toBe('colorstack-reported');
    expect(canva.requirements).toHaveLength(10);        // the ten visible requirements from the source
    expect(canva.inferred.length).toBeGreaterThan(3);   // everything else is labeled as inferred
    // Canva is assigned on a day at or after every OOP lesson. The bootcamp teaches oop/copying earlier the
    // same day (tests/bootcamp.test.ts checks that a challenge comes after its lessons within a day).
    const canvaDay = schedule.find((d) => d.practice?.oop === 'canva')!.date;
    for (const k of ['oop/classes-objects', 'oop/inheritance-composition', 'oop/references-collections', 'oop/copying']) expect(lessonDate(k)! <= canvaDay, k).toBe(true);
  });

  it('blind assessments never name their pattern and only unlock after their lessons', () => {
    const giveaways = /\b(hash|dict|dictionary|set\b|two[- ]pointers?|sliding window|stack|queue|heap|binary search|prefix|backtrack|recurs|dynamic programming|easy|medium|hard|leetcode)/i;
    const ids = new Set<string>();
    for (const b of blindItems) {
      expect(ids.has(b.id), b.id).toBe(false);
      ids.add(b.id);
      expect(giveaways.test(b.statement), `${b.id} statement`).toBe(false);
      expect(giveaways.test(b.codename), `${b.id} codename`).toBe(false);
      expect((BLIND_APPROACHES as readonly string[]).includes(b.answer.structure), b.id).toBe(true);
      expect(b.hints.length, b.id).toBeGreaterThanOrEqual(2);
      expect(b.answer.signals.length, b.id).toBeGreaterThanOrEqual(2);
      expect(b.answer.edgeCases.length, b.id).toBeGreaterThanOrEqual(2);
      if (b.answer.problem) expect(getProblem(b.answer.problem), b.id).toBeDefined();
      for (const k of b.answer.lessons) expect(getLesson(k), `${b.id} → ${k}`).toBeDefined();
      // The primary lesson (first) must be taught by the unlock date; the others are "revisit" links.
      const primary = b.answer.lessons[0];
      expect(lessonDate(primary)! <= b.unlock, `${b.id} unlocks ${b.unlock} but ${primary} is taught ${lessonDate(primary)}`).toBe(true);
    }
    expect(blindItems.length).toBeGreaterThanOrEqual(14); // enough for 2 per day from Nov 25 to Dec 1
    // Every ColorStack-reported coding question has a blind version.
    const reportedProblems = blindItems.filter((b) => b.evidence === 'colorstack-reported').map((b) => b.answer.problem);
    for (const id of [1, 167, 13, 21, 203]) expect(reportedProblems, String(id)).toContain(id);
  });

  it('the two reported code-explanation questions exist', () => {
    const reported = codeReadings.filter((r) => r.evidence === 'colorstack-reported').map((r) => r.id);
    expect(reported.sort()).toEqual(['has-duplicates', 'sum-evens']);
    for (const r of codeReadings) expect(r.model.edgeCases.length, r.id).toBeGreaterThanOrEqual(3);
  });

  it('résumé prep covers exactly Road Report, SpeakLab AI and ZBXP (no Guiding Hands)', () => {
    expect(projects.map((p) => p.name)).toEqual(['Road Report', 'SpeakLab AI', 'ZBXP']);
    const text = JSON.stringify({ projects, storySlots, behavioralPrompts });
    expect(text).not.toMatch(/Guiding Hands/);
    for (const p of projects) {
      expect(p.facts.every((f) => f.source.length > 5), p.id).toBe(true);
      expect(p.diagram.length, p.id).toBeGreaterThanOrEqual(3);
      expect(p.followUps.length, p.id).toBeLessThanOrEqual(6); // deliberately limited
    }
  });

  it('every ColorStack-reported behavioral / product question is present', () => {
    expect(behavioralPrompts.filter((b) => b.source === 'colorstack-reported')).toHaveLength(12);
    expect(productPrompts.filter((b) => b.source === 'colorstack-reported')).toHaveLength(5);
    expect(productPrompts.filter((b) => b.source === 'github-historical')).toHaveLength(8);
    for (const b of behavioralPrompts) expect(storySlots.some((s) => s.id === b.slot), b.id).toBe(true);
  });
});
