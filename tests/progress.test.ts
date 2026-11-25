import { describe, expect, it } from 'vitest';
import { problems, getProblem } from '@/content/problems';
import { PLAN_START } from '@/content/schedule';
import {
  conceptReviewQueue, effectiveDate, emptyProgress, everCompleted, recoveredItems, independentDays, isMastered, normalizeProgress, parseProgress,
  problemRecord, problemReviewQueue, recordCheck, recordDrill, recordPattern, reviewDue, setLesson, setProblemStatus,
  trackStatus, updateProblemFields,
} from '@/lib/progress';
import { weakAreasFor } from '@/lib/insights';

describe('problem status tracking', () => {
  it('records status, last-attempted date and history', () => {
    let p = setProblemStatus(emptyProgress(), 49, 'attempted', '2026-11-21');
    p = setProblemStatus(p, 49, 'with-help', '2026-11-21');
    const rec = problemRecord(p, 49);
    expect(rec.status).toBe('with-help');
    expect(rec.lastAttempted).toBe('2026-11-21');
    expect(rec.history.map((h) => h.status)).toEqual(['attempted', 'with-help']);
  });

  it('resetting to Not Started keeps history and last attempt', () => {
    let p = setProblemStatus(emptyProgress(), 1, 'independent', '2026-11-21');
    p = setProblemStatus(p, 1, 'not-started', '2026-11-22');
    expect(problemRecord(p, 1).history).toHaveLength(1);
    expect(problemRecord(p, 1).lastAttempted).toBe('2026-11-21');
  });

  it('does not mutate the previous progress object', () => {
    const before = emptyProgress();
    setProblemStatus(before, 1, 'independent', '2026-11-21');
    expect(before.problems).toEqual({});
  });
});

describe('mastery is not a single completion', () => {
  it('one independent solve is not mastery', () => {
    const p = setProblemStatus(emptyProgress(), 1, 'independent', '2026-11-21');
    expect(isMastered(problemRecord(p, 1))).toBe(false);
  });

  it('two independent solves on the SAME day are not mastery', () => {
    let p = setProblemStatus(emptyProgress(), 1, 'independent', '2026-11-21');
    p = setProblemStatus(p, 1, 'independent', '2026-11-21');
    expect(independentDays(problemRecord(p, 1))).toBe(1);
    expect(isMastered(problemRecord(p, 1))).toBe(false);
  });

  it('independent solves on two different days are mastery', () => {
    let p = setProblemStatus(emptyProgress(), 1, 'independent', '2026-11-21');
    p = setProblemStatus(p, 1, 'independent', '2026-11-24');
    expect(isMastered(problemRecord(p, 1))).toBe(true);
  });

  it('a retry flag or a later Needs Review revokes mastery', () => {
    let p = setProblemStatus(emptyProgress(), 1, 'independent', '2026-11-21');
    p = setProblemStatus(p, 1, 'independent', '2026-11-24');
    expect(isMastered(problemRecord(updateProblemFields(p, 1, { retry: true }), 1))).toBe(false);
    expect(isMastered(problemRecord(setProblemStatus(p, 1, 'needs-review', '2026-11-25'), 1))).toBe(false);
  });

  it('solved-with-help never counts as independent', () => {
    let p = setProblemStatus(emptyProgress(), 49, 'with-help', '2026-11-21');
    p = setProblemStatus(p, 49, 'with-help', '2026-11-23');
    expect(independentDays(problemRecord(p, 49))).toBe(0);
    expect(isMastered(problemRecord(p, 49))).toBe(false);
  });
});

