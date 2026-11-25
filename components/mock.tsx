'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { behavioralPrompts, frameworks, mockProblems, mockSteps, productPrompts, productSteps, rubric, starFields, storySlots } from '@/content/mocks';
import { getProblem } from '@/content/problems';
import type { MockSession, Story } from '@/lib/progress';
import { update, useProgress } from '@/lib/store';
import { LeetCodeLink } from './problem-ui';
import { PageHeader, Panel, ProgressBar } from './ui';

export function MockTabs({ active }: { active: 'technical' | 'behavioral' | 'projects' }) {
  return (
    <div className="tabs" role="navigation" aria-label="Mock interview sections">
      <Link href="/mock" aria-current={active === 'technical' ? 'page' : undefined}>Technical mocks</Link>
      <Link href="/mock/behavioral" aria-current={active === 'behavioral' ? 'page' : undefined}>Behavioral & product</Link>
      <Link href="/mock/projects" aria-current={active === 'projects' ? 'page' : undefined}>Projects</Link>
    </div>
  );
}

export function MockHub() {
  const progress = useProgress();
  return (
    <>
      <PageHeader
        eyebrow="Mock Interviews"
        title="Practice explaining and defending solutions"
        description="Each mock follows the interview arc — clarify, brute force, improve, justify, walk through, Big-O, edge cases, trade-offs — one step at a time. Write your answer before revealing talking points. Code on LeetCode or in your own editor; this app does not run code."
      />
      <MockTabs active="technical" />
      <ul className="item-list">
        {mockProblems.map((m) => {
          const sessions = progress.mocks.filter((s) => s.problemId === m.id);
          const lastDone = sessions.filter((s) => s.completedAt).at(-1);
          const avg = lastDone ? Object.values(lastDone.rubric).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(lastDone.rubric).length) : null;
          return (
            <li key={m.id} className="item" style={{ padding: 'var(--s4)' }}>
              <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                <Link className="title" href={`/mock/${m.id}`}>{m.title}</Link>
                {m.label && <span className="badge warn" style={{ marginLeft: 8 }}>Candidate-reported reconstruction</span>}
                <div className="small muted" style={{ marginTop: 2 }}>{m.statement}</div>
              </div>
              <div className="row">
                {avg !== null && <span className="status good">Last self-score {avg.toFixed(1)}/4</span>}
                <span className="meta">{sessions.length} session{sessions.length === 1 ? '' : 's'}</span>
                <Link className="btn small primary" href={`/mock/${m.id}`}>Start</Link>
              </div>
            </li>
          );
        })}
      </ul>
      <Panel className="section" title="How you are scored">
        <ul className="item-list">
          {rubric.map((r) => <li key={r.id} className="item"><strong>{r.label}</strong><span className="small muted" style={{ flex: '1 1 300px' }}>{r.describe}</span></li>)}
        </ul>
        <p className="small muted" style={{ marginTop: 'var(--s3)' }}>Score yourself 0–4 on each at the end of a session. Honest scores are the useful ones.</p>
      </Panel>
    </>
  );
}

function Timer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div className="row">
      <span className={`timer${left < 300 ? ' low' : ''}`} aria-label={`Time remaining ${mm} minutes ${ss} seconds`}>{mm}:{ss}</span>
      <button className="btn small" onClick={() => setRunning(!running)}>{running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> {left === minutes * 60 ? 'Start' : 'Resume'}</>}</button>
      {left === 0 && <span className="badge bad" role="status">Time</span>}
    </div>
  );
}

