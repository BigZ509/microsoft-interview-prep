'use client';

import Link from 'next/link';
import { getProblem } from '@/content/problems';
import { getLesson } from '@/content/modules';
import { getDrill } from '@/content/drills';
import { scenarios } from '@/content/patterns';
import { problems } from '@/content/problems';
import { formatDate } from '@/lib/dates';
import { isMastered, mistakeLog, OUTCOME_LABELS, problemRecord, recoveredItems, type PracticeReviewItem, type ReviewItem } from '@/lib/progress';
import { getTerm } from '@/content/glossary';
import { practiceInfo, reviewQueuesFor, weakAreasFor } from '@/lib/insights';
import { update, useHydrated, useProgress, useToday } from '@/lib/store';
import { updateProblemFields } from '@/lib/progress';
import { ProblemItem } from './problem-ui';
import { PageHeader, Panel, Stat } from './ui';
import { CheckCircle2 } from 'lucide-react';

export function ReviewList({ problems: probs, concepts, practice = [] }: { problems: Extract<ReviewItem, { kind: 'problem' }>[]; concepts: ReviewItem[]; practice?: PracticeReviewItem[] }) {
  if (!probs.length && !concepts.length && !practice.length) return <p className="empty">Nothing is due. Problems you solve with help, attempt, or mark Needs Review — and blind assessments or OOP challenges that needed hints — appear here on their review date.</p>;
  return (
    <ul className="item-list">
      {practice.map((r) => {
        const info = practiceInfo(r.key);
        return info && (
          <li key={r.key} className="item">
            <div style={{ minWidth: 0, flex: 1 }}>
              <Link className="title" href={info.href}>{info.title}</Link>
              <div className="tiny muted">{r.reason} · due {formatDate(r.due)}</div>
              {r.mistake && <div className="tiny" style={{ marginTop: 2 }}>Your note: {r.mistake}</div>}
            </div>
            <span className="status warn">{info.kind === 'Blind assessment' ? 'Blind' : info.kind === 'OOP challenge' ? 'OOP' : 'Practice'}</span>
          </li>
        );
      })}
      {probs.map((r) => {
        const p = getProblem(r.id)!;
        return (
          <li key={`p${r.id}`} className="item">
            <div><Link className="title" href={`/tracker/${p.id}`}>{p.id}. {p.title}</Link><div className="tiny muted">{r.reason} · due {formatDate(r.due)}</div></div>
            <span className="status warn">Problem</span>
          </li>
        );
      })}
      {concepts.map((c) => {
        if (c.kind === 'lesson') {
          const ref = getLesson(c.key);
          return ref && <li key={`l${c.key}`} className="item"><div><Link href={`/learn/${c.key}`}>{ref.lesson.title}</Link><div className="tiny muted">{c.reason}</div></div><span className="status">Lesson</span></li>;
        }
        if (c.kind === 'drill') {
          const d = getDrill(c.id);
          return d && <li key={`d${c.id}`} className="item"><div><Link href={`/big-o/${c.id}`}>{d.title}</Link><div className="tiny muted">{c.reason}</div></div><span className="status">Big-O</span></li>;
        }
        if (c.kind === 'pattern') {
          const s = scenarios.find((x) => x.id === c.id);
          return s && <li key={`s${c.id}`} className="item"><div><Link href={`/patterns#${c.id}`} className="small">{s.wording}</Link><div className="tiny muted">{c.reason}</div></div><span className="status">Pattern</span></li>;
        }
        return null;
      })}
    </ul>
  );
}

