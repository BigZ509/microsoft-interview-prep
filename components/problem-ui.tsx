'use client';

import Link from 'next/link';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import type { Problem } from '@/content/types';
import { leetCodeUrl } from '@/content/problems';
import { formatDate, toDateKey } from '@/lib/dates';
import {
  PROBLEM_STATUSES, STATUS_LABELS, effectiveDate, everCompleted, isMastered, problemRecord, setProblemStatus,
  type ProblemStatus, type Progress,
} from '@/lib/progress';
import { update, useToday } from '@/lib/store';

export function statusTone(status: ProblemStatus): string {
  return status === 'independent' ? 'good' : status === 'with-help' ? 'accent' : status === 'needs-review' ? 'bad' : status === 'attempted' ? 'warn' : '';
}

export function StatusBadge({ progress, id }: { progress: Progress; id: number }) {
  const rec = problemRecord(progress, id);
  if (isMastered(rec)) return <span className="badge good">Mastered</span>;
  return <span className={`badge ${statusTone(rec.status)}`}>{STATUS_LABELS[rec.status]}</span>;
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

export function ProblemItem({ problem, progress, showDate = false }: { problem: Problem; progress: Progress; showDate?: boolean }) {
  const rec = problemRecord(progress, problem.id);
  const done = everCompleted(rec);
  return (
    <li className={`item${done ? ' done' : ''}`}>
      <div style={{ minWidth: 0, flex: '1 1 260px' }}>
        <div className="row" style={{ gap: 8 }}>
          {done && <CheckCircle2 size={16} className="check-icon" aria-label="Completed" />}
          <Link href={`/tracker/${problem.id}`} className="title">{problem.id}. {problem.title}</Link>
          <span className={`badge ${problem.difficulty}`}>{problem.difficulty}</span>
          {problem.wave === 'Stretch' && <span className="badge">P1 · optional</span>}
        </div>
        <div className="tiny muted" style={{ marginTop: 2 }}>
          {problem.pattern}{showDate ? ` · ${formatDate(effectiveDate(problem, progress))}` : ''}{rec.reschedule ? ' (rescheduled)' : ''}
        </div>
      </div>
      <div className="row" style={{ gap: 6 }}>
        <StatusBadge progress={progress} id={problem.id} />
        <Link className="btn small" href={`/tracker/${problem.id}`}>Prep & record</Link>
        <LeetCodeLink problem={problem} label="LeetCode" />
      </div>
    </li>
  );
}
