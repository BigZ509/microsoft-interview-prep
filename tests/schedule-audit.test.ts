import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { problems, getProblem } from '@/content/problems';
import { schedule } from '@/content/schedule';
import { allLessons, getLesson, lessonPhase, modules } from '@/content/modules';

/** First date on which a lesson appears in the schedule, or undefined. */
function lessonDate(key: string): string | undefined {
  return schedule.find((d) => d.lessons.includes(key))?.date;
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

  it('has 18 first-wave and 17 supporting problems, and nothing else', () => {
    expect(first).toHaveLength(18);
    expect(supp).toHaveLength(17);
    expect(problems.map((p) => p.id).sort((a, b) => a - b)).toEqual([...first, ...supp].map((p) => p.id).sort((a, b) => a - b));
  });

  it('titles, difficulties and priority tiers match', () => {
    const finalThree = supp.slice(-3).map((p) => p.id);
    expect(finalThree).toEqual([994, 215, 207]); // "Tag final three as P1"
    for (const s of first) {
      const p = getProblem(s.id)!;
      expect([norm(p.title), p.difficulty, p.wave, p.priority]).toEqual([norm(s.title), D[s.diff as keyof typeof D], 'First wave', 'P0']);
    }
    for (const s of supp) {
      const p = getProblem(s.id)!;
      const stretch = finalThree.includes(s.id);
      expect([norm(p.title), p.difficulty, p.wave, p.priority]).toEqual([norm(s.title), D[s.diff as keyof typeof D], stretch ? 'Stretch' : 'Supporting', stretch ? 'P1' : 'P0']);
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

  it("each problem matches its day's concepts (a prerequisite or its primary module is taught that day)", () => {
    for (const p of problems) {
      const day = schedule.find((d) => d.date === p.date)!;
      const primary = p.prereqs[0].split('/')[0];
      const sameDayPrereq = p.prereqs.some((k) => day.lessons.includes(k));
      const primaryTaught = day.lessons.some((k) => k.startsWith(`${primary}/`));
      expect(sameDayPrereq || primaryTaught, `${p.id} (${primary}) on ${p.date}`).toBe(true);
    }
  });

  it('most problems are taught by a lesson on the same day', () => {
    const same = problems.filter((p) => p.prereqs.some((k) => schedule.find((d) => d.date === p.date)!.lessons.includes(k)));
    expect(problems.length - same.length).toBeLessThanOrEqual(1); // LC 98 applies Nov 28 tree lessons on Nov 30
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