export function MockSessionView({ id }: { id: string }) {
  const m = mockProblems.find((x) => x.id === id)!;
  const problem = m.leetcode ? getProblem(m.leetcode) : undefined;
  const [minutes, setMinutes] = useState(45);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [current, setCurrent] = useState(0);
  const [sessionId] = useState(() => `${id}-${Date.now().toString(36)}`);
  const [startedAt] = useState(() => Date.now());
  const total = mockSteps.length;
  const answered = mockSteps.filter((s) => (answers[s.id] ?? '').trim().length >= 5).length;
  const onWrapUp = current === total;
  const step = mockSteps[current];

  const persist = () => {
    const session: MockSession = { id: sessionId, problemId: id, startedAt, minutes, answers, rubric: scores, completedAt: Date.now() };
    update((p) => ({ ...p, mocks: [...p.mocks.filter((s) => s.id !== sessionId), session] }));
    setSaved(true);
  };

  return (
    <>
      <PageHeader eyebrow={<><Link href="/mock">Mock Interviews</Link> · Technical</>} title={m.title}>
        {m.label && <div className="callout warn small"><strong>Label:</strong> {m.label}</div>}
        <div className="card" style={{ marginTop: 'var(--s3)', padding: 'var(--s4) var(--s5)' }}>
          <div className="exercise-label" style={{ marginTop: 0 }}>Problem</div>
          <p style={{ fontSize: 'var(--fs-md)', margin: 0 }}>{m.statement}</p>
        </div>
      </PageHeader>

      <div className="session-bar" role="region" aria-label="Session controls">
        <Timer key={minutes} minutes={minutes} />
        <label className="row small" style={{ gap: 6 }}>Length
          <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}><option value={45}>45 min</option><option value={35}>35 min</option><option value={20}>20 min</option></select>
        </label>
        <div className="grow" style={{ maxWidth: 220 }}>
          <div className="tiny muted" style={{ marginBottom: 4, fontWeight: 600 }}>{answered}/{total} steps answered</div>
          <ProgressBar value={answered} max={total} label="Steps answered" />
        </div>
        {problem && <LeetCodeLink problem={problem} label="Code it on LeetCode" />}
      </div>

      <div className="session">
        <ol className="stepper" aria-label="Interview steps">
          {mockSteps.map((s, i) => {
            const filled = (answers[s.id] ?? '').trim().length >= 5;
            return (
              <li key={s.id}>
                <button aria-current={current === i ? 'step' : undefined} onClick={() => setCurrent(i)}>
                  <span className={`dot${filled ? ' filled' : ''}`}>{filled ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
                  <span className="lbl">{s.title}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button aria-current={onWrapUp ? 'step' : undefined} onClick={() => setCurrent(total)}>
              <span className={`dot${saved ? ' filled' : ''}`}>{saved ? <Check size={12} strokeWidth={3} /> : '★'}</span>
              <span className="lbl">Wrap-up & self-score</span>
            </button>
          </li>
        </ol>

        {!onWrapUp ? (
          <Panel title={<><span className="step-dot">{current + 1}</span>{step.title}</>} action={<span className="tiny muted">Step {current + 1} of {total}</span>}>
            <p className="muted" style={{ marginTop: 0 }}>{step.prompt}</p>
            <textarea value={answers[step.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [step.id]: e.target.value })} aria-label={step.title} style={{ minHeight: 150 }} placeholder="Answer the way you would say it out loud…" />
            {revealed[step.id] ? (
              <div className="callout" style={{ marginTop: 'var(--s3)' }}>
                <strong>Talking points</strong>
                <ul style={{ margin: '6px 0 0' }}>{m.points[step.id].map((pt) => <li key={pt}>{pt}</li>)}</ul>
              </div>
            ) : (
              <button className="btn small" style={{ marginTop: 'var(--s3)' }} disabled={(answers[step.id] ?? '').trim().length < 5} onClick={() => setRevealed({ ...revealed, [step.id]: true })}>
                Reveal talking points
              </button>
            )}
            <div className="spread" style={{ marginTop: 'var(--s5)', paddingTop: 'var(--s4)', borderTop: '1px solid var(--line)' }}>
              <button className="btn small ghost" disabled={current === 0} onClick={() => setCurrent(current - 1)}><ArrowLeft size={14} /> Back</button>
              <button className="btn small primary" onClick={() => setCurrent(current + 1)}>{current === total - 1 ? 'Wrap up' : 'Next step'} <ArrowRight size={14} /></button>
            </div>
          </Panel>
        ) : (
          <div>
            <Panel title="Likely follow-ups">
              <ul>{m.followUps.map((f) => <li key={f}>{f}</li>)}</ul>
            </Panel>
            <Panel title="Self-assessment" action={<span className="tiny muted">0 = missing · 4 = interview-ready</span>}>
              <div>
                {rubric.map((r) => (
                  <div key={r.id} className="rubric-row">
                    <strong>{r.label}</strong>
                    <span className="small muted">{r.describe}</span>
                    <div className="segmented" role="group" aria-label={`${r.label} score`}>
                      {[0, 1, 2, 3, 4].map((n) => <button key={n} aria-pressed={scores[r.id] === n} onClick={() => setScores({ ...scores, [r.id]: n })}>{n}</button>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 'var(--s4)' }}>
                <button className="btn primary" onClick={persist}>Save session</button>
                {saved && <span className="status good" role="status">Saved</span>}
                <span className="tiny muted">{answered}/{total} steps answered</span>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}

// ------------------------- Behavioral / product -------------------------

const SOURCE_LABEL = { 'colorstack-reported': 'ColorStack-reported', 'github-historical': 'Historical report', general: 'General' } as const;

export function BehavioralHub() {
  const progress = useProgress();
  const [promptId, setPromptId] = useState(behavioralPrompts[0].id);
  const prompt = behavioralPrompts.find((p) => p.id === promptId)!;
  const bank = (slot: string) => progress.stories.find((s) => s.id === `bank:${slot}`);
  const others = progress.stories.filter((s) => !s.id.startsWith('bank:'));

  const editBank = (slot: string, title: string, field: string, value: string) => update((p) => {
    const id = `bank:${slot}`;
    const existing = p.stories.find((s) => s.id === id);
    const story: Story = existing
      ? { ...existing, fields: { ...existing.fields, [field]: value }, updatedAt: Date.now() }
      : { id, promptId: slot, title, fields: { [field]: value }, updatedAt: Date.now() };
    return { ...p, stories: existing ? p.stories.map((s) => (s.id === id ? story : s)) : [...p.stories, story] };
  });
  const addStory = () => {
    const story: Story = { id: `s-${Date.now().toString(36)}`, promptId, title: prompt.prompt, fields: {}, updatedAt: Date.now() };
    update((p) => ({ ...p, stories: [...p.stories, story] }));
  };
  const editStory = (sid: string, patch: Partial<Story>) =>
    update((p) => ({ ...p, stories: p.stories.map((s) => (s.id === sid ? { ...s, ...patch, updatedAt: Date.now() } : s)) }));
  const removeStory = (sid: string) => {
    if (window.confirm('Delete this story card?')) update((p) => ({ ...p, stories: p.stories.filter((s) => s.id !== sid) }));
  };
  const setProduct = (name: string, field: string, value: string) =>
    update((p) => ({ ...p, projects: { ...p.projects, [name]: { ...(p.projects[name] ?? {}), [field]: value } } }));
  const reported = behavioralPrompts.filter((p) => p.source === 'colorstack-reported');

  return (
    <>
      <PageHeader
        eyebrow="Mock Interviews"
        title="Behavioral and product design"
        description="About 30 minutes a day. Instead of memorizing an answer for every question, build six reusable stories and practice adapting them. Questions below are the ColorStack-reported ones (anecdotal, not an official list). Never invent accomplishments or metrics."
      />
      <MockTabs active="behavioral" />

      <section className="section" style={{ marginTop: 0 }}>
        <div className="section-title" style={{ marginTop: 0 }}><h2>Story bank</h2><span className="tiny muted">{frameworks.star.name}: {frameworks.star.steps.join(' · ')} — plus a one-line reflection</span></div>
        <div className="stack" style={{ gap: 'var(--s2)' }}>
          {storySlots.map((slot) => {
            const story = bank(slot.id);
            const filled = starFields.filter((f) => (story?.fields[f.id] ?? '').trim()).length;
            const wordsCount = Object.values(story?.fields ?? {}).join(' ').split(/\s+/).filter(Boolean).length;
            const answers = behavioralPrompts.filter((b) => b.slot === slot.id && b.source === 'colorstack-reported');
            return (
              <details key={slot.id} id={`story-${slot.id}`} className="card" style={{ padding: 'var(--s4) var(--s5)' }}>
                <summary>{slot.title} <span className="meta" style={{ marginLeft: 'auto' }}>{filled}/{starFields.length} · ~{Math.round(wordsCount / 2.5)}s</span></summary>
                <p className="small muted" style={{ marginTop: 'var(--s2)' }}>Covers: {slot.covers}</p>
                <ul className="small">{slot.seeds.map((x) => <li key={x}>{x}</li>)}</ul>
                {answers.length > 0 && <p className="tiny muted">Reported questions it answers: {answers.map((a) => `“${a.prompt}”`).join(' · ')}</p>}
                <div className="grid-2" style={{ gap: 'var(--s3)' }}>
                  {starFields.map((f) => (
                    <label key={f.id} className="field">{f.label} <span className="hint">{f.hint}</span>
                      <textarea value={story?.fields[f.id] ?? ''} onChange={(e) => editBank(slot.id, slot.title, f.id, e.target.value)} />
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <Panel className="section" title={`Reported questions → which story to use (${reported.length})`} flush>
        <ul className="item-list">
          {reported.map((b) => {
            const slot = storySlots.find((x) => x.id === b.slot);
            return (
              <li key={b.id} id={b.id} className="item">
                <div style={{ minWidth: 0, flex: 1 }}><strong>{b.prompt}</strong><div className="tiny muted">{b.tip}</div></div>
                {slot && <a className="badge accent" href={`#story-${slot.id}`}>{slot.title}</a>}
              </li>
            );
          })}
        </ul>
      </Panel>

      <section className="section">
        <div className="section-title" style={{ marginTop: 0 }}><h2>Product design and testing</h2><span className="tiny muted">One interview may be with a PM — reported by ColorStack</span></div>
        <div className="grid-3" style={{ marginBottom: 'var(--s4)' }}>
          {(['circles', 'testing', 'explain'] as const).map((k) => (
            <div key={k} className="fact"><div className="k">{frameworks[k].name}</div><ol className="small" style={{ margin: 0, paddingLeft: 18 }}>{frameworks[k].steps.map((x) => <li key={x}>{x}</li>)}</ol></div>
          ))}
        </div>
        <div className="stack" style={{ gap: 'var(--s2)' }}>
          {productPrompts.map((pp) => {
            const store = `product:${pp.id}`;
            const steps = productSteps(pp);
            const filled = steps.filter((_, i) => (progress.projects[store]?.[String(i)] ?? '').trim()).length;
            return (
              <details key={pp.id} id={pp.id} className="card" style={{ padding: 'var(--s4) var(--s5)' }}>
                <summary>{pp.prompt} <span className="meta" style={{ marginLeft: 'auto' }}>{SOURCE_LABEL[pp.source]} · {frameworks[pp.framework].name} · {filled}/{steps.length}</span></summary>
                <div className="stack" style={{ gap: 'var(--s3)' }}>
                  {steps.map((stepText, i) => (
                    <label key={i} className="field">{i + 1}. {stepText}
                      <textarea style={{ minHeight: 56 }} value={progress.projects[store]?.[String(i)] ?? ''} onChange={(e) => setProduct(store, String(i), e.target.value)} />
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <Panel className="section" title="Other story cards" action={<span className="tiny muted">Free-form STAR(R) cards for any prompt</span>}>
        <div className="row" style={{ alignItems: 'end' }}>
          <label className="field" style={{ flex: '1 1 320px' }}>Prompt
            <select value={promptId} onChange={(e) => setPromptId(e.target.value)}>
              {behavioralPrompts.map((p) => <option key={p.id} value={p.id}>{p.theme}: {p.prompt}</option>)}
            </select>
          </label>
          <button className="btn primary" onClick={addStory}><Plus size={15} /> New story card</button>
        </div>
        <div className="callout small"><strong>Tip:</strong> {prompt.tip}</div>
      </Panel>
      <div className="stack section" style={{ marginTop: 'var(--s4)' }}>
        {others.map((s) => {
          const wordsCount = Object.values(s.fields).join(' ').split(/\s+/).filter(Boolean).length;
          return (
            <article key={s.id} className="card">
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input type="text" value={s.title} onChange={(e) => editStory(s.id, { title: e.target.value })} aria-label="Story title" style={{ flex: 1, fontWeight: 650, minWidth: 0 }} />
                <span className="badge" title="Spoken length at ~150 words per minute">{wordsCount} words · ~{Math.round(wordsCount / 2.5)}s</span>
                <button className="btn icon ghost" onClick={() => removeStory(s.id)} aria-label="Delete story"><Trash2 size={15} /></button>
              </div>
              <div className="grid-2" style={{ marginTop: 'var(--s3)', gap: 'var(--s3)' }}>
                {starFields.map((f) => (
                  <label key={f.id} className="field">{f.label} <span className="hint">{f.hint}</span>
                    <textarea value={s.fields[f.id] ?? ''} onChange={(e) => editStory(s.id, { fields: { ...s.fields, [f.id]: e.target.value } })} />
                  </label>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      <p className="small muted">Project explanations moved to <Link href="/mock/projects">Mock → Projects</Link>.</p>
    </>
  );
}