describe('review scheduling', () => {
  it('with help → due the next day; needs review → due immediately; independent once → 3 days', () => {
    const help = problemRecord(setProblemStatus(emptyProgress(), 1, 'with-help', '2026-11-21'), 1);
    expect(reviewDue(help)).toBe('2026-11-22');
    const nr = problemRecord(setProblemStatus(emptyProgress(), 1, 'needs-review', '2026-11-21'), 1);
    expect(reviewDue(nr)).toBe('2026-11-21');
    const ind = problemRecord(setProblemStatus(emptyProgress(), 1, 'independent', '2026-11-29'), 1);
    expect(reviewDue(ind)).toBe('2026-12-02');
  });

  it('crosses month boundaries correctly', () => {
    const rec = problemRecord(setProblemStatus(emptyProgress(), 1, 'with-help', '2026-11-30'), 1);
    expect(reviewDue(rec)).toBe('2026-12-01');
  });

  it('queue includes only due items, sorted by due date', () => {
    let p = setProblemStatus(emptyProgress(), 49, 'with-help', '2026-11-21'); // due 11-22
    p = setProblemStatus(p, 1, 'needs-review', '2026-11-21'); // due 11-21
    p = setProblemStatus(p, 242, 'independent', '2026-11-21'); // due 11-24
    expect(problemReviewQueue(p, problems, '2026-11-21').map((r) => r.id)).toEqual([1]);
    expect(problemReviewQueue(p, problems, '2026-11-22').map((r) => r.id)).toEqual([1, 49]);
    expect(problemReviewQueue(p, problems, '2026-11-24').map((r) => r.id)).toEqual([1, 49, 242]);
  });

  it('marking for another attempt puts a solved problem back in the queue today', () => {
    let p = setProblemStatus(emptyProgress(), 49, 'with-help', '2026-11-21');
    p = updateProblemFields(p, 49, { retry: true });
    expect(problemReviewQueue(p, problems, '2026-11-21').map((r) => r.id)).toEqual([49]);
    // Solving again clears the retry request.
    p = setProblemStatus(p, 49, 'independent', '2026-11-22');
    expect(problemRecord(p, 49).retry).toBe(false);
  });

  it('mastered problems leave the queue', () => {
    let p = setProblemStatus(emptyProgress(), 1, 'independent', '2026-11-21');
    p = setProblemStatus(p, 1, 'independent', '2026-11-24');
    expect(problemReviewQueue(p, problems, '2026-12-30')).toEqual([]);
  });

  it('concept queue surfaces unfamiliar lessons, missed checks, drills and patterns', () => {
    let p = setLesson(emptyProgress(), 'big-o/loops', { unfamiliar: true }, '2026-11-21');
    p = recordCheck(p, 'lesson:hashing/canonical-keys:0', false, '2026-11-21');
    p = recordCheck(p, 'lesson:arrays/frequency:0', true, '2026-11-21');
    p = recordDrill(p, 'pop-front', { time: false, space: true, dominant: true, explanation: 'x' }, '2026-11-21');
    p = recordPattern(p, 'count-subarrays-k', false, 'window', '2026-11-21');
    const q = conceptReviewQueue(p, ['big-o/loops', 'hashing/canonical-keys', 'arrays/frequency']);
    expect(q).toEqual([
      { kind: 'lesson', key: 'big-o/loops', reason: 'Marked unfamiliar' },
      { kind: 'lesson', key: 'hashing/canonical-keys', reason: 'Missed a knowledge check' },
      { kind: 'drill', id: 'pop-front', reason: 'Time complexity was off' },
      { kind: 'pattern', id: 'count-subarrays-k', reason: 'Chose a weaker pattern' },
    ]);
  });
});

describe('weak areas', () => {
  it('scores modules from recorded struggles', () => {
    let p = setProblemStatus(emptyProgress(), 49, 'needs-review', '2026-11-21'); // primary prereq: hashing/canonical-keys → hashing (+2)
    p = setProblemStatus(p, 206, 'with-help', '2026-11-24'); // linked-lists (+1)
    p = recordDrill(p, 'sliding-window-amortized', { time: false, space: false, dominant: false, explanation: '' }, '2026-11-25'); // sliding-window (+1)
    p = recordCheck(p, 'lesson:hashing/hashable-keys:1', false, '2026-11-22'); // hashing (+1)
    const weak = weakAreasFor(p);
    expect(weak[0].id).toBe('hashing');
    expect(weak[0].score).toBe(3);
    expect(weak.map((w) => w.id)).toEqual(expect.arrayContaining(['linked-lists', 'sliding-window']));
  });

  it('is empty with no evidence', () => {
    expect(weakAreasFor(emptyProgress())).toEqual([]);
  });
});

describe('schedule tracking and rescheduling', () => {
  it('today’s unfinished problems are "due today", not "behind"', () => {
    const s = trackStatus(emptyProgress(), problems, '2026-11-21', PLAN_START);
    expect(s.plannedSoFar).toBe(3);
    expect(s.dueToday).toBe(3);
    expect(s.behind).toBe(0);
    expect(s.state).toBe('on-track');
    // 32 plan core − 8 made optional (933, 200 in the scope correction; 155, 56, 53, 70, 733, 560 in the bootcamp)
    // + 9 ColorStack core additions (10 − 83, 415, 1344 made optional + 283, 237 promoted) + LC 102 (bootcamp).
    expect(s.totalPlanned).toBe(34);
  });

  it('unfinished problems from earlier days count as behind', () => {
    const p = setProblemStatus(emptyProgress(), 242, 'independent', '2026-11-21');
    const s = trackStatus(p, problems, '2026-11-22', PLAN_START);
    expect(s.behind).toBe(2); // 49 and 1 from Nov 21
    expect(s.dueToday).toBe(5); // Nov 22 problems
    expect(s.state).toBe('behind');
  });

  it('completing the day’s problems puts you on track; with-help counts as completed', () => {
    let p = setProblemStatus(emptyProgress(), 242, 'independent', '2026-11-21');
    p = setProblemStatus(p, 49, 'with-help', '2026-11-21');
    p = setProblemStatus(p, 1, 'independent', '2026-11-21');
    const s = trackStatus(p, problems, '2026-11-21', PLAN_START);
    expect(s.state).toBe('on-track');
    expect(s.dueToday).toBe(0);
    expect(s.independent).toBe(2);
    expect(s.withHelp).toBe(1);
  });

  it('before the plan starts nothing is planned', () => {
    const s = trackStatus(emptyProgress(), problems, '2026-11-10', PLAN_START);
    expect(s.plannedSoFar).toBe(0);
    expect(s.state).toBe('not-started-yet');
  });

  it('rescheduling moves a problem to its new date without changing the original plan', () => {
    const p = updateProblemFields(emptyProgress(), 1, { reschedule: '2026-11-23' });
    const two = getProblem(1)!;
    expect(effectiveDate(two, p)).toBe('2026-11-23');
    expect(two.date).toBe('2026-11-21');
    expect(trackStatus(p, problems, '2026-11-21', PLAN_START).plannedSoFar).toBe(2);
  });
});

