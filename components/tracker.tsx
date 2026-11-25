'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { BookOpen, CalendarClock, CheckCircle2, Circle, Download, Lightbulb, NotebookPen, Upload } from 'lucide-react';
import { problems, getProblem } from '@/content/problems';
import { getLesson } from '@/content/modules';
import { getTerm } from '@/content/glossary';
import { schedule, PLAN_START } from '@/content/schedule';
import { formatDate, isDateKey } from '@/lib/dates';
import {
  PROBLEM_STATUSES, STATUS_LABELS, effectiveDate, everCompleted, independentDays, isMastered, problemRecord, reviewDue, trackStatus,
  updateProblemFields, type ProblemStatus,
} from '@/lib/progress';
import { exportProgress, replaceProgress, update, useProgress, useToday } from '@/lib/store';
import { LeetCodeLink, ProblemItem, StatusBadge, StatusPicker } from './problem-ui';
import { Inline } from './rich';
import { DifficultyBadge, PageHeader, Panel, ProgressBar, Stat } from './ui';

type Filter = { status: ProblemStatus | 'all' | 'mastered'; topic: string; wave: string; difficulty: string };

export function Tracker() {
  const progress = useProgress();
  const today = useToday();
  const [f, setF] = useState<Filter>({ status: 'all', topic: 'all', wave: 'all', difficulty: 'all' });
  const topics = [...new Set(problems.map((p) => p.topic))];
  const list = problems.filter((p) => {
    const rec = problemRecord(progress, p.id);
    if (f.status === 'mastered' ? !isMastered(rec) : f.status !== 'all' && rec.status !== f.status) return false;
    if (f.topic !== 'all' && p.topic !== f.topic) return false;
    if (f.wave === 'reported') { if (!p.evidence?.some((e) => e !== 'colorstack-recommended')) return false; }
    else if (f.wave !== 'all' && p.wave !== f.wave) return false;
    if (f.difficulty !== 'all' && p.difficulty !== f.difficulty) return false;
    return true;
  });
  const byDate = new Map<string, typeof list>();
  for (const p of list) {
    const d = effectiveDate(p, progress);
    byDate.set(d, [...(byDate.get(d) ?? []), p]);
  }
  const dates = [...byDate.keys()].sort();
  const track = today ? trackStatus(progress, problems, today, PLAN_START) : null;
  const filtered = f.status !== 'all' || f.topic !== 'all' || f.wave !== 'all' || f.difficulty !== 'all';

  return (
    <>
      <PageHeader
        eyebrow="LeetCode Tracker"
        title="Your study-plan problems"
        description="The 35 problems from your original plan plus 20 added on Nov 25 from the ColorStack research (10 core — reported, historical or approachable Easy — and 10 optional). Advanced and secondary-topic problems are marked optional. Solve on LeetCode, then record what happened here. Nothing syncs from LeetCode; every status is one you record."
      />
      {track && (
        <div className="stats" style={{ marginBottom: 'var(--s5)' }}>
          <Stat label="Plan progress" value={`${track.totalCompleted}/${track.totalPlanned}`} hint={<><ProgressBar value={track.totalCompleted} max={track.totalPlanned} tone="good" /><span style={{ display: 'block', marginTop: 6 }}>{track.behind > 0 ? `${track.behind} behind schedule` : track.dueToday ? `On schedule · ${track.dueToday} due today` : 'On schedule'} (first wave + supporting)</span></>} />
          <Stat label="Solved independently" value={track.independent} tone="good" hint={`${track.mastered} mastered (independent on 2+ days)`} />
          <Stat label="Solved with help" value={track.withHelp} tone="accent" hint="Tracked separately — these return to review" />
        </div>
      )}
      <div className="toolbar" role="group" aria-label="Filters">
        <label className="field">Status
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Filter['status'] })}>
            <option value="all">All statuses</option>
            {PROBLEM_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            <option value="mastered">Mastered</option>
          </select>
        </label>
        <label className="field">Topic
          <select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
            <option value="all">All topics</option>{topics.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">Priority
          <select value={f.wave} onChange={(e) => setF({ ...f, wave: e.target.value })}>
            <option value="all">All priorities</option><option>First wave</option><option>Supporting</option><option value="Stretch">Optional / stretch</option><option value="reported">Reported or historical</option>
          </select>
        </label>
        <label className="field">Difficulty
          <select value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}>
            <option value="all">All</option><option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </label>
        {filtered && <button className="btn small ghost" onClick={() => setF({ status: 'all', topic: 'all', wave: 'all', difficulty: 'all' })}>Clear filters</button>}
      </div>
      <p className="small muted" style={{ margin: '0 0 var(--s2)' }}>{list.length} of {problems.length} problems{filtered ? ' match' : ''}</p>
      {dates.map((d) => {
        const day = schedule.find((s) => s.date === d);
        const items = byDate.get(d)!;
        const done = items.filter((p) => everCompleted(problemRecord(progress, p.id))).length;
        const isToday = d === today;
        return (
          <section key={d} className={`day-group${isToday ? ' today' : ''}`} aria-label={formatDate(d)}>
            <div className="day-head">
              <h2>{formatDate(d)}</h2>
              {isToday && <span className="badge accent">Today</span>}
              <span className="theme">{day ? `${day.theme} · target ${day.target}` : 'Rescheduled outside the plan'}</span>
              <span className="day-progress"><ProgressBar value={done} max={items.length} tone="good" label={`${done} of ${items.length} done`} />{done}/{items.length}</span>
            </div>
            <ul className="item-list">{items.map((p) => <ProblemItem key={p.id} problem={p} progress={progress} />)}</ul>
          </section>
        );
      })}
      {list.length === 0 && <p className="empty">No problems match these filters.</p>}
      <Backup />
    </>
  );
}

