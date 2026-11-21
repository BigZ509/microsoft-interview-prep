'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { CheckCircle2, Circle, Download, Upload } from 'lucide-react';
import { problems, getProblem } from '@/content/problems';
import { getLesson } from '@/content/modules';
import { getTerm } from '@/content/glossary';
import { schedule } from '@/content/schedule';
import { formatDate, isDateKey } from '@/lib/dates';
import {
  PROBLEM_STATUSES, STATUS_LABELS, effectiveDate, independentDays, isMastered, problemRecord, reviewDue, trackStatus,
  updateProblemFields, type ProblemStatus,
} from '@/lib/progress';
import { exportProgress, replaceProgress, update, useProgress, useToday } from '@/lib/store';
import { PLAN_START } from '@/content/schedule';
import { LeetCodeLink, ProblemItem, StatusBadge, StatusPicker } from './problem-ui';
import { Inline } from './rich';

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
    if (f.wave !== 'all' && p.wave !== f.wave) return false;
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

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">LeetCode Tracker</div>
        <h1>Your study-plan problems</h1>
        <p>The {problems.length} problems from your plan — 18 first-wave, 14 supporting, and 3 optional P1 stretch problems — on the dates you planned. Solve them on LeetCode, then record what happened here. Nothing is synced from LeetCode; every status is what you record.</p>
      </div>
      {track && (
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <div className="card"><div className="eyebrow">Solved independently</div><div className="big-number">{track.independent}</div><div className="small muted">{track.mastered} mastered (independent on 2+ days)</div></div>
          <div className="card"><div className="eyebrow">Solved with help</div><div className="big-number">{track.withHelp}</div><div className="small muted">Tracked separately — these return to the review queue.</div></div>
          <div className="card"><div className="eyebrow">Plan progress</div><div className="big-number">{track.totalCompleted}/{track.totalPlanned}</div><div className="small muted">{track.behind > 0 ? `${track.behind} behind schedule` : track.dueToday ? `On schedule · ${track.dueToday} due today` : 'On schedule'} (first wave + supporting)</div></div>
        </div>
      )}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          <label className="field">Status
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Filter['status'] })}>
              <option value="all">All</option>
              {PROBLEM_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              <option value="mastered">Mastered</option>
            </select>
          </label>
          <label className="field">Topic
            <select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
              <option value="all">All</option>{topics.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="field">Priority
            <select value={f.wave} onChange={(e) => setF({ ...f, wave: e.target.value })}>
              <option value="all">All</option><option>First wave</option><option>Supporting</option><option value="Stretch">P1 stretch</option>
            </select>
          </label>
          <label className="field">Difficulty
            <select value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}>
              <option value="all">All</option><option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </label>
        </div>
      </div>
      {dates.map((d) => {
        const day = schedule.find((s) => s.date === d);
        return (
          <section key={d} className="section" style={{ marginTop: 20 }}>
            <div className="spread">
              <h2 style={{ margin: 0 }}>{formatDate(d)}{d === today ? ' — today' : ''}</h2>
              {day && <span className="small muted">{day.theme} · planned target {day.target}</span>}
            </div>
            <ul className="item-list" style={{ marginTop: 8 }}>{byDate.get(d)!.map((p) => <ProblemItem key={p.id} problem={p} progress={progress} />)}</ul>
          </section>
        );
      })}
      {list.length === 0 && <p className="muted">No problems match these filters.</p>}
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

  return (
    <>
      <div className="page-head">
        <div className="eyebrow"><Link href="/tracker">LeetCode Tracker</Link> · {p.topic}</div>
        <h1>{p.id}. {p.title}</h1>
        <div className="row">
          <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
          <span className="badge accent">{p.priority} · {p.wave === 'Stretch' ? 'P1 stretch (optional)' : p.wave}</span>
          <span className="badge">{p.pattern}</span>
          <StatusBadge progress={progress} id={p.id} />
          <LeetCodeLink problem={p} />
        </div>
        <p style={{ marginTop: 10 }}><strong>Why it was selected:</strong> {p.why}</p>
        {p.candidateReport && <div className="callout warn small"><strong>Candidate report (anecdotal):</strong> {p.candidateReport}</div>}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <section className="card">
            <h2>Before you open LeetCode</h2>
            <p className="small muted">Review these prerequisites first.</p>
            <ul className="item-list">
              {p.prereqs.map((key) => {
                const ref = getLesson(key);
                if (!ref) return null;
                const done = progress.lessons[key]?.done;
                return (
                  <li key={key} className={`item${done ? ' done' : ''}`}>
                    <span className="row" style={{ gap: 8 }}>{done ? <CheckCircle2 size={15} className="check-icon" /> : <Circle size={15} className="muted" />}<Link href={`/learn/${key}`}>{ref.lesson.title}</Link></span>
                    <span className="tiny muted">Module {ref.module.number}</span>
                  </li>
                );
              })}
            </ul>
            <h3 style={{ marginTop: 14 }}>Vocabulary</h3>
            <div className="chip-group">{p.terms.map((t) => getTerm(t) && <Link key={t} className="chip" href={`/dictionary/${t}`}>{getTerm(t)!.term}</Link>)}</div>
          </section>
          <section className="card">
            <h2>Hint ladder</h2>
            <p className="small muted">Reveal one at a time — only when stuck.</p>
            <ol className="steps">{p.hints.slice(0, hints).map((h, i) => <li key={i}><Inline text={h} /></li>)}</ol>
            {hints < p.hints.length ? <button className="btn small" onClick={() => setHints(hints + 1)}>Show hint {hints + 1} of {p.hints.length}</button> : <p className="tiny muted">No more hints — open the lesson or try explaining the brute force first.</p>}
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <h2>Record your attempt</h2>
            <StatusPicker id={p.id} progress={progress} />
            <p className="small muted" style={{ marginTop: 10 }}>
              Date last attempted: <strong>{rec.lastAttempted ? formatDate(rec.lastAttempted) : '—'}</strong>
              {' · '}Independent solves on {independentDays(rec)} day{independentDays(rec) === 1 ? '' : 's'}
              {isMastered(rec) ? ' · Mastered' : rec.status === 'independent' ? ' · Solve again on another day to confirm mastery' : ''}
              {due && ` · Review ${today && due <= today ? 'due now' : `on ${formatDate(due)}`}`}
            </p>
            <label className="row small" style={{ marginTop: 6 }}>
              <input type="checkbox" checked={rec.retry} onChange={(e) => set({ retry: e.target.checked })} /> Mark for another attempt
            </label>
          </section>
          <section className="card">
            <h2>Your approach</h2>
            <label className="field">Approach you used <span className="hint">In your own words — data structure, key idea, why it works.</span>
              <textarea value={rec.approach} onChange={(e) => set({ approach: e.target.value })} />
            </label>
            <div className="grid-2" style={{ marginTop: 10 }}>
              <label className="field">Time complexity <input type="text" value={rec.time} onChange={(e) => set({ time: e.target.value })} placeholder="e.g. O(n·k)" /></label>
              <label className="field">Space complexity <input type="text" value={rec.space} onChange={(e) => set({ space: e.target.value })} placeholder="e.g. O(n)" /></label>
            </div>
            <button className="btn small" style={{ marginTop: 10 }} onClick={() => setShowRef(!showRef)}>{showRef ? 'Hide' : 'Compare with'} reference complexity</button>
            {showRef && <div className="callout small"><strong>Reference:</strong> time {p.time}; space {p.space}.</div>}
            <label className="field" style={{ marginTop: 10 }}>Notes <textarea value={rec.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Bugs you hit, edge cases, what to remember next time…" /></label>
          </section>
          <section className="card">
            <h2>Schedule</h2>
            <p className="small">Planned for <strong>{formatDate(p.date)}</strong>{plannedDay ? ` (${plannedDay.theme})` : ''}.{rec.reschedule && <> Rescheduled to <strong>{formatDate(rec.reschedule)}</strong>.</>}</p>
            <div className="row">
              <label className="field">Move to date
                <input type="date" value={rec.reschedule ?? p.date} min="2026-11-01" max="2027-12-31" onChange={(e) => isDateKey(e.target.value) && set({ reschedule: e.target.value === p.date ? null : e.target.value })} />
              </label>
              {rec.reschedule && <button className="btn small" style={{ alignSelf: 'end' }} onClick={() => set({ reschedule: null })}>Restore planned date</button>}
            </div>
            <p className="tiny muted" style={{ marginTop: 6 }}>Daily targets from the plan stay as planned; a moved problem counts toward its new day.</p>
          </section>
          {rec.history.length > 0 && (
            <section className="card">
              <h2>History</h2>
              <ul className="small">{[...rec.history].reverse().map((h, i) => <li key={i}>{formatDate(h.date)} — {STATUS_LABELS[h.status]}</li>)}</ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
