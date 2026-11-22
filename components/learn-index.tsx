'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { modules, lessonKey } from '@/content/modules';
import { useProgress } from '@/lib/store';
import { PageHeader, ProgressBar } from './ui';

const PHASES = [
  { phase: 1, title: 'Phase 1 — Essential for December 2' },
  { phase: 2, title: 'Phase 2 — Important supporting topics' },
  { phase: 3, title: 'Phase 3 — Long-term expansion' },
] as const;

export function LearnIndex() {
  const progress = useProgress();
  return (
    <>
      <PageHeader
        eyebrow="Learn"
        title="Concept lessons"
        description="13 modules, ordered by priority. Every lesson follows the same path: what → why → how → visualization → Python → Big-O → when to use → mistakes → knowledge check → LeetCode. Priorities come from your study plan; they are recommendations, not interview-frequency data."
      />
      {PHASES.map(({ phase, title }) => {
        const list = modules.filter((m) => m.phase === phase);
        if (!list.length) return null;
        return (
          <section key={phase} className="section" style={{ marginTop: phase === 1 ? 0 : undefined }}>
            <div className="section-title" style={{ marginTop: 0 }}><h2>{title}</h2><span className="tiny muted">{list.length} modules</span></div>
            <div className="grid-auto">
              {list.map((m) => {
                const done = m.lessons.filter((l) => progress.lessons[lessonKey(m.id, l.id)]?.done).length;
                return (
                  <Link key={m.id} href={`/learn/${m.id}`} className="card term-card">
                    <span className="spread" style={{ flexWrap: 'nowrap' }}>
                      <span className="eyebrow" style={{ margin: 0 }}>Module {m.number}</span>
                      <span className={`badge ${m.priority === 'P0' ? 'accent' : ''}`}>{m.priority}</span>
                    </span>
                    <h3 style={{ marginTop: 4 }}>{m.title}</h3>
                    <p style={{ flex: 1 }}>{m.blurb}</p>
                    <span className="spread tiny muted" style={{ marginTop: 8 }}>
                      <span>{m.lessons.length} lessons</span>
                      <span className="row" style={{ gap: 4 }}>{done === m.lessons.length ? <><CheckCircle2 size={13} className="check-icon" /> Complete</> : `${done}/${m.lessons.length} complete`}</span>
                    </span>
                    <ProgressBar value={done} max={m.lessons.length} tone="good" />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

export function ModuleView({ moduleId }: { moduleId: string }) {
  const progress = useProgress();
  const m = modules.find((x) => x.id === moduleId)!;
  return (
    <>
      <PageHeader eyebrow={<><Link href="/learn">Learn</Link> · Module {m.number} · {m.priority} · Phase {m.phase}</>} title={m.title} description={m.blurb}>
        {m.prerequisites.length > 0 && (
          <div className="row small" style={{ marginTop: 'var(--s3)' }}><span className="muted">Study first:</span>{m.prerequisites.map((id) => {
            const pre = modules.find((x) => x.id === id)!;
            return <Link key={id} className="chip" href={`/learn/${id}`}>{pre.title}</Link>;
          })}</div>
        )}
      </PageHeader>
      <ol className="item-list">
        {m.lessons.map((l, i) => {
          const key = lessonKey(m.id, l.id);
          const rec = progress.lessons[key];
          return (
            <li key={l.id} className="item" style={{ padding: 'var(--s4)', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 300px', display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12 }}>
                <span className={`step-num`} style={rec?.done ? { background: 'var(--good)', color: '#fff' } : undefined}>{rec?.done ? '✓' : i + 1}</span>
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <Link className="title" href={`/learn/${key}`}>{l.title}</Link>
                    {l.phase === 3 && <span className="badge">Phase 3</span>}
                    {rec?.unfamiliar && <span className="badge warn">Unfamiliar</span>}
                  </div>
                  <p className="small muted" style={{ margin: '2px 0 0' }}>{l.summary}</p>
                </div>
              </div>
              {rec?.done ? <span className="status good">Complete</span> : <Link className="btn small" href={`/learn/${key}`}>Start</Link>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
