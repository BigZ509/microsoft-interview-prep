'use client';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { decoderProblems, patternLabels, patternLessons, scenarios } from '@/content/patterns';
import { getProblem } from '@/content/problems';
import { getTerm } from '@/content/glossary';
import type { DecoderProblem, PatternId, PatternScenario } from '@/content/types';
import { recordPattern } from '@/lib/progress';
import { update, useProgress, useToday } from '@/lib/store';
import { toDateKey } from '@/lib/dates';
import { Inline } from './rich';
import { PageHeader } from './ui';

/** Current URL hash (without '#'), kept in sync with navigation; '' on the server. */
function useHash(): string {
  return useSyncExternalStore(
    (cb) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); },
    () => window.location.hash.slice(1),
    () => '',
  );
}

function openAndScroll(id: string, set: (id: string | null) => void) {
  set(id);
  window.history.replaceState(null, '', `#${id}`);
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

export function PatternTabs({ active }: { active: 'engine' | 'decoder' }) {
  return (
    <div className="tabs" role="navigation" aria-label="Pattern recognition sections">
      <Link href="/patterns" aria-current={active === 'engine' ? 'page' : undefined}>Keyword → pattern exercises</Link>
      <Link href="/patterns/decoder" aria-current={active === 'decoder' ? 'page' : undefined}>Interactive problem decoder</Link>
    </div>
  );
}

const CHEAT_SHEET: [string, string][] = [
  ['"Find two elements that sum to a target"', 'Hash map (unsorted) or two pointers (sorted)'],
  ['"Same characters in any order"', 'Frequency counting or sorting'],
  ['"Generate all arrangements"', 'Permutations / backtracking'],
  ['"Choose K elements"', 'Combinations / backtracking'],
  ['"Find all subsets"', 'Subset enumeration (include/exclude, bitmask)'],
  ['"Longest contiguous sequence satisfying a condition"', 'Sliding window — when the condition is monotonic'],
  ['"Count subarrays with sum K"', 'Prefix sums + hash map'],
  ['"Find duplicates"', 'Hash set, counting, or sorting'],
  ['"Search a sorted array"', 'Binary search'],
  ['"Detect a linked-list cycle"', 'Fast/slow pointers'],
  ['"Explore connected cells"', 'BFS / DFS'],
  ['"Shortest path in an unweighted graph"', 'BFS'],
  ['"Find K largest elements"', 'Heap, sorting, or quickselect'],
  ['"Process most recently added element first"', 'Stack'],
  ['"Process elements in arrival order"', 'Queue'],
];

function ScenarioCard({ s, index, open, onToggle, onNext }: { s: PatternScenario; index: number; open: boolean; onToggle: () => void; onNext?: () => void }) {
  const progress = useProgress();
  const today = useToday() ?? toDateKey(new Date());
  const [pick, setPick] = useState<PatternId | null>(null);
  const [reason, setReason] = useState('');
  const [alt, setAlt] = useState('');
  const [done, setDone] = useState(false);
  const prev = progress.patterns[s.id];
  const problem = s.problem ? getProblem(s.problem) : undefined;
  const correct = pick !== null && s.best.includes(pick);

  const submit = () => {
    setDone(true);
    update((p) => recordPattern(p, s.id, s.best.includes(pick!), reason, today));
  };
  const status = done ? <span className={`status ${correct ? 'good' : 'bad'}`}>{correct ? 'Strong choice' : 'Revisit'}</span>
    : prev ? <span className={`status ${prev.correct ? 'good' : 'warn'}`}>Last: {prev.correct ? 'strong choice' : 'revisit'}</span>
    : <span className="status">New</span>;

  return (
    <article id={s.id} className={`exercise${open ? ' open' : ''}`}>
      <button className="exercise-head" aria-expanded={open} aria-controls={`${s.id}-body`} onClick={onToggle}>
        <span className="num" aria-hidden="true">{index + 1}</span>
        <span className="q">{s.wording}</span>
        {status}
      </button>
      {open && (
        <div id={`${s.id}-body`} className="exercise-body">
          <div className="callout" style={{ marginTop: 0 }}><strong>Constraints:</strong> {s.constraints}</div>
          <div className="exercise-label">Your choice — the most promising approach</div>
          <div className="chip-group" role="group" aria-label="Choose a pattern">
            {s.options.map((o) => (
              <button key={o} disabled={done} aria-pressed={pick === o} onClick={() => setPick(o)}
                className={done ? (s.best.includes(o) ? 'chip correct' : o === pick ? 'chip wrong' : 'chip') : 'chip'}>
                {patternLabels[o]}
              </button>
            ))}
          </div>
          {!done ? (
            <>
              <div className="exercise-label">Your reasoning</div>
              <div className="stack" style={{ gap: 'var(--s3)' }}>
                <label className="field">Why does this pattern fit? <span className="hint">Point to specific words AND constraints.</span>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} style={{ minHeight: 64 }} />
                </label>
                <label className="field">When might an alternative be better? <span className="hint">Optional.</span>
                  <textarea value={alt} onChange={(e) => setAlt(e.target.value)} style={{ minHeight: 52 }} />
                </label>
                <div className="row">
                  <button className="btn primary" disabled={!pick || reason.trim().length < 8} onClick={submit}>Check my reasoning</button>
                  {(!pick || reason.trim().length < 8) && <span className="tiny muted">Pick an approach and write a sentence of reasoning.</span>}
                </div>
              </div>
            </>
          ) : (
            <div className="feedback" aria-live="polite">
              <div className={`callout ${correct ? 'good' : 'bad'}`} style={{ marginTop: 0 }}>
                <div className="row" style={{ gap: 6 }}>
                  {correct ? <CheckCircle2 size={16} style={{ color: 'var(--good)' }} /> : <XCircle size={16} style={{ color: 'var(--bad)' }} />}
                  <strong>{correct ? 'Strong choice.' : 'A different pattern fits better.'}</strong>
                  <span>Best: {s.best.map((b) => patternLabels[b]).join(' or ')}.</span>
                </div>
              </div>
              <div className="your-answer"><span className="k">Your reasoning</span>{reason}{alt && <><br /><span className="k" style={{ marginTop: 6 }}>Your alternative</span>{alt}</>}</div>
              <div className="exercise-label">Recognition clues</div>
              <ul>{s.clues.map((c) => <li key={c}><Inline text={c} /></li>)}</ul>
              <div className="exercise-label">Why it works</div>
              <p><Inline text={s.why} /></p>
              <div className="exercise-label">Alternative</div>
              <p><Inline text={s.alternative} /></p>
              <div className="callout warn"><strong>When the obvious guess is a bad fit:</strong> <Inline text={s.badFit} /></div>
              <div className="row" style={{ marginTop: 'var(--s4)' }}>
                <Link className="btn small" href={`/learn/${patternLessons[s.best[0]]}`}>Review: {patternLabels[s.best[0]]}</Link>
                {problem && <Link className="btn small" href={`/tracker/${problem.id}`}>Practice: {problem.id}. {problem.title}</Link>}
                <button className="btn small ghost" onClick={() => { setDone(false); setPick(null); setReason(''); setAlt(''); }}>Try again</button>
                {onNext && <button className="btn small primary" style={{ marginLeft: 'auto' }} onClick={onNext}>Next scenario <ArrowRight size={14} /></button>}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function PatternEngine() {
  const progress = useProgress();
  const hash = useHash();
  const [filter, setFilter] = useState<'all' | 'new' | 'missed'>('all');
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const list = scenarios.filter((s) => filter === 'all' || (filter === 'new' ? !progress.patterns[s.id] : progress.patterns[s.id] && !progress.patterns[s.id].correct));
  const fromHash = scenarios.some((s) => s.id === hash) ? hash : null;
  const firstNew = scenarios.find((s) => !progress.patterns[s.id])?.id ?? scenarios[0].id;
  const openId = picked === undefined ? (fromHash ?? firstNew) : picked;
  const attempted = scenarios.filter((s) => progress.patterns[s.id]).length;
  const strong = scenarios.filter((s) => progress.patterns[s.id]?.correct).length;

  return (
    <>
      <PageHeader
        eyebrow="Pattern Recognition"
        title="Recognize the algorithm from the problem"
        description={<>Pick the most promising approach and justify it before seeing feedback. <strong>Keywords are clues, not guaranteed solutions</strong>: combine the wording with the constraints, the input’s structure (sorted? negatives? graph?), and the required complexity. Several scenarios are deliberate keyword traps.</>}
      />
      <PatternTabs active="engine" />
      <div className="spread" style={{ marginBottom: 'var(--s3)' }}>
        <div className="segmented" role="group" aria-label="Filter scenarios">
          {(['all', 'new', 'missed'] as const).map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? `All ${scenarios.length}` : f === 'new' ? 'Not attempted' : 'Missed last time'}</button>
          ))}
        </div>
        <span className="small muted">{attempted}/{scenarios.length} attempted · {strong} strong choices</span>
      </div>
      <div>
        {list.map((s) => {
          const idx = scenarios.indexOf(s);
          const nextS = list[list.indexOf(s) + 1];
          return (
            <ScenarioCard key={s.id} s={s} index={idx} open={openId === s.id}
              onToggle={() => setPicked(openId === s.id ? null : s.id)}
              onNext={nextS ? () => openAndScroll(nextS.id, setPicked) : undefined} />
          );
        })}
        {list.length === 0 && <p className="empty">Nothing here — nice.</p>}
      </div>
      <details className="card section">
        <summary>Keyword cheat sheet — use after you have tried the scenarios</summary>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Wording in problem</th><th>Possible pattern</th></tr></thead>
            <tbody>{CHEAT_SHEET.map(([w, p]) => <tr key={w}><td>{w}</td><td>{p}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 10, marginBottom: 0 }}>Before committing, check: input size → feasible Big-O; sorted or not; negatives; contiguous vs any selection; whether you must generate outputs or only count/compare them.</p>
      </details>
    </>
  );
}

// ------------------------- Decoder -------------------------

type Token = { text: string; start: number; end: number; word: boolean };

function tokenize(statement: string): Token[] {
  const out: Token[] = [];
  const re = /[A-Za-z0-9'’-]+|[^A-Za-z0-9'’-]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(statement))) out.push({ text: m[0], start: m.index, end: m.index + m[0].length, word: /[A-Za-z0-9]/.test(m[0]) });
  return out;
}

function keySpans(d: DecoderProblem): [number, number][] {
  const lower = d.statement.toLowerCase();
  return d.keyTerms.map((k) => {
    const start = lower.indexOf(k.text.toLowerCase());
    return [start, start + k.text.length];
  });
}

function DecoderCard({ d, index, open, onToggle }: { d: DecoderProblem; index: number; open: boolean; onToggle: () => void }) {
  const progress = useProgress();
  const today = useToday() ?? toDateKey(new Date());
  const tokens = useMemo(() => tokenize(d.statement), [d.statement]);
  const spans = useMemo(() => keySpans(d), [d]);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [constraints, setConstraints] = useState('');
  const [structure, setStructure] = useState<number | null>(null);
  const [pattern, setPattern] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const prev = progress.decoder[d.id];

  const toggle = (i: number) => {
    if (revealed) return;
    setMarked((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  };
  const found = spans.map(([a, b]) => tokens.some((t, i) => marked.has(i) && t.start < b && t.end > a));
  const isKeyToken = (t: Token) => spans.some(([a, b]) => t.start < b && t.end > a);
  const ready = marked.size > 0 && input.trim() && output.trim() && structure !== null && pattern !== null && time !== null;

  const reveal = () => {
    setRevealed(true);
    const matched = found.filter(Boolean).length;
    update((p) => ({ ...p, decoder: { ...p.decoder, [d.id]: { at: today, matched, total: d.keyTerms.length } } }));
  };

  const pickList = (label: string, opts: string[], value: number | null, set: (n: number) => void, answer: number) => (
    <div>
      <div className="exercise-label">{label}</div>
      <div className="chip-group" role="group" aria-label={label}>
        {opts.map((o, i) => (
          <button key={o} disabled={revealed} aria-pressed={value === i} onClick={() => set(i)}
            className={revealed ? (i === answer ? 'chip correct' : i === value ? 'chip wrong' : 'chip') : 'chip'}>{o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <article id={d.id} className={`exercise${open ? ' open' : ''}`}>
      <button className="exercise-head" aria-expanded={open} aria-controls={`${d.id}-body`} onClick={onToggle}>
        <span className="num" aria-hidden="true">{index + 1}</span>
        <span className="q">{d.title}{d.label ? ' · candidate-reported reconstruction' : ''}</span>
        {prev ? <span className="status good">Found {prev.matched}/{prev.total} key terms</span> : <span className="status">New</span>}
      </button>
      {open && (
        <div id={`${d.id}-body`} className="exercise-body">
          {d.label && <div className="callout warn small" style={{ marginTop: 0 }}><strong>Label:</strong> {d.label}</div>}
          <div className="exercise-label">Step 1 — Click the words that carry meaning</div>
          <p className="statement">
            {tokens.map((t, i) => t.word ? (
              <button key={i} className={`tok${revealed && isKeyToken(t) ? ' key' : ''}`} aria-pressed={marked.has(i)} onClick={() => toggle(i)}>{t.text}</button>
            ) : <span key={i}>{t.text}</span>)}
          </p>
          <div className="grid-2" style={{ marginTop: 'var(--s4)' }}>
            <label className="field">Step 2 — Input <textarea value={input} onChange={(e) => setInput(e.target.value)} disabled={revealed} style={{ minHeight: 56 }} /></label>
            <label className="field">Expected output <textarea value={output} onChange={(e) => setOutput(e.target.value)} disabled={revealed} style={{ minHeight: 56 }} /></label>
          </div>
          <label className="field" style={{ marginTop: 'var(--s3)' }}>Step 3 — Important constraints <span className="hint">What limits or guarantees matter?</span>
            <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} disabled={revealed} style={{ minHeight: 56 }} />
          </label>
          {pickList('Step 4 — Likely data structure', d.structureOptions, structure, setStructure, d.structure)}
          {pickList('Step 5 — Likely algorithmic pattern', d.patternOptions, pattern, setPattern, d.pattern)}
          {pickList('Step 6 — Estimated time complexity', d.timeOptions, time, setTime, d.time)}
          {!revealed ? (
            <div className="row" style={{ marginTop: 'var(--s5)' }}>
              <button className="btn primary" disabled={!ready} onClick={reveal}>Step 7 — Reveal guided explanation</button>
              {!ready && <span className="tiny muted">Highlight at least one term, fill input/output, and make all three choices.</span>}
            </div>
          ) : (
            <div className="feedback" aria-live="polite">
              <div className="exercise-label" style={{ marginTop: 0 }}>Meaningful terminology — {found.filter(Boolean).length}/{d.keyTerms.length} found</div>
              <ul className="item-list">
                {d.keyTerms.map((k, i) => (
                  <li key={k.text} className="item">
                    <span className="row" style={{ gap: 10, flexWrap: 'nowrap', flex: 1, minWidth: 0 }}>
                      {found[i] ? <CheckCircle2 size={16} className="check-icon" aria-label="Found" /> : <XCircle size={16} style={{ color: 'var(--muted)', flex: 'none' }} aria-label="Missed" />}
                      <span><strong>“{k.text}”</strong> — <Inline text={k.meaning} /></span>
                    </span>
                    {k.term && getTerm(k.term) && <Link className="chip" href={`/dictionary/${k.term}`}>{getTerm(k.term)!.term}</Link>}
                  </li>
                ))}
              </ul>
              <div className="grid-2" style={{ marginTop: 'var(--s4)' }}>
                <div className="fact"><div className="k">Input</div>{d.input}</div>
                <div className="fact"><div className="k">Output</div>{d.output}</div>
              </div>
              <div className="exercise-label">Constraints to notice</div>
              <ul>{d.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
              <div className="callout"><strong>Target complexity:</strong> time {d.timeOptions[d.time]}, space {d.space}.</div>
              <div className="exercise-label">Guided explanation</div>
              <ol className="steps timeline">{d.guided.map((g, i) => <li key={i}><Inline text={g} /></li>)}</ol>
              <div className="row">
                {d.problem && <Link className="btn small" href={`/tracker/${d.problem}`}>Related LeetCode: {getProblem(d.problem)?.title}</Link>}
                <button className="btn small ghost" onClick={() => { setRevealed(false); setMarked(new Set()); setStructure(null); setPattern(null); setTime(null); }}>Try again</button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function Decoder() {
  const hash = useHash();
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const fromHash = decoderProblems.some((d) => d.id === hash) ? hash : null;
  const openId = picked === undefined ? (fromHash ?? decoderProblems[0].id) : picked;
  return (
    <>
      <PageHeader
        eyebrow="Pattern Recognition"
        title="Interactive Problem Decoder"
        description="Dissect a short problem statement the way you would in the first two minutes of an interview: highlight meaningful terms, state input and output, note constraints, then commit to a data structure, a pattern, and a complexity. The guided explanation stays hidden until you have committed."
      />
      <PatternTabs active="decoder" />
      <div>
        {decoderProblems.map((d, i) => (
          <DecoderCard key={d.id} d={d} index={i} open={openId === d.id} onToggle={() => setPicked(openId === d.id ? null : d.id)} />
        ))}
      </div>
    </>
  );
}
