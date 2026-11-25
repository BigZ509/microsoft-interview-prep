'use client';

import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { getOopChallenge, oopChallenges } from '@/content/oop-challenges';
import { getLesson } from '@/content/modules';
import { formatDate } from '@/lib/dates';
import { OUTCOME_LABELS, lastAttempt, practiceDue, practiceRecord, recordPracticeOutcome, restartPractice, revealPractice, setPracticeDraft } from '@/lib/progress';
import { update, useHydrated, useProgress, useToday } from '@/lib/store';
import { OutcomeForm, practiceStatus } from './blind';
import { CodeBlock } from './code-block';
import { PageHeader, Panel } from './ui';

export function OopHub() {
  const hydrated = useHydrated();
  const progress = useProgress();
  if (!hydrated) return <p className="muted">Loading…</p>;
  return (
    <>
      <PageHeader
        eyebrow="Practice · Python OOP"
        title="OOP challenge bank"
        description={<>Five progressive challenges, each adding one or two concepts, ending with the <strong>ColorStack-reported simplified Canva</strong> question. Study the linked lessons first, write your own version, then compare with the reference. Kept deliberately small: no design-pattern catalog, no architecture course.</>}
      />
      <ul className="item-list card" style={{ padding: 0 }}>
        {oopChallenges.map((c) => {
          const rec = practiceRecord(progress, `oop:${c.id}`);
          const status = practiceStatus(rec);
          const lessonsDone = c.prereqs.filter((k) => progress.lessons[k]?.done).length;
          return (
            <li key={c.id} className="item" style={{ padding: 'var(--s4) var(--s5)' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className="step-dot">{c.order}</span>
                  <Link className="title" href={`/oop/${c.id}`}>{c.title}</Link>
                  {c.evidence === 'colorstack-reported' && <span className="badge accent">Reported question</span>}
                  {c.evidence === 'github-historical' && <span className="badge">Historical report</span>}
                </div>
                <div className="small muted" style={{ marginTop: 4 }}>{c.concepts.join(' · ')}</div>
                <div className="tiny muted">Prerequisite lessons: {lessonsDone}/{c.prereqs.length} done</div>
              </div>
              <span className={`status ${status.tone}`}>{status.label}</span>
            </li>
          );
        })}
      </ul>
      <Panel className="section" title="Lessons behind these challenges">
        <div className="chip-group">
          {['oop/classes-objects', 'oop/inheritance-composition', 'oop/references-collections', 'oop/copying'].map((k) => (
            <Link key={k} className={`chip${progress.lessons[k]?.done ? ' correct' : ''}`} href={`/learn/${k}`}>{progress.lessons[k]?.done ? '✓ ' : ''}{getLesson(k)?.lesson.title}</Link>
          ))}
        </div>
      </Panel>
    </>
  );
}

export function OopSession({ id }: { id: string }) {
  const today = useToday();
  const hydrated = useHydrated();
  const progress = useProgress();
  const c = getOopChallenge(id)!;
  const key = `oop:${id}`;
  if (!today || !hydrated) return <p className="muted">Loading…</p>;
  const rec = practiceRecord(progress, key);
  const d = rec.draft;
  const set = (field: string, value: string) => update((p) => setPracticeDraft(p, key, field, value));
  const missing = c.prereqs.filter((k) => !progress.lessons[k]?.done);
  const last = lastAttempt(rec);
  const recorded = Boolean(rec.revealed && last && d.__recorded === String(rec.attempts.length));
  const stagesDone = c.stages.filter((_, i) => d[`stage-${i}`] === '1').length;

  return (
    <>
      <PageHeader
        eyebrow={<><Link href="/oop">OOP challenges</Link> · {c.order} of {oopChallenges.length}</>}
        title={c.title}
        description={c.brief}
        actions={rec.revealed ? <button className="btn small" onClick={() => update((p) => restartPractice(p, key))}><RotateCcw size={14} aria-hidden="true" /> Fresh attempt</button> : undefined}
      />
      {c.evidenceNote && <div className={`callout${c.evidence === 'colorstack-reported' ? '' : ''}`}><strong>Source:</strong> {c.evidenceNote}</div>}
      {missing.length > 0 && (
        <div className="callout warn">Study first: {missing.map((k, i) => <span key={k}>{i > 0 && ' · '}<Link href={`/learn/${k}`}>{getLesson(k)?.lesson.title}</Link></span>)}. You can start anyway, but the challenge assumes these.</div>
      )}
      {rec.attempts.length > 0 && <p className="small muted">History: {rec.attempts.map((a) => `${formatDate(a.date)} — ${OUTCOME_LABELS[a.outcome]}`).join(' · ')}</p>}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Panel title="Requirements">
          <ol style={{ margin: 0 }}>{c.requirements.map((r) => <li key={r}>{r}</li>)}</ol>
          {c.inferred.length > 0 && (
            <>
              <div className="exercise-label" style={{ color: 'var(--warn)' }}>Inferred by this app — not in the source</div>
              <ul className="small" style={{ margin: 0 }}>{c.inferred.map((r) => <li key={r}>{r}</li>)}</ul>
              <p className="tiny muted" style={{ margin: 'var(--s2) 0 0' }}>In the interview, ask about these instead of assuming them — or state your assumption out loud.</p>
            </>
          )}
        </Panel>
        <Panel title="Before you code: clarifying questions">
          <ul className="small" style={{ marginTop: 0 }}>{c.clarify.map((q) => <li key={q}>{q}</li>)}</ul>
          <label className="field">Your questions and assumptions
            <textarea value={d.clarify ?? ''} onChange={(e) => set('clarify', e.target.value)} />
          </label>
        </Panel>
      </div>

      <Panel className="section" title={`Build it in stages (${stagesDone}/${c.stages.length})`}>
        <ol className="stack" style={{ gap: 'var(--s2)', margin: 0, paddingLeft: 18 }}>
          {c.stages.map((s, i) => (
            <li key={s}><label className="row" style={{ gap: 8, alignItems: 'start', flexWrap: 'nowrap' }}>
              <input type="checkbox" checked={d[`stage-${i}`] === '1'} onChange={(e) => set(`stage-${i}`, e.target.checked ? '1' : '')} style={{ marginTop: 4 }} />
              <span>{s}</span>
            </label></li>
          ))}
        </ol>
      </Panel>

      <div className="grid-2 section" style={{ alignItems: 'start' }}>
        <Panel title="Starter skeleton">
          <div className="code-frame" style={{ marginBottom: 0 }}><CodeBlock code={c.starter} /></div>
        </Panel>
        <Panel title="Your solution">
          <label className="field"><span className="hint" style={{ marginLeft: 0 }}>Write it in your editor and run it, then paste it here so you can compare and keep it.</span>
            <textarea value={d.code ?? ''} onChange={(e) => set('code', e.target.value)} spellCheck={false} style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', minHeight: 260 }} />
          </label>
          {!rec.revealed && (
            <button className="btn primary" style={{ marginTop: 'var(--s3)' }} disabled={(d.code ?? '').trim().length < 40} onClick={() => update((p) => revealPractice(p, key))}>Compare with the reference</button>
          )}
        </Panel>
      </div>

      {rec.revealed && (
        <section className="section" aria-label="Reference solution">
          <div className="section-title" style={{ marginTop: 0 }}><h2>Reference solution</h2><span className="tiny muted">One correct version — yours can differ and still be right</span></div>
          <div className="code-frame"><CodeBlock code={c.solution} /></div>
          <Panel title="Follow-up questions an interviewer may ask">
            <div className="stack" style={{ gap: 'var(--s3)' }}>
              {c.followUps.map((q, i) => (
                <label key={q} className="field">{q}
                  <textarea style={{ minHeight: 56 }} value={d[`follow-${i}`] ?? ''} onChange={(e) => set(`follow-${i}`, e.target.value)} />
                </label>
              ))}
            </div>
          </Panel>
          <OutcomeForm key={rec.attempts.length} hints={0} recorded={recorded} lastOutcome={last?.outcome} due={practiceDue(rec)} onSave={(outcome, mistake) => update((p) => {
            const next = recordPracticeOutcome(p, key, outcome, mistake, today);
            return setPracticeDraft(next, key, '__recorded', String(practiceRecord(next, key).attempts.length));
          })} />
        </section>
      )}
    </>
  );
}
