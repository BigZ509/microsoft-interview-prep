'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, HelpCircle, MessageSquareQuote } from 'lucide-react';
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

type SectionId = 'what' | 'why' | 'how' | 'visual' | 'code' | 'complexity' | 'when' | 'mistakes' | 'check' | 'leetcode';

const BANDS: { label: string; sections: [SectionId, string][] }[] = [
  { label: 'Understand', sections: [['what', 'What is this concept?'], ['why', 'Why does it exist?'], ['how', 'How does it work?'], ['visual', 'Visualization']] },
  { label: 'Implement & analyze', sections: [['code', 'Python implementation'], ['complexity', 'Time and space complexity']] },
  { label: 'Apply', sections: [['when', 'When should I use it?'], ['mistakes', 'Common mistakes'], ['check', 'Knowledge check'], ['leetcode', 'LeetCode application']] },
];

/** Tracks which section is currently being read, for the table of contents. */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px' },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

export function LessonView({ module, lesson, lessonKey, prev, next }: {
  module: Pick<Module, 'id' | 'number' | 'title' | 'phase'>; lesson: Lesson; lessonKey: string;
  prev?: { href: string; title: string }; next?: { href: string; title: string };
}) {
  const progress = useProgress();
  const today = useToday() ?? toDateKey(new Date());
  const rec = progress.lessons[lessonKey];
  const bands = BANDS.map((b) => ({ ...b, sections: b.sections.filter(([id]) => id !== 'visual' || lesson.visual) }));
  const ordered = bands.flatMap((b) => b.sections.map(([id]) => id));
  const [ids] = useState(ordered);
  const active = useActiveSection(ids);
  const num = (id: SectionId) => ordered.indexOf(id) + 1;
  const title = (id: SectionId) => BANDS.flatMap((b) => b.sections).find(([s]) => s === id)![1];
  const heading = (id: SectionId) => <h2><span className="step-num">{num(id)}</span>{title(id)}</h2>;

  return (
    <div className="lesson-layout">
      <article className="lesson-article">
        <header className="page-head">
          <div className="eyebrow">
            <Link href={`/learn/${module.id}`}>Module {module.number} · {module.title}</Link>
            {(lesson.phase ?? module.phase) === 3 && ' · Phase 3 (long-term)'}
          </div>
          <h1>{lesson.title}</h1>
          <p className="lede">{lesson.summary}</p>
          <div className="lesson-actions">
            <button className={`btn small${rec?.done ? ' primary' : ''}`} onClick={() => update((p) => setLesson(p, lessonKey, { done: !rec?.done }, today))} aria-pressed={!!rec?.done}>
              {rec?.done ? <CheckCircle2 size={15} /> : <Circle size={15} />} {rec?.done ? 'Completed' : 'Mark complete'}
            </button>
            <button className="btn small" onClick={() => update((p) => setLesson(p, lessonKey, { unfamiliar: !rec?.unfamiliar }, today))} aria-pressed={!!rec?.unfamiliar}>
              <HelpCircle size={15} /> {rec?.unfamiliar ? 'Marked unfamiliar (in review queue)' : 'Still unfamiliar — add to review'}
            </button>
          </div>
        </header>

        <div className="lesson-band">{bands[0].label}</div>
        <section id="what" className="lesson-section">{heading('what')}<Rich text={lesson.what} /></section>
        <section id="why" className="lesson-section">{heading('why')}<Rich text={lesson.why} /></section>
        <section id="how" className="lesson-section">
          {heading('how')}
          <ol className="steps">{lesson.how.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ol>
        </section>
        {lesson.visual && (
          <section id="visual" className="lesson-section">{heading('visual')}<Visualizer visual={lesson.visual} /></section>
        )}

        <div className="lesson-band">{bands[1].label}</div>
        <section id="code" className="lesson-section">
          {heading('code')}
          <div className="code-frame">
            <div className="code-bar"><span>Python 3</span><span>Runs as written · asserts verified by the test suite</span></div>
            <CodeBlock code={lesson.code} />
          </div>
          <h3>Syntax notes</h3>
          <ul>{lesson.codeNotes.map((n, i) => <li key={i}><Inline text={n} /></li>)}</ul>
        </section>
        <section id="complexity" className="lesson-section">
          {heading('complexity')}
          <div className="complexity-cards">
            <div className="complexity-card"><div className="k">Time</div><div className="v"><Inline text={lesson.complexity.time} /></div></div>
            <div className="complexity-card"><div className="k">Space</div><div className="v"><Inline text={lesson.complexity.space} /></div></div>
          </div>
          <h3>How it is derived</h3>
          <ol className="steps timeline">{lesson.complexity.derivation.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ol>
        </section>

        <div className="lesson-band">{bands[2].label}</div>
        <section id="when" className="lesson-section">
          {heading('when')}
          <ul>{lesson.whenToUse.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ul>
          <div className="callout">
            <div className="row" style={{ gap: 6, marginBottom: 4 }}><MessageSquareQuote size={15} aria-hidden="true" style={{ color: 'var(--accent)' }} /><strong>Say it out loud</strong></div>
            <Inline text={lesson.verbal} />
          </div>
        </section>
        <section id="mistakes" className="lesson-section">
          {heading('mistakes')}
          <ul>{lesson.mistakes.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ul>
        </section>
        <section id="check" className="lesson-section">
          {heading('check')}
          <div className="stack">
            {lesson.checks.map((c, i) => <KnowledgeCheck key={i} index={i} check={c} storageKey={`lesson:${lessonKey}:${i}`} />)}
          </div>
        </section>
        <section id="leetcode" className="lesson-section">
          {heading('leetcode')}
          <ul className="item-list">
            {lesson.problems.map((id) => {
              const p = getProblem(id);
              return p ? <ProblemItem key={id} problem={p} progress={progress} showDate /> : null;
            })}
          </ul>
          {lesson.terms.length > 0 && (
            <>
              <h3>Vocabulary in this lesson</h3>
              <div className="chip-group">
                {lesson.terms.map((t) => {
                  const term = getTerm(t);
                  return term ? <Link key={t} className="chip" href={`/dictionary/${t}`}>{term.term}</Link> : null;
                })}
              </div>
            </>
          )}
        </section>

        <nav className="pager" aria-label="Lesson navigation">
          {prev ? <Link href={prev.href}><small>← Previous</small>{prev.title}</Link> : <span />}
          {next ? <Link className="next" href={next.href}><small>Next →</small>{next.title}</Link> : <Link className="next" href="/learn"><small>Done</small>All modules</Link>}
        </nav>
      </article>
      <nav className="lesson-toc" aria-label="On this page">
        <div className="toc-title">On this page</div>
        <ol>
          {bands.map((b) => (
            <li key={b.label}>
              <div className="toc-group">{b.label}</div>
              <ol>
                {b.sections.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`} aria-current={active === id ? 'true' : undefined}>{num(id)}. {label}</a></li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
