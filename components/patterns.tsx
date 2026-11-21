'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { decoderProblems, patternLabels, patternLessons, scenarios } from '@/content/patterns';
import { getProblem } from '@/content/problems';
import { getTerm } from '@/content/glossary';
import type { DecoderProblem, PatternId, PatternScenario } from '@/content/types';
import { recordPattern } from '@/lib/progress';
import { update, useProgress, useToday } from '@/lib/store';
import { toDateKey } from '@/lib/dates';
import { Inline } from './rich';

export function PatternTabs({ active }: { active: 'engine' | 'decoder' }) {
  return (
    <div className="tabs" role="navigation" aria-label="Pattern recognition sections">
      <Link href="/patterns" aria-current={active === 'engine' ? 'page' : undefined}>Keyword → pattern engine</Link>
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

function ScenarioCard({ s, index }: { s: PatternScenario; index: number }) {
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

  return (
    <article id={s.id} className="card">
      <div className="spread">
        <span className="eyebrow" style={{ margin: 0 }}>Scenario {index + 1}</span>
        {prev && !done && <span className={`badge ${prev.correct ? 'good' : 'warn'}`}>Last: {prev.correct ? 'strong choice' : 'revisit'}</span>}
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: '6px 0' }}>{s.wording}</p>
      <p className="small muted">Constraints: {s.constraints}</p>
      <div className="chip-group" role="group" aria-label="Choose a pattern">
        {s.options.map((o) => (
          <button key={o} disabled={done} aria-pressed={pick === o} onClick={() => setPick(o)}
            className={done ? (s.best.includes(o) ? 'chip correct' : o === pick ? 'chip wrong' : 'chip') : 'chip'}>
            {patternLabels[o]}
          </button>
        ))}
      </div>
      {!done ? (
        <div className="stack" style={{ marginTop: 12 }}>
          <label className="field">Why does this pattern fit? <span className="hint">Point to specific words AND constraints.</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} style={{ minHeight: 60 }} />
          </label>
          <label className="field">When might an alternative be better? <span className="hint">Optional.</span>
            <textarea value={alt} onChange={(e) => setAlt(e.target.value)} style={{ minHeight: 50 }} />
          </label>
          <div><button className="btn primary" disabled={!pick || reason.trim().length < 8} onClick={submit}>Check my reasoning</button></div>
        </div>
      ) : (
        <div style={{ marginTop: 12 }} aria-live="polite">
          <div className={`callout ${correct ? 'good' : 'bad'}`}>
            <strong>{correct ? <><CheckCircle2 size={14} /> Strong choice.</> : <><XCircle size={14} /> A different pattern fits better.</>}</strong>{' '}
            Best: {s.best.map((b) => patternLabels[b]).join(' or ')}.
          </div>
          <p><strong>Recognition clues:</strong></p>
          <ul>{s.clues.map((c) => <li key={c}><Inline text={c} /></li>)}</ul>
          <p><strong>Why it works:</strong> <Inline text={s.why} /></p>
          <p><strong>Alternative:</strong> <Inline text={s.alternative} /></p>
          <div className="callout warn"><strong>When the obvious guess is a bad fit:</strong> <Inline text={s.badFit} /></div>
          <p className="small"><strong>Your reasoning:</strong> {reason}{alt && <><br /><strong>Your alternative:</strong> {alt}</>}</p>
          <div className="row">
            <Link className="btn small" href={`/learn/${patternLessons[s.best[0]]}`}>Review: {patternLabels[s.best[0]]}</Link>
            {problem && <Link className="btn small" href={`/tracker/${problem.id}`}>Practice: {problem.id}. {problem.title}</Link>}
            <button className="btn small ghost" onClick={() => { setDone(false); setPick(null); setReason(''); setAlt(''); }}>Try again</button>
          </div>
        </div>
      )}
    </article>
  );
}

