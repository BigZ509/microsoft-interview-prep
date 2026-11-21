'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, BookText, Gauge, LayoutDashboard, ListChecks, MessagesSquare, Puzzle, RotateCcw, Search, Library } from 'lucide-react';
import { useStorageError, useToday } from '@/lib/store';
import { countdown } from '@/lib/dates';
import { INTERVIEW_DATE } from '@/content/schedule';

const nav = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard, match: (p: string) => p === '/' },
  { href: '/learn', label: 'Learn', Icon: BookOpen, match: (p: string) => p.startsWith('/learn') },
  { href: '/dictionary', label: 'Interview Dictionary', Icon: BookText, match: (p: string) => p.startsWith('/dictionary') },
  { href: '/patterns', label: 'Pattern Recognition', Icon: Puzzle, match: (p: string) => p.startsWith('/patterns') },
  { href: '/big-o', label: 'Big-O Lab', Icon: Gauge, match: (p: string) => p.startsWith('/big-o') },
  { href: '/tracker', label: 'LeetCode Tracker', Icon: ListChecks, match: (p: string) => p.startsWith('/tracker') },
  { href: '/review', label: 'Review', Icon: RotateCcw, match: (p: string) => p.startsWith('/review') },
  { href: '/mock', label: 'Mock Interviews', Icon: MessagesSquare, match: (p: string) => p.startsWith('/mock') },
  { href: '/sources', label: 'Sources', Icon: Library, match: (p: string) => p.startsWith('/sources') },
];

export function CountdownChip() {
  const today = useToday();
  if (!today) return <span className="badge countdown-chip">Dec 2 interview</span>;
  const c = countdown(today, INTERVIEW_DATE);
  if (c.kind === 'today') return <span className="badge warn countdown-chip">Interview day — you’ve got this</span>;
  if (c.kind === 'after') return <span className="badge countdown-chip">Interview was {c.days} day{c.days === 1 ? '' : 's'} ago</span>;
  return <span className="badge accent countdown-chip">{c.days} day{c.days === 1 ? '' : 's'} to Dec 2</span>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const storageError = useStorageError();
  const [q, setQ] = useState('');

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <aside className="sidebar" aria-label="Sections">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">{'{ }'}</span>
          <span>Explore Prep<small>Think like a programmer</small></span>
        </Link>
        <nav aria-label="Main" style={{ display: 'contents' }}>
          {nav.map(({ href, label, Icon, match }) => (
            <Link key={href} href={href} className="nav-link" aria-current={match(pathname) ? 'page' : undefined}>
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          Solve on LeetCode; learn, decode, analyze and review here. Progress is saved in this browser.
        </div>
      </aside>
      <div className="main-col">
        <header className="topbar">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <label className="search-wrap">
              <span className="sr-only">Search lessons, terms and problems</span>
              <Search size={16} aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons, terms, problems… (e.g. permutation)" />
            </label>
          </form>
          <CountdownChip />
        </header>
        {storageError && <p className="notice" role="alert">{storageError}</p>}
        <main id="main">{children}</main>
        <footer className="footer">Original explanations. LeetCode links go to official problem pages. Not affiliated with Microsoft or LeetCode.</footer>
      </div>
    </div>
  );
}
