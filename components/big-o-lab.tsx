'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { drills } from '@/content/drills';
import { getModule } from '@/content/modules';
import { getProblem } from '@/content/problems';
import type { Drill } from '@/content/types';
import { recordDrill } from '@/lib/progress';
import { update, useProgress, useToday } from '@/lib/store';
import { toDateKey } from '@/lib/dates';
import { CodeBlock } from './code-block';
import { Inline } from './rich';
import { GrowthChart } from './visualizer';
import { ProblemItem } from './problem-ui';

export function BigOIndex() {
  const progress = useProgress();
  const groups = new Map<string, Drill[]>();
  for (const d of drills) groups.set(d.module, [...(groups.get(d.module) ?? []), d]);
  const attempted = drills.filter((d) => progress.drills[d.id]).length;
  const correct = drills.filter((d) => progress.drills[d.id]?.time && progress.drills[d.id]?.space).length;

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Big-O Lab</div>
        <h1>Big-O Analyzer Training</h1>
        <p>Read an original Python snippet, then commit to the time complexity, the auxiliary space, the dominant operation, your reasoning, and an optimization. Only after you submit do you see the step-by-step derivation. Several drills are traps — nested loops that are linear, one-line calls that hide loops, recursion that is not exponential.</p>
        <p className="small">{attempted}/{drills.length} attempted · {correct} fully correct (time and space) on the latest attempt.</p>
      </div>
      <div className="grid-2">
        <div className="card">
          <h2>Growth rates at a glance</h2>
          <GrowthChart />
        </div>
        <div className="card">
          <h2>The method</h2>
          <ol className="steps">
            <li>Name the size variables (<code>n</code>, <code>m</code>, <code>k</code>…).</li>
            <li>Cost each line honestly — including hidden loops in <code>in</code>, slicing, <code>sorted</code>, <code>pop(0)</code>.</li>
            <li>Multiply by how many times the line runs; for inner loops ask how far the pointer can move <em>in total</em>.</li>
            <li>Add sequential parts, keep the dominant term, drop constants.</li>
            <li>Space: what you store + the deepest recursion; say whether output counts.</li>
          </ol>
          <p className="small">Need the theory first? <Link href="/learn/big-o">Module 2 — Big-O and Complexity Analysis</Link>.</p>
        </div>
      </div>
      {[...groups.entries()].map(([moduleId, list]) => (
        <section key={moduleId} className="section">
          <h2>{getModule(moduleId)?.title ?? moduleId}</h2>
          <ul className="item-list">
            {list.map((d) => {
              const rec = progress.drills[d.id];
              const ok = rec?.time && rec?.space;
              return (
                <li key={d.id} className={`item${ok ? ' done' : ''}`}>
                  <div>
                    <Link className="title" href={`/big-o/${d.id}`}>{d.title}</Link>
                    <div className="tiny muted">{rec ? d.tags.join(' · ') : 'Topics revealed after your first attempt'}</div>
                  </div>
                  <div className="row">
                    {rec ? <span className={`badge ${ok ? 'good' : 'warn'}`}>{ok ? 'Correct' : 'Review'}</span> : <span className="badge">New</span>}
                    <Link className="btn small" href={`/big-o/${d.id}`}>{rec ? 'Retry' : 'Analyze'}</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

function Result({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`badge ${ok ? 'good' : 'bad'}`}>
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {label}
    </span>
  );
}

export function DrillRunner({ id }: { id: string }) {
  const index = drills.findIndex((d) => d.id === id);
  const d = drills[index];
  const next = drills[index + 1];
  const progress = useProgress();
  const today = useToday() ?? toDateKey(new Date());
  const [time, setTime] = useState<string | null>(null);
  const [space, setSpace] = useState<string | null>(null);
  const [dominant, setDominant] = useState<number | null>(null);
  const [why, setWhy] = useState('');
  const [opt, setOpt] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const problem = d.problem ? getProblem(d.problem) : undefined;
  const previous = progress.drills[d.id];

  const canSubmit = time && space && dominant !== null && why.trim().length >= 10;
  const submit = () => {
    setSubmitted(true);
    update((p) => recordDrill(p, d.id, { time: time === d.time, space: space === d.space, dominant: dominant === d.dominant, explanation: why }, today));
  };
  const reset = () => { setTime(null); setSpace(null); setDominant(null); setWhy(''); setOpt(''); setSubmitted(false); };

  const chipCls = (value: string, picked: string | null, answer: string) =>
    submitted ? (value === answer ? 'chip correct' : value === picked ? 'chip wrong' : 'chip') : 'chip';

  return (
    <>
      <div className="page-head">
        <div className="eyebrow"><Link href="/big-o">Big-O Lab</Link> · Drill {index + 1} of {drills.length}</div>
        <h1>{d.title}</h1>
        {previous && !submitted && <p className="small">Previous attempt: time {previous.time ? '✓' : '✗'}, space {previous.space ? '✓' : '✗'} ({previous.attempts} attempt{previous.attempts === 1 ? '' : 's'}{previous.misses ? `, missed ${previous.misses}×` : ''}). Retrying adds a new attempt; your history is kept.</p>}
      </div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          <CodeBlock code={d.code} />
          <div className="callout"><strong>Sizes:</strong> {d.sizes}</div>
        </div>
        <div className="stack">
          <div className="card">
            <h3>1. Time complexity</h3>
            <div className="chip-group" role="group" aria-label="Time complexity">
              {d.timeOptions.map((o) => <button key={o} className={chipCls(o, time, d.time)} aria-pressed={time === o} disabled={submitted} onClick={() => setTime(o)}>{o}</button>)}
            </div>
            <h3 style={{ marginTop: 14 }}>2. Auxiliary space</h3>
            <div className="chip-group" role="group" aria-label="Space complexity">
              {d.spaceOptions.map((o) => <button key={o} className={chipCls(o, space, d.space)} aria-pressed={space === o} disabled={submitted} onClick={() => setSpace(o)}>{o}</button>)}
            </div>
          </div>
          <div className="card">
            <h3>3. Which operation dominates?</h3>
            <div className="choices">
              {d.dominantOptions.map((o, i) => (
                <button key={i} disabled={submitted} aria-pressed={dominant === i} onClick={() => setDominant(i)}
                  className={submitted ? (i === d.dominant ? 'choice correct' : i === dominant ? 'choice wrong' : 'choice') : 'choice'}>
                  <span className="letter">{String.fromCharCode(65 + i)}</span><span><Inline text={o} /></span>
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <label className="field">4. Explain why <span className="hint">Count the work like you would out loud (at least a sentence).</span>
              <textarea value={why} onChange={(e) => setWhy(e.target.value)} disabled={submitted} />
            </label>
            <label className="field" style={{ marginTop: 10 }}>5. Suggest an optimization (if any)
              <textarea value={opt} onChange={(e) => setOpt(e.target.value)} disabled={submitted} style={{ minHeight: 60 }} />
            </label>
            {!submitted && (
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn primary" disabled={!canSubmit} onClick={submit}>Submit analysis</button>
                {!canSubmit && <span className="tiny muted">Choose all three and write a short explanation first.</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {submitted && (
        <section className="section card" aria-live="polite">
          <div className="row" style={{ marginBottom: 12 }}>
            <Result ok={time === d.time} label={`Time: ${d.time}`} />
            <Result ok={space === d.space} label={`Space: ${d.space}`} />
            <Result ok={dominant === d.dominant} label="Dominant operation" />
          </div>
          <h2>Step-by-step derivation</h2>
          <ol className="steps">{d.derivation.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ol>
          <h3>Space</h3>
          <p><Inline text={d.spaceWhy} /></p>
          {d.trap && <div className="callout warn"><strong>Common trap:</strong> <Inline text={d.trap} /></div>}
          <h3>Optimization</h3>
          <p><Inline text={d.optimization} /></p>
          {why && <div className="callout"><strong>Your explanation:</strong> {why}<br /><span className="tiny muted">Compare it with the derivation: did you name the variables, count the hidden work, and identify the dominant term?</span></div>}
          {opt && <div className="callout"><strong>Your optimization idea:</strong> {opt}</div>}
          {problem && <><h3>Where this shows up</h3><ul className="item-list"><ProblemItem problem={problem} progress={progress} /></ul></>}
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" onClick={reset}>Try again</button>
            {next ? <Link className="btn primary" href={`/big-o/${next.id}`}>Next drill: {next.title} →</Link> : <Link className="btn primary" href="/big-o">Back to all drills</Link>}
          </div>
        </section>
      )}
    </>
  );
}
