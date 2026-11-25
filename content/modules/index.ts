import type { Lesson, Module } from '../types';
import { pythonModule } from './python';
import { bigOModule } from './big-o';
import { arraysModule } from './arrays';
import { hashingModule } from './hashing';
import { twoPointersModule } from './two-pointers';
import { slidingWindowModule } from './sliding-window';
import { linkedListsModule } from './linked-lists';
import { stacksQueuesModule } from './stacks-queues';
import { recursionModule } from './recursion';
import { searchSortModule } from './search-sort';
import { treesModule } from './trees';
import { graphsModule } from './graphs';
import { patternsModule } from './patterns';
import { solvingModule } from './solving';
import { oopModule } from './oop';

export const modules: Module[] = [
  pythonModule,
  bigOModule,
  arraysModule,
  hashingModule,
  twoPointersModule,
  slidingWindowModule,
  linkedListsModule,
  stacksQueuesModule,
  recursionModule,
  searchSortModule,
  treesModule,
  graphsModule,
  patternsModule,
  solvingModule,
  oopModule,
];

export type LessonRef = { module: Module; lesson: Lesson; key: string };

/** Lessons are addressed as "moduleId/lessonId". */
export function lessonKey(moduleId: string, lessonId: string): string {
  return `${moduleId}/${lessonId}`;
}

export const allLessons: LessonRef[] = modules.flatMap((module) =>
  module.lessons.map((lesson) => ({ module, lesson, key: lessonKey(module.id, lesson.id) })),
);

export function getModule(id: string): Module | undefined {
  return modules.find((module) => module.id === id);
}

export function getLesson(key: string): LessonRef | undefined {
  return allLessons.find((ref) => ref.key === key);
}

export function lessonPhase(ref: LessonRef): 1 | 2 | 3 {
  return ref.lesson.phase ?? ref.module.phase;
}
