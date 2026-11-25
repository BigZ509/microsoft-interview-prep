'use client';

/**
 * The bootcamp activity player (/study/<activity id>). Top: day, position, progress, duration.
 * Main: the real content, embedded. Bottom: Previous · Skip for now · Complete & Continue, with the
 * next activity precomputed and linked. Opening an activity saves it as the resume position.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, SkipForward } from 'lucide-react';
import { getLesson } from '@/content/modules';
import { getCodeReading } from '@/content/code-reading';
import { behavioralPrompts, storySlots } from '@/content/mocks';
import { getProject } from '@/content/projects';
import { SEQUENCE_STEPS, TIER_LABELS, type ActivityKind } from '@/content/bootcamp';
import { formatDate } from '@/lib/dates';
import {
  activeItems, canComplete, completeActivity, isTail, nextActivity, planContext, previousActivity, setPosition, skipActivity,
  type DayPlan, type PlanItem,
} from '@/lib/bootcamp';
import { problemRecord } from '@/lib/progress';
import { update, useHydrated, useProgress, useToday } from '@/lib/store';
import { LessonView } from './lesson-view';
import { TermStudy } from './dictionary';
import { ReadingCard } from './code-reading';
import { DrillRunner } from './big-o-lab';
import { Visualizer } from './visualizer';
import { CodeBlock } from './code-block';
import { Inline } from './rich';
import { DecoderSingle, ScenarioSet } from './patterns';
import { MockSessionView, ProductFrameworks, ProductPromptCard, StorySlotEditor } from './mock';
import { ProblemDetail } from './tracker';
import { OopSession } from './oop';
import { BlindSession } from './blind';
import { ProjectView } from './projects';
import { DayReview, ReviewPlanView, ReviewWorkbench } from './bootcamp-review';
import { ProgressBar } from './ui';

/** Kinds whose embedded component renders its own page heading (h1). */
const OWN_HEADING = new Set<ActivityKind>(['lesson', 'drill', 'mock', 'problem', 'oop', 'blind']);

function ModeCallout({ item, progress }: { item: PlanItem; progress: ReturnType<typeof useProgress> }) {
  const a = item.activity;
  if (item.mode === 'recap') {
    const rec = progress.lessons[a.refs[0]];
    return (
      <div className="callout">
        <strong>Recap · about {item.minutes} min.</strong> {rec?.done ? `You completed this lesson on ${formatDate(rec.at)}. ` : ''}
        Skim “How does it work?”, step through the visualization, and redo the knowledge check. Read in full only if something feels unfamiliar
        (mark it unfamiliar and it goes to your review queue).
      </div>
    );
  }
  if (item.mode === 'retention') {
    const rec = problemRecord(progress, Number(a.refs[0]));
    const last = [...rec.history].reverse().find((e) => e.status === 'independent');
    return (
      <div className="callout">
        <strong>Retention check · about {item.minutes} min.</strong> You solved this on your own{last ? ` on ${formatDate(last.date)}` : ''}. Solve it again cold:
        no hints, no notes. Record <em>Solved Independently</em> only if that is what happened. Anything else sends it to tomorrow’s mistake review.
      </div>
    );
  }
  if (a.kind === 'problem') {
    return <div className="callout"><strong>Independent attempt.</strong> Open it on LeetCode (a new tab, so you keep your place here). Try for 20 minutes before the first hint; hints unlock one at a time. Then record honestly how it went.</div>;
  }
  if (a.kind === 'blind' && item.reattempt) {
    return <div className="callout warn">You have attempted every unseen candidate for this slot, so this is a repeat. Do it cold.</div>;
  }
  return null;
}

function VisualWalkthrough({ lessonKey }: { lessonKey: string }) {
  const ref = getLesson(lessonKey)!;
  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>Before each <strong>Next</strong>, say what you expect the next step to show. Then check.</p>
      {ref.lesson.visual && <Visualizer visual={ref.lesson.visual} />}
      <section>
        <h2>The steps it follows</h2>
        <ol className="steps">{ref.lesson.how.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ol>
      </section>
      <section>
        <h2>The code being traced</h2>
        <div className="code-frame"><div className="code-bar"><span>Python 3</span><span>From “{ref.lesson.title}”</span></div><CodeBlock code={ref.lesson.code} /></div>
      </section>
    </div>
  );
}

