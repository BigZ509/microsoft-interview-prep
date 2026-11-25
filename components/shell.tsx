'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpen, BookText, Boxes, EyeOff, FileCode, Gauge, GraduationCap, Library, ListChecks, Menu, MessagesSquare, Puzzle, RotateCcw, Search, X,
} from 'lucide-react';
import { useHydrated, useProgress, useStorageError, useToday } from '@/lib/store';
import { countdown } from '@/lib/dates';
import { reviewQueuesFor } from '@/lib/insights';
import { currentDay, dayPlan } from '@/lib/bootcamp';
import { INTERVIEW_DATE } from '@/content/schedule';
import { bootcampDays } from '@/content/bootcamp';
import { ProgressBar } from './ui';

type NavItem = { href: string; label: string; Icon: typeof BookOpen; match: (p: string) => boolean; badge?: 'review' };

/**
 * Primary navigation is the guided bootcamp and review. Every standalone page lives under the secondary
 * Reference Library: still available, never required by a scheduled activity.
 */
const groups: { label: string; items: NavItem[]; secondary?: boolean }[] = [
  {
    label: 'Study',
    items: [
      { href: '/', label: 'Bootcamp', Icon: GraduationCap, match: (p) => p === '/' || p.startsWith('/study') },
      { href: '/review', label: 'Review', Icon: RotateCcw, match: (p) => p.startsWith('/review'), badge: 'review' },
    ],
  },
  {
    label: 'Reference Library',
    secondary: true,
    items: [
      { href: '/learn', label: 'Lessons', Icon: BookOpen, match: (p) => p.startsWith('/learn') },
      { href: '/dictionary', label: 'Interview Dictionary', Icon: BookText, match: (p) => p.startsWith('/dictionary') },
      { href: '/patterns', label: 'Pattern Recognition', Icon: Puzzle, match: (p) => p.startsWith('/patterns') },
      { href: '/big-o', label: 'Big-O Lab', Icon: Gauge, match: (p) => p.startsWith('/big-o') },
      { href: '/code-reading', label: 'Code Reading', Icon: FileCode, match: (p) => p.startsWith('/code-reading') },
      { href: '/blind', label: 'Blind Assessments', Icon: EyeOff, match: (p) => p.startsWith('/blind') },
      { href: '/tracker', label: 'LeetCode Tracker', Icon: ListChecks, match: (p) => p.startsWith('/tracker') },
      { href: '/oop', label: 'OOP Challenges', Icon: Boxes, match: (p) => p.startsWith('/oop') },
      { href: '/mock', label: 'Mock Interviews', Icon: MessagesSquare, match: (p) => p.startsWith('/mock') },
      { href: '/sources', label: 'Sources', Icon: Library, match: (p) => p.startsWith('/sources') },
    ],
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
  const { day } = currentDay(today);
  const plan = dayPlan(day, progress, today);
  return (
    <div className="sidebar-foot" aria-label="Bootcamp progress">
      <div className="muted tiny" style={{ fontWeight: 600 }}>Microsoft Explore · Dec 2</div>
      <div className="count">{c.kind === 'before' ? `${c.days} day${c.days === 1 ? '' : 's'} left` : c.kind === 'today' ? 'Interview day' : 'Interview done'}</div>
      <ProgressBar value={plan.percent} max={100} tone="good" label={`Day ${day} progress`} />
      <div className="tiny muted">Day {day} of {bootcampDays.length} · {plan.percent}% done today</div>
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
  const dueCount = today && hydrated ? (() => { const q = reviewQueuesFor(progress, today); return q.problems.length + q.practice.length; })() : 0;

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
            <div key={g.label} className={`nav-group${g.secondary ? ' secondary' : ''}`}>
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
