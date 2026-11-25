import type { StudyDay } from './types';
import { bootcampDays, type BootcampDay } from './bootcamp';
import { getProblem } from './problems';

export const INTERVIEW_DATE = '2026-12-02';
export const PLAN_START = '2026-11-21';

/**
 * How active study time is split (scope correction, Nov 25 — sources/scope-priority-correction.md).
 * `minutes` assumes an 8-hour bootcamp day; the bootcamp tests check each day against `share`.
 */
export const studyAllocation = [
  { id: 'dsa', label: 'LeetCode, patterns, blind assessments, mistake review', share: 65, minutes: 312 },
  { id: 'oop', label: 'Python OOP and practical coding', share: 15, minutes: 72 },
  { id: 'behavioral', label: 'Behavioral and product design', share: 10, minutes: 48 },
  { id: 'resume', label: 'Résumé and project architecture', share: 5, minutes: 24 },
  { id: 'vocab', label: 'Vocabulary and code reading', share: 5, minutes: 24 },
] as const;

/** Blind assessments served per day (see lib/plan.ts blindForDay). */
export const BLIND_PER_DAY = 2;

/**
 * Nov 21–24: the plan's "Suggested study plan until Dec 2, 2026" as already studied, expanded with the lessons, vocabulary,
 * drills and pattern exercises that support each day. `target` equals the number of First-wave +
 * Supporting problems assigned that day in content/problems.ts (verified by tests).
 */
const studiedDays: StudyDay[] = [
  {
    date: '2026-11-21', theme: 'Big-O, Python operation costs, hashing review',
    focus: 'Big-O, Python operation costs, hashing review, Group Anagrams and the digit-grouping mock. You have already practiced today’s three problems, so read the hashing lessons at review speed and spend the time on explaining Big-O out loud.',
    lessons: ['big-o/growth', 'big-o/loops', 'big-o/python-costs', 'python/collections-module', 'hashing/how-hashing-works', 'hashing/frequency-maps', 'hashing/hashable-keys', 'arrays/frequency', 'hashing/canonical-keys'],
    terms: ['time-complexity', 'space-complexity', 'hashing', 'key-value-pair', 'anagram', 'canonical-key', 'multiset'],
    drills: ['sum-list', 'sequential-loops', 'all-pairs', 'group-anagrams-sorted', 'group-anagrams-count', 'digit-key'],
    patterns: ['pair-target-unsorted', 'same-chars-any-order', 'group-digit-perms'],
    target: 3,
    extras: ['Mock: Digit-permutation buckets (candidate-reported reconstruction)'],
  },
  {
    date: '2026-11-22', theme: 'Arrays, strings, and hash-set recognition',
    focus: 'Arrays/strings and hash-set recognition.',
    lessons: ['python/collections-basics', 'python/control-flow', 'big-o/notation', 'arrays/traversal', 'arrays/subarrays', 'arrays/strings'],
    terms: ['subarray', 'substring', 'subsequence', 'prefix', 'duplicate', 'distinct', 'set', 'minimum'],
    drills: ['list-membership', 'set-membership', 'string-concat', 'slice-in-loop'],
    patterns: ['find-duplicates', 'small-n-check'],
    target: 5,
    extras: [],
  },
  {
    date: '2026-11-23', theme: 'Two pointers and sorted arrays',
    focus: 'Two pointers and sorted-array problems.',
    lessons: ['python/functions-scope', 'python/builtins', 'two-pointers/opposite', 'two-pointers/same-direction', 'big-o/amortized'],
    terms: ['sorted', 'non-decreasing', 'in-place', 'pointer', 'invariant', 'adjacent'],
    drills: ['two-pointers-converge', 'sorting-then-scan', 'halving'],
    patterns: ['pair-target-sorted', 'pair-target-unsorted'],
    target: 3,
    extras: [],
  },
  {
    date: '2026-11-24', theme: 'Linked lists and pointer rewiring',
    focus: 'Linked lists and pointer rewiring.',
    lessons: ['python/variables-references', 'linked-lists/nodes', 'linked-lists/reverse', 'linked-lists/dummy-merge', 'two-pointers/fast-slow', 'linked-lists/cycle'],
    terms: ['node', 'pointer', 'reference', 'cycle', 'visited', 'edge-case'],
    drills: ['reverse-list-drill', 'fast-slow-drill'],
    patterns: ['list-cycle'],
    target: 3,
    extras: [],
  },
];

export const schedule: StudyDay[] = [
  ...studiedDays,
  // Nov 25 – Dec 1: derived from the seven-day bootcamp so the tracker and the bootcamp always agree.
  ...bootcampDays.map(studyDayFromBootcamp),
  {
    date: '2026-12-02', theme: 'Interview day',
    focus: 'Interview-day checklist and short warm-up only.',
    lessons: [],
    terms: [],
    drills: ['sum-list'],
    patterns: [],
    target: 0,
    extras: ['Warm-up: re-explain one solved problem out loud (Two Sum → sorted follow-up)', 'Checklist: quiet room, charger, water, Python editor, LeetCode logged in, STAR stories open'],
  },
];

export const interviewDayChecklist = [
  'Sleep and eat normally — no new topics today.',
  'Warm up for 15 minutes: explain Two Sum (and its sorted follow-up), Roman to Integer and Merge Two Sorted Lists out loud, including Big-O.',
  'Expect project questions: have the 60-second versions of Road Report, SpeakLab AI and ZBXP ready — and only claim what you can explain.',
  'Have your STAR(R) stories and project cards open for a quick skim.',
  'Test your mic, camera, and the interview link 15 minutes early.',
  'During the interview: clarify → characteristics → brute force → bottleneck → optimize → code → test → Big-O.',
  'If you get a hint or a correction, acknowledge it, restate it, and re-derive out loud — reported candidates recovered this way.',
  'It is fine to say "Let me think out loud for a moment."',
];

/**
 * A bootcamp day as a StudyDay. `lessons` lists only lessons taught for the first time that day
 * (recaps of earlier lessons live only in the bootcamp), so each Phase 1/2 lesson is scheduled once.
 */
function studyDayFromBootcamp(day: BootcampDay): StudyDay {
  const earlier = new Set(studiedDays.flatMap((d) => d.lessons));
  for (const d of bootcampDays) {
    if (d.day >= day.day) break;
    for (const a of d.activities) if (a.kind === 'lesson') earlier.add(a.refs[0]);
  }
  const of = (kind: string) => day.activities.filter((a) => a.kind === kind);
  const firstRef = (kind: string) => of(kind)[0]?.refs[0];
  return {
    date: day.date,
    theme: day.title,
    focus: day.focus,
    lessons: [...new Set(of('lesson').filter((a) => !a.recap && !earlier.has(a.refs[0])).map((a) => a.refs[0]))],
    terms: [...new Set(of('terms').flatMap((a) => a.refs))],
    drills: [...new Set(of('drill').map((a) => a.refs[0]))],
    patterns: [...new Set(of('patterns').flatMap((a) => a.refs))],
    target: of('problem').filter((a) => a.tier === 'core' && getProblem(Number(a.refs[0]))?.date === day.date).length,
    extras: [...of('decoder'), ...of('mock')].map((a) => a.title),
    practice: {
      oop: firstRef('oop'),
      reading: of('reading').map((a) => a.refs[0]),
      behavioral: of('behavioral').map((a) => a.refs[0]),
      product: firstRef('product'),
      project: firstRef('project'),
    },
  };
}
