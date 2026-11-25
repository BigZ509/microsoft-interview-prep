'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, EyeOff, Lightbulb, RotateCcw } from 'lucide-react';
import { BLIND_APPROACHES, CHARACTERISTIC_PROMPTS, blindItems, getBlindItem } from '@/content/blind';
import { getLesson } from '@/content/modules';
import { getProblem, leetCodeUrl } from '@/content/problems';
import { formatDate } from '@/lib/dates';
import { blindForDay } from '@/lib/plan';
import {
  OUTCOME_LABELS, PRACTICE_OUTCOMES, lastAttempt, practiceDue, practiceIndependentDays, practiceRecord,
  recordPracticeOutcome, restartPractice, revealPractice, setPracticeDraft, takeHint, type PracticeOutcome, type PracticeRecord,
} from '@/lib/progress';
import { update, useHydrated, useProgress, useToday } from '@/lib/store';
import type { BlindItem } from '@/content/types';
import { CodeBlock } from './code-block';
import { DifficultyBadge, EmptyState, PageHeader, Panel } from './ui';

const EVIDENCE_BADGE: Record<string, string> = {
  'colorstack-reported': 'Reported question',
  'github-historical': 'Historical report',
  'colorstack-recommended': 'Recommended practice',
};

export function practiceStatus(rec: PracticeRecord): { label: string; tone: '' | 'good' | 'warn' } {
  const last = lastAttempt(rec);
  if (!last) return rec.revealed || Object.values(rec.draft).some((v) => v.trim()) ? { label: 'In progress', tone: '' } : { label: 'New', tone: '' };
  if (last.outcome === 'independent') return practiceIndependentDays(rec) >= 2 ? { label: 'Retained (2 days)', tone: 'good' } : { label: 'Solved on my own', tone: 'good' };
  return { label: last.outcome === 'missed' ? 'Missed — retry' : 'Needed hints — retry', tone: 'warn' };
}

// ------------------------------------------------------------------ hub

export function BlindHub() {
  const today = useToday();
  const hydrated = useHydrated();
  const progress = useProgress();
  if (!today || !hydrated) return <p className="muted">Loading…</p>;
  const todays = blindForDay(today, progress);

  return (
    <>
      <PageHeader
        eyebrow="Practice · Independent solve"
        title="Blind assessments"
        description="Unlabeled questions: the pattern, difficulty and solution stay hidden until you commit to an approach. This trains the skill interviews actually test — choosing an approach for a problem that does not name its pattern. Talk out loud, aim for about 25 minutes each, and treat a hint as information, not failure."
      />
      <Panel id="today-blind" title={`Today’s assessments (${todays.length})`} icon={<EyeOff size={16} aria-hidden="true" />} action={<span className="tiny muted">Picked from topics taught on earlier days</span>} flush>
        {todays.length === 0 ? <EmptyState>No blind assessments today. Use the review queue or pick any assessment below.</EmptyState> : (
          <ul className="item-list">{todays.map((b) => <BlindRow key={b.id} item={b} rec={practiceRecord(progress, `blind:${b.id}`)} />)}</ul>
        )}
      </Panel>

      <Panel className="section" title="The method (same for every question)">
        <ol style={{ margin: 0 }}>
          <li>Restate the problem and the exact output; ask clarifying questions.</li>
          <li>List the characteristics you notice (sorted? contiguous? pairs? matching? linked? constraints?).</li>
          <li>Choose a data structure or approach and say why the characteristics point there.</li>
          <li>State a brute force and its Big-O, find its bottleneck, and remove it.</li>
          <li>Code it, trace an example, test edge cases, give final time and space.</li>
        </ol>
        <p className="small muted" style={{ margin: 'var(--s3) 0 0' }}>The lesson <Link href="/learn/solving/characteristics">Read the problem for characteristics</Link> and <Link href="/learn/solving/brute-to-optimal">Brute force → bottleneck → optimized</Link> teach this method.</p>
      </Panel>

      <Panel className="section" title={`All assessments (${blindItems.length})`} action={<span className="tiny muted">Names are neutral on purpose</span>} flush>
        <ul className="item-list">{blindItems.map((b) => <BlindRow key={b.id} item={b} rec={practiceRecord(progress, `blind:${b.id}`)} today={today} />)}</ul>
      </Panel>
    </>
  );
}

