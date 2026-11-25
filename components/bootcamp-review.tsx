'use client';

/**
 * Review views used inside the bootcamp player. Every due item opens in place (the same components
 * the library pages use), so a scheduled review never requires leaving the study flow.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getLesson } from '@/content/modules';
import { getProblem } from '@/content/problems';
import { getDrill } from '@/content/drills';
import { scenarios } from '@/content/patterns';
import { getCodeReading } from '@/content/code-reading';
import { bootcampDays } from '@/content/bootcamp';
import { interviewDayChecklist } from '@/content/schedule';
import { addDays, formatDate } from '@/lib/dates';
import { practiceInfo, reviewQueuesFor, weakAreasFor } from '@/lib/insights';
import { activeItems, targetedReviewPlan, type DayPlan } from '@/lib/bootcamp';
import { OUTCOME_LABELS, mistakeLog } from '@/lib/progress';
import { useProgress } from '@/lib/store';
import { BlindSession } from './blind';
import { OopSession } from './oop';
import { ReadingCard } from './code-reading';
import { ProblemDetail } from './tracker';
import { LessonView } from './lesson-view';
import { DrillRunner } from './big-o-lab';
import { ScenarioSet } from './patterns';
import { EmptyState, Panel } from './ui';

type Row = { key: string; title: string; detail: string; kind: string };

/** Renders the real exercise for a review key ("blind:x", "problem:1", "lesson:a/b", …). */
function ReviewTarget({ rowKey, today }: { rowKey: string; today: string }) {
  const [kind, ...rest] = rowKey.split(':');
  const id = rest.join(':');
  if (kind === 'blind') return <BlindSession key={id} id={id} concealSource />;
  if (kind === 'oop') return <OopSession key={id} id={id} />;
  if (kind === 'read') { const r = getCodeReading(id); return r ? <ReadingCard reading={r} today={today} /> : null; }
  if (kind === 'problem') return <ProblemDetail key={id} id={Number(id)} embedded />;
  if (kind === 'lesson') {
    const ref = getLesson(id);
    return ref ? <LessonView key={id} embedded module={{ id: ref.module.id, number: ref.module.number, title: ref.module.title, phase: ref.module.phase }} lesson={ref.lesson} lessonKey={id} /> : null;
  }
  if (kind === 'drill') return <DrillRunner key={id} id={id} embedded />;
  if (kind === 'pattern') return <ScenarioSet ids={[id]} />;
  return null;
}

function ReviewRows({ rows, today, empty }: { rows: Row[]; today: string; empty: string }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!rows.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="item-list review-rows">
      {rows.map((r) => (
        <li key={r.key} className="review-row">
          <div className="item">
            <div style={{ minWidth: 0, flex: 1 }}>
              <span className="title">{r.title}</span>
              <div className="tiny muted">{r.detail}</div>
            </div>
            <span className="badge">{r.kind}</span>
            <button className="btn small" aria-expanded={open === r.key} onClick={() => setOpen(open === r.key ? null : r.key)}>
              {open === r.key ? <><ChevronUp size={14} aria-hidden="true" /> Close</> : <><ChevronDown size={14} aria-hidden="true" /> Open here</>}
            </button>
          </div>
          {open === r.key && <div className="review-inline"><ReviewTarget rowKey={r.key} today={today} /></div>}
        </li>
      ))}
    </ul>
  );
}

function dueRows(progress: ReturnType<typeof useProgress>, today: string): Row[] {
  const q = reviewQueuesFor(progress, today);
  const rows: Row[] = [];
  for (const r of q.practice) {
    const info = practiceInfo(r.key);
    if (info) rows.push({ key: r.key, title: info.title, detail: `${r.reason}${r.mistake ? ` · your note: ${r.mistake}` : ''}`, kind: info.kind });
  }
  for (const r of q.problems) {
    const p = getProblem(r.id);
    if (p) rows.push({ key: `problem:${p.id}`, title: `${p.id}. ${p.title}`, detail: r.reason, kind: 'Problem' });
  }
  for (const c of q.concepts) {
    if (c.kind === 'lesson') rows.push({ key: `lesson:${c.key}`, title: getLesson(c.key)?.lesson.title ?? c.key, detail: c.reason, kind: 'Lesson' });
    if (c.kind === 'drill') rows.push({ key: `drill:${c.id}`, title: getDrill(c.id)?.title ?? c.id, detail: c.reason, kind: 'Big-O' });
    if (c.kind === 'pattern') rows.push({ key: `pattern:${c.id}`, title: scenarios.find((s) => s.id === c.id)?.wording ?? c.id, detail: c.reason, kind: 'Pattern' });
  }
  return rows;
}

/** Mistake review: everything the review queues say is due today, each one openable in place. */
export function ReviewWorkbench({ today }: { today: string }) {
  const progress = useProgress();
  const rows = dueRows(progress, today);
  const mistakes = mistakeLog(progress).slice(0, 6);
  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>
        Retry each item cold before opening hints. Problems solved with help, retention checks you could not finish on your own, and
        assessments that needed hints all come back here the next day.
      </p>
      <Panel title={`Due now (${rows.length})`} flush>
        <ReviewRows rows={rows} today={today} empty="Nothing is due. Read your recent mistake notes below, then continue." />
      </Panel>
      {mistakes.length > 0 && (
        <Panel title="Recent mistake notes" flush>
          <ul className="item-list">{mistakes.map((m, i) => (
            <li key={`${m.key}${i}`} className="item"><div style={{ minWidth: 0 }}><div className="small" style={{ whiteSpace: 'pre-wrap' }}>{m.mistake}</div><div className="tiny muted">{practiceInfo(m.key)?.title ?? m.key} · {formatDate(m.date)} · {OUTCOME_LABELS[m.outcome]}</div></div></li>
          ))}</ul>
        </Panel>
      )}
    </div>
  );
}

