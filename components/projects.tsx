'use client';

import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { explanationDrills, projectPromptOrder, projects } from '@/content/projects';
import { legacyProjectNames, projectFields } from '@/content/mocks';
import type { ProjectBrief } from '@/content/types';
import { update, useHydrated, useProgress } from '@/lib/store';
import { MockTabs } from './mock';
import { PageHeader, Panel } from './ui';

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

export function ProjectsPage() {
  const hydrated = useHydrated();
  const [active, setActive] = useState(projects[0].id);
  if (!hydrated) return <p className="muted">Loading…</p>;
  const project = projects.find((p) => p.id === active)!;
  return (
    <>
      <PageHeader
        eyebrow="Mock Interviews"
        title="Explain your projects"
        description="Kept small on purpose (about 15 minutes a day). ColorStack members reported detailed résumé-project questions, and one candidate explained a project poorly the first time and was asked again. Every fact below comes from your résumé, your portfolio notes or the ZBXP repository docs — where the résumé claims more than that evidence shows, it is listed under “Verify before the interview” rather than explained."
      />
      <MockTabs active="projects" />
      <div className="segmented" role="group" aria-label="Project" style={{ marginBottom: 'var(--s4)' }}>
        {projects.map((p) => <button key={p.id} aria-pressed={p.id === active} onClick={() => setActive(p.id)}>{p.name}</button>)}
      </div>
      <ProjectView key={project.id} project={project} />
    </>
  );
}

function ProjectView({ project: p }: { project: ProjectBrief }) {
  const progress = useProgress();
  const store = `project:${p.id}`;
  const notes = progress.projects[store] ?? {};
  const set = (field: string, value: string) =>
    update((pr) => ({ ...pr, projects: { ...pr.projects, [store]: { ...(pr.projects[store] ?? {}), [field]: value } } }));
  const legacy = progress.projects[legacyProjectNames[p.id]] ?? {};
  const legacyFilled = projectFields.filter((f) => (legacy[f.id] ?? '').trim());

  return (
    <div className="stack">
      <Panel title="Architecture" action={<span className="tiny muted">{p.stack}</span>}>
        <ol className="arch" aria-label={`${p.name} architecture, in order of data flow`}>
          {p.diagram.map((box) => <li key={box.label}><strong>{box.label}</strong><span>{box.detail}</span></li>)}
        </ol>
      </Panel>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Panel title="What the résumé says">
          <ul style={{ margin: 0 }}>{p.resumeClaims.map((c) => <li key={c}>{c}</li>)}</ul>
        </Panel>
        <Panel title="Verify before the interview">
          <ul className="small" style={{ margin: 0 }}>{p.verify.map((v) => <li key={v}>{v}</li>)}</ul>
        </Panel>
      </div>

      <Panel title="Grounded facts" flush>
        <ul className="item-list">{p.facts.map((f) => (
          <li key={f.text} className="item"><div><div className="small">{f.text}</div><div className="tiny muted">Source: {f.source}</div></div></li>
        ))}</ul>
      </Panel>

      <Panel title="The nine things to be able to explain">
        <div className="grid-2" style={{ gap: 'var(--s3)' }}>
          {projectPromptOrder.map((q) => (
            <label key={q.id} className="field">{q.label} <span className="hint">{p.prompts[q.id]}</span>
              <textarea value={notes[q.id] ?? ''} onChange={(e) => set(q.id, e.target.value)} />
            </label>
          ))}
        </div>
      </Panel>

      <Panel title="Timed explanations" action={<span className="tiny muted">Say it out loud first; then write what you said</span>}>
        <div className="stack" style={{ gap: 'var(--s3)' }}>
          {explanationDrills.map((dr) => (
            <div key={dr.id}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{dr.label}</strong>
                <span className="row" style={{ gap: 8 }}>
                  <span className="badge">{words(notes[`say-${dr.id}`] ?? '')}/{dr.words} words</span>
                  <Countdown seconds={dr.seconds} />
                </span>
              </div>
              <p className="tiny muted" style={{ margin: '2px 0 6px' }}>{dr.guide}</p>
              <textarea aria-label={`${p.name} ${dr.label}`} value={notes[`say-${dr.id}`] ?? ''} onChange={(e) => set(`say-${dr.id}`, e.target.value)} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Realistic follow-ups">
        <div className="stack" style={{ gap: 'var(--s3)' }}>
          {p.followUps.map((q, i) => (
            <label key={q} className="field">{q}
              <textarea style={{ minHeight: 56 }} value={notes[`follow-${i}`] ?? ''} onChange={(e) => set(`follow-${i}`, e.target.value)} />
            </label>
          ))}
        </div>
      </Panel>

      {legacyFilled.length > 0 && (
        <Panel title="Your earlier project-defense notes">
          {legacyFilled.map((f) => <p key={f.id} className="small"><strong>{f.label}:</strong> {legacy[f.id]}</p>)}
        </Panel>
      )}
    </div>
  );
}

function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [running]);
  const done = left === 0;
  return (
    <span className="row" style={{ gap: 4 }}>
      <span className={`badge${done ? ' warn' : running ? ' accent' : ''}`} aria-live="polite">{done ? 'Time' : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</span>
      <button className="btn icon ghost small" aria-label={running ? 'Pause timer' : 'Start timer'} disabled={done} onClick={() => setRunning((r) => !r)}>{running ? <Pause size={14} /> : <Play size={14} />}</button>
      <button className="btn icon ghost small" aria-label="Reset timer" onClick={() => { setRunning(false); setLeft(seconds); }}><RotateCcw size={14} /></button>
    </span>
  );
}
