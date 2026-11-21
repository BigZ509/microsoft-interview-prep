import { Suspense } from 'react';
import { SearchPage } from '@/components/search-page';

export const metadata = { title: 'Search — Explore Prep' };

export default function Search() {
  return (
    <Suspense fallback={<p className="muted">Loading search…</p>}>
      <SearchPage />
    </Suspense>
  );
}
