/** Wires content into the pure progress functions (weak areas, review queues). */
import { modules, allLessons } from '@/content/modules';
import { problems } from '@/content/problems';
import { drills } from '@/content/drills';
import { scenarios, patternLessons } from '@/content/patterns';
import { conceptReviewQueue, problemReviewQueue, weakAreas, type Progress } from './progress';

const moduleTitles = Object.fromEntries(modules.map((m) => [m.id, m.title]));
const drillModules = Object.fromEntries(drills.map((d) => [d.id, d.module]));
const patternModules = Object.fromEntries(scenarios.map((s) => [s.id, patternLessons[s.best[0]].split('/')[0]]));
const lessonKeys = allLessons.map((l) => l.key);

export function weakAreasFor(progress: Progress) {
  return weakAreas(progress, { problems, moduleTitles, drillModules, patternModules });
}

export function reviewQueuesFor(progress: Progress, today: string) {
  return {
    problems: problemReviewQueue(progress, problems, today),
    concepts: conceptReviewQueue(progress, lessonKeys),
  };
}
