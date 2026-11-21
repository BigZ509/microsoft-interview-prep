'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { getLesson } from '@/content/modules';
import { getTerm } from '@/content/glossary';
import { getDrill } from '@/content/drills';
import { getProblem } from '@/content/problems';
import { scenarios } from '@/content/patterns';
import { INTERVIEW_DATE, PLAN_START, interviewDayChecklist, schedule, studyBlocks } from '@/content/schedule';
import { problems } from '@/content/problems';
import { countdown, daysBetween, formatDate } from '@/lib/dates';
import { assignmentsFor, daySequence, studyDayFor } from '@/lib/plan';
import { trackStatus } from '@/lib/progress';
import { reviewQueuesFor, weakAreasFor } from '@/lib/insights';
import { useHydrated, useProgress, useToday } from '@/lib/store';
import { ProblemItem } from './problem-ui';
import { ReviewList } from './review';

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
  const weak = weakAreasFor(progress).slice(0, 5);
  const showingOtherDay = day.date !== today;
  const stretch = a.assigned.filter((p) => p.wave === 'Stretch');

  return (
    <>
      <div className="hero">
        <div className="card">
          <div className="eyebrow">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <h1 style={{ marginBottom: 4 }}>{position === 'during' ? `Day ${dayNumber} of ${schedule.length}: ${day.theme}` : position === 'before' ? `Plan starts ${formatDate(PLAN_START)}` : 'Your plan is complete'}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {position === 'before' && `Previewing Day 1 (${formatDate(day.date)}). `}
            {position === 'after' && 'The interview date has passed. Everything stays available for continued practice — showing the last plan day. '}
            {day.focus}
          </p>
          <div className="row small muted" style={{ marginTop: 10 }}>
            <Clock size={14} /> Suggested blocks: {studyBlocks.map((b) => `${b.label} ${b.minutes}`).join(' · ')}
          </div>
        </div>
        <div className="card">
          <div className="eyebrow">Interview · {formatDate(INTERVIEW_DATE, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          {c.kind === 'before' && <><div className="big-number">{c.days}</div><div className="muted">day{c.days === 1 ? '' : 's'} to go</div></>}
          {c.kind === 'today' && <div className="big-number" style={{ fontSize: '1.8rem' }}>Today</div>}
          {c.kind === 'after' && <div className="muted">Interview was {c.days} day{c.days === 1 ? '' : 's'} ago.</div>}
          <hr style={{ margin: '12px 0' }} />
          <div className="eyebrow">Am I on track?</div>
          <p style={{ margin: '0 0 6px', fontWeight: 650 }}>
            {track.state === 'not-started-yet' && 'Plan has not started yet.'}
            {track.state === 'on-track' && `Yes — on schedule.${track.dueToday ? ` ${track.dueToday} problem${track.dueToday === 1 ? '' : 's'} still to do today.` : ''}`}
            {track.state === 'behind' && `Behind by ${track.behind} problem${track.behind === 1 ? '' : 's'} from earlier days.`}
            {track.state === 'finished' && 'All planned problems completed.'}
          </p>
          <div className="progress good"><span style={{ width: `${(track.totalCompleted / track.totalPlanned) * 100}%` }} /></div>
          <p className="tiny muted" style={{ margin: '6px 0 0' }}>{track.totalCompleted}/{track.totalPlanned} planned problems done · {track.independent} independent · {track.withHelp} with help · {track.mastered} mastered</p>
        </div>
      </div>

      {c.kind === 'today' && (
        <section className="section card">
          <h2>Interview-day checklist</h2>
          <ul>{interviewDayChecklist.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}

      <section className="section">
        <h2>Today&apos;s learning sequence{showingOtherDay ? ` (${formatDate(day.date)})` : ''}</h2>
        <div className="sequence">
          {seq.map((s, i) => {
            const done = s.total > 0 && s.done >= s.total;
            return (
              <a key={s.id} href={s.href} className={`seq-step${done ? ' done' : ''}`}>
                <span className="n">STEP {i + 1}</span>
                <span className="label">{s.label}</span>
                <span className="tiny muted">{s.id === 'review' ? (queues.problems.length ? `${queues.problems.length} due` : 'Queue clear') : s.total ? `${s.done}/${s.total}` : 'Nothing new today'}</span>
              </a>
            );
          })}
        </div>
      </section>

      <div className="grid-2 section" style={{ alignItems: 'start' }}>
        <section id="today-lessons" className="card">
          <h2>1. Learn — today&apos;s concepts</h2>
          {day.lessons.length === 0 && <p className="muted small">No new lessons today. Revisit lessons in your review queue.</p>}
          <ul className="item-list">
            {day.lessons.map((key) => {
              const ref = getLesson(key)!;
              const done = progress.lessons[key]?.done;
              return (
                <li key={key} className={`item${done ? ' done' : ''}`}>
                  <span className="row" style={{ gap: 8 }}>{done ? <CheckCircle2 size={15} className="check-icon" /> : <Circle size={15} className="muted" />}<Link href={`/learn/${key}`}>{ref.lesson.title}</Link></span>
                  <span className="tiny muted">M{ref.module.number}</span>
                </li>
              );
            })}
          </ul>
        </section>
        <section id="today-terms" className="card">
          <h2>2. Vocabulary</h2>
          <p className="small muted">Open each term and answer its knowledge check.</p>
          <div className="chip-group">
            {day.terms.map((t) => {
              const term = getTerm(t)!;
              const done = progress.terms[t] || progress.checks[`term:${t}`];
              return <Link key={t} href={`/dictionary/${t}`} className={`chip${done ? ' correct' : ''}`}>{done ? '✓ ' : ''}{term.term}</Link>;
            })}
          </div>
        </section>
        <section id="today-drills" className="card">
          <h2>3. Big-O exercises</h2>
          <ul className="item-list">
            {day.drills.map((id) => {
              const d = getDrill(id)!;
              const rec = progress.drills[id];
              return (
                <li key={id} className={`item${rec?.time && rec?.space ? ' done' : ''}`}>
                  <Link href={`/big-o/${id}`}>{d.title}</Link>
                  {rec ? <span className={`badge ${rec.time && rec.space ? 'good' : 'warn'}`}>{rec.time && rec.space ? 'Correct' : 'Review'}</span> : <span className="badge">New</span>}
                </li>
              );
            })}
          </ul>
        </section>
        <section id="today-patterns" className="card">
          <h2>4. Recognize the pattern</h2>
          <ul className="item-list">
            {day.patterns.map((id) => {
              const s = scenarios.find((x) => x.id === id)!;
              const rec = progress.patterns[id];
              return (
                <li key={id} className={`item${rec?.correct ? ' done' : ''}`}>
                  <Link href={`/patterns#${id}`} className="small">{s.wording}</Link>
                  {rec ? <span className={`badge ${rec.correct ? 'good' : 'warn'}`}>{rec.correct ? 'Done' : 'Revisit'}</span> : <span className="badge">New</span>}
                </li>
              );
            })}
          </ul>
          {day.patterns.length === 0 && <p className="small muted">None today.</p>}
          <p className="small" style={{ marginTop: 10 }}>Also try the <Link href="/patterns/decoder">problem decoder</Link>.</p>
        </section>
      </div>

      <section id="today-problems" className="section card">
        <div className="spread">
          <h2 style={{ margin: 0 }}>5. Solve on LeetCode</h2>
          <span className="badge accent">Daily target: {a.plannedTarget} · done {a.completedToday.filter((p) => p.wave !== 'Stretch').length}/{a.coreAssigned.length}</span>
        </div>
        {a.coreAssigned.length === 0 && <p className="small muted" style={{ marginTop: 8 }}>No new problems planned for this day. {day.extras.join(' · ')}</p>}
        <ul className="item-list" style={{ marginTop: 10 }}>{a.coreAssigned.map((p) => <ProblemItem key={p.id} problem={p} progress={progress} />)}</ul>
        {a.coreAssigned.length !== a.plannedTarget && a.plannedTarget > 0 && <p className="tiny muted">Rescheduling changed today&apos;s list ({a.coreAssigned.length} assigned vs. {a.plannedTarget} planned).</p>}
        {stretch.length > 0 && (
          <>
            <h3 style={{ marginTop: 14 }}>Optional P1 stretch</h3>
            <ul className="item-list">{stretch.map((p) => <ProblemItem key={p.id} problem={p} progress={progress} />)}</ul>
          </>
        )}
        {a.carried.length > 0 && (
          <>
            <h3 style={{ marginTop: 14 }}>Carried over from earlier days</h3>
            <ul className="item-list">{a.carried.map((p) => <ProblemItem key={p.id} problem={p} progress={progress} showDate />)}</ul>
          </>
        )}
        {day.extras.length > 0 && a.coreAssigned.length > 0 && <p className="small" style={{ marginTop: 12 }}><strong>Also today:</strong> {day.extras.join(' · ')} — see <Link href="/mock">Mock Interviews</Link>.</p>}
      </section>

      <div className="grid-2 section" style={{ alignItems: 'start' }}>
        <section id="review" className="card">
          <h2>6. Review queue</h2>
          <ReviewList problems={queues.problems.slice(0, 6)} concepts={queues.concepts.slice(0, 6)} />
          {(queues.problems.length > 6 || queues.concepts.length > 6) && <Link className="btn small" href="/review">See all</Link>}
        </section>
        <section className="card">
          <h2>Weak areas</h2>
          {weak.length === 0 ? <p className="small muted">No weak areas yet. They appear as you record help-needed solves, missed checks, and Big-O or pattern misses.</p> : (
            <ul className="item-list">
              {weak.map((w) => (
                <li key={w.id} className="item">
                  <div><Link href={`/learn/${w.id}`} className="title">{w.label}</Link><div className="tiny muted">{w.reasons.slice(0, 2).join(' · ')}</div></div>
                  <span className="badge warn">score {w.score}</span>
                </li>
              ))}
            </ul>
          )}
          <hr style={{ margin: '14px 0' }} />
          <h3>Upcoming</h3>
          <ul className="small">
            {schedule.filter((d) => d.date > day.date).slice(0, 3).map((d) => (
              <li key={d.date}>{formatDate(d.date)} ({daysBetween(today, d.date) > 0 ? `in ${daysBetween(today, d.date)}d` : 'past'}): {d.theme}{d.target ? ` — ${d.target} problems` : ''}</li>
            ))}
          </ul>
          <p className="tiny muted">Problems: {problems.filter((p) => p.date > day.date).map((p) => getProblem(p.id)!.id).slice(0, 8).join(', ')}{problems.filter((p) => p.date > day.date).length > 8 ? '…' : ''}</p>
        </section>
      </div>
    </>
  );
}
