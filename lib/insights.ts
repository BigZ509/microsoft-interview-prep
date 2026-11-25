/** Wires content into the pure progress functions (weak areas, review queues). */
import { modules, allLessons } from '@/content/modules';
import { problems } from '@/content/problems';
import { drills } from '@/content/drills';
import { scenarios, patternLessons } from '@/content/patterns';
import { blindItems } from '@/content/blind';
import { oopChallenges } from '@/content/oop-challenges';
import { codeReadings } from '@/content/code-reading';
import { conceptReviewQueue, practiceReviewQueue, problemReviewQueue, weakAreas, type Progress } from './progress';

const moduleTitles = Object.fromEntries(modules.map((m) => [m.id, m.title]));
const drillModules = Object.fromEntries(drills.map((d) => [d.id, d.module]));
const patternModules = Object.fromEntries(scenarios.map((s) => [s.id, patternLessons[s.best[0]].split('/')[0]]));
const lessonKeys = allLessons.map((l) => l.key);
const practiceModules: Record<string, string> = {
  ...Object.fromEntries(blindItems.map((b) => [`blind:${b.id}`, b.answer.lessons[0].split('/')[0]])),
  ...Object.fromEntries(oopChallenges.map((c) => [`oop:${c.id}`, 'oop'])),
};

export function weakAreasFor(progress: Progress) {
  return weakAreas(progress, { problems, moduleTitles, drillModules, patternModules, practiceModules });
}

export function reviewQueuesFor(progress: Progress, today: string) {
  return {
    problems: problemReviewQueue(progress, problems, today),
    concepts: conceptReviewQueue(progress, lessonKeys),
    practice: practiceReviewQueue(progress, today),
  };
}

/** Display info for a practice key. Blind items show their codename only (never the pattern) until opened. */
export function practiceInfo(key: string): { kind: string; title: string; href: string } | null {
  const [kind, id] = key.split(':');
  if (kind === 'blind') {
    const b = blindItems.find((x) => x.id === id);
    return b ? { kind: 'Blind assessment', title: b.codename, href: `/blind/${b.id}` } : null;
  }
  if (kind === 'oop') {
    const c = oopChallenges.find((x) => x.id === id);
    return c ? { kind: 'OOP challenge', title: c.title, href: `/oop/${c.id}` } : null;
  }
  if (kind === 'read') {
    const r = codeReadings.find((x) => x.id === id);
    return r ? { kind: 'Code reading', title: r.title, href: `/code-reading#${r.id}` } : null;
  }
  if (kind === 'problem') {
    const p = problems.find((x) => String(x.id) === id);
    return p ? { kind: 'LeetCode notes', title: `${p.id}. ${p.title}`, href: `/tracker/${p.id}` } : null;
  }
  return null;
}
