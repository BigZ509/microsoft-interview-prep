'use client';

/**
 * Home: the guided seven-day bootcamp. Shows the countdown, today's objectives and ordered activities,
 * time and progress, a Continue Studying button that goes straight to the next activity, the hours
 * setting, and a card per day.
 */
import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, Circle, Clock, PlayCircle, Target } from 'lucide-react';
import { ALLOCATION_LABELS, SEQUENCE_STEPS, TIER_LABELS, bootcampDays } from '@/content/bootcamp';
import { INTERVIEW_DATE, interviewDayChecklist } from '@/content/schedule';
import { formatDate } from '@/lib/dates';
import {
  activeItems, allocationMinutes, continueTarget, currentDay, dayCardStatus, dayPlan, daysUntilInterview, hoursFor, setHours,
  type DayCardStatus, type DayPlan, type PlanItem,
} from '@/lib/bootcamp';
import { update, useHydrated, useProgress, useToday } from '@/lib/store';
import { Panel, ProgressBar } from './ui';

export function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`;
}

const STATUS_TEXT: Record<PlanItem['status'], string> = { done: 'Done', skipped: 'Skipped', pending: 'To do', deferred: 'Deferred' };
const STATUS_TONE: Record<PlanItem['status'], string> = { done: 'good', skipped: 'warn', pending: '', deferred: '' };
const CARD_TEXT: Record<DayCardStatus, string> = { complete: 'Complete', today: 'Today', behind: 'Unfinished', upcoming: 'Upcoming', 'in-progress': 'Started early' };

const HOUR_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function ActivityRow({ item, index, isNext }: { item: PlanItem; index: number | null; isNext: boolean }) {
  const a = item.activity;
  const deferred = item.status === 'deferred';
  return (
    <li className={`plan-row${deferred ? ' deferred' : ''}${isNext ? ' next' : ''}`}>
      <span className="plan-num" aria-hidden="true">{item.status === 'done' ? <CheckCircle2 size={17} className="check-icon" /> : index ?? '–'}</span>
      <div className="plan-main">
        <Link href={`/study/${a.id}`} className="plan-title">{item.title}</Link>
        <span className="plan-meta">
          {SEQUENCE_STEPS[a.step - 1]}
          {item.carried && ` · carried over from Day ${a.day}`}
          {item.mode === 'recap' && ' · short recap'}
          {item.mode === 'retention' && ' · retention check'}
        </span>
      </div>
      <span className="plan-side">
        {isNext && <span className="tag">Next</span>}
        <span className={`badge tier-${item.tier}`}>{TIER_LABELS[item.tier]}</span>
        <span className="tiny muted">{item.minutes} min</span>
        <span className={`status ${STATUS_TONE[item.status]}`}>{STATUS_TEXT[item.status]}</span>
      </span>
    </li>
  );
}

function DayCard({ plan, today, position, featured }: { plan: DayPlan; today: string; position: string | null; featured: boolean }) {
  const d = plan.day;
  const status = dayCardStatus(plan, today);
  const target = continueTarget(plan, position) ?? activeItems(plan)[0];
  const label = status === 'complete' ? 'Review' : plan.percent > 0 || status === 'behind' ? 'Continue' : 'Start';
  return (
    <article className={`day-card${featured ? ' featured' : ''} ${status}`} aria-label={`Day ${d.day}: ${d.title}`}>
      <div className="day-card-head">
        <span className="eyebrow" style={{ margin: 0 }}>Day {d.day} · {formatDate(d.date)}</span>
        <span className={`status ${status === 'complete' ? 'good' : status === 'behind' ? 'warn' : ''}`}>{CARD_TEXT[status]}</span>
      </div>
      <h3>{d.title}</h3>
      <p className="tiny muted" style={{ margin: 0 }}>{d.topics.slice(0, 4).join(' · ')}</p>
      <div className="day-card-progress">
        <ProgressBar value={plan.percent} max={100} tone="good" label={`Day ${d.day} completion`} />
        <span className="tiny muted">{plan.percent}% · {formatMinutes(plan.planned)}</span>
      </div>
      {target && <Link className={`btn small${featured ? ' primary' : ''}`} href={`/study/${target.activity.id}`}>{label} <ArrowRight size={13} aria-hidden="true" /></Link>}
    </article>
  );
}

export function BootcampHome() {
  const today = useToday();
  const hydrated = useHydrated();
  const progress = useProgress();
  if (!today || !hydrated) return <p className="muted">Loading today’s plan…</p>;

  const { day: n, phase } = currentDay(today);
  const plans = bootcampDays.map((d) => dayPlan(d.day, progress, today));
  const plan = plans[n - 1];
  const day = plan.day;
  const target = continueTarget(plan, progress.bootcamp.position);
  const left = daysUntilInterview(today);
  const hours = hoursFor(progress);
  const active = activeItems(plan);
  const remaining = active.filter((i) => i.status !== 'done').reduce((s, i) => s + i.minutes, 0);
  const alloc = allocationMinutes(active.map((i) => ({ category: i.activity.category, minutes: i.minutes })));
  const nextDay = plans[n];
  const nextDayTarget = nextDay ? continueTarget(nextDay, progress.bootcamp.position) : null;
  // Number the non-deferred items, and show a heading where a group (Day 6 rounds) starts.
  const rows = plan.items.map((item, k) => ({
    item,
    index: item.status === 'deferred' ? null : plan.items.slice(0, k + 1).filter((i) => i.status !== 'deferred').length,
    heading: item.activity.group && item.activity.group !== plan.items[k - 1]?.activity.group ? item.activity.group : undefined,
  }));

  return (
    <>
      <section className="hero bootcamp-hero" aria-label="Today">
        <div className="hero-main">
          <div className="eyebrow">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1>
            <span className="h1-kicker">
              {phase === 'during' && `Day ${n} of ${bootcampDays.length}`}
              {phase === 'before' && `The bootcamp starts ${formatDate(day.date)} · previewing Day 1`}
              {phase === 'interview' && 'Interview day · Day 7 shown for a last skim'}
              {phase === 'after' && 'Bootcamp finished · Day 7 shown'}
            </span>
            {day.title}
          </h1>
          <p style={{ marginBottom: 0 }}>{day.focus}</p>
          {target ? (
            <div className="continue-box">
              <Link className="btn primary continue-btn" href={`/study/${target.activity.id}`}>
                <PlayCircle size={20} aria-hidden="true" /> Continue Studying
              </Link>
              <span className="continue-next">
                <span className="label">Next up · {SEQUENCE_STEPS[target.activity.step - 1]}</span>
                <span className="what">{target.title}</span>
                <span className="tiny muted">About {target.minutes} min · {TIER_LABELS[target.tier]}</span>
              </span>
            </div>
          ) : (
            <div className="continue-box done">
              <CheckCircle2 size={20} className="check-icon" aria-hidden="true" />
              <span className="continue-next">
                <span className="what">Day {n} is complete.</span>
                <span className="tiny muted">{nextDay && nextDayTarget ? <>Rest, or <Link href={`/study/${nextDayTarget.activity.id}`}>start Day {nextDay.day.day} early</Link>.</> : 'Rest well before the interview.'}</span>
              </span>
            </div>
          )}
          <div className="hero-meta">
            <span><Clock size={14} aria-hidden="true" /> {formatMinutes(plan.planned)} planned · {formatMinutes(remaining)} left</span>
            {plan.deferredCount > 0 && <span>{plan.deferredCount} optional item{plan.deferredCount === 1 ? '' : 's'} deferred to fit {hours} h</span>}
          </div>
          <div className="day-progress-line">
            <ProgressBar value={plan.percent} max={100} tone="good" label="Today’s progress" />
            <span className="small"><strong>{plan.percent}%</strong> of today · {active.filter((i) => i.status === 'done').length}/{active.length} activities</span>
          </div>
        </div>
        <div className="hero-side">
          <div className="eyebrow" style={{ marginBottom: 0 }}>Interview · {formatDate(INTERVIEW_DATE, { month: 'short', day: 'numeric' })}</div>
          {left > 0 && <div><span className="big-number">{left}</span> <span className="muted">day{left === 1 ? '' : 's'} remaining</span></div>}
          {left === 0 && <div className="big-number" style={{ fontSize: 32 }}>Today</div>}
          {left < 0 && <p className="muted" style={{ margin: 0 }}>Interview was {-left} day{left === -1 ? '' : 's'} ago.</p>}
          <hr style={{ margin: '8px 0' }} />
          <label className="field">Hours available per day
            <select value={hours} onChange={(e) => update((p) => setHours(p, Number(e.target.value)))}>
              {[...new Set([...HOUR_OPTIONS, hours])].sort((a, b) => a - b).map((h) => <option key={h} value={h}>{h} hours</option>)}
            </select>
            <span className="hint">Over budget, stretch items are deferred first, then reinforcement. Core work is never dropped. Day 7 uses 60% of this.</span>
          </label>
          <ul className="alloc-list" aria-label="Today’s time split">
            {(Object.keys(alloc) as (keyof typeof alloc)[]).map((k) => (
              <li key={k}><span>{ALLOCATION_LABELS[k]}</span><span className="muted">{plan.planned ? Math.round((100 * alloc[k]) / plan.planned) : 0}%</span></li>
            ))}
          </ul>
        </div>
      </section>

      {phase === 'interview' && (
        <Panel title="Interview-day checklist" className="section" icon={<Target size={17} aria-hidden="true" />}>
          <ul>{interviewDayChecklist.map((x) => <li key={x}>{x}</li>)}</ul>
        </Panel>
      )}

      <div className="dash-grid">
        <div className="dash-main">
          <Panel title={`Today’s objectives · Day ${n}`} icon={<Target size={16} aria-hidden="true" />}>
            <ul style={{ margin: 0 }}>{day.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
          </Panel>
          <Panel id="today-activities" title="Today’s activities, in order" action={<span className="tiny muted">Core first · reinforcement if time permits · stretch is optional</span>} flush>
            <ol className="plan-list">
              {rows.map(({ item, index, heading }) => (
                <ActivityRowGroup key={item.activity.id} heading={heading}>
                  <ActivityRow item={item} index={index} isNext={target?.activity.id === item.activity.id} />
                </ActivityRowGroup>
              ))}
            </ol>
          </Panel>
        </div>
        <aside className="dash-rail" aria-label="The seven days">
          <Panel title="The seven days" icon={<CalendarDays size={16} aria-hidden="true" />}>
            <div className="day-cards">
              {plans.map((p) => <DayCard key={p.day.day} plan={p} today={today} position={progress.bootcamp.position} featured={p.day.day === n} />)}
            </div>
          </Panel>
          <p className="tiny muted"><Circle size={10} aria-hidden="true" /> Every page in the Reference Library stays available, but nothing scheduled requires it.</p>
        </aside>
      </div>
    </>
  );
}

function ActivityRowGroup({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <>
      {heading && <li className="plan-group">{heading}</li>}
      {children}
    </>
  );
}