/** End-of-day review: what was done, what is left, what comes back tomorrow. */
export function DayReview({ plan, today }: { plan: DayPlan; today: string }) {
  const progress = useProgress();
  const active = activeItems(plan);
  const done = active.filter((i) => i.status === 'done');
  const open = active.filter((i) => i.status !== 'done' && i.activity.kind !== 'day-review');
  const deferred = plan.items.filter((i) => i.status === 'deferred');
  const tomorrow = reviewQueuesFor(progress, addDays(today, 1));
  const weak = weakAreasFor(progress).slice(0, 3);
  const todaysNotes = mistakeLog(progress).filter((m) => m.date === today);
  const nextDay = bootcampDays.find((d) => d.day === plan.day.day + 1);
  const final = plan.day.day === bootcampDays.length;

  return (
    <div className="stack">
      <div className="stats">
        <div className="stat good"><div className="stat-label">Completed</div><div className="stat-value">{done.length}/{active.length}</div></div>
        <div className="stat"><div className="stat-label">Still open</div><div className="stat-value">{open.length}</div><div className="stat-hint">Core problems, assessments and OOP carry to tomorrow</div></div>
        <div className="stat"><div className="stat-label">Due tomorrow</div><div className="stat-value">{tomorrow.problems.length + tomorrow.practice.length}</div><div className="stat-hint">Shown in tomorrow’s mistake review</div></div>
      </div>
      <Panel title="Say it out loud (2 minutes)">
        <ol style={{ margin: 0 }}>
          <li>Which pattern did you learn today, and which words in a problem statement point to it?</li>
          <li>What was your slowest moment today, and what will you check first next time?</li>
          <li>Give the time and space complexity of one solution you wrote today, naming every variable.</li>
        </ol>
      </Panel>
      {open.length > 0 && (
        <Panel title="Not finished today" flush>
          <ul className="item-list">{open.map((i) => <li key={i.activity.id} className="item"><span>{i.title}</span><span className="status warn">{i.status === 'skipped' ? 'Skipped' : 'Pending'} · {i.tier}</span></li>)}</ul>
        </Panel>
      )}
      {deferred.length > 0 && <p className="small muted" style={{ margin: 0 }}>{deferred.length} optional item{deferred.length === 1 ? ' was' : 's were'} deferred to fit your hours. They are not carried forward.</p>}
      {(weak.length > 0 || todaysNotes.length > 0) && (
        <Panel title="What your results say">
          {weak.length > 0 && <ul style={{ marginTop: 0 }}>{weak.map((w) => <li key={w.id}><strong>{w.label}</strong>: {w.reasons.slice(0, 2).join('; ')}</li>)}</ul>}
          {todaysNotes.length > 0 && <><div className="exercise-label">Your mistake notes from today</div><ul style={{ margin: 0 }}>{todaysNotes.map((m, i) => <li key={i} className="small">{m.mistake}</li>)}</ul></>}
        </Panel>
      )}
      {final ? (
        <Panel title="Interview-day checklist (Dec 2)">
          <ul style={{ margin: 0 }}>{interviewDayChecklist.map((x) => <li key={x}>{x}</li>)}</ul>
        </Panel>
      ) : nextDay && <p className="small" style={{ margin: 0 }}><strong>Tomorrow, Day {nextDay.day}:</strong> {nextDay.title}. Get some rest.</p>}
    </div>
  );
}

/** Day 6: a review plan generated from demonstrated weaknesses. */
export function ReviewPlanView({ today }: { today: string }) {
  const progress = useProgress();
  const plan = targetedReviewPlan(progress, today);
  const rows = dueRows(progress, today);
  const [lesson, setLesson] = useState<string | null>(null);
  return (
    <div className="stack">
      <Panel title="Your plan for tonight and tomorrow">
        <ol style={{ margin: 0 }}>{plan.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      </Panel>
      <Panel title={`Weakest areas (${plan.focus.length})`} flush>
        {plan.focus.length === 0 ? <EmptyState>No weaknesses recorded yet.</EmptyState> : (
          <ul className="item-list">
            {plan.focus.map((f) => (
              <li key={f.id} className="review-row">
                <div className="item">
                  <div style={{ minWidth: 0, flex: 1 }}><span className="title">{f.label}</span><div className="tiny muted">{f.reasons.join(' · ')}</div></div>
                  <span className="status warn">score {f.score}</span>
                </div>
                {f.lessons.length > 0 && (
                  <div className="chip-group" style={{ padding: '0 var(--s5) var(--s3)' }}>
                    {f.lessons.map((k) => <button key={k} className="chip" aria-pressed={lesson === k} onClick={() => setLesson(lesson === k ? null : k)}>Recap: {getLesson(k)?.lesson.title}</button>)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {lesson && <div className="review-inline"><ReviewTarget rowKey={`lesson:${lesson}`} today={today} /></div>}
      <Panel title={`Due for review (${rows.length})`} flush>
        <ReviewRows rows={rows} today={today} empty="Nothing due yet. Results recorded in today’s rounds appear here tomorrow." />
      </Panel>
    </div>
  );
}
