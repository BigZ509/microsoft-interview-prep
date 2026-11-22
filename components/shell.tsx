'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpen, BookText, Gauge, LayoutDashboard, Library, ListChecks, Menu, MessagesSquare, Puzzle, RotateCcw, Search, X,
} from 'lucide-react';
import { useHydrated, useProgress, useStorageError, useToday } from '@/lib/store';
import { countdown } from '@/lib/dates';
import { trackStatus } from '@/lib/progress';
import { reviewQueuesFor } from '@/lib/insights';
import { INTERVIEW_DATE, PLAN_START } from '@/content/schedule';
import { problems } from '@/content/problems';
import { ProgressBar } from './ui';

type NavItem = { href: string; label: string; Icon: typeof BookOpen; match: (p: string) => boolean; badge?: 'review' };

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Today',
    items: [
      { href: '/', label: 'Dashboard', Icon: LayoutDashboard, match: (p) => p === '/' },
      { href: '/review', label: 'Review', Icon: RotateCcw, match: (p) => p.startsWith('/review'), badge: 'review' },
    ],
  },
  {
    label: 'Study',
    items: [
      { href: '/learn', label: 'Learn', Icon: BookOpen, match: (p) => p.startsWith('/learn') },
      { href: '/dictionary', label: 'Interview Dictionary', Icon: BookText, match: (p) => p.startsWith('/dictionary') },
      { href: '/patterns', label: 'Pattern Recognition', Icon: Puzzle, match: (p) => p.startsWith('/patterns') },
      { href: '/big-o', label: 'Big-O Lab', Icon: Gauge, match: (p) => p.startsWith('/big-o') },
    ],
  },
  {
    label: 'Practice',
    items: [
      { href: '/tracker', label: 'LeetCode Tracker', Icon: ListChecks, match: (p) => p.startsWith('/tracker') },
      { href: '/mock', label: 'Mock Interviews', Icon: MessagesSquare, match: (p) => p.startsWith('/mock') },
    ],
  },
  {
    label: 'Reference',
    items: [{ href: '/sources', label: 'Sources', Icon: Library, match: (p) => p.startsWith('/sources') }],
  },
];

export function CountdownChip() {
  const today = useToday();
  if (!today) return <span className="badge countdown-chip">Interview Dec 2</span>;
  const c = countdown(today, INTERVIEW_DATE);
  if (c.kind === 'today') return <span className="badge warn countdown-chip">Interview day — you’ve got this</span>;
  if (c.kind === 'after') return <span className="badge countdown-chip">Interview was {c.days} day{c.days === 1 ? '' : 's'} ago</span>;
  return <span className="badge accent countdown-chip">{c.days} day{c.days === 1 ? '' : 's'} to Dec 2</span>;
}

function SidebarProgress() {
  const today = useToday();
  const progress = useProgress();
  const hydrated = useHydrated();
  if (!today || !hydrated) return null;
  const c = countdown(today, INTERVIEW_DATE);
  const t = trackStatus(progress, problems, today, PLAN_START);
  return (
    <div className="sidebar-foot" aria-label="Plan progress">
      <div className="muted tiny" style={{ fontWeight: 600 }}>Microsoft Explore · Dec 2</div>
      <div className="count">{c.kind === 'before' ? `${c.days} day${c.days === 1 ? '' : 's'} left` : c.kind === 'today' ? 'Interview day' : 'Interview done'}</div>
      <ProgressBar value={t.totalCompleted} max={t.totalPlanned} tone="good" label="Planned problems completed" />
      <div className="tiny muted">{t.totalCompleted}/{t.totalPlanned} planned problems · {t.behind > 0 ? `${t.behind} behind` : 'on schedule'}</div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const storageError = useStorageError();
  const today = useToday();
  const progress = useProgress();
  const hydrated = useHydrated();
  const [q, setQ] = useState('');
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname; // the drawer closes automatically on navigation
  const dueCount = today && hydrated ? reviewQueuesFor(progress, today).problems.length : 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenFor(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <button className={`scrim${open ? ' open' : ''}`} aria-hidden={!open} tabIndex={-1} onClick={() => setOpenFor(null)} />
      <aside id="sidebar" className={`sidebar${open ? ' open' : ''}`} aria-label="Sections">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">{'{ }'}</span>
          <span>Explore Prep<small>Think like a programmer</small></span>
        </Link>
        <nav aria-label="Main">
          {groups.map((g) => (
            <div key={g.label} className="nav-group">
              <div className="nav-group-label">{g.label}</div>
              {g.items.map(({ href, label, Icon, match, badge }) => (
                <Link key={href} href={href} className="nav-link" aria-current={match(pathname) ? 'page' : undefined}>
                  <Icon size={17} aria-hidden="true" />
                  {label}
                  {badge === 'review' && dueCount > 0 && <span className="nav-count" aria-label={`${dueCount} due`}>{dueCount}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <SidebarProgress />
      </aside>
      <div className="main-col">
        <header className="topbar">
          <button className="menu-btn" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="sidebar" onClick={() => setOpenFor(open ? null : pathname)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
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
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons, terms, problems…" />
            </label>
          </form>
          <CountdownChip />
        </header>
        {storageError && <p className="notice" role="alert">{storageError}</p>}
        <main id="main">{children}</main>
        <footer className="footer">Original explanations · LeetCode links open official problem pages · Not affiliated with Microsoft or LeetCode · Progress is saved in this browser</footer>
      </div>
    </div>
  );
}
