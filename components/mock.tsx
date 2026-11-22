'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { behavioralPrompts, mockProblems, mockSteps, productPrompts, projectFields, rubric, starFields, starterProjects } from '@/content/mocks';
import { getProblem } from '@/content/problems';
import type { MockSession, Story } from '@/lib/progress';
import { update, useProgress } from '@/lib/store';
import { LeetCodeLink } from './problem-ui';
import { PageHeader, Panel, ProgressBar } from './ui';

export function MockTabs({ active }: { active: 'technical' | 'behavioral' }) {
  return (
    <div className="tabs" role="navigation" aria-label="Mock interview sections">
      <Link href="/mock" aria-current={active === 'technical' ? 'page' : undefined}>Technical mocks</Link>
      <Link href="/mock/behavioral" aria-current={active === 'behavioral' ? 'page' : undefined}>Behavioral, projects & product</Link>
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

// ------------------------- Behavioral / projects / product -------------------------

export function BehavioralHub() {
  const progress = useProgress();
  const [promptId, setPromptId] = useState(behavioralPrompts[0].id);
  const prompt = behavioralPrompts.find((p) => p.id === promptId)!;
  const stories = progress.stories;

  const addStory = () => {
    const story: Story = { id: `s-${Date.now().toString(36)}`, promptId, title: prompt.prompt, fields: {}, updatedAt: Date.now() };
    update((p) => ({ ...p, stories: [...p.stories, story] }));
  };
  const editStory = (sid: string, patch: Partial<Story>) =>
    update((p) => ({ ...p, stories: p.stories.map((s) => (s.id === sid ? { ...s, ...patch, updatedAt: Date.now() } : s)) }));
  const removeStory = (sid: string) => {
    if (window.confirm('Delete this story card?')) update((p) => ({ ...p, stories: p.stories.filter((s) => s.id !== sid) }));
  };
  const setProject = (name: string, field: string, value: string) =>
    update((p) => ({ ...p, projects: { ...p.projects, [name]: { ...(p.projects[name] ?? {}), [field]: value } } }));

  return (
    <>
      <PageHeader
        eyebrow="Mock Interviews"
        title="Behavioral, project defense, and product thinking"
        description="Supporting preparation — the DSA plan stays the priority. Write in your own words and never invent accomplishments or metrics. Aim for 60–90 second answers."
      />
      <MockTabs active="behavioral" />

      <Panel title="STAR(R) story builder" action={<span className="tiny muted">Situation · Task · Action · Result · Reflection</span>}>
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
        {stories.length === 0 && <p className="empty">No story cards yet. Pick a prompt and create one.</p>}
        {stories.map((s) => {
          const words = Object.values(s.fields).join(' ').split(/\s+/).filter(Boolean).length;
          return (
            <article key={s.id} className="card">
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input type="text" value={s.title} onChange={(e) => editStory(s.id, { title: e.target.value })} aria-label="Story title" style={{ flex: 1, fontWeight: 650, minWidth: 0 }} />
                <span className="badge" title="Spoken length at ~150 words per minute">{words} words · ~{Math.round(words / 2.5)}s</span>
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

      <section className="section">
        <div className="section-title" style={{ marginTop: 0 }}><h2>Project defense cards</h2><span className="tiny muted">Intentionally blank — use verifiable facts in your own words</span></div>
        <div className="stack" style={{ gap: 'var(--s2)' }}>
          {starterProjects.map((name) => {
            const filled = projectFields.filter((f) => (progress.projects[name]?.[f.id] ?? '').trim()).length;
            return (
              <details key={name} className="card" style={{ padding: 'var(--s4) var(--s5)' }}>
                <summary>{name} <span className="meta" style={{ marginLeft: 'auto' }}>{filled}/{projectFields.length} fields</span></summary>
                <div className="grid-2" style={{ gap: 'var(--s3)' }}>
                  {projectFields.map((f) => (
                    <label key={f.id} className="field">{f.label} <span className="hint">{f.hint}</span>
                      <textarea value={progress.projects[name]?.[f.id] ?? ''} onChange={(e) => setProject(name, f.id, e.target.value)} />
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-title" style={{ marginTop: 0 }}><h2>Product thinking</h2><span className="tiny muted">Some Explore reports describe a product-style conversation; not every interview has one</span></div>
        <div className="stack" style={{ gap: 'var(--s2)' }}>
          {productPrompts.map((pp) => (
            <details key={pp.id} className="card" style={{ padding: 'var(--s4) var(--s5)' }}>
              <summary>{pp.prompt}</summary>
              <div className="stack" style={{ gap: 'var(--s3)' }}>
                {pp.steps.map((stepText, i) => (
                  <label key={i} className="field">{i + 1}. {stepText}
                    <textarea style={{ minHeight: 56 }} value={progress.projects[`product:${pp.id}`]?.[String(i)] ?? ''} onChange={(e) => setProject(`product:${pp.id}`, String(i), e.target.value)} />
                  </label>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
