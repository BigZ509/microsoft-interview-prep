'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { search, type SearchKind } from '@/lib/search';

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
      <div className="page-head">
        <div className="eyebrow">Search</div>
        <h1>Search everything</h1>
        <p>Lessons, dictionary terms, LeetCode problems, Big-O drills, pattern exercises, and mock interviews.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); router.replace(`/search?q=${encodeURIComponent(q)}`); }} className="card" role="search">
        <label className="field">Query
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="permutation, sliding window, O(n log n)…" autoFocus />
        </label>
      </form>
      {q && <p className="small muted" style={{ marginTop: 12 }}>{results.length} result{results.length === 1 ? '' : 's'} for “{q}”.</p>}
      {groups.map((g) => (
        <section key={g.kind} className="section">
          <h2>{g.kind === 'Term' ? 'Definitions' : `${g.kind}s`}</h2>
          <ul className="item-list">
            {g.items.map((r) => (
              <li key={r.href + r.title} className="item">
                <div style={{ minWidth: 0 }}>
                  <Link className="title" href={r.href}>{r.title}</Link>
                  <div className="small muted">{r.subtitle}</div>
                </div>
                <span className="badge">{r.kind}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
