'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { search, type SearchKind } from '@/lib/search';
import { PageHeader } from './ui';

const ORDER: SearchKind[] = ['Term', 'Lesson', 'Problem', 'Big-O drill', 'Pattern exercise', 'Decoder', 'Mock interview'];

export function SearchPage() {
  const initial = useSearchParams().get('q') ?? '';
  return <SearchInner key={initial} initial={initial} />;
}

function SearchInner({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const results = useMemo(() => search(q), [q]);
  const groups = ORDER.map((kind) => ({ kind, items: results.filter((r) => r.kind === kind) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader eyebrow="Search" title="Search everything" description="Lessons, dictionary terms, LeetCode problems, Big-O drills, pattern exercises, and mock interviews." />
      <form onSubmit={(e) => { e.preventDefault(); router.replace(`/search?q=${encodeURIComponent(q)}`); }} className="toolbar" role="search">
        <label className="field grow">Query
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="permutation, sliding window, O(n log n)…" autoFocus />
        </label>
      </form>
      {q && <p className="small muted" style={{ marginTop: 12 }}>{results.length} result{results.length === 1 ? '' : 's'} for “{q}”.</p>}
      {groups.map((g) => (
        <section key={g.kind} className="section" style={{ marginTop: 'var(--s6)' }}>
          <div className="section-title" style={{ marginTop: 0 }}><h2>{g.kind === 'Term' ? 'Definitions' : `${g.kind}s`}</h2><span className="tiny muted">{g.items.length}</span></div>
          <ul className="item-list">
            {g.items.map((r) => (
              <li key={r.href + r.title} className="item">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link className="title" href={r.href}>{r.title}</Link>
                  <div className="small muted">{r.subtitle}</div>
                </div>
                <span className="status">{r.kind}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
