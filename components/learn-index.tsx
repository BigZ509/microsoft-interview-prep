'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { modules, lessonKey } from '@/content/modules';
import { useProgress } from '@/lib/store';

const PHASES = [
  { phase: 1, title: 'Phase 1 — Essential for December 2' },
  { phase: 2, title: 'Phase 2 — Important supporting topics' },
  { phase: 3, title: 'Phase 3 — Long-term expansion' },
] as const;

export function LearnIndex() {
  const progress = useProgress();
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Learn</div>
        <h1>Concept lessons</h1>
        <p>13 modules, ordered by priority. Every lesson follows the same path: what → why → how → visualization → Python → Big-O → when to use → mistakes → knowledge check → LeetCode. Priorities come from your study plan; they are recommendations, not interview-frequency data.</p>
      </div>
      {PHASES.map(({ phase, title }) => {
        const list = modules.filter((m) => m.phase === phase);
        if (!list.length) return null;
        return (
          <section key={phase} className="section">
            <h2>{title}</h2>
            <div className="grid-auto">
              {list.map((m) => {
                const done = m.lessons.filter((l) => progress.lessons[lessonKey(m.id, l.id)]?.done).length;
                return (
                  <Link key={m.id} href={`/learn/${m.id}`} className="card term-card">
                    <div className="spread">
                      <span className="eyebrow" style={{ margin: 0 }}>Module {m.number}</span>
                      <span className={`badge ${m.priority === 'P0' ? 'accent' : ''}`}>{m.priority}</span>
                    </div>
                    <h3 style={{ marginTop: 6 }}>{m.title}</h3>
                    <p className="small muted">{m.blurb}</p>
                    <div className="spread tiny muted">
                      <span>{m.lessons.length} lessons</span>
                      <span>{done === m.lessons.length ? <><CheckCircle2 size={13} className="check-icon" /> done</> : `${done}/${m.lessons.length} complete`}</span>
                    </div>
                    <div className="progress good" style={{ marginTop: 6 }}><span style={{ width: `${(done / m.lessons.length) * 100}%` }} /></div>
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
      <div className="page-head">
        <div className="eyebrow"><Link href="/learn">Learn</Link> · Module {m.number} · {m.priority} · Phase {m.phase}</div>
        <h1>{m.title}</h1>
        <p>{m.blurb}</p>
        {m.prerequisites.length > 0 && (
          <p className="small">Study first: {m.prerequisites.map((id, i) => {
            const pre = modules.find((x) => x.id === id)!;
            return <span key={id}>{i ? ', ' : ''}<Link href={`/learn/${id}`}>{pre.title}</Link></span>;
          })}</p>
        )}
      </div>
      <ol className="item-list">
        {m.lessons.map((l, i) => {
          const key = lessonKey(m.id, l.id);
          const rec = progress.lessons[key];
          return (
            <li key={l.id} className={`item${rec?.done ? ' done' : ''}`}>
              <div style={{ flex: '1 1 300px' }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className="step-num">{i + 1}</span>
                  <Link className="title" href={`/learn/${key}`}>{l.title}</Link>
                  {l.phase === 3 && <span className="badge">Phase 3</span>}
                  {rec?.unfamiliar && <span className="badge warn">Unfamiliar</span>}
                </div>
                <p className="small muted" style={{ margin: '4px 0 0 34px' }}>{l.summary}</p>
              </div>
              {rec?.done ? <span className="badge good">Complete</span> : <Link className="btn small" href={`/learn/${key}`}>Start</Link>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
