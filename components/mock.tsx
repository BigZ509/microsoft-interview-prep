'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Pause, Play, Plus, Trash2 } from 'lucide-react';
import { behavioralPrompts, mockProblems, mockSteps, productPrompts, projectFields, rubric, starFields, starterProjects } from '@/content/mocks';
import { getProblem } from '@/content/problems';
import type { MockSession, Story } from '@/lib/progress';
import { update, useProgress } from '@/lib/store';
import { LeetCodeLink } from './problem-ui';

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
      <div className="page-head">
        <div className="eyebrow">Mock Interviews</div>
        <h1>Practice explaining and defending solutions</h1>
        <p>Each mock walks the interview flow: clarify → inputs/outputs → assumptions → brute force → improve → justify the data structure → walk through an example → Big-O → edge cases → trade-offs. Write your answer for each step before revealing talking points. Code on LeetCode or in your own editor — this app does not execute or judge code.</p>
      </div>
      <MockTabs active="technical" />
      <ul className="item-list">
        {mockProblems.map((m) => {
          const sessions = progress.mocks.filter((s) => s.problemId === m.id);
          const lastDone = sessions.filter((s) => s.completedAt).at(-1);
          const avg = lastDone ? Object.values(lastDone.rubric).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(lastDone.rubric).length) : null;
          return (
            <li key={m.id} className="item">
              <div style={{ flex: '1 1 320px' }}>
                <Link className="title" href={`/mock/${m.id}`}>{m.title}</Link>
                {m.label && <div className="tiny" style={{ color: 'var(--warn)', marginTop: 2 }}>Candidate-reported reconstruction — not an official question</div>}
                <div className="small muted">{m.statement}</div>
              </div>
              <div className="row">
                {avg !== null && <span className="badge good">Last self-score {avg.toFixed(1)}/4</span>}
                <span className="badge">{sessions.length} session{sessions.length === 1 ? '' : 's'}</span>
                <Link className="btn small primary" href={`/mock/${m.id}`}>Start</Link>
              </div>
            </li>
          );
        })}
      </ul>
      <section className="section card">
        <h2>Rubric</h2>
        <ul>{rubric.map((r) => <li key={r.id}><strong>{r.label}:</strong> {r.describe}</li>)}</ul>
        <p className="small muted">Score yourself 0–4 on each after a session. Be honest — the scores only help you.</p>
      </section>
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
      <span className={`timer${left < 300 ? ' low' : ''}`} aria-live="off">{mm}:{ss}</span>
      <button className="btn small" onClick={() => setRunning(!running)}>{running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Start timer</>}</button>
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
  const [sessionId] = useState(() => `${id}-${Date.now().toString(36)}`);
  const [startedAt] = useState(() => Date.now());

  const persist = (completed: boolean) => {
    const session: MockSession = { id: sessionId, problemId: id, startedAt, minutes, answers, rubric: scores, completedAt: completed ? Date.now() : null };
    update((p) => ({ ...p, mocks: [...p.mocks.filter((s) => s.id !== sessionId), session] }));
    setSaved(completed);
  };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow"><Link href="/mock">Mock Interviews</Link> · Technical</div>
        <h1>{m.title}</h1>
        {m.label && <div className="callout warn"><strong>Label:</strong> {m.label}</div>}
        <div className="card" style={{ marginTop: 10 }}><p style={{ fontSize: 16, margin: 0 }}>{m.statement}</p></div>
        <div className="spread" style={{ marginTop: 12 }}>
          <div className="row">
            <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Length
              <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}><option value={35}>35 min</option><option value={45}>45 min</option><option value={20}>20 min (short)</option></select>
            </label>
            <Timer key={minutes} minutes={minutes} />
          </div>
          {problem && <LeetCodeLink problem={problem} label="Code it on LeetCode" />}
        </div>
      </div>
      <div className="stack">
        {mockSteps.map((s, i) => (
          <section key={s.id} className="card">
            <h3><span className="step-num">{i + 1}</span> {s.title}</h3>
            <p className="small muted">{s.prompt}</p>
            <textarea value={answers[s.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [s.id]: e.target.value })} aria-label={s.title} />
            {revealed[s.id] ? (
              <div className="callout" style={{ marginTop: 8 }}>
                <strong>Talking points</strong>
                <ul style={{ margin: '4px 0 0' }}>{m.points[s.id].map((pt) => <li key={pt}>{pt}</li>)}</ul>
              </div>
            ) : (
              <button className="btn small" style={{ marginTop: 8 }} disabled={(answers[s.id] ?? '').trim().length < 5} onClick={() => setRevealed({ ...revealed, [s.id]: true })}>
                Reveal talking points
              </button>
            )}
          </section>
        ))}
        <section className="card">
          <h3>Likely follow-ups</h3>
          <ul>{m.followUps.map((f) => <li key={f}>{f}</li>)}</ul>
        </section>
        <section className="card">
          <h3>Self-assessment</h3>
          <div className="stack">
            {rubric.map((r) => (
              <div key={r.id}>
                <div className="spread"><strong>{r.label}</strong><span className="tiny muted">{r.describe}</span></div>
                <div className="chip-group" role="group" aria-label={`${r.label} score`}>
                  {[0, 1, 2, 3, 4].map((n) => <button key={n} className="chip" aria-pressed={scores[r.id] === n} onClick={() => setScores({ ...scores, [r.id]: n })}>{n}</button>)}
                </div>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn primary" onClick={() => persist(true)}>Save session</button>
            {saved && <span className="badge good" role="status">Saved</span>}
          </div>
        </section>
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
      <div className="page-head">
        <div className="eyebrow">Mock Interviews</div>
        <h1>Behavioral, project defense, and product thinking</h1>
        <p>Supporting preparation — the DSA plan remains the immediate priority. Write in your own words and never invent accomplishments or metrics. Aim for 60–90 second answers.</p>
      </div>
      <MockTabs active="behavioral" />

      <section className="card">
        <h2>STAR(R) story builder</h2>
        <p className="small muted">Situation · Task · Action · Result · Reflection. Choose a prompt, then create a story card.</p>
        <div className="row">
          <select value={promptId} onChange={(e) => setPromptId(e.target.value)} aria-label="Behavioral prompt">
            {behavioralPrompts.map((p) => <option key={p.id} value={p.id}>{p.theme}: {p.prompt}</option>)}
          </select>
          <button className="btn small primary" onClick={addStory}><Plus size={14} /> New story for this prompt</button>
        </div>
        <div className="callout small"><strong>Tip:</strong> {prompt.tip}</div>
      </section>

      <div className="stack section">
        {stories.length === 0 && <p className="muted small">No story cards yet.</p>}
        {stories.map((s) => {
          const words = Object.values(s.fields).join(' ').split(/\s+/).filter(Boolean).length;
          return (
            <article key={s.id} className="card">
              <div className="spread">
                <input type="text" value={s.title} onChange={(e) => editStory(s.id, { title: e.target.value })} aria-label="Story title" style={{ flex: 1, fontWeight: 650 }} />
                <span className="tiny muted">{words} words (~{Math.round(words / 2.5)} s spoken)</span>
                <button className="btn small ghost" onClick={() => removeStory(s.id)} aria-label="Delete story"><Trash2 size={14} /></button>
              </div>
              <div className="grid-2" style={{ marginTop: 10 }}>
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
        <h2>Project defense cards</h2>
        <p className="small muted">Starter cards for the projects named in your plan. They are intentionally blank — fill them with verifiable facts in your own words.</p>
        <div className="stack">
          {starterProjects.map((name) => (
            <details key={name} className="card">
              <summary>{name}</summary>
              <div className="grid-2">
                {projectFields.map((f) => (
                  <label key={f.id} className="field">{f.label} <span className="hint">{f.hint}</span>
                    <textarea value={progress.projects[name]?.[f.id] ?? ''} onChange={(e) => setProject(name, f.id, e.target.value)} />
                  </label>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Product thinking</h2>
        <p className="small muted">Some first-hand Explore reports describe a product-style conversation; not every interview includes one.</p>
        <div className="stack">
          {productPrompts.map((pp) => (
            <details key={pp.id} className="card">
              <summary>{pp.prompt}</summary>
              <div className="stack">
                {pp.steps.map((step, i) => (
                  <label key={i} className="field">{i + 1}. {step}
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
