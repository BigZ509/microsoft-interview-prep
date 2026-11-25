import { describe, expect, it } from 'vitest';
import { allLessons, getLesson, modules } from '@/content/modules';
import { glossary, getTerm } from '@/content/glossary';
import { problems, getProblem, leetCodeUrl } from '@/content/problems';
import { drills, getDrill } from '@/content/drills';
import { scenarios, decoderProblems, patternLessons } from '@/content/patterns';
import { schedule, PLAN_START, INTERVIEW_DATE } from '@/content/schedule';
import { mockProblems, mockSteps } from '@/content/mocks';
import type { Check } from '@/content/types';

function validCheck(check: Check) {
  expect(check.options.length).toBeGreaterThanOrEqual(2);
  expect(Number.isInteger(check.answer)).toBe(true);
  expect(check.answer).toBeGreaterThanOrEqual(0);
  expect(check.answer).toBeLessThan(check.options.length);
  expect(new Set(check.options).size).toBe(check.options.length);
  expect(check.explain.length).toBeGreaterThan(10);
}

describe('curriculum', () => {
  it('has all 15 modules in order with unique IDs (13 original + problem solving + OOP)', () => {
    expect(modules.map((m) => m.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect(modules.slice(-2).map((m) => m.id)).toEqual(['solving', 'oop']);
    expect(new Set(modules.map((m) => m.id)).size).toBe(modules.length);
  });

  it('module prerequisites reference earlier, existing modules', () => {
    for (const mod of modules) {
      for (const pre of mod.prerequisites) {
        const target = modules.find((m) => m.id === pre);
        expect(target, `${mod.id} → ${pre}`).toBeDefined();
        expect(target!.number).toBeLessThan(mod.number);
      }
    }
  });

  it('every lesson has every teaching section populated', () => {
    for (const { key, lesson } of allLessons) {
      expect(lesson.what.length, key).toBeGreaterThan(80);
      expect(lesson.why.length, key).toBeGreaterThan(40);
      expect(lesson.how.length, key).toBeGreaterThanOrEqual(3);
      expect(lesson.code.trim().length, key).toBeGreaterThan(50);
      expect(lesson.codeNotes.length, key).toBeGreaterThanOrEqual(1);
      expect(lesson.complexity.derivation.length, key).toBeGreaterThanOrEqual(2);
      expect(lesson.whenToUse.length, key).toBeGreaterThanOrEqual(2);
      expect(lesson.mistakes.length, key).toBeGreaterThanOrEqual(2);
      expect(lesson.checks.length, key).toBeGreaterThanOrEqual(2);
      expect(lesson.problems.length, key).toBeGreaterThanOrEqual(1);
      expect(lesson.verbal.length, key).toBeGreaterThan(20);
      lesson.checks.forEach(validCheck);
    }
  });

  it('P0 modules have multiple lessons and at least 3 knowledge checks', () => {
    for (const mod of modules.filter((m) => m.priority === 'P0')) {
      expect(mod.lessons.length, mod.id).toBeGreaterThanOrEqual(2);
      const checks = mod.lessons.reduce((sum, l) => sum + l.checks.length, 0);
      expect(checks, mod.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('lesson IDs are unique and cross-references resolve', () => {
    const keys = allLessons.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const { key, lesson } of allLessons) {
      for (const id of lesson.problems) expect(getProblem(id), `${key} → problem ${id}`).toBeDefined();
      for (const id of lesson.terms) expect(getTerm(id), `${key} → term ${id}`).toBeDefined();
    }
  });

  it('visualizations have steps and valid indices', () => {
    for (const { key, lesson } of allLessons) {
      const v = lesson.visual;
      if (!v || v.kind === 'growth') continue;
      expect(v.steps.length, key).toBeGreaterThan(0);
      if (v.kind === 'array') {
        for (const s of v.steps) {
          for (const i of Object.values(s.pointers ?? {})) expect(i < s.cells.length, key).toBe(true);
          for (const i of s.highlight ?? []) expect(i < s.cells.length, key).toBe(true);
        }
      }
      if (v.kind === 'list') {
        for (const s of v.steps) {
          expect(s.next.length, key).toBe(s.nodes.length);
          for (const n of s.next) if (n !== null) expect(n < s.nodes.length, key).toBe(true);
          for (const p of Object.values(s.pointers)) if (p !== null) expect(p < s.nodes.length, key).toBe(true);
        }
      }
      if (v.kind === 'tree') {
        const ids = new Set<string>();
        const walk = (n: typeof v.root) => { ids.add(n.id); n.children?.forEach(walk); };
        walk(v.root);
        for (const s of v.steps) for (const id of [...s.active, ...(s.done ?? [])]) expect(ids.has(id), `${key}: ${id}`).toBe(true);
      }
    }
  });
});

describe('interview dictionary', () => {
  const required = [
    // Counting and arrangements
    'permutation', 'combination', 'subset', 'subsequence', 'frequency', 'occurrence', 'distinct', 'unique', 'duplicate', 'repeated', 'anagram', 'factorial', 'lexicographical-order', 'canonical-key', 'multiset',
    // Arrays and sequences
    'contiguous', 'subarray', 'substring', 'prefix', 'suffix', 'adjacent', 'consecutive', 'increasing', 'decreasing', 'sorted', 'rotated', 'monotonic', 'strictly-increasing', 'non-decreasing', 'in-place', 'stable-ordering',
    // Searching and optimization
    'maximum', 'minimum', 'optimal', 'brute-force', 'greedy', 'threshold', 'target', 'constraint', 'binary-search', 'lower-bound', 'upper-bound', 'nearest', 'range', 'kth-largest', 'top-k',
    // Data structures
    'hashing', 'collision', 'bucket', 'key-value-pair', 'set', 'stack', 'queue', 'heap', 'priority-queue', 'node', 'pointer', 'reference', 'cycle', 'traversal', 'parent', 'child', 'leaf', 'depth', 'height',
    // Recursion and graphs
    'recursion', 'backtracking', 'dfs', 'bfs', 'directed-graph', 'undirected-graph', 'connected-component', 'path', 'shortest-path', 'visited', 'base-case', 'memoization', 'state', 'transition',
    // Complexity and implementation
    'time-complexity', 'space-complexity', 'auxiliary-space', 'amortized', 'trade-off', 'invariant', 'edge-case', 'off-by-one', 'mutable', 'immutable', 'hashable', 'shallow-copy', 'deep-copy',
  ];

  it('decision guidance has no orphan entries', async () => {
    const { decideByTerm } = await import('@/content/glossary-decide');
    for (const id of Object.keys(decideByTerm)) expect(getTerm(id), id).toBeDefined();
  });

  it('contains every vocabulary term requested', () => {
    for (const id of required) expect(getTerm(id), id).toBeDefined();
  });

  it('has unique IDs and complete entries with valid references', () => {
    expect(new Set(glossary.map((t) => t.id)).size).toBe(glossary.length);
    for (const term of glossary) {
      expect(term.definition.length, term.id).toBeGreaterThan(20);
      expect(term.example.length, term.id).toBeGreaterThan(5);
      expect(term.implies.length, term.id).toBeGreaterThan(10);
      expect(term.decide.length, `${term.id} needs "check before choosing" guidance`).toBeGreaterThan(40);
      expect(term.approaches.length, term.id).toBeGreaterThan(0);
      expect(term.misconception.length, term.id).toBeGreaterThan(10);
      expect(term.structures.length, term.id).toBeGreaterThan(0);
      expect(getProblem(term.problem), `${term.id} → ${term.problem}`).toBeDefined();
      expect(term.lessons.length, term.id).toBeGreaterThan(0);
      for (const key of term.lessons) expect(getLesson(key), `${term.id} → ${key}`).toBeDefined();
      validCheck(term.check);
    }
  });
});

describe('LeetCode catalog', () => {
  const firstWave = [49, 242, 46, 1, 217, 169, 206, 21, 141, 167, 88, 232, 933, 20, 155, 56, 53, 3];
  const supporting = [121, 14, 1768, 1200, 704, 35, 733, 104, 100, 98, 78, 70, 560, 200, 994, 215, 207];

  const planProblems = problems.filter((p) => p.origin !== 'colorstack');
  const demoted = [933, 200]; // made optional by the Nov 25 scope correction (secondary topic / niche)

  it('imports exactly the problems from the study plan, deduplicated', () => {
    const ids = planProblems.map((p) => p.id).sort((a, b) => a - b);
    expect(ids).toEqual([...firstWave, ...supporting].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(35);
    expect(new Set(problems.map((p) => p.id)).size).toBe(problems.length);
  });

  it('preserves first-wave / supporting / P1 priorities, except documented demotions', () => {
    for (const id of firstWave.filter((x) => !demoted.includes(x))) expect(getProblem(id)!.wave, String(id)).toBe('First wave');
    for (const id of [994, 215, 207]) {
      expect(getProblem(id)!.priority).toBe('P1');
      expect(getProblem(id)!.wave).toBe('Stretch');
    }
    for (const id of supporting.filter((id) => ![994, 215, 207, ...demoted].includes(id))) expect(getProblem(id)!.wave, String(id)).toBe('Supporting');
    for (const id of demoted) {
      const p = getProblem(id)!;
      expect([p.wave, p.priority], String(id)).toEqual(['Stretch', 'P1']);
      expect(p.demoted!.length, String(id)).toBeGreaterThan(40);
    }
    expect(problems.filter((p) => p.demoted).map((p) => p.id).sort((a, b) => a - b)).toEqual([200, 933]);
  });

  it('ColorStack additions carry evidence, and hard / advanced ones are optional', () => {
    const added = problems.filter((p) => p.origin === 'colorstack');
    expect(added).toHaveLength(20);
    for (const p of added) {
      expect(p.evidence?.length, String(p.id)).toBeGreaterThan(0);
      if (p.difficulty === 'Hard') expect(p.wave, String(p.id)).toBe('Stretch');
      if (p.wave !== 'Stretch') expect(p.priority, String(p.id)).toBe('P0');
    }
    // Every ColorStack-reported LeetCode question is in the catalog and is core (not optional).
    for (const id of [13, 1, 167, 21, 203]) {
      const p = getProblem(id)!;
      expect(p.evidence, String(id)).toContain('colorstack-reported');
      expect(p.wave, String(id)).not.toBe('Stretch');
    }
    // Historical reports that map to LeetCode problems.
    for (const id of [344, 226, 268, 1344, 83]) expect(getProblem(id)!.evidence, String(id)).toContain('github-historical');
  });

  it('uses exact names and difficulties from the plan', () => {
    const expected: Record<number, [string, string]> = {
      49: ['Group Anagrams', 'Medium'], 242: ['Valid Anagram', 'Easy'], 46: ['Permutations', 'Medium'], 1: ['Two Sum', 'Easy'],
      167: ['Two Sum II – Input Array Is Sorted', 'Medium'], 3: ['Longest Substring Without Repeating Characters', 'Medium'],
      232: ['Implement Queue using Stacks', 'Easy'], 933: ['Number of Recent Calls', 'Easy'], 155: ['Min Stack', 'Medium'],
      1768: ['Merge Strings Alternately', 'Easy'], 1200: ['Minimum Absolute Difference', 'Easy'], 98: ['Validate Binary Search Tree', 'Medium'],
    };
    for (const [id, [title, difficulty]] of Object.entries(expected)) {
      const p = getProblem(Number(id))!;
      expect(p.title).toBe(title);
      expect(p.difficulty).toBe(difficulty);
    }
  });

  it('has well-formed official LeetCode URLs', () => {
    for (const p of problems) {
      expect(leetCodeUrl(p)).toMatch(/^https:\/\/leetcode\.com\/problems\/[a-z0-9]+(-[a-z0-9]+)*\/$/);
    }
    expect(leetCodeUrl(getProblem(167)!)).toBe('https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/');
    expect(leetCodeUrl(getProblem(49)!)).toBe('https://leetcode.com/problems/group-anagrams/');
  });

  it('every problem has prerequisites that resolve, hints, and a date inside the plan', () => {
    for (const p of problems) {
      expect(p.prereqs.length, String(p.id)).toBeGreaterThan(0);
      for (const key of p.prereqs) expect(getLesson(key), `${p.id} → ${key}`).toBeDefined();
      for (const t of p.terms) expect(getTerm(t), `${p.id} → ${t}`).toBeDefined();
      expect(p.hints.length).toBeGreaterThanOrEqual(2);
      expect(p.date >= PLAN_START && p.date <= INTERVIEW_DATE, String(p.id)).toBe(true);
    }
  });

  it('every problem is reachable from at least one lesson', () => {
    const linked = new Set(allLessons.flatMap((l) => l.lesson.problems));
    for (const p of problems) expect(linked.has(p.id), String(p.id)).toBe(true);
  });
});

describe('study schedule', () => {
  it('covers every day from Nov 21 to Dec 2, 2026 once', () => {
    const dates = schedule.map((d) => d.date);
    expect(dates[0]).toBe('2026-11-21');
    expect(dates.at(-1)).toBe('2026-12-02');
    expect(dates.length).toBe(12);
    expect(new Set(dates).size).toBe(12);
  });

  it('daily target equals the first-wave + supporting problems assigned that day', () => {
    for (const day of schedule) {
      const assigned = problems.filter((p) => p.date === day.date && p.wave !== 'Stretch').length;
      expect(assigned, day.date).toBe(day.target);
    }
  });

  it('every referenced lesson, term, drill and pattern exists', () => {
    for (const day of schedule) {
      for (const k of day.lessons) expect(getLesson(k), `${day.date} → ${k}`).toBeDefined();
      for (const t of day.terms) expect(getTerm(t), `${day.date} → ${t}`).toBeDefined();
      for (const d of day.drills) expect(getDrill(d), `${day.date} → ${d}`).toBeDefined();
      for (const s of day.patterns) expect(scenarios.some((x) => x.id === s), `${day.date} → ${s}`).toBe(true);
    }
  });
});

describe('Big-O lab', () => {
  it('has at least 20 original drills with unique IDs', () => {
    expect(drills.length).toBeGreaterThanOrEqual(20);
    expect(new Set(drills.map((d) => d.id)).size).toBe(drills.length);
  });

  it('every answer is one of its options and derivations are present', () => {
    for (const d of drills) {
      expect(d.timeOptions, d.id).toContain(d.time);
      expect(d.spaceOptions, d.id).toContain(d.space);
      expect(new Set(d.timeOptions).size, d.id).toBe(d.timeOptions.length);
      expect(d.dominant).toBeLessThan(d.dominantOptions.length);
      expect(d.derivation.length, d.id).toBeGreaterThanOrEqual(2);
      expect(d.derivation.join(' '), d.id).toContain(d.time.replace(' — a = alphabet size', ''));
      if (d.problem) expect(getProblem(d.problem), d.id).toBeDefined();
    }
  });

  it('includes nested loops that are linear because of amortized pointer movement', () => {
    const nestedLinear = drills.filter((d) => d.tags.includes('nested but linear'));
    expect(nestedLinear.length).toBeGreaterThanOrEqual(2);
    for (const d of nestedLinear) expect(d.time).toBe('O(n)');
  });

  it('encodes key complexity facts from the plan correctly', () => {
    expect(getDrill('group-anagrams-count')!.time).toBe('O(n · k)');
    expect(getDrill('group-anagrams-sorted')!.time).toBe('O(n · k log k)');
    expect(getDrill('permutations-enum')!.time).toBe('O(n · n!)');
    expect(getDrill('pop-front')!.time).toBe('O(n²)');
    expect(getDrill('sequential-loops')!.time).toBe('O(n + m)');
    expect(getDrill('fib-naive')!.space).toBe('O(n)');
    expect(getDrill('factorial-recursion')!.space).toBe('O(n)');
    expect(getDrill('tree-dfs')!.time).toBe('O(n)');
    expect(getDrill('sorting-then-scan')!.time).toBe('O(n log n)');
  });
});

describe('pattern recognition and decoder', () => {
  it('scenarios have options containing the best answers and explanations', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(15);
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length);
    for (const s of scenarios) {
      for (const b of s.best) expect(s.options, s.id).toContain(b);
      expect(s.clues.length).toBeGreaterThan(0);
      expect(s.why.length).toBeGreaterThan(20);
      expect(s.badFit.length).toBeGreaterThan(10);
      if (s.problem) expect(getProblem(s.problem)).toBeDefined();
      for (const o of s.options) expect(getLesson(patternLessons[o]), o).toBeDefined();
    }
  });

  it('decoder problems have valid answer indices and key terms that appear in the statement', () => {
    for (const d of decoderProblems) {
      expect(d.structure).toBeLessThan(d.structureOptions.length);
      expect(d.pattern).toBeLessThan(d.patternOptions.length);
      expect(d.time).toBeLessThan(d.timeOptions.length);
      for (const k of d.keyTerms) {
        expect(d.statement.toLowerCase(), `${d.id}: ${k.text}`).toContain(k.text.toLowerCase());
        if (k.term) expect(getTerm(k.term), k.term).toBeDefined();
      }
    }
  });

  it('labels the digit-grouping exercise as a candidate-reported reconstruction', () => {
    const decoder = decoderProblems.find((d) => d.id === 'decode-digit-groups')!;
    expect(decoder.label).toMatch(/candidate-reported/i);
    expect(decoder.label).toMatch(/not an official/i);
    const mock = mockProblems.find((m) => m.id === 'digit-buckets')!;
    expect(mock.label).toMatch(/candidate-reported/i);
    expect(mock.label).toMatch(/not an official/i);
  });

  it('mock problems provide talking points for every step', () => {
    for (const m of mockProblems) {
      for (const step of mockSteps) expect(m.points[step.id]?.length, `${m.id}: ${step.id}`).toBeGreaterThan(0);
      if (m.leetcode) expect(getProblem(m.leetcode)).toBeDefined();
    }
  });
});
