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
import { PageHeader, ProgressBar } from './ui';

function matches(term: Term, q: string): boolean {
  if (!q) return true;
  const hay = [term.term, ...(term.aliases ?? []), term.definition, term.implies, term.decide, term.approaches.join(' '), term.structures.join(' ')].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}

function TermCard({ t, done }: { t: Term; done: boolean }) {
  return (
    <Link href={`/dictionary/${t.id}`} className="card term-card">
      <span className="spread" style={{ flexWrap: 'nowrap' }}>
        <h3>{t.term}</h3>
        {done && <CheckCircle2 size={16} className="check-icon" aria-label="Reviewed" />}
      </span>
      <p><Inline text={t.definition} /></p>
    </Link>
  );
}

export function Dictionary() {
  const progress = useProgress();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<TermCategory | 'All'>('All');
  const list = useMemo(() => glossary.filter((t) => (cat === 'All' || t.category === cat) && matches(t, q)), [q, cat]);
  const isDone = (t: Term) => !!(progress.terms[t.id] || progress.checks[`term:${t.id}`]);
  const reviewed = glossary.filter(isDone).length;
  const grouped = cat === 'All' && !q;

  return (
    <>
      <PageHeader
        eyebrow="Interview Dictionary"
        title="Decode the Interview Question"
        description={<>{glossary.length} terms you will meet in problem statements — what each one means, what the wording suggests, which constraints change the approach, common misconceptions, and a quick check. <strong>Keywords are clues, not guaranteed solutions.</strong></>}
      >
        <div className="row" style={{ marginTop: 'var(--s3)', maxWidth: 420 }}>
          <div style={{ flex: 1 }}><ProgressBar value={reviewed} max={glossary.length} tone="good" label="Terms reviewed" /></div>
          <span className="small muted">{reviewed}/{glossary.length} reviewed</span>
        </div>
      </PageHeader>
      <div className="toolbar">
        <label className="field grow">Search
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. contiguous, permutation, amortized…" />
        </label>
        <div className="chip-group" role="group" aria-label="Category">
          {(['All', ...termCategories] as const).map((c) => (
            <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c}{c !== 'All' && <span className="muted tiny">{glossary.filter((t) => t.category === c).length}</span>}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 && <p className="empty">No terms match. Try the global search for lessons and problems.</p>}
      {grouped ? termCategories.map((c) => {
        const terms = glossary.filter((t) => t.category === c);
        return (
          <section key={c} aria-label={c}>
            <div className="cat-head"><h2>{c}</h2><span className="tiny muted">{terms.filter(isDone).length}/{terms.length} reviewed</span></div>
            <div className="term-grid">{terms.map((t) => <TermCard key={t.id} t={t} done={isDone(t)} />)}</div>
          </section>
        );
      }) : (
        <>
          <p className="small muted" style={{ margin: '0 0 var(--s3)' }}>{list.length} term{list.length === 1 ? '' : 's'}</p>
          <div className="term-grid">{list.map((t) => <TermCard key={t.id} t={t} done={isDone(t)} />)}</div>
        </>
      )}
    </>
  );
}

/** Compact term card for the bootcamp player: the same facts and knowledge check, under an h2. */
export function TermStudy({ id }: { id: string }) {
  const progress = useProgress();
  const today = useToday() ?? toDateKey(new Date());
  const t = getTerm(id)!;
  const reviewed = progress.terms[t.id] || progress.checks[`term:${t.id}`];
  return (
    <section className="card term-study" aria-labelledby={`term-${t.id}`}>
      <div className="spread">
        <h2 id={`term-${t.id}`} style={{ margin: 0 }}>{t.term}</h2>
        <button className={`btn small${reviewed ? ' primary' : ''}`} onClick={() => update((p) => markTermReviewed(p, t.id, today))}>
          <CheckCircle2 size={15} /> {reviewed ? 'Reviewed' : 'Mark as reviewed'}
        </button>
      </div>
      <p className="term-definition"><Inline text={t.definition} /></p>
      <div className="fact-grid">
        <div className="fact"><div className="k">Example</div><Inline text={t.example} /></div>
        <div className="fact"><div className="k">What the wording suggests</div><Inline text={t.implies} /></div>
        <div className="fact decide wide"><div className="k">Check before choosing</div><Inline text={t.decide} /></div>
        <div className="fact warn"><div className="k">Common misconception</div><Inline text={t.misconception} /></div>
        <div className="fact"><div className="k">Typical complexity</div><Inline text={t.complexity} /></div>
      </div>
      <KnowledgeCheck check={t.check} storageKey={`term:${t.id}`} />
    </section>
  );
}

export function TermDetail({ id }: { id: string }) {
  const progress = useProgress();
  const today = useToday() ?? toDateKey(new Date());
  const t = getTerm(id)!;
  const problem = getProblem(t.problem);
  const reviewed = progress.terms[t.id];
  const related = glossary.filter((o) => o.id !== t.id && o.category === t.category && o.lessons.some((l) => t.lessons.includes(l))).slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow={<><Link href="/dictionary">Interview Dictionary</Link> · {t.category}</>}
        title={t.term}
        actions={
          <button className={`btn small${reviewed ? ' primary' : ''}`} onClick={() => update((p) => markTermReviewed(p, t.id, today))}>
            <CheckCircle2 size={15} /> {reviewed ? `Reviewed ${reviewed}` : 'Mark as reviewed'}
          </button>
        }
      >
        <p className="term-definition"><Inline text={t.definition} /></p>
        {t.aliases?.length ? <div className="row small" style={{ marginTop: 'var(--s3)' }}><span className="muted">Also appears as</span>{t.aliases.map((a) => <span key={a} className="badge">{a}</span>)}</div> : null}
      </PageHeader>

      <div className="fact-grid">
        <div className="fact"><div className="k">Example</div><Inline text={t.example} /></div>
        <div className="fact"><div className="k">What the wording suggests</div><Inline text={t.implies} /></div>
        <div className="fact decide wide"><div className="k">Check before choosing</div><Inline text={t.decide} /><p className="tiny muted" style={{ margin: '8px 0 0' }}>A keyword is a clue, not a decision. Confirm the approach against the constraints, the input’s properties (sorted? negatives? alphabet size?), and whether you must generate, count, or compare.</p></div>
        <div className="fact"><div className="k">Possible approaches</div><ul>{t.approaches.map((a) => <li key={a}><Inline text={a} /></li>)}</ul></div>
        <div className="fact warn"><div className="k">Common misconception</div><Inline text={t.misconception} /></div>
        <div className="fact"><div className="k">Data structures</div><div className="row" style={{ gap: 6 }}>{t.structures.map((s) => <code key={s}>{s}</code>)}</div></div>
        <div className="fact"><div className="k">Typical complexity</div><Inline text={t.complexity} /></div>
        <div className="fact wide"><div className="k">Learn it in depth</div>
          <div className="chip-group">{t.lessons.map((key) => {
            const ref = getLesson(key);
            return ref ? <Link key={key} className="chip" href={`/learn/${key}`}>{ref.lesson.title}</Link> : null;
          })}</div>
        </div>
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
