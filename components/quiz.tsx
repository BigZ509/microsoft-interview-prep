'use client';

import { useState } from 'react';
import type { Check } from '@/content/types';
import { recordCheck } from '@/lib/progress';
import { update, useProgress, useToday } from '@/lib/store';
import { toDateKey } from '@/lib/dates';
import { Inline } from './rich';

/** A single multiple-choice knowledge check. Records the result under `storageKey`. */
export function KnowledgeCheck({ check, storageKey, index }: { check: Check; storageKey: string; index?: number }) {
  const progress = useProgress();
  const today = useToday();
  const [picked, setPicked] = useState<number | null>(null);
  const saved = progress.checks[storageKey];
  const submitted = picked !== null;

  const choose = (i: number) => {
    if (submitted) return;
    setPicked(i);
    update((p) => recordCheck(p, storageKey, i === check.answer, today ?? toDateKey(new Date())));
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <p style={{ fontWeight: 600 }}>{index !== undefined ? `${index + 1}. ` : ''}<Inline text={check.q} /></p>
      <div className="choices" role="group" aria-label="Answer choices">
        {check.options.map((opt, i) => {
          const cls = submitted ? (i === check.answer ? 'choice correct' : i === picked ? 'choice wrong' : 'choice') : 'choice';
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={submitted} aria-pressed={picked === i}>
              <span className="letter">{String.fromCharCode(65 + i)}</span>
              <span><Inline text={opt} /></span>
            </button>
          );
        })}
      </div>
      {submitted ? (
        <div className={`callout ${picked === check.answer ? 'good' : 'bad'}`} role="status">
          <strong>{picked === check.answer ? 'Correct.' : 'Not quite.'}</strong> <Inline text={check.explain} />
          <div style={{ marginTop: 8 }}><button className="btn small" onClick={() => setPicked(null)}>Try again</button></div>
        </div>
      ) : saved ? (
        <p className="tiny muted" style={{ margin: 0 }}>Last attempt: {saved.correct ? 'correct' : 'incorrect'} ({saved.attempts} attempt{saved.attempts === 1 ? '' : 's'}{saved.misses ? `, missed ${saved.misses}× before` : ''})</p>
      ) : null}
    </div>
  );
}
