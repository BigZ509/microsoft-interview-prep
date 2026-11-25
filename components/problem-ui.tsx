'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, ExternalLink, RotateCcw } from 'lucide-react';
import type { Problem } from '@/content/types';
import { leetCodeUrl } from '@/content/problems';
import { formatDate, toDateKey } from '@/lib/dates';
import {
  PROBLEM_STATUSES, STATUS_LABELS, effectiveDate, everCompleted, isMastered, problemRecord, setProblemStatus,
  type ProblemStatus, type Progress,
} from '@/lib/progress';
import { update, useToday } from '@/lib/store';
import { DifficultyBadge } from './ui';

export function statusTone(status: ProblemStatus): string {
  return status === 'independent' ? 'good' : status === 'with-help' ? 'accent' : status === 'needs-review' ? 'bad' : status === 'attempted' ? 'warn' : '';
}

export function StatusBadge({ progress, id }: { progress: Progress; id: number }) {
  const rec = problemRecord(progress, id);
  if (isMastered(rec)) return <span className="status good">Mastered</span>;
  return <span className={`status ${statusTone(rec.status)}`}>{STATUS_LABELS[rec.status]}</span>;
}

export function StatusPicker({ id, progress }: { id: number; progress: Progress }) {
  const today = useToday();
  const current = problemRecord(progress, id).status;
  return (
    <div className="chip-group" role="group" aria-label="Problem status">
      {PROBLEM_STATUSES.map((s) => (
        <button
          key={s}
          className="chip"
          aria-pressed={current === s}
          onClick={() => update((p) => setProblemStatus(p, id, s, today ?? toDateKey(new Date())))}
        >
          {STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}

export function LeetCodeLink({ problem, label = 'Open on LeetCode' }: { problem: Problem; label?: string }) {
  return (
    <a className="btn small" href={leetCodeUrl(problem)} target="_blank" rel="noopener noreferrer">
      {label} <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}

/** A compact, fully clickable problem row. The row opens the prep page; the icon opens LeetCode. */
export function ProblemItem({ problem, progress, showDate = false }: { problem: Problem; progress: Progress; showDate?: boolean }) {
  const rec = problemRecord(progress, problem.id);
  const done = everCompleted(rec);
  const queued = rec.retry || rec.status === 'needs-review';
  return (
    <li className={`prob${done ? ' done' : ''}`}>
      {queued ? <RotateCcw size={17} className="todo-icon" style={{ color: 'var(--bad)' }} aria-label="Queued for review" />
        : done ? <CheckCircle2 size={18} className="check-icon" aria-label="Completed" />
        : <Circle size={18} className="todo-icon" aria-label="Not completed" />}
      <Link href={`/tracker/${problem.id}`} className="prob-main">
        <span className="prob-title">
          <span className="prob-name">{problem.id}. {problem.title}</span>
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.evidence?.includes('colorstack-reported') && <span className="badge accent" title="Reported by ColorStack members in Explore interviews (anecdotal)">Reported</span>}
          {!problem.evidence?.includes('colorstack-reported') && problem.evidence?.includes('github-historical') && <span className="badge" title="Historical Microsoft internship report (anecdotal)">Historical</span>}
          {problem.wave === 'Stretch' && <span className="badge">{problem.demoted ? 'Optional' : 'P1 · optional'}</span>}
        </span>
        <span className="prob-meta" style={{ display: 'block' }}>
          {problem.pattern}{showDate ? ` · ${formatDate(effectiveDate(problem, progress))}` : ''}{rec.reschedule ? ' · rescheduled' : ''}
        </span>
      </Link>
      <span className="prob-side">
        <StatusBadge progress={progress} id={problem.id} />
        <a className="btn icon ghost" href={leetCodeUrl(problem)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${problem.id}. ${problem.title} on LeetCode`} title="Open on LeetCode">
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </span>
    </li>
  );
}
