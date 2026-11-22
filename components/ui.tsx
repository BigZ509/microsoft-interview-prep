/**
 * Shared presentational building blocks. Styling lives in app/globals.css under the
 * matching class names; these components keep markup consistent across pages.
 */
import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { Difficulty } from '@/content/types';

export function PageHeader({ eyebrow, title, description, actions, children }: {
  eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode;
}) {
  return (
    <header className="page-head">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <div className="page-head-row">
        <h1>{title}</h1>
        {actions && <div className="page-head-actions">{actions}</div>}
      </div>
      {description && <p className="lede">{description}</p>}
      {children}
    </header>
  );
}

export function Panel({ title, step, icon, action, id, className = '', children, flush = false }: {
  title?: ReactNode; step?: number | 'done'; icon?: ReactNode; action?: ReactNode; id?: string;
  className?: string; children: ReactNode; flush?: boolean;
}) {
  return (
    <section id={id} className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-head">
          <h2 className="panel-title">
            {step !== undefined && <span className={`step-dot${step === 'done' ? ' done' : ''}`} aria-hidden="true">{step === 'done' ? <Check size={13} strokeWidth={3} /> : step}</span>}
            {icon}
            {title}
          </h2>
          {action && <div className="panel-action">{action}</div>}
        </div>
      )}
      <div className={flush ? 'panel-body flush' : 'panel-body'}>{children}</div>
    </section>
  );
}

export function ProgressBar({ value, max, tone = 'accent', label }: { value: number; max: number; tone?: 'accent' | 'good'; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`progress ${tone}`} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'good' | 'accent' | 'warn' }) {
  return (
    <div className={`stat${tone ? ` ${tone}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`diff diff-${difficulty}`}>{difficulty}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