export function PatternEngine() {
  const progress = useProgress();
  const [filter, setFilter] = useState<'all' | 'new' | 'missed'>('all');
  const list = scenarios.filter((s) => filter === 'all' || (filter === 'new' ? !progress.patterns[s.id] : progress.patterns[s.id] && !progress.patterns[s.id].correct));
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Pattern Recognition</div>
        <h1>Recognize the algorithm from the problem</h1>
        <p>Pick the most promising approach and justify it before seeing feedback. <strong>Keywords are clues, not guaranteed solutions</strong>: combine the wording with the constraints, the input structure (sorted? negatives? graph?), the examples, and the required complexity. Several scenarios are deliberate keyword traps.</p>
      </div>
      <PatternTabs active="engine" />
      <div className="chip-group" style={{ marginBottom: 14 }} role="group" aria-label="Filter scenarios">
        {(['all', 'new', 'missed'] as const).map((f) => <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? `All (${scenarios.length})` : f === 'new' ? 'Not attempted' : 'Missed last time'}</button>)}
      </div>
      <div className="stack">
        {list.map((s) => <ScenarioCard key={s.id} s={s} index={scenarios.indexOf(s)} />)}
        {list.length === 0 && <p className="muted">Nothing here — nice.</p>}
      </div>
      <details className="card section">
        <summary>Keyword cheat sheet (use after you have tried the scenarios)</summary>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Wording in problem</th><th>Possible pattern</th></tr></thead>
            <tbody>{CHEAT_SHEET.map(([w, p]) => <tr key={w}><td>{w}</td><td>{p}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>Before committing, check: input size → feasible Big-O; sorted or not; negatives; contiguous vs any selection; whether you must generate outputs or only count/compare them.</p>
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

function DecoderCard({ d }: { d: DecoderProblem }) {
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
      <h3>{label}</h3>
      <div className="chip-group" role="group" aria-label={label}>
        {opts.map((o, i) => (
          <button key={o} disabled={revealed} aria-pressed={value === i} onClick={() => set(i)}
            className={revealed ? (i === answer ? 'chip correct' : i === value ? 'chip wrong' : 'chip') : 'chip'}>{o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <article id={d.id} className="card">
      <div className="spread">
        <h2 style={{ margin: 0 }}>{d.title}</h2>
        {prev && <span className="badge">Last: found {prev.matched}/{prev.total} key terms</span>}
      </div>
      {d.label && <div className="callout warn small"><strong>Label:</strong> {d.label}</div>}
      <p className="small muted" style={{ marginTop: 10 }}>Step 1 — click the words that carry meaning (constraints, structure, what to return).</p>
      <p className="statement">
        {tokens.map((t, i) => t.word ? (
          <button key={i} className={`tok${revealed && isKeyToken(t) ? ' key' : ''}`} aria-pressed={marked.has(i)} onClick={() => toggle(i)}>{t.text}</button>
        ) : <span key={i}>{t.text}</span>)}
      </p>
      <div className="grid-2" style={{ marginTop: 12 }}>
        <label className="field">Step 2 — Input <textarea value={input} onChange={(e) => setInput(e.target.value)} disabled={revealed} style={{ minHeight: 56 }} /></label>
        <label className="field">Expected output <textarea value={output} onChange={(e) => setOutput(e.target.value)} disabled={revealed} style={{ minHeight: 56 }} /></label>
      </div>
      <label className="field" style={{ marginTop: 10 }}>Step 3 — Important constraints <span className="hint">What limits or guarantees matter?</span>
        <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} disabled={revealed} style={{ minHeight: 56 }} />
      </label>
      <div className="stack" style={{ marginTop: 12 }}>
        {pickList('Step 4 — Likely data structure', d.structureOptions, structure, setStructure, d.structure)}
        {pickList('Step 5 — Likely algorithmic pattern', d.patternOptions, pattern, setPattern, d.pattern)}
        {pickList('Step 6 — Estimated time complexity', d.timeOptions, time, setTime, d.time)}
      </div>
      {!revealed ? (
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn primary" disabled={!ready} onClick={reveal}>Step 7 — Reveal guided explanation</button>
          {!ready && <span className="tiny muted">Highlight at least one term, fill input/output, and make all three choices.</span>}
        </div>
      ) : (
        <div style={{ marginTop: 14 }} aria-live="polite">
          <h3>Meaningful terminology ({found.filter(Boolean).length}/{d.keyTerms.length} found)</h3>
          <ul className="item-list">
            {d.keyTerms.map((k, i) => (
              <li key={k.text} className={`item${found[i] ? ' done' : ''}`}>
                <div><strong>“{k.text}”</strong> — <Inline text={k.meaning} /></div>
                {k.term && getTerm(k.term) && <Link className="btn small" href={`/dictionary/${k.term}`}>{getTerm(k.term)!.term}</Link>}
              </li>
            ))}
          </ul>
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div className="card"><div className="eyebrow">Input</div>{d.input}</div>
            <div className="card"><div className="eyebrow">Output</div>{d.output}</div>
          </div>
          <p style={{ marginTop: 12 }}><strong>Constraints to notice:</strong></p>
          <ul>{d.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
          <p><strong>Target complexity:</strong> time {d.timeOptions[d.time]}, space {d.space}.</p>
          <h3>Guided explanation</h3>
          <ol className="steps">{d.guided.map((g, i) => <li key={i}><Inline text={g} /></li>)}</ol>
          <div className="row">
            {d.problem && <Link className="btn small" href={`/tracker/${d.problem}`}>Related LeetCode: {getProblem(d.problem)?.title}</Link>}
            <button className="btn small ghost" onClick={() => { setRevealed(false); setMarked(new Set()); setStructure(null); setPattern(null); setTime(null); }}>Try again</button>
          </div>
        </div>
      )}
    </article>
  );
}

export function Decoder() {
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Pattern Recognition</div>
        <h1>Interactive Problem Decoder</h1>
        <p>Dissect a short problem statement the way you would in the first two minutes of an interview: highlight meaningful terms, state input and output, note constraints, then commit to a data structure, a pattern, and a complexity. The guided explanation stays hidden until you have committed.</p>
      </div>
      <PatternTabs active="decoder" />
      <div className="stack">{decoderProblems.map((d) => <DecoderCard key={d.id} d={d} />)}</div>
    </>
  );
}