function BlindRow({ item, rec, today }: { item: BlindItem; rec: PracticeRecord; today?: string }) {
  const status = practiceStatus(rec);
  const due = practiceDue(rec);
  const early = today && item.unlock > today;
  return (
    <li className="item">
      <div style={{ minWidth: 0, flex: 1 }}>
        <Link className="title" href={`/blind/${item.id}`}>{item.codename}</Link>
        <div className="tiny muted">
          {item.evidence ? `${EVIDENCE_BADGE[item.evidence]} · ` : ''}
          {early ? `Concepts taught ${formatDate(item.unlock)}` : rec.attempts.length ? `${rec.attempts.length} attempt${rec.attempts.length === 1 ? '' : 's'}${due ? ` · review ${formatDate(due)}` : ''}` : 'Not attempted'}
        </div>
      </div>
      <span className={`status ${status.tone}`}>{status.label}</span>
    </li>
  );
}

// ------------------------------------------------------------------ session

const FIELDS: { id: string; title: string; prompt: string; mono?: boolean }[] = [
  { id: 'clarify', title: 'Restate and clarify', prompt: 'In one sentence, what are the input and the exact output? What would you ask the interviewer?' },
  { id: 'signals', title: 'Characteristics you notice', prompt: 'List every property of the input, output and constraints that could matter.' },
  { id: 'brute', title: 'Brute force and its Big-O', prompt: 'A simple correct approach. Time and space, naming the size variables.' },
  { id: 'bottleneck', title: 'Bottleneck', prompt: 'Which line runs the most? What question does it keep re-answering?' },
  { id: 'optimized', title: 'Optimized approach', prompt: 'How do you remove the bottleneck? Final time and space, and the trade-off.' },
  { id: 'code', title: 'Code', prompt: 'Write the Python solution here (or in your editor and paste it). This app does not run code.', mono: true },
  { id: 'tests', title: 'Trace and test', prompt: 'Trace one example. List edge cases and what your code returns for each.' },
];

