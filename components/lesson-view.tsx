'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, HelpCircle } from 'lucide-react';
import type { Lesson, Module } from '@/content/types';
import { getProblem } from '@/content/problems';
import { getTerm } from '@/content/glossary';
import { setLesson } from '@/lib/progress';
import { update, useProgress, useToday } from '@/lib/store';
import { toDateKey } from '@/lib/dates';
import { CodeBlock } from './code-block';
import { Inline, Rich } from './rich';
import { KnowledgeCheck } from './quiz';
import { Visualizer } from './visualizer';
import { ProblemItem } from './problem-ui';

const SECTIONS = [
  ['what', 'What is this concept?'],
  ['why', 'Why does it exist?'],
  ['how', 'How does it work?'],
  ['visual', 'Visualization'],
  ['code', 'Python implementation'],
  ['complexity', 'Time and space complexity'],
  ['when', 'When should I use it?'],
  ['mistakes', 'Common mistakes'],
  ['check', 'Knowledge check'],
  ['leetcode', 'LeetCode application'],
] as const;

export function LessonView({ module, lesson, lessonKey, prev, next }: {
  module: Pick<Module, 'id' | 'number' | 'title' | 'phase'>; lesson: Lesson; lessonKey: string;
  prev?: { href: string; title: string }; next?: { href: string; title: string };
}) {
  const progress = useProgress();
  const today = useToday() ?? toDateKey(new Date());
  const rec = progress.lessons[lessonKey];
  const sections = SECTIONS.filter(([id]) => id !== 'visual' || lesson.visual);
  const num = (id: string) => sections.findIndex(([s]) => s === id) + 1;

  return (
    <div className="lesson-layout">
      <article>
        <div className="page-head">
          <div className="eyebrow">
            <Link href={`/learn/${module.id}`}>Module {module.number} · {module.title}</Link>
            {(lesson.phase ?? module.phase) === 3 && ' · Phase 3 (long-term)'}
          </div>
          <h1>{lesson.title}</h1>
          <p>{lesson.summary}</p>
          <div className="row">
            <button className={`btn small${rec?.done ? ' primary' : ''}`} onClick={() => update((p) => setLesson(p, lessonKey, { done: !rec?.done }, today))} aria-pressed={!!rec?.done}>
              {rec?.done ? <CheckCircle2 size={15} /> : <Circle size={15} />} {rec?.done ? 'Completed' : 'Mark complete'}
            </button>
            <button className="btn small" onClick={() => update((p) => setLesson(p, lessonKey, { unfamiliar: !rec?.unfamiliar }, today))} aria-pressed={!!rec?.unfamiliar}>
              <HelpCircle size={15} /> {rec?.unfamiliar ? 'Marked unfamiliar (in review queue)' : 'Still unfamiliar — add to review'}
            </button>
          </div>
        </div>

        <section id="what" className="lesson-section">
          <h2><span className="step-num">{num('what')}</span>What is this concept?</h2>
          <Rich text={lesson.what} />
        </section>

        <section id="why" className="lesson-section">
          <h2><span className="step-num">{num('why')}</span>Why does it exist?</h2>
          <Rich text={lesson.why} />
        </section>

        <section id="how" className="lesson-section">
          <h2><span className="step-num">{num('how')}</span>How does it work?</h2>
          <ol className="steps">{lesson.how.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ol>
        </section>

        {lesson.visual && (
          <section id="visual" className="lesson-section">
            <h2><span className="step-num">{num('visual')}</span>Visualization</h2>
            <Visualizer visual={lesson.visual} />
          </section>
        )}

        <section id="code" className="lesson-section">
          <h2><span className="step-num">{num('code')}</span>Python implementation</h2>
          <CodeBlock code={lesson.code} />
          <p className="tiny muted">Every sample includes <code>assert</code> statements and is executed by the test suite, so it runs as written.</p>
          <h3>Syntax notes</h3>
          <ul>{lesson.codeNotes.map((n, i) => <li key={i}><Inline text={n} /></li>)}</ul>
        </section>

        <section id="complexity" className="lesson-section">
          <h2><span className="step-num">{num('complexity')}</span>Time and space complexity</h2>
          <div className="grid-2">
            <div className="card"><div className="eyebrow">Time</div><Inline text={lesson.complexity.time} /></div>
            <div className="card"><div className="eyebrow">Space</div><Inline text={lesson.complexity.space} /></div>
          </div>
          <h3 style={{ marginTop: 14 }}>How it is derived</h3>
          <ol className="steps">{lesson.complexity.derivation.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ol>
        </section>

        <section id="when" className="lesson-section">
          <h2><span className="step-num">{num('when')}</span>When should I use it?</h2>
          <ul>{lesson.whenToUse.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ul>
          <div className="callout"><strong>Say it out loud:</strong> <Inline text={lesson.verbal} /></div>
        </section>

        <section id="mistakes" className="lesson-section">
          <h2><span className="step-num">{num('mistakes')}</span>Common mistakes & edge cases</h2>
          <ul>{lesson.mistakes.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ul>
        </section>

        <section id="check" className="lesson-section">
          <h2><span className="step-num">{num('check')}</span>Knowledge check</h2>
          <div className="stack">
            {lesson.checks.map((c, i) => <KnowledgeCheck key={i} index={i} check={c} storageKey={`lesson:${lessonKey}:${i}`} />)}
          </div>
        </section>

        <section id="leetcode" className="lesson-section">
          <h2><span className="step-num">{num('leetcode')}</span>LeetCode application</h2>
          <ul className="item-list">
            {lesson.problems.map((id) => {
              const p = getProblem(id);
              return p ? <ProblemItem key={id} problem={p} progress={progress} showDate /> : null;
            })}
          </ul>
          {lesson.terms.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>Vocabulary in this lesson</h3>
              <div className="chip-group">
                {lesson.terms.map((t) => {
                  const term = getTerm(t);
                  return term ? <Link key={t} className="chip" href={`/dictionary/${t}`}>{term.term}</Link> : null;
                })}
              </div>
            </>
          )}
        </section>

        <hr />
        <div className="spread">
          {prev ? <Link className="btn" href={prev.href}>← {prev.title}</Link> : <span />}
          {next ? <Link className="btn primary" href={next.href}>{next.title} →</Link> : <Link className="btn" href="/learn">All modules</Link>}
        </div>
      </article>
      <nav className="lesson-toc" aria-label="On this page">
        <ol>{sections.map(([id, label], i) => <li key={id}><a href={`#${id}`}>{i + 1}. {label}</a></li>)}</ol>
      </nav>
    </div>
  );
}
