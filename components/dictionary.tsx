'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { glossary, termCategories, getTerm } from '@/content/glossary';
import { getLesson } from '@/content/modules';
import { getProblem } from '@/content/problems';
import type { Term, TermCategory } from '@/content/types';
import { markTermReviewed } from '@/lib/progress';
import { update, useProgress, useToday } from '@/lib/store';
import { toDateKey } from '@/lib/dates';
import { Inline } from './rich';
import { KnowledgeCheck } from './quiz';
import { ProblemItem } from './problem-ui';

function matches(term: Term, q: string): boolean {
  if (!q) return true;
  const hay = [term.term, ...(term.aliases ?? []), term.definition, term.implies, term.decide, term.approaches.join(' '), term.structures.join(' ')].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}

export function Dictionary() {
  const progress = useProgress();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<TermCategory | 'All'>('All');
  const list = useMemo(() => glossary.filter((t) => (cat === 'All' || t.category === cat) && matches(t, q)), [q, cat]);
  const reviewed = glossary.filter((t) => progress.terms[t.id] || progress.checks[`term:${t.id}`]).length;

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Interview Dictionary</div>
        <h1>Decode the Interview Question</h1>
        <p>{glossary.length} terms you will meet in problem statements. Each entry explains what the wording <em>implies</em>, which approaches it suggests, common misconceptions, typical complexity, a related LeetCode problem, and a quick knowledge check. <strong>Keywords are clues, not guaranteed solutions</strong> — always confirm with the constraints and examples.</p>
        <p className="small">{reviewed} of {glossary.length} terms reviewed.</p>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <label className="field">
          Search the dictionary
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. contiguous, permutation, amortized…" />
        </label>
        <div className="chip-group" style={{ marginTop: 10 }} role="group" aria-label="Category">
          {(['All', ...termCategories] as const).map((c) => (
            <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>
      {list.length === 0 && <p className="muted">No terms match. Try the global search for lessons and problems.</p>}
      <div className="term-grid">
        {list.map((t) => {
          const done = !!(progress.terms[t.id] || progress.checks[`term:${t.id}`]);
          return (
            <Link key={t.id} href={`/dictionary/${t.id}`} className="card term-card">
              <div className="spread">
                <h3>{t.term}</h3>
                {done && <CheckCircle2 size={16} className="check-icon" aria-label="Reviewed" />}
              </div>
              <div className="tiny muted" style={{ marginBottom: 6 }}>{t.category}</div>
              <p className="small" style={{ margin: 0 }}><Inline text={t.definition} /></p>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function TermDetail({ id }: { id: string }) {
  const progress = useProgress();
  const today = useToday() ?? toDateKey(new Date());
  const t = getTerm(id)!;
  const problem = getProblem(t.problem);
  const reviewed = progress.terms[t.id];
  const related = glossary.filter((o) => o.id !== t.id && (o.category === t.category) && o.lessons.some((l) => t.lessons.includes(l))).slice(0, 6);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow"><Link href="/dictionary">Interview Dictionary</Link> · {t.category}</div>
        <h1>{t.term}</h1>
        {t.aliases?.length ? <p className="small">Also appears as: {t.aliases.map((a) => <span key={a} className="badge" style={{ marginRight: 4 }}>{a}</span>)}</p> : null}
        <p style={{ fontSize: 17, color: 'var(--ink)' }}><Inline text={t.definition} /></p>
        <p className="small muted">A keyword is a clue, not a decision. Confirm the approach against the constraints, the input’s properties (sorted? negatives? alphabet size?), and whether you must generate, count, or compare.</p>
        <button className={`btn small${reviewed ? ' primary' : ''}`} onClick={() => update((p) => markTermReviewed(p, t.id, today))}>
          <CheckCircle2 size={15} /> {reviewed ? `Reviewed ${reviewed}` : 'Mark as reviewed'}
        </button>
      </div>
      <div className="card">
        <dl className="facts">
          <dt>Example</dt><dd><Inline text={t.example} /></dd>
          <dt>What the wording suggests</dt><dd><Inline text={t.implies} /></dd>
          <dt>Check before choosing</dt><dd><div className="callout" style={{ margin: 0 }}><Inline text={t.decide} /></div></dd>
          <dt>Possible approaches</dt><dd><ul style={{ margin: 0 }}>{t.approaches.map((a) => <li key={a}><Inline text={a} /></li>)}</ul></dd>
          <dt>Common misconception</dt><dd><div className="callout warn" style={{ margin: 0 }}><Inline text={t.misconception} /></div></dd>
          <dt>Associated data structures</dt><dd>{t.structures.map((s) => <code key={s} style={{ marginRight: 6 }}>{s}</code>)}</dd>
          <dt>Typical complexity</dt><dd><Inline text={t.complexity} /></dd>
          <dt>Learn it in depth</dt>
          <dd>{t.lessons.map((key, i) => {
            const ref = getLesson(key);
            return ref ? <span key={key}>{i ? ' · ' : ''}<Link href={`/learn/${key}`}>{ref.lesson.title}</Link></span> : null;
          })}</dd>
        </dl>
      </div>
      <section className="section">
        <h2>Knowledge check</h2>
        <KnowledgeCheck check={t.check} storageKey={`term:${t.id}`} />
      </section>
      {problem && (
        <section className="section">
          <h2>Related LeetCode problem</h2>
          <ul className="item-list"><ProblemItem problem={problem} progress={progress} showDate /></ul>
        </section>
      )}
      {related.length > 0 && (
        <section className="section">
          <h2>Related terms</h2>
          <div className="chip-group">{related.map((r) => <Link key={r.id} className="chip" href={`/dictionary/${r.id}`}>{r.term}</Link>)}</div>
        </section>
      )}
    </>
  );
}