export function BlindSession({ id }: { id: string }) {
  const today = useToday();
  const hydrated = useHydrated();
  const progress = useProgress();
  const item = getBlindItem(id)!;
  const key = `blind:${id}`;
  if (!today || !hydrated) return <p className="muted">Loading…</p>;
  const rec = practiceRecord(progress, key);
  const d = rec.draft;
  const set = (field: string, value: string) => update((p) => setPracticeDraft(p, key, field, value));
  const committed = Boolean(d.signals?.trim() && d.structure && (d.brute?.trim() || d.optimized?.trim()));
  const last = lastAttempt(rec);
  const recordedThisRound = rec.revealed && last && rec.attempts.length > 0 && d.__recorded === String(rec.attempts.length);
  const problem = item.answer.problem ? getProblem(item.answer.problem) : undefined;

  return (
    <>
      <PageHeader
        eyebrow={<><Link href="/blind">Blind assessments</Link> · Independent solve</>}
        title={item.codename}
        description="Work through the steps on the right. The reveal unlocks once you have written your characteristics, chosen an approach, and described a brute force or an optimized plan."
        actions={rec.revealed ? <button className="btn small" onClick={() => update((p) => restartPractice(p, key))}><RotateCcw size={14} aria-hidden="true" /> Fresh attempt</button> : undefined}
      />
      {rec.attempts.length > 0 && (
        <p className="small muted" style={{ marginTop: 0 }}>
          History: {rec.attempts.map((a) => `${formatDate(a.date)} — ${OUTCOME_LABELS[a.outcome]}${a.hints ? ` (${a.hints} hint${a.hints === 1 ? '' : 's'})` : ''}`).join(' · ')}
        </p>
      )}
      <div className="lab">
        <div className="lab-code stack">
          <Panel title="The question">
            {item.evidence && <span className="badge accent" style={{ marginBottom: 'var(--s3)' }}>{EVIDENCE_BADGE[item.evidence]}</span>}
            <p>{item.statement}</p>
            <div className="exercise-label">Examples</div>
            <ul className="small">{item.examples.map((e) => <li key={e}><code>{e}</code></li>)}</ul>
            <div className="exercise-label">Constraints</div>
            <ul className="small" style={{ marginBottom: 0 }}>{item.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
          </Panel>
          <Panel title={`Interviewer hints (${rec.hints}/${item.hints.length} used)`} icon={<Lightbulb size={16} aria-hidden="true" />}>
            {item.hints.slice(0, rec.hints).map((h, i) => (
              <div key={i} style={{ marginBottom: 'var(--s3)' }}>
                <div className="callout" style={{ marginTop: 0 }}><strong>Hint {i + 1}:</strong> {h}</div>
                {!rec.revealed && (
                  <label className="field">How do you respond? <span className="hint">Acknowledge it, restate what it implies, say what you will change.</span>
                    <textarea style={{ minHeight: 56 }} value={d[`hint-${i}`] ?? ''} onChange={(e) => set(`hint-${i}`, e.target.value)} />
                  </label>
                )}
              </div>
            ))}
            {!rec.revealed && rec.hints < item.hints.length && (
              <button className="btn small" onClick={() => update((p) => takeHint(p, key, item.hints.length))}>Ask for {rec.hints === 0 ? 'a hint' : 'another hint'}</button>
            )}
            {rec.hints === 0 && <p className="tiny muted" style={{ margin: 'var(--s2) 0 0' }}>Hints are recorded. Using one means the attempt counts as “needed hints”.</p>}
          </Panel>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="q-block">
            <h3><span className="step-dot">1</span> {FIELDS[0].title}</h3>
            <BlindField field={FIELDS[0]} value={d.clarify ?? ''} onChange={(v) => set('clarify', v)} disabled={rec.revealed} />
          </div>
          <div className="q-block">
            <h3><span className="step-dot">2</span> {FIELDS[1].title}</h3>
            <ul className="tiny muted" style={{ margin: '0 0 var(--s2)' }}>{CHARACTERISTIC_PROMPTS.map((q) => <li key={q}>{q}</li>)}</ul>
            <BlindField field={FIELDS[1]} value={d.signals ?? ''} onChange={(v) => set('signals', v)} disabled={rec.revealed} />
          </div>
          <div className="q-block">
            <h3><span className="step-dot">3</span> Choose the main data structure or approach</h3>
            <div className="chip-group" role="group" aria-label="Approach">
              {BLIND_APPROACHES.map((a) => (
                <button key={a} type="button" className={`chip${rec.revealed && a === item.answer.structure ? ' correct' : rec.revealed && a === d.structure ? ' wrong' : ''}`} aria-pressed={d.structure === a} disabled={rec.revealed} onClick={() => set('structure', a)}>{a}</button>
              ))}
            </div>
            <label className="field" style={{ marginTop: 'var(--s3)' }}>Why do the characteristics point there?
              <textarea style={{ minHeight: 56 }} value={d.structureWhy ?? ''} disabled={rec.revealed} onChange={(e) => set('structureWhy', e.target.value)} />
            </label>
          </div>
          {FIELDS.slice(2).map((f, i) => (
            <div key={f.id} className="q-block">
              <h3><span className="step-dot">{i + 4}</span> {f.title}</h3>
              <BlindField field={f} value={d[f.id] ?? ''} onChange={(v) => set(f.id, v)} disabled={rec.revealed} />
            </div>
          ))}
          {!rec.revealed && (
            <div className="q-block">
              <button className="btn primary" disabled={!committed} onClick={() => update((p) => revealPractice(p, key))}>Reveal the reference approach</button>
              {!committed && <p className="tiny muted" style={{ margin: 'var(--s2) 0 0' }}>Write your characteristics, choose an approach, and describe a brute force or optimized plan first.</p>}
            </div>
          )}
        </div>
      </div>

      {rec.revealed && (
        <section className="section" aria-label="Reference approach">
          <div className="section-title" style={{ marginTop: 0 }}><h2>Reference approach</h2><span className="row" style={{ gap: 8 }}><DifficultyBadge difficulty={item.answer.difficulty} />{item.evidenceNote && <span className="tiny muted">{item.evidenceNote}</span>}</span></div>
          <div className={`callout ${d.structure === item.answer.structure ? 'good' : 'warn'}`}>
            <strong>{d.structure === item.answer.structure ? 'Your approach matches.' : `You chose “${d.structure ?? 'nothing'}”; the reference uses “${item.answer.structure}”.`}</strong>{' '}
            Pattern: {item.answer.pattern}. {d.structure !== item.answer.structure && 'A different approach can still be correct — compare its Big-O with the reference below.'}
          </div>
          <div className="fact-grid">
            <div className="fact wide"><div className="k">Signals in the statement</div><ul style={{ margin: 0 }}>{item.answer.signals.map((s) => <li key={s}>{s}</li>)}</ul></div>
            <div className="fact"><div className="k">Brute force · {item.answer.brute.time} time · {item.answer.brute.space} space</div>{item.answer.brute.idea}</div>
            <div className="fact"><div className="k">Bottleneck</div>{item.answer.bottleneck}</div>
            <div className="fact wide decide"><div className="k">Optimized · {item.answer.optimized.time} time · {item.answer.optimized.space} space</div>{item.answer.optimized.idea}</div>
            <div className="fact"><div className="k">Edge cases</div><ul style={{ margin: 0 }}>{item.answer.edgeCases.map((s) => <li key={s}>{s}</li>)}</ul></div>
            <div className="fact"><div className="k">Interviewer follow-up</div>{item.followUp}</div>
          </div>
          <div className="exercise-label">Reference solution</div>
          <div className="code-frame"><CodeBlock code={item.answer.solution} /></div>
          <p className="small">
            Revisit: {item.answer.lessons.map((k, i) => { const ref = getLesson(k); return ref && <span key={k}>{i > 0 && ' · '}<Link href={`/learn/${k}`}>{ref.lesson.title}</Link></span>; })}
            {problem && <> · Practice it on LeetCode: <a href={leetCodeUrl(problem)} target="_blank" rel="noreferrer">{problem.id}. {problem.title}</a> (<Link href={`/tracker/${problem.id}`}>tracker</Link>)</>}
          </p>
          <OutcomeForm key={rec.attempts.length} hints={rec.hints} recorded={Boolean(recordedThisRound)} lastOutcome={last?.outcome} onSave={(outcome, mistake) => update((p) => {
            const next = recordPracticeOutcome(p, key, outcome, mistake, today);
            return setPracticeDraft(next, key, '__recorded', String(practiceRecord(next, key).attempts.length));
          })} due={practiceDue(rec)} />
        </section>
      )}
    </>
  );
}

function BlindField({ field, value, onChange, disabled }: { field: (typeof FIELDS)[number]; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <label className="field"><span className="hint" style={{ marginLeft: 0 }}>{field.prompt}</span>
      <textarea value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={field.mono ? { fontFamily: 'var(--font-mono, ui-monospace, monospace)', minHeight: 140 } : undefined} spellCheck={!field.mono} />
    </label>
  );
}

/** Self-assessment after a reveal. Shared by blind assessments and OOP challenges. */
export function OutcomeForm({ hints, recorded, lastOutcome, onSave, due }: {
  hints: number; recorded: boolean; lastOutcome?: PracticeOutcome; onSave: (o: PracticeOutcome, mistake: string) => void; due: string | null;
}) {
  if (recorded && lastOutcome) {
    return (
      <div className="callout good" role="status">
        <CheckCircle2 size={16} className="check-icon" aria-hidden="true" /> Recorded: <strong>{OUTCOME_LABELS[lastOutcome]}</strong>.{' '}
        {due ? `It comes back for review on ${formatDate(due)}.` : 'Retained — solved on your own on two different days.'} Use “Fresh attempt” to try again cold later.
      </div>
    );
  }
  return <OutcomeEditor hints={hints} onSave={onSave} />;
}

function OutcomeEditor({ hints, onSave }: { hints: number; onSave: (o: PracticeOutcome, mistake: string) => void }) {
  const [outcome, setOutcome] = useState<PracticeOutcome | null>(null);
  const [mistake, setMistake] = useState('');
  const needsNote = outcome !== null && outcome !== 'independent';
  return (
    <Panel title="How did it go?" className="section">
      <div className="segmented" role="group" aria-label="Outcome">
        {PRACTICE_OUTCOMES.map((o) => (
          <button key={o} aria-pressed={outcome === o} disabled={o === 'independent' && hints > 0} onClick={() => setOutcome(o)}>{OUTCOME_LABELS[o]}</button>
        ))}
      </div>
      {hints > 0 && <p className="tiny muted" style={{ margin: 'var(--s2) 0 0' }}>You used {hints} hint{hints === 1 ? '' : 's'}, so this attempt is recorded as “needed hints” at best.</p>}
      <label className="field" style={{ marginTop: 'var(--s3)' }}>
        {needsNote ? 'Which signal did you miss, and what will you look for next time? (required)' : 'Note for your mistake log (optional)'}
        <textarea value={mistake} onChange={(e) => setMistake(e.target.value)} placeholder="e.g. I saw “sorted” but didn’t connect it to moving two pointers inward." />
      </label>
      <button className="btn primary" style={{ marginTop: 'var(--s3)' }} disabled={outcome === null || (needsNote && !mistake.trim())} onClick={() => outcome && onSave(outcome, mistake)}>Record attempt</button>
    </Panel>
  );
}
