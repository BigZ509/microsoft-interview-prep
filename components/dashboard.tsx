'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Circle, Clock, Gauge, Puzzle, RotateCcw, Target } from 'lucide-react';
import { getLesson } from '@/content/modules';
import { getTerm } from '@/content/glossary';
import { getDrill } from '@/content/drills';
import { scenarios } from '@/content/patterns';
import { INTERVIEW_DATE, PLAN_START, interviewDayChecklist, schedule, studyBlocks } from '@/content/schedule';
import { problems } from '@/content/problems';
import { countdown, daysBetween, formatDate } from '@/lib/dates';
import { assignmentsFor, daySequence, studyDayFor } from '@/lib/plan';
import { effectiveDate, everCompleted, problemRecord, trackStatus } from '@/lib/progress';
import { reviewQueuesFor, weakAreasFor } from '@/lib/insights';
import { useHydrated, useProgress, useToday } from '@/lib/store';
import { ProblemItem } from './problem-ui';
import { ReviewList } from './review';
import { EmptyState, Panel, ProgressBar } from './ui';

export function Dashboard() {
  const today = useToday();
  const hydrated = useHydrated();
  const progress = useProgress();
  if (!today || !hydrated) return <p className="muted">Loading today&apos;s plan…</p>;

  const { day, position } = studyDayFor(today);
  const dayNumber = schedule.indexOf(day) + 1;
  const c = countdown(today, INTERVIEW_DATE);
  const track = trackStatus(progress, problems, today, PLAN_START);
  const seq = daySequence(day, progress, today);
  const a = assignmentsFor(day.date, progress);
  const queues = reviewQueuesFor(progress, today);
  const weak = weakAreasFor(progress).slice(0, 4);
  const stretch = a.assigned.filter((p) => p.wave === 'Stretch');
  const stepDone = (id: string) => { const s = seq.find((x) => x.id === id)!; return s.total > 0 && s.done >= s.total; };
  const currentStep = seq.find((s) => s.total > 0 && s.done < s.total)?.id;

  // "Next up": the first unfinished item in learning order.
  const nextLesson = day.lessons.find((k) => !progress.lessons[k]?.done);
  const nextTerm = day.terms.find((t) => !(progress.terms[t] || progress.checks[`term:${t}`]));
  const nextDrill = day.drills.find((d) => !progress.drills[d]);
  const nextPattern = day.patterns.find((s) => !progress.patterns[s]);
  const nextProblem = a.coreAssigned.find((p) => !everCompleted(problemRecord(progress, p.id)));
  const next = nextLesson ? { label: 'Lesson', what: getLesson(nextLesson)!.lesson.title, href: `/learn/${nextLesson}` }
    : nextTerm ? { label: 'Vocabulary', what: getTerm(nextTerm)!.term, href: `/dictionary/${nextTerm}` }
    : nextDrill ? { label: 'Big-O drill', what: getDrill(nextDrill)!.title, href: `/big-o/${nextDrill}` }
    : nextPattern ? { label: 'Pattern exercise', what: scenarios.find((s) => s.id === nextPattern)!.wording, href: `/patterns#${nextPattern}` }
    : nextProblem ? { label: 'LeetCode', what: `${nextProblem.id}. ${nextProblem.title}`, href: `/tracker/${nextProblem.id}` }
    : queues.problems.length ? { label: 'Review', what: `${queues.problems.length} problem${queues.problems.length === 1 ? '' : 's'} due`, href: '/review' }
    : null;

  return (
    <>
      <section className="hero" aria-label="Today">
        <div className="hero-main">
          <div className="eyebrow">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1>
            <span className="h1-kicker">{position === 'during' ? `Day ${dayNumber} of ${schedule.length}` : position === 'before' ? `Plan starts ${formatDate(PLAN_START)} · previewing Day 1` : 'Plan complete · showing the last day'}</span>
            {day.theme}
          </h1>
          <p style={{ marginBottom: 0 }}>{day.focus}</p>
          <div className="hero-meta">
            <span><Clock size={14} aria-hidden="true" /> {studyBlocks.map((b) => `${b.label} ${b.minutes}`).join(' · ')}</span>
          </div>
          {next ? (
            <div className="next-up">
              <span className="label">Next up · {next.label}</span>
              <span className="what">{next.what}</span>
              <Link className="btn primary small" href={next.href}>Continue <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
          ) : (
            <div className="next-up" style={{ background: 'var(--good-soft)', borderColor: 'var(--good-line)' }}>
              <CheckCircle2 size={18} className="check-icon" aria-hidden="true" />
              <span className="what">Everything planned for today is done. Revisit a weak area or rest.</span>
            </div>
          )}
        </div>
        <div className="hero-side">
          <div className="eyebrow" style={{ marginBottom: 0 }}>Interview · {formatDate(INTERVIEW_DATE, { month: 'short', day: 'numeric' })}</div>
          {c.kind === 'before' && <div><span className="big-number">{c.days}</span> <span className="muted">day{c.days === 1 ? '' : 's'} to go</span></div>}
          {c.kind === 'today' && <div className="big-number" style={{ fontSize: 32 }}>Today</div>}
          {c.kind === 'after' && <p className="muted" style={{ margin: 0 }}>Interview was {c.days} day{c.days === 1 ? '' : 's'} ago.</p>}
          <hr style={{ margin: '8px 0' }} />
          <div className="eyebrow" style={{ marginBottom: 0, color: 'var(--muted)' }}>Am I on track?</div>
          <p className="track-state" style={{ color: track.state === 'behind' ? 'var(--warn)' : track.state === 'not-started-yet' ? 'var(--ink)' : 'var(--good)' }}>
            {track.state === 'not-started-yet' && 'Plan has not started yet.'}
            {track.state === 'on-track' && `Yes — on schedule.${track.dueToday ? ` ${track.dueToday} problem${track.dueToday === 1 ? '' : 's'} still to do today.` : ''}`}
            {track.state === 'behind' && `Behind by ${track.behind} problem${track.behind === 1 ? '' : 's'} from earlier days.`}
            {track.state === 'finished' && 'All planned problems completed.'}
          </p>
          <ProgressBar value={track.totalCompleted} max={track.totalPlanned} tone="good" label="Planned problems completed" />
          <p className="tiny muted" style={{ margin: 0 }}>{track.totalCompleted}/{track.totalPlanned} planned problems · {track.independent} independent · {track.withHelp} with help · {track.mastered} mastered</p>
        </div>
      </section>

      {c.kind === 'today' && (
        <Panel title="Interview-day checklist" className="section" icon={<Target size={17} aria-hidden="true" />}>
          <ul>{interviewDayChecklist.map((x) => <li key={x}>{x}</li>)}</ul>
        </Panel>
      )}

      <div className="section-title">
        <h2>Today&apos;s learning sequence{day.date !== today ? ` · ${formatDate(day.date)}` : ''}</h2>
        <span className="tiny muted">Learn → Vocabulary → Big-O → Pattern → Solve → Review</span>
      </div>
      <nav className="sequence" aria-label="Today's steps">
        {seq.map((s, i) => {
          const done = s.total > 0 && s.done >= s.total;
          const cls = `seq-step${done ? ' done' : ''}${s.id === currentStep ? ' current' : ''}`;
          return (
            <a key={s.id} href={s.href} className={cls} aria-current={s.id === currentStep ? 'step' : undefined}>
              <span className="seq-top">
                <span className={`step-dot${done ? ' done' : ''}`} aria-hidden="true">{done ? '✓' : i + 1}</span>
                {s.id === currentStep && <span className="tag">Now</span>}
              </span>
              <span className="label">{s.label}</span>
              <span className="count">{s.id === 'review' ? (queues.problems.length ? `${queues.problems.length} due` : 'Queue clear') : s.total ? `${s.done}/${s.total}` : 'Nothing new today'}</span>
              {s.id !== 'review' && s.total > 0 && <ProgressBar value={s.done} max={s.total} tone={done ? 'good' : 'accent'} />}
            </a>
          );
        })}
      </nav>

      <div className="dash-grid">
        <div className="dash-main">
          <Panel id="today-lessons" step={stepDone('learn') ? 'done' : 1} title="Learn today’s concepts" action={<span className="tiny muted">{seq[0].done}/{seq[0].total} complete</span>} flush>
            {day.lessons.length === 0 ? <EmptyState>No new lessons today — revisit anything in your review queue.</EmptyState> : (
              <ul className="item-list">
                {day.lessons.map((key) => {
                  const ref = getLesson(key)!;
                  const done = progress.lessons[key]?.done;
                  return (
                    <li key={key} className="item">
                      <span className="row" style={{ gap: 10 }}>
                        {done ? <CheckCircle2 size={17} className="check-icon" aria-label="Completed" /> : <Circle size={17} className="todo-icon" aria-label="Not completed" />}
                        <Link href={`/learn/${key}`}>{ref.lesson.title}</Link>
                      </span>
                      <span className="meta">Module {ref.module.number}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel id="today-terms" step={stepDone('vocab') ? 'done' : 2} title="Understand the vocabulary" action={<span className="tiny muted">Open each term and answer its check</span>}>
            {day.terms.length === 0 ? <EmptyState>No new terms today.</EmptyState> : (
              <div className="chip-group">
                {day.terms.map((t) => {
                  const term = getTerm(t)!;
                  const done = progress.terms[t] || progress.checks[`term:${t}`];
                  return <Link key={t} href={`/dictionary/${t}`} className={`chip${done ? ' correct' : ''}`}>{done ? '✓ ' : ''}{term.term}</Link>;
                })}
              </div>
            )}
          </Panel>

          <div className="grid-2" style={{ marginTop: 'var(--s4)' }}>
            <Panel id="today-drills" step={stepDone('bigo') ? 'done' : 3} title="Analyze complexity" icon={<Gauge size={16} aria-hidden="true" />} flush>
              {day.drills.length === 0 ? <EmptyState>None today.</EmptyState> : (
                <ul className="item-list">
                  {day.drills.map((id) => {
                    const d = getDrill(id)!;
                    const rec = progress.drills[id];
                    return (
                      <li key={id} className="item">
                        <Link href={`/big-o/${id}`}>{d.title}</Link>
                        {rec ? <span className={`status ${rec.time && rec.space ? 'good' : 'warn'}`}>{rec.time && rec.space ? 'Correct' : 'Review'}</span> : <span className="status">New</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
            <Panel id="today-patterns" step={stepDone('pattern') ? 'done' : 4} title="Recognize the pattern" icon={<Puzzle size={16} aria-hidden="true" />} flush>
              {day.patterns.length === 0 ? <EmptyState>None today.</EmptyState> : (
                <ul className="item-list">
                  {day.patterns.map((id) => {
                    const s = scenarios.find((x) => x.id === id)!;
                    const rec = progress.patterns[id];
                    return (
                      <li key={id} className="item">
                        <Link href={`/patterns#${id}`} className="small" style={{ flex: '1 1 180px' }}>{s.wording}</Link>
                        {rec ? <span className={`status ${rec.correct ? 'good' : 'warn'}`}>{rec.correct ? 'Done' : 'Revisit'}</span> : <span className="status">New</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <Panel
            id="today-problems"
            className="section"
            step={stepDone('solve') ? 'done' : 5}
            title="Solve on LeetCode"
            action={<span className="badge accent">Daily target: {a.plannedTarget} · done {a.completedToday.filter((p) => p.wave !== 'Stretch').length}/{a.coreAssigned.length}</span>}
            flush
          >
            {a.coreAssigned.length === 0 && <EmptyState>No new problems planned for this day. {day.extras.join(' · ')}</EmptyState>}
            {a.coreAssigned.length > 0 && <ul className="item-list">{a.coreAssigned.map((p) => <ProblemItem key={p.id} problem={p} progress={progress} />)}</ul>}
            {a.coreAssigned.length !== a.plannedTarget && a.plannedTarget > 0 && <p className="tiny muted" style={{ padding: '8px 20px 0' }}>Rescheduling changed today&apos;s list ({a.coreAssigned.length} assigned vs. {a.plannedTarget} planned).</p>}
            {stretch.length > 0 && (
              <>
                <div className="exercise-label" style={{ padding: '0 20px' }}>Optional P1 stretch</div>
                <ul className="item-list">{stretch.map((p) => <ProblemItem key={p.id} problem={p} progress={progress} />)}</ul>
              </>
            )}
            {a.carried.length > 0 && (
              <>
                <div className="exercise-label" style={{ padding: '0 20px', color: 'var(--warn)' }}>Carried over from earlier days</div>
                <ul className="item-list">{a.carried.map((p) => <ProblemItem key={p.id} problem={p} progress={progress} showDate />)}</ul>
              </>
            )}
            {day.extras.length > 0 && a.coreAssigned.length > 0 && <p className="small" style={{ padding: '12px 20px 16px', margin: 0, borderTop: '1px solid var(--line)' }}><strong>Also today:</strong> {day.extras.join(' · ')} — see <Link href="/mock">Mock Interviews</Link>.</p>}
          </Panel>

          <Panel id="review" step={queues.problems.length + queues.concepts.length === 0 ? 'done' : 6} title="Review queue" icon={<RotateCcw size={16} aria-hidden="true" />} action={<Link className="btn small ghost" href="/review">Open review</Link>} flush>
            <ReviewList problems={queues.problems.slice(0, 6)} concepts={queues.concepts.slice(0, 6)} />
          </Panel>
        </div>

        <aside className="dash-rail" aria-label="Progress and upcoming">
          <Panel title="Weak areas" icon={<Target size={16} aria-hidden="true" />} flush>
            {weak.length === 0 ? <p className="empty" style={{ padding: '0 20px 16px' }}>None yet. They appear as you record help-needed solves, missed checks, and Big-O or pattern misses.</p> : (
              <ul className="item-list">
                {weak.map((w) => (
                  <li key={w.id} className="item">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Link href={`/learn/${w.id}`} className="title">{w.label}</Link>
                      <div className="meta">{w.reasons.slice(0, 2).join(' · ')}</div>
                    </div>
                    <span className="status warn">{w.score}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Coming up" icon={<CalendarDays size={16} aria-hidden="true" />}>
            <ul className="upcoming">
              {schedule.filter((d) => d.date > day.date).slice(0, 4).map((d) => {
                const count = problems.filter((p) => effectiveDate(p, progress) === d.date && p.wave !== 'Stretch').length;
                return (
                  <li key={d.date}>
                    <span className="date"><span>{formatDate(d.date, { weekday: 'short' })}</span><b>{Number(d.date.slice(8))}</b></span>
                    <span>
                      <strong style={{ display: 'block', lineHeight: 1.35 }}>{d.theme}</strong>
                      <span className="tiny muted">{daysBetween(today, d.date) > 0 ? `in ${daysBetween(today, d.date)}d` : 'past'}{count ? ` · ${count} problem${count === 1 ? '' : 's'}` : ' · review day'}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            {schedule.filter((d) => d.date > day.date).length === 0 && <EmptyState>No more plan days.</EmptyState>}
          </Panel>
          <Panel title="Keep learning" icon={<BookOpen size={16} aria-hidden="true" />}>
            <div className="chip-group">
              <Link className="chip" href="/learn">All lessons</Link>
              <Link className="chip" href="/patterns/decoder">Problem decoder</Link>
              <Link className="chip" href="/mock">Mock interview</Link>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