describe('persistence parsing', () => {
  it('round-trips through JSON', () => {
    let p = setProblemStatus(emptyProgress(), 49, 'with-help', '2026-11-21');
    p = updateProblemFields(p, 49, { notes: 'tuple key', approach: 'count tuple', time: 'O(nk)', space: 'O(nk)', reschedule: '2026-11-25' });
    p = setLesson(p, 'hashing/canonical-keys', { done: true }, '2026-11-21');
    const back = parseProgress(JSON.stringify(p));
    expect(JSON.parse(JSON.stringify(back))).toEqual(JSON.parse(JSON.stringify(p)));
  });

  it('rejects unknown versions and non-objects', () => {
    expect(() => parseProgress('[]')).toThrow();
    expect(() => parseProgress(JSON.stringify({ version: 2 }))).toThrow(/version/);
  });

  it('drops malformed entries and unsafe keys instead of crashing', () => {
    const raw = {
      version: 1,
      problems: { '49': { status: 'bogus', history: [{ date: 'nope', status: 'independent' }, { date: '2026-11-21', status: 'attempted' }], reschedule: '2026-02-30' }, '__proto__': { status: 'independent' } },
      lessons: 'not an object',
      mocks: [{ id: 'm', problemId: 'x', rubric: { clarity: 9, correctness: 3 } }],
    };
    const p = normalizeProgress(raw);
    expect(p.problems['49'].status).toBe('not-started');
    expect(p.problems['49'].history).toEqual([{ date: '2026-11-21', status: 'attempted' }]);
    expect(p.problems['49'].reschedule).toBeNull();
    expect(Object.keys(p.problems)).toEqual(['49']);
    expect(p.lessons).toEqual({});
    expect(p.mocks[0].rubric).toEqual({ correctness: 3 });
  });
});

describe('revisiting missed concepts keeps earlier progress', () => {
  it('re-marking a solved problem "Needs Review" keeps it counted as done but queues it', () => {
    let p = setProblemStatus(emptyProgress(), 49, 'independent', '2026-11-21');
    p = setProblemStatus(p, 49, 'needs-review', '2026-11-23');
    const rec = problemRecord(p, 49);
    expect(everCompleted(rec)).toBe(true);
    expect(rec.history.map((h) => h.status)).toEqual(['independent', 'needs-review']);
    expect(problemReviewQueue(p, problems, '2026-11-23').map((r) => r.id)).toEqual([49]);
    expect(trackStatus(p, problems, '2026-11-23', PLAN_START).totalCompleted).toBe(1);
  });

  it('retrying checks, drills and patterns counts misses instead of erasing them', () => {
    let p = recordCheck(emptyProgress(), 'lesson:big-o/loops:0', false, '2026-11-21');
    p = recordCheck(p, 'lesson:big-o/loops:0', true, '2026-11-22');
    expect(p.checks['lesson:big-o/loops:0']).toMatchObject({ correct: true, attempts: 2, misses: 1 });
    p = recordDrill(p, 'pop-front', { time: false, space: true, dominant: true, explanation: 'a' }, '2026-11-21');
    p = recordDrill(p, 'pop-front', { time: true, space: true, dominant: true, explanation: 'b' }, '2026-11-22');
    expect(p.drills['pop-front']).toMatchObject({ attempts: 2, misses: 1, time: true });
    p = recordPattern(p, 'count-subarrays-k', false, 'window', '2026-11-21');
    p = recordPattern(p, 'count-subarrays-k', true, 'prefix sums', '2026-11-22');
    expect(recoveredItems(p).map((r) => r.kind).sort()).toEqual(['check', 'drill', 'pattern']);
    // and the concept review queue clears once each is answered correctly
    expect(conceptReviewQueue(p, ['big-o/loops'])).toEqual([]);
  });

  it('a lesson marked unfamiliar stays completed', () => {
    let p = setLesson(emptyProgress(), 'big-o/loops', { done: true }, '2026-11-21');
    p = setLesson(p, 'big-o/loops', { unfamiliar: true }, '2026-11-22');
    expect(p.lessons['big-o/loops']).toMatchObject({ done: true, unfamiliar: true });
  });

  it('progress saved before `misses` existed still loads', () => {
    const old = { version: 1, checks: { a: { correct: false, attempts: 2, at: '2026-11-21' }, b: { correct: true, attempts: 1, at: '2026-11-21' } }, drills: { d: { time: true, space: true, dominant: true, explanation: '', attempts: 1, at: '2026-11-21' } } };
    const p = normalizeProgress(old);
    expect(p.checks.a.misses).toBe(1);
    expect(p.checks.b.misses).toBe(0);
    expect(p.drills.d.misses).toBe(0);
  });
});