function ActivityContent({ item, plan, today }: { item: PlanItem; plan: DayPlan; today: string }) {
  const a = item.activity;
  const id = a.refs[0];
  switch (a.kind) {
    case 'lesson': {
      const ref = getLesson(id)!;
      return <LessonView embedded module={{ id: ref.module.id, number: ref.module.number, title: ref.module.title, phase: ref.module.phase }} lesson={ref.lesson} lessonKey={id} />;
    }
    case 'terms': return <div className="stack">{a.refs.map((t) => <TermStudy key={t} id={t} />)}</div>;
    case 'reading': return <ReadingCard reading={getCodeReading(id)!} today={today} />;
    case 'drill': return <DrillRunner id={id} embedded />;
    case 'visual': return <VisualWalkthrough lessonKey={id} />;
    case 'patterns': return <ScenarioSet ids={a.refs} />;
    case 'decoder': return <DecoderSingle id={id} />;
    case 'mock': return <MockSessionView id={id} />;
    case 'problem': return <ProblemDetail id={Number(id)} embedded />;
    case 'review': return <ReviewWorkbench today={today} />;
    case 'oop': return <OopSession id={id} />;
    case 'blind': return <BlindSession id={item.blindId ?? id} concealSource />;
    case 'behavioral': {
      const b = behavioralPrompts.find((x) => x.id === id)!;
      return (
        <div className="stack">
          <div className="callout" style={{ marginTop: 0 }}><strong>Tip:</strong> {b.tip}</div>
          <p className="muted" style={{ margin: 0 }}>Answer out loud in about 90 seconds using a story from your bank (STAR plus a one-line reflection). Write the parts down only after you have said them.</p>
          {b.slot ? <StorySlotEditor slotId={b.slot} open /> : storySlots.map((s) => <StorySlotEditor key={s.id} slotId={s.id} />)}
        </div>
      );
    }
    case 'product': return <div className="stack"><ProductFrameworks /><ProductPromptCard id={id} open /></div>;
    case 'project': return <ProjectView project={getProject(id)!} />;
    case 'stories': return <div className="stack">{storySlots.map((s) => <StorySlotEditor key={s.id} slotId={s.id} open />)}</div>;
    case 'day-review': return <DayReview plan={plan} today={today} />;
    case 'review-plan': return <ReviewPlanView today={today} />;
  }
}

export function ActivityPlayer({ id }: { id: string }) {
  const today = useToday();
  const hydrated = useHydrated();
  const progress = useProgress();
  const router = useRouter();

  // Save the position on open, so a refresh or a later visit resumes here.
  useEffect(() => {
    if (hydrated) update((p) => setPosition(p, id));
  }, [hydrated, id]);

  if (!today || !hydrated) return <p className="muted">Loading your activity…</p>;
  const ctx = planContext(id, progress, today);
  if (!ctx) return <p className="muted">This activity no longer exists. <Link href="/">Back to today’s plan</Link>.</p>;
  const { plan, item } = ctx;
  const a = item.activity;
  const active = activeItems(plan);
  const index = active.findIndex((i) => i.activity.id === id);
  const done = active.filter((i) => i.status === 'done').length;
  // The end-of-day review closes the day: it returns to the plan (skipped items stay listed there).
  const next = isTail(a) ? null : nextActivity(plan, id);
  const prev = previousActivity(plan, id);
  const gate = canComplete(item, progress, today);
  const nextHref = next ? `/study/${next.activity.id}` : '/';
  const go = () => router.push(nextHref);
  const complete = () => {
    if (item.status !== 'done') update((p) => completeActivity(p, item, today));
    go();
  };
  const skip = () => {
    update((p) => skipActivity(p, item, today));
    go();
  };

  return (
    <div className="player">
      <header className="player-top" aria-label="Activity progress">
        <div className="player-meta">
          <Link href="/" className="player-home"><ArrowLeft size={14} aria-hidden="true" /> Today’s plan</Link>
          <span className="player-pos">
            Day {plan.day.day} · {index >= 0 ? `Activity ${index + 1} of ${active.length}` : 'Deferred (outside today’s hours)'}
            {a.group ? ` · ${a.group}` : ''}
          </span>
          <span className="player-tags">
            <span className="badge">{SEQUENCE_STEPS[a.step - 1]}</span>
            <span className={`badge tier-${item.tier}`}>{TIER_LABELS[item.tier]}</span>
            <span className="badge"><Clock size={12} aria-hidden="true" /> ~{item.minutes} min</span>
            {item.carried && <span className="badge warn">Carried over from Day {a.day}</span>}
            {item.status === 'done' && <span className="status good"><CheckCircle2 size={12} aria-hidden="true" /> Completed</span>}
            {item.status === 'skipped' && <span className="status warn">Skipped earlier</span>}
          </span>
        </div>
        <div className="player-progress">
          <ProgressBar value={done} max={active.length} tone="good" label="Day progress" />
          <span className="tiny muted">{plan.percent}% of Day {plan.day.day}</span>
        </div>
      </header>

      {!OWN_HEADING.has(a.kind) && <h1 className="player-title">{item.title}</h1>}
      {a.note && <div className="callout small"><strong>Focus:</strong> {a.note}</div>}
      <ModeCallout item={item} progress={progress} />

      <div className="player-body">
        <ActivityContent key={id} item={item} plan={plan} today={today} />
      </div>

      <nav className="player-nav" aria-label="Activity navigation">
        <div className="player-nav-row">
          {prev ? <Link className="btn" href={`/study/${prev.activity.id}`}><ArrowLeft size={14} aria-hidden="true" /> Previous</Link> : <span className="btn ghost" aria-hidden="true" style={{ visibility: 'hidden' }}>Previous</span>}
          <span className="player-next">
            {next ? <>Up next: <Link href={nextHref}>{next.title}</Link></> : <>Last activity. Next: <Link href="/">today’s plan</Link></>}
          </span>
          <button className="btn" onClick={skip}><SkipForward size={14} aria-hidden="true" /> Skip for now</button>
          <button className="btn primary" onClick={complete} disabled={item.status !== 'done' && !gate.ok}>
            {item.status === 'done' ? 'Continue' : 'Complete & Continue'} <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        {item.status !== 'done' && !gate.ok && <p className="tiny muted player-gate" role="status">{gate.reason}</p>}
      </nav>
    </div>
  );
}