function Backup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `explore-prep-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const restore = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!window.confirm('Replace all saved progress in this browser with the backup?')) return;
      const r = replaceProgress(data);
      setMsg(r.ok ? 'Backup restored.' : `Could not restore: ${r.error}`);
    } catch {
      setMsg('That file is not valid JSON.');
    }
  };
  return (
    <details className="card section">
      <summary>Back up or restore progress</summary>
      <p className="small muted">Progress lives in this browser&apos;s local storage. Download a backup before clearing browser data or switching devices.</p>
      <div className="row">
        <button className="btn small" onClick={download}><Download size={14} /> Download backup</button>
        <button className="btn small" onClick={() => fileRef.current?.click()}><Upload size={14} /> Restore from file</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
      </div>
      {msg && <p className="small" role="status" style={{ marginTop: 8 }}>{msg}</p>}
    </details>
  );
}

export function ProblemDetail({ id }: { id: number }) {
  const p = getProblem(id)!;
  const progress = useProgress();
  const today = useToday();
  const rec = problemRecord(progress, id);
  const [hints, setHints] = useState(0);
  const [showRef, setShowRef] = useState(false);
  const due = reviewDue(rec);
  const set = (fields: Parameters<typeof updateProblemFields>[2]) => update((pr) => updateProblemFields(pr, id, fields));
  const plannedDay = schedule.find((d) => d.date === p.date);
  const prereqsDone = p.prereqs.filter((k) => progress.lessons[k]?.done).length;

  return (
    <>
      <PageHeader
        eyebrow={<><Link href="/tracker">LeetCode Tracker</Link> · {p.topic}</>}
        title={`${p.id}. ${p.title}`}
        actions={<LeetCodeLink problem={p} />}
      >
        <div className="row" style={{ marginTop: 'var(--s3)', gap: 10 }}>
          <DifficultyBadge difficulty={p.difficulty} />
          <span className="badge accent">{p.priority} · {p.wave === 'Stretch' ? 'P1 stretch (optional)' : p.wave}</span>
          <span className="badge">{p.pattern}</span>
          <StatusBadge progress={progress} id={p.id} />
        </div>
        <p className="lede" style={{ fontSize: 'var(--fs-base)' }}><strong style={{ color: 'var(--ink)' }}>Why it was selected:</strong> {p.why}</p>
        {p.candidateReport && <div className="callout warn small"><strong>Candidate report (anecdotal):</strong> {p.candidateReport}</div>}
        {p.demoted && <div className="callout small"><strong>Optional since Nov 25:</strong> {p.demoted}</div>}
        {p.evidence && !p.candidateReport && <p className="tiny muted">Evidence: {p.evidence.map((e) => e === 'colorstack-reported' ? 'ColorStack-reported' : e === 'github-historical' ? 'historical report' : 'ColorStack-recommended practice').join(', ')} (anecdotal).</p>}
      </PageHeader>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          <div className="exercise-label" style={{ marginTop: 0 }}>Before you open LeetCode</div>
          <Panel title="Prerequisite lessons" icon={<BookOpen size={16} aria-hidden="true" />} action={<span className="tiny muted">{prereqsDone}/{p.prereqs.length} complete</span>} flush>
            <ul className="item-list">
              {p.prereqs.map((key) => {
                const ref = getLesson(key);
                if (!ref) return null;
                const done = progress.lessons[key]?.done;
                return (
                  <li key={key} className="item">
                    <span className="row" style={{ gap: 10 }}>{done ? <CheckCircle2 size={16} className="check-icon" aria-label="Completed" /> : <Circle size={16} className="todo-icon" aria-label="Not completed" />}<Link href={`/learn/${key}`}>{ref.lesson.title}</Link></span>
                    <span className="meta">Module {ref.module.number}</span>
                  </li>
                );
              })}
            </ul>
            <div style={{ padding: 'var(--s4) var(--s5)' }}>
              <div className="exercise-label" style={{ marginTop: 0 }}>Vocabulary</div>
              <div className="chip-group">{p.terms.map((t) => getTerm(t) && <Link key={t} className="chip" href={`/dictionary/${t}`}>{getTerm(t)!.term}</Link>)}</div>
            </div>
          </Panel>
          <Panel title="Hint ladder" icon={<Lightbulb size={16} aria-hidden="true" />} action={<span className="tiny muted">Reveal one at a time, only when stuck</span>}>
            {hints > 0 && <ol className="steps">{p.hints.slice(0, hints).map((h, i) => <li key={i}><Inline text={h} /></li>)}</ol>}
            {hints < p.hints.length ? <button className="btn small" onClick={() => setHints(hints + 1)}>Show hint {hints + 1} of {p.hints.length}</button> : <p className="tiny muted" style={{ margin: 0 }}>No more hints — open the lesson or explain the brute force first.</p>}
          </Panel>
        </div>

        <div>
          <div className="exercise-label" style={{ marginTop: 0 }}>After you solve it</div>
          <Panel title="Record your attempt">
            <StatusPicker id={p.id} progress={progress} />
            <div className="row small" style={{ marginTop: 'var(--s3)', gap: '4px 16px', color: 'var(--muted)' }}>
              <span>Last attempted: <strong style={{ color: 'var(--ink)' }}>{rec.lastAttempted ? formatDate(rec.lastAttempted) : '—'}</strong></span>
              <span>Independent solves: <strong style={{ color: 'var(--ink)' }}>{independentDays(rec)} day{independentDays(rec) === 1 ? '' : 's'}</strong></span>
              {due && <span>Review: <strong style={{ color: today && due <= today ? 'var(--warn)' : 'var(--ink)' }}>{today && due <= today ? 'due now' : formatDate(due)}</strong></span>}
            </div>
            <p className="tiny muted" style={{ margin: '6px 0 0' }}>{isMastered(rec) ? 'Mastered — solved independently on two different days.' : rec.status === 'independent' ? 'Solve it again on another day to confirm mastery.' : 'Mastery = solved independently on two different days.'}</p>
            <label className="row small" style={{ marginTop: 'var(--s3)', gap: 8 }}>
              <input type="checkbox" checked={rec.retry} onChange={(e) => set({ retry: e.target.checked })} /> Mark for another attempt
            </label>
          </Panel>
          <Panel title="Your approach" icon={<NotebookPen size={16} aria-hidden="true" />}>
            <label className="field">Approach you used <span className="hint">In your own words — data structure, key idea, why it works.</span>
              <textarea value={rec.approach} onChange={(e) => set({ approach: e.target.value })} />
            </label>
            <div className="grid-2" style={{ marginTop: 'var(--s3)', gap: 'var(--s3)' }}>
              <label className="field">Time complexity <input type="text" value={rec.time} onChange={(e) => set({ time: e.target.value })} placeholder="e.g. O(n·k)" /></label>
              <label className="field">Space complexity <input type="text" value={rec.space} onChange={(e) => set({ space: e.target.value })} placeholder="e.g. O(n)" /></label>
            </div>
            <button className="btn small" style={{ marginTop: 'var(--s3)' }} onClick={() => setShowRef(!showRef)}>{showRef ? 'Hide' : 'Compare with'} reference complexity</button>
            {showRef && <div className="callout small"><strong>Reference:</strong> time {p.time}; space {p.space}.</div>}
            <label className="field" style={{ marginTop: 'var(--s3)' }}>Notes <textarea value={rec.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Bugs you hit, edge cases, what to remember next time…" /></label>
          </Panel>
          <Panel title="Schedule" icon={<CalendarClock size={16} aria-hidden="true" />}>
            <p className="small" style={{ marginTop: 0 }}>Planned for <strong>{formatDate(p.date)}</strong>{plannedDay ? ` (${plannedDay.theme})` : ''}.{rec.reschedule && <> Rescheduled to <strong>{formatDate(rec.reschedule)}</strong>.</>}</p>
            <div className="row" style={{ alignItems: 'end' }}>
              <label className="field">Move to date
                <input type="date" value={rec.reschedule ?? p.date} min="2026-11-01" max="2027-12-31" onChange={(e) => isDateKey(e.target.value) && set({ reschedule: e.target.value === p.date ? null : e.target.value })} />
              </label>
              {rec.reschedule && <button className="btn small" onClick={() => set({ reschedule: null })}>Restore planned date</button>}
            </div>
            <p className="tiny muted" style={{ margin: '8px 0 0' }}>Daily targets from the plan stay as planned; a moved problem counts toward its new day.</p>
          </Panel>
          {rec.history.length > 0 && (
            <Panel title="History" flush>
              <ul className="item-list">{[...rec.history].reverse().map((h, i) => <li key={i} className="item small"><span>{STATUS_LABELS[h.status]}</span><span className="meta">{formatDate(h.date)}</span></li>)}</ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