export function ReviewPage() {
  const today = useToday();
  const hydrated = useHydrated();
  const progress = useProgress();
  if (!today || !hydrated) return <p className="muted">Loading…</p>;
  const queues = reviewQueuesFor(progress, today);
  const weak = weakAreasFor(progress);
  const withHelp = problems.filter((p) => problemRecord(progress, p.id).status === 'with-help');
  const independent = problems.filter((p) => problemRecord(progress, p.id).status === 'independent');
  const upcoming = problems.map((p) => ({ p, rec: problemRecord(progress, p.id) })).filter(({ rec }) => rec.status !== 'not-started' && !isMastered(rec));
  const recovered = recoveredItems(progress);
  const mistakes = mistakeLog(progress);
  const dueTotal = queues.problems.length + queues.concepts.length + queues.practice.length;
  const recoveredLink = (r: (typeof recovered)[number]) => {
    if (r.kind === 'drill') return { href: `/big-o/${r.id}`, label: getDrill(r.id)?.title ?? r.id, type: 'Big-O' };
    if (r.kind === 'pattern') return { href: `/patterns#${r.id}`, label: scenarios.find((s) => s.id === r.id)?.wording ?? r.id, type: 'Pattern' };
    if (r.id.startsWith('term:')) { const t = getTerm(r.id.slice(5)); return { href: `/dictionary/${r.id.slice(5)}`, label: t?.term ?? r.id, type: 'Term' }; }
    const key = r.id.split(':')[1];
    return { href: `/learn/${key}#check`, label: getLesson(key)?.lesson.title ?? key, type: 'Lesson check' };
  };

  return (
    <>
      <PageHeader
        eyebrow="Review"
        title="What needs review?"
        description={<>Light spaced repetition: problems solved with help or only attempted come back after 1 day; a first independent solve comes back after 3 days. A problem counts as <strong>retained</strong> only after you solve it independently on two different days — one completion is not retention.</>}
      />
      <div className="stats" style={{ marginBottom: 'var(--s5)' }}>
        <Stat label="Due now" value={dueTotal} tone={dueTotal ? undefined : 'good'} hint={`${queues.problems.length} problems · ${queues.practice.length} practice · ${queues.concepts.length} concepts`} />
        <Stat label="Solved with help" value={withHelp.length} tone="accent" hint="Not counted toward retention" />
        <Stat label="Solved independently" value={independent.length} tone="good" hint={`${problems.filter((p) => isMastered(problemRecord(progress, p.id))).length} retained`} />
        <Stat label="Recovered" value={recovered.length} hint="Missed before, correct now" />
      </div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Panel title={`Due now (${dueTotal})`} flush><ReviewList problems={queues.problems} concepts={queues.concepts} practice={queues.practice} /></Panel>
        <Panel title="Weak concepts" flush>
          {weak.length === 0 ? <p className="empty">No evidence of weak areas yet.</p> : (
            <ul className="item-list">{weak.map((w) => (
              <li key={w.id} className="item">
                <div style={{ minWidth: 0, flex: 1 }}><Link className="title" href={`/learn/${w.id}`}>{w.label}</Link><ul className="meta" style={{ margin: '4px 0 0', paddingLeft: 16 }}>{w.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>
                <span className="status warn">{w.score}</span>
              </li>
            ))}</ul>
          )}
        </Panel>
      </div>
      <Panel id="mistakes" className="section" title={`Mistake log (${mistakes.length})`} action={<span className="tiny muted">Reread this before every mock — it is your personal list of missed signals</span>} flush>
        {mistakes.length === 0 ? <p className="empty">Empty. When a blind assessment or OOP challenge needs hints, write down the signal you missed; notes on problems marked Needs Review, Attempted or Solved With Help appear here too.</p> : (
          <ul className="item-list">{mistakes.slice(0, 40).map((m, i) => { const info = practiceInfo(m.key); return (
            <li key={`${m.key}${m.date}${i}`} className="item">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>{info ? <Link className="title" href={info.href}>{info.title}</Link> : <span className="title">{m.key}</span>}<span className="tiny muted">{formatDate(m.date)} · {OUTCOME_LABELS[m.outcome]}</span></div>
                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{m.mistake}</div>
              </div>
              <span className="badge">{info?.kind ?? 'Note'}</span>
            </li>
          ); })}</ul>
        )}
      </Panel>
      <Panel className="section" title={`Recovered — missed before, correct now (${recovered.length})`} action={<span className="tiny muted">Retrying never erases history</span>} flush>
        {recovered.length === 0 ? <p className="empty">Nothing yet. Items you miss and later answer correctly appear here with their miss count.</p> : (
          <ul className="item-list">{recovered.map((r) => { const l = recoveredLink(r); return (
            <li key={`${r.kind}${r.id}`} className="item"><span className="row" style={{ gap: 10 }}><CheckCircle2 size={16} className="check-icon" aria-hidden="true" /><Link href={l.href} className="small">{l.label}</Link></span><span className="badge">{l.type} · missed {r.misses}×</span></li>
          ); })}</ul>
        )}
      </Panel>
      <Panel className="section" title={`Solved with help (${withHelp.length})`} action={<span className="tiny muted">Mark one for another attempt to queue it today</span>} flush>
        {withHelp.length === 0 ? <p className="empty">None.</p> : (
          <ul className="item-list">{withHelp.map((p) => (
            <li key={p.id} className="item">
              <Link className="title" href={`/tracker/${p.id}`}>{p.id}. {p.title}</Link>
              <button className="btn small" onClick={() => update((pr) => updateProblemFields(pr, p.id, { retry: true }))} disabled={problemRecord(progress, p.id).retry}>{problemRecord(progress, p.id).retry ? 'Queued' : 'Attempt again'}</button>
            </li>
          ))}</ul>
        )}
      </Panel>
      <Panel className="section" title={`Solved independently (${independent.length})`} flush>
        {independent.length === 0 ? <p className="empty">None yet.</p> : <ul className="item-list">{independent.map((p) => <ProblemItem key={p.id} problem={p} progress={progress} />)}</ul>}
      </Panel>
      <Panel className="section" title={`Not yet retained (${upcoming.length})`} flush>
        {upcoming.length === 0 ? <p className="empty">Nothing in progress.</p> : <ul className="item-list">{upcoming.map(({ p }) => <ProblemItem key={p.id} problem={p} progress={progress} />)}</ul>}
      </Panel>
    </>
  );
}
