'use client';

import Link from 'next/link';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { codeReadings, readingPrompts } from '@/content/code-reading';
import { lastAttempt, practiceRecord, recordPracticeOutcome, restartPractice, revealPractice, setPracticeDraft } from '@/lib/progress';
import { update, useHydrated, useProgress, useToday } from '@/lib/store';
import type { CodeReading } from '@/content/types';
import { CodeBlock } from './code-block';
import { PageHeader } from './ui';

export function CodeReadingPage() {
  const today = useToday();
  const hydrated = useHydrated();
  if (!today || !hydrated) return <p className="muted">Loading…</p>;
  return (
    <>
      <PageHeader
        eyebrow="Study · Code comprehension"
        title="Explain code you did not write"
        description={<>ColorStack members reported being asked to <strong>explain a provided function</strong> (sum of evens, duplicate detection) and to <strong>identify its inputs, outputs and edge cases</strong>. Read each function, write your explanation, then compare. Method: <Link href="/learn/solving/code-reading">Explaining code you did not write</Link>.</>}
      />
      <div className="stack">
        {codeReadings.map((r) => <ReadingCard key={r.id} reading={r} today={today} />)}
      </div>
    </>
  );
}

export function ReadingCard({ reading: r, today: date }: { reading: CodeReading; today: string }) {
    const progress = useProgress();
    const key = `read:${r.id}`;
    const rec = practiceRecord(progress, key);
    const d = rec.draft;
    const set = (field: string, value: string) => update((p) => setPracticeDraft(p, key, field, value));
    const written = readingPrompts.filter((_, i) => (d[`p${i}`] ?? '').trim()).length;
    const last = lastAttempt(rec);
    const recorded = Boolean(rec.revealed && last && d.__recorded === String(rec.attempts.length));
    const record = (covered: boolean) => update((p) => {
      const next = recordPracticeOutcome(p, key, covered ? 'independent' : 'missed', covered ? '' : (d.missed ?? ''), date);
      return setPracticeDraft(next, key, '__recorded', String(practiceRecord(next, key).attempts.length));
    });
    return (
      <article id={r.id} className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{r.title}</h2>
          <span className="row" style={{ gap: 6 }}>
            {r.evidence === 'colorstack-reported' && <span className="badge accent">Reported question type</span>}
            {last && <span className={`status ${last.outcome === 'independent' ? 'good' : 'warn'}`}>{last.outcome === 'independent' ? 'Covered' : 'Missed something'}</span>}
            {rec.revealed && <button className="btn small ghost" onClick={() => update((p) => restartPractice(p, key))}><RotateCcw size={14} aria-hidden="true" /> Redo</button>}
          </span>
        </div>
        {r.evidenceNote && <p className="tiny muted" style={{ margin: '4px 0 0' }}>{r.evidenceNote}</p>}
        <div className="grid-2" style={{ marginTop: 'var(--s3)', alignItems: 'start' }}>
          <div className="code-frame"><CodeBlock code={r.code.split('\nassert')[0]} label={`${r.title} code`} /></div>
          <div className="stack" style={{ gap: 'var(--s2)' }}>
            {readingPrompts.map((q, i) => (
              <label key={q} className="field">{q}
                <textarea style={{ minHeight: 52 }} value={d[`p${i}`] ?? ''} disabled={rec.revealed} onChange={(e) => set(`p${i}`, e.target.value)} />
              </label>
            ))}
            {!rec.revealed && <button className="btn primary small" disabled={written < 3} onClick={() => update((p) => revealPractice(p, key))}>Compare with a model answer</button>}
            {!rec.revealed && written < 3 && <span className="tiny muted">Answer at least three prompts first.</span>}
          </div>
        </div>
        {rec.revealed && (
          <div style={{ marginTop: 'var(--s4)' }}>
            <div className="fact-grid">
              <div className="fact wide decide"><div className="k">Say it in 30 seconds</div>{r.model.explain}</div>
              <div className="fact"><div className="k">Purpose</div>{r.model.purpose}</div>
              <div className="fact"><div className="k">Inputs → outputs</div>{r.model.inputs} {r.model.outputs}</div>
              <div className="fact"><div className="k">Edge cases</div><ul style={{ margin: 0 }}>{r.model.edgeCases.map((e) => <li key={e}>{e}</li>)}</ul></div>
              <div className="fact"><div className="k">Complexity</div>{r.model.complexity}</div>
              {r.model.issues.length > 0 && <div className="fact wide warn"><div className="k">Bugs and risks</div><ul style={{ margin: 0 }}>{r.model.issues.map((e) => <li key={e}>{e}</li>)}</ul></div>}
            </div>
            {recorded ? (
              <p className="small" role="status" style={{ marginBottom: 0 }}><CheckCircle2 size={15} className="check-icon" aria-hidden="true" /> Recorded.</p>
            ) : (
              <div className="row" style={{ marginTop: 'var(--s3)', alignItems: 'end' }}>
                <button className="btn" onClick={() => record(true)}>I covered purpose, I/O, edge cases and complexity</button>
                <label className="field" style={{ flex: '1 1 260px' }}>What did you miss?
                  <input type="text" value={d.missed ?? ''} onChange={(e) => set('missed', e.target.value)} />
                </label>
                <button className="btn" disabled={!(d.missed ?? '').trim()} onClick={() => record(false)}>I missed something</button>
              </div>
            )}
          </div>
        )}
      </article>
    );
  }
