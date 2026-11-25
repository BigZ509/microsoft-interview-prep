'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, XCircle } from 'lucide-react';
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
import { PageHeader, Panel, ProgressBar, Stat } from './ui';

export function BigOIndex() {
  const progress = useProgress();
  const groups = new Map<string, Drill[]>();
  for (const d of drills) groups.set(d.module, [...(groups.get(d.module) ?? []), d]);
  const attempted = drills.filter((d) => progress.drills[d.id]).length;
  const correct = drills.filter((d) => progress.drills[d.id]?.time && progress.drills[d.id]?.space).length;
  const firstNew = drills.find((d) => !progress.drills[d.id]);

  return (
    <>
      <PageHeader
        eyebrow="Big-O Lab"
        title="Big-O Analyzer Training"
        description="Read an original Python snippet, then commit to the time complexity, auxiliary space, dominant operation, your reasoning, and an optimization. The step-by-step derivation appears only after you submit. Some drills are traps: nested loops that are linear, one-line calls that hide loops, recursion that is not exponential."
        actions={firstNew && <Link className="btn primary" href={`/big-o/${firstNew.id}`}>Start next drill <ArrowRight size={14} /></Link>}
      />
      <div className="stats" style={{ marginBottom: 'var(--s5)' }}>
        <Stat label="Drills attempted" value={`${attempted}/${drills.length}`} hint={<ProgressBar value={attempted} max={drills.length} />} />
        <Stat label="Fully correct (latest attempt)" value={correct} tone="good" hint="Time and space both right" />
        <Stat label="To revisit" value={attempted - correct} hint="Shown in your review queue" />
      </div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Panel title="Growth rates at a glance"><GrowthChart /></Panel>
        <Panel title="The method">
          <ol className="steps">
            <li>Name the size variables (<code>n</code>, <code>m</code>, <code>k</code>…).</li>
            <li>Cost each line honestly — including hidden loops in <code>in</code>, slicing, <code>sorted</code>, <code>pop(0)</code>.</li>
            <li>Multiply by how many times the line runs; for inner loops ask how far the pointer can move <em>in total</em>.</li>
            <li>Add sequential parts, keep the dominant term, drop constants.</li>
            <li>Space: what you store + the deepest recursion; say whether output counts.</li>
          </ol>
          <p className="small muted" style={{ marginBottom: 0 }}>Need the theory first? <Link href="/learn/big-o">Module 2 — Big-O and Complexity Analysis</Link>.</p>
        </Panel>
      </div>
      {[...groups.entries()].map(([moduleId, list]) => (
        <section key={moduleId} className="section">
          <div className="section-title" style={{ marginTop: 0 }}>
            <h2>{getModule(moduleId)?.title ?? moduleId}</h2>
            <span className="tiny muted">{list.filter((d) => progress.drills[d.id]).length}/{list.length} attempted</span>
          </div>
          <ul className="item-list">
            {list.map((d) => {
              const rec = progress.drills[d.id];
              const ok = rec?.time && rec?.space;
              return (
                <li key={d.id} className="item">
                  <span className="row" style={{ gap: 10 }}>
                    {ok ? <CheckCircle2 size={17} className="check-icon" aria-label="Correct" /> : rec ? <XCircle size={17} style={{ color: 'var(--warn)', flex: 'none' }} aria-label="Needs review" /> : <Circle size={17} className="todo-icon" aria-label="Not attempted" />}
                    <span style={{ minWidth: 0 }}>
                      <Link className="title" href={`/big-o/${d.id}`}>{d.title}</Link>
                      <span className="meta" style={{ display: 'block' }}>{rec ? d.tags.join(' · ') : 'Topics revealed after your first attempt'}</span>
                    </span>
                  </span>
                  {rec ? <span className={`status ${ok ? 'good' : 'warn'}`}>{ok ? 'Correct' : 'Review'}</span> : <span className="status">New</span>}
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
    <span className={`status ${ok ? 'good' : 'bad'}`}>
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {label}
    </span>
  );
}

export function DrillRunner({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const index = drills.findIndex((d) => d.id === id);
  const d = drills[index];
  const next = drills[index + 1];
  const prevDrill = drills[index - 1];
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
  const stepDone = [!!time, !!space, dominant !== null, why.trim().length >= 10, opt.trim().length > 0];

  return (
    <>
      <PageHeader
        eyebrow={<><Link href="/big-o">Big-O Lab</Link> · Drill {index + 1} of {drills.length}</>}
        title={d.title}
        actions={embedded ? undefined : <>
          {prevDrill && <Link className="btn small ghost" href={`/big-o/${prevDrill.id}`}>← Previous</Link>}
          {next && <Link className="btn small ghost" href={`/big-o/${next.id}`}>Skip →</Link>}
        </>}
      >
        {previous && !submitted && <p className="small muted" style={{ marginTop: 8 }}>Previous attempt: time {previous.time ? '✓' : '✗'}, space {previous.space ? '✓' : '✗'} ({previous.attempts} attempt{previous.attempts === 1 ? '' : 's'}{previous.misses ? `, missed ${previous.misses}×` : ''}). Retrying adds a new attempt; your history is kept.</p>}
      </PageHeader>

      <div className="lab">
        <div className="lab-code">
          <div className="code-frame">
            <div className="code-bar"><span>snippet.py</span><span>Read it line by line</span></div>
            <CodeBlock code={d.code} />
          </div>
          <div className="callout" style={{ marginTop: 0 }}><strong>Size variables:</strong> <span className="mono small">{d.sizes}</span></div>
        </div>

        <div className="panel">
          <div className="q-block">
            <h3><span className={`step-dot${stepDone[0] ? ' done' : ''}`}>1</span>Time complexity</h3>
            <div className="chip-group" role="group" aria-label="Time complexity">
              {d.timeOptions.map((o) => <button key={o} className={chipCls(o, time, d.time)} aria-pressed={time === o} disabled={submitted} onClick={() => setTime(o)}>{o}</button>)}
            </div>
          </div>
          <div className="q-block">
            <h3><span className={`step-dot${stepDone[1] ? ' done' : ''}`}>2</span>Auxiliary space</h3>
            <div className="chip-group" role="group" aria-label="Space complexity">
              {d.spaceOptions.map((o) => <button key={o} className={chipCls(o, space, d.space)} aria-pressed={space === o} disabled={submitted} onClick={() => setSpace(o)}>{o}</button>)}
            </div>
          </div>
          <div className="q-block">
            <h3><span className={`step-dot${stepDone[2] ? ' done' : ''}`}>3</span>Which operation dominates?</h3>
            <div className="choices" style={{ margin: 0 }}>
              {d.dominantOptions.map((o, i) => (
                <button key={i} disabled={submitted} aria-pressed={dominant === i} onClick={() => setDominant(i)}
                  className={submitted ? (i === d.dominant ? 'choice correct' : i === dominant ? 'choice wrong' : 'choice') : 'choice'}>
                  <span className="letter">{String.fromCharCode(65 + i)}</span><span><Inline text={o} /></span>
                </button>
              ))}
            </div>
          </div>
          <div className="q-block">
            <label className="field"><span className="row" style={{ gap: 10, fontSize: 'var(--fs-base)', color: 'var(--ink)' }}><span className={`step-dot${stepDone[3] ? ' done' : ''}`}>4</span>Explain why</span>
              <span className="hint">Count the work like you would out loud (at least a sentence).</span>
              <textarea value={why} onChange={(e) => setWhy(e.target.value)} disabled={submitted} />
            </label>
          </div>
          <div className="q-block">
            <label className="field"><span className="row" style={{ gap: 10, fontSize: 'var(--fs-base)', color: 'var(--ink)' }}><span className={`step-dot${stepDone[4] ? ' done' : ''}`}>5</span>Suggest an optimization <span className="muted" style={{ fontWeight: 400 }}>(if any)</span></span>
              <textarea value={opt} onChange={(e) => setOpt(e.target.value)} disabled={submitted} style={{ minHeight: 60 }} />
            </label>
            {!submitted && (
              <div className="row" style={{ marginTop: 'var(--s3)' }}>
                <button className="btn primary" disabled={!canSubmit} onClick={submit}>Submit analysis</button>
                {!canSubmit && <span className="tiny muted">Answer 1–3 and write a short explanation first.</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {submitted && (
        <Panel className="section" title="Step-by-step derivation" action={<span className="small muted">Compare with your reasoning</span>}>
          <div className="result-row" aria-live="polite">
            <Result ok={time === d.time} label={`Time: ${d.time}`} />
            <Result ok={space === d.space} label={`Space: ${d.space}`} />
            <Result ok={dominant === d.dominant} label="Dominant operation" />
          </div>
          <ol className="steps timeline">{d.derivation.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ol>
          <div className="grid-2">
            <div className="fact"><div className="k">Space</div><Inline text={d.spaceWhy} /></div>
            <div className="fact"><div className="k">Optimization</div><Inline text={d.optimization} /></div>
          </div>
          {d.trap && <div className="callout warn"><strong>Common trap:</strong> <Inline text={d.trap} /></div>}
          {why && <div className="your-answer"><span className="k">Your explanation</span>{why}<br /><span className="tiny muted">Did you name the variables, count the hidden work, and identify the dominant term?</span></div>}
          {opt && <div className="your-answer"><span className="k">Your optimization idea</span>{opt}</div>}
          {problem && <><div className="exercise-label">Where this shows up</div><ul className="item-list"><ProblemItem problem={problem} progress={progress} /></ul></>}
          <div className="row" style={{ marginTop: 'var(--s4)' }}>
            <button className="btn" onClick={reset}>Try again</button>
            {!embedded && (next ? <Link className="btn primary" href={`/big-o/${next.id}`}>Next drill: {next.title} <ArrowRight size={14} /></Link> : <Link className="btn primary" href="/big-o">Back to all drills</Link>)}
          </div>
        </Panel>
      )}
    </>
  );
}
