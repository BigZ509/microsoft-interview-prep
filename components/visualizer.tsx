'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { TreeNode, Visual } from '@/content/types';
import { Inline } from './rich';

function Vars({ vars }: { vars?: Record<string, string> }) {
  if (!vars || !Object.keys(vars).length) return null;
  return (
    <div className="viz-vars">
      {Object.entries(vars).map(([k, v]) => <span key={k} className="viz-var">{k} = {v}</span>)}
    </div>
  );
}

function TreeView({ node, active, done }: { node: TreeNode; active: Set<string>; done: Set<string> }) {
  const cls = active.has(node.id) ? 'tree-label active' : done.has(node.id) ? 'tree-label done' : 'tree-label';
  return (
    <div className="tree-node">
      <span className={cls}>{node.label}</span>
      {node.children?.length ? (
        <div className="tree-children">
          {node.children.map((c) => <TreeView key={c.id} node={c} active={active} done={done} />)}
        </div>
      ) : null}
    </div>
  );
}

export function GrowthChart() {
  const [n, setN] = useState(16);
  const rows: [string, (n: number) => number][] = [
    ['O(1)', () => 1],
    ['O(log n)', (x) => Math.max(1, Math.log2(x))],
    ['O(n)', (x) => x],
    ['O(n log n)', (x) => x * Math.max(1, Math.log2(x))],
    ['O(n²)', (x) => x * x],
    ['O(2ⁿ)', (x) => 2 ** x],
    ['O(n!)', (x) => { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; }],
  ];
  const values = rows.map(([, f]) => f(n));
  const max = Math.log10(Math.max(...values) + 1);
  const fmt = (v: number) => (v >= 1e6 ? v.toExponential(1).replace('e+', '×10^') : Math.round(v).toLocaleString());
  return (
    <div>
      <label className="field">
        Input size n = {n}
        <input type="range" min={1} max={30} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Input size n" />
      </label>
      <div style={{ marginTop: 10 }} role="table" aria-label="Approximate steps per complexity class">
        {rows.map(([label], i) => (
          <div key={label} className="growth-row" role="row">
            <span className="mono" role="cell">{label}</span>
            <div className="growth-bar" role="cell" aria-hidden="true">
              <span style={{ width: `${Math.max(1, (Math.log10(values[i] + 1) / max) * 100)}%` }} />
            </div>
            <span className="val" role="cell">{fmt(values[i])}</span>
          </div>
        ))}
      </div>
      <p className="tiny muted" style={{ marginTop: 8 }}>Bars use a logarithmic scale — otherwise O(2ⁿ) and O(n!) would hide everything else. At n = 20: n² = 400, 2ⁿ ≈ 10⁶, n! ≈ 2.4 × 10¹⁸.</p>
    </div>
  );
}

export function Visualizer({ visual }: { visual: Visual }) {
  const [i, setI] = useState(0);
  if (visual.kind === 'growth') {
    return (
      <div className="viz">
        <h3>{visual.title}</h3>
        <GrowthChart />
      </div>
    );
  }
  const steps = visual.steps;
  const step = steps[Math.min(i, steps.length - 1)];

  let stage: React.ReactNode = null;
  let vars: Record<string, string> | undefined;
  switch (visual.kind) {
    case 'array': {
      const s = step as (typeof visual.steps)[number];
      const ptrAt = (idx: number) => Object.entries(s.pointers ?? {}).filter(([, v]) => v === idx).map(([k]) => k).join(' ');
      const [wl, wr] = s.window ?? [-1, -2];
      stage = (
        <div className="arr">
          {s.cells.map((c, idx) => (
            <div key={idx} className={`arr-cell${idx >= wl && idx <= wr ? ' in-window' : ''}${s.highlight?.includes(idx) ? ' hl' : ''}`}>
              <span className="arr-ptr">{ptrAt(idx)}</span>
              <span className="arr-box">{String(c)}</span>
              <span className="arr-idx">{idx}</span>
            </div>
          ))}
        </div>
      );
      vars = s.vars;
      break;
    }
    case 'list': {
      const s = step as (typeof visual.steps)[number];
      const ptrAt = (idx: number) => Object.entries(s.pointers).filter(([, v]) => v === idx).map(([k]) => k).join(', ');
      const nones = Object.entries(s.pointers).filter(([, v]) => v === null).map(([k]) => k);
      stage = (
        <div>
          <div className="ll">
            {s.nodes.map((label, idx) => (
              <div key={idx} className="ll-node">
                <div className="ll-box" aria-label={`node ${label}, next ${s.next[idx] === null ? 'None' : s.nodes[s.next[idx]!]}`}>
                  <span className="ll-val">{label}</span>
                  <span className="ll-next">→ {s.next[idx] === null ? 'None' : s.nodes[s.next[idx]!]}</span>
                </div>
                <span className="ll-ptrs">{ptrAt(idx)}</span>
              </div>
            ))}
          </div>
          {nones.length > 0 && <p className="tiny muted" style={{ textAlign: 'center', margin: '6px 0 0' }}>{nones.join(', ')} = None</p>}
        </div>
      );
      break;
    }
    case 'tree': {
      const s = step as (typeof visual.steps)[number];
      stage = <div className="tree"><TreeView node={visual.root} active={new Set(s.active)} done={new Set(s.done ?? [])} /></div>;
      break;
    }
    case 'buckets': {
      const s = step as (typeof visual.steps)[number];
      stage = (
        <div>
          {s.incoming && <div className="incoming">incoming: <strong>{s.incoming}</strong></div>}
          <div className="buckets">
            {s.buckets.map((b) => (
              <div key={b.key} className="bucket">
                <div className="bucket-key">{b.key}</div>
                <div className="bucket-items">{b.items.length ? b.items.map((it) => <span key={it} className="sv-item">{it}</span>) : <span className="tiny muted">empty</span>}</div>
              </div>
            ))}
          </div>
        </div>
      );
      break;
    }
    case 'stack':
    case 'queue': {
      const s = step as (typeof visual.steps)[number];
      stage = (
        <div style={{ textAlign: 'center' }}>
          {s.input && <div className="incoming">next input: <strong>{s.input}</strong></div>}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className={visual.kind === 'stack' ? 'stackviz' : 'queueviz'} aria-label={`${visual.kind}: ${s.items.join(', ') || 'empty'}`}>
              {s.items.length ? s.items.map((it, idx) => <span key={idx} className="sv-item">{it}</span>) : <span className="tiny muted">empty</span>}
            </div>
          </div>
          <p className="tiny muted" style={{ margin: '4px 0 0' }}>{visual.kind === 'stack' ? 'top is at the top' : 'front ← … → back'}</p>
        </div>
      );
      vars = s.vars;
      break;
    }
    case 'grid': {
      const s = step as (typeof visual.steps)[number];
      const hl = new Set((s.highlight ?? []).map(([r, c]) => `${r},${c}`));
      stage = (
        <div className="grid-viz" style={{ gridTemplateColumns: `repeat(${s.grid[0].length}, 38px)` }}>
          {s.grid.flatMap((row, r) => row.map((cell, c) => (
            <span key={`${r}-${c}`} className={`grid-cell${cell === '1' ? ' land' : /[A-Z#]/.test(cell) ? ' mark' : ''}${hl.has(`${r},${c}`) ? ' hl' : ''}`}>{cell}</span>
          )))}
        </div>
      );
      vars = s.vars;
      break;
    }
    case 'vars': {
      const s = step as (typeof visual.steps)[number];
      stage = (
        <table className="vars-table">
          <tbody>{Object.entries(s.vars).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
        </table>
      );
      break;
    }
  }

  return (
    <div className="viz">
      <div className="spread"><h3 style={{ margin: 0 }}>{visual.title}</h3><span className="tiny muted">Step {i + 1} of {steps.length}</span></div>
      <div className="viz-stage">{stage}</div>
      <Vars vars={vars} />
      <div className="viz-note" aria-live="polite"><Inline text={step.note} /></div>
      <div className="viz-controls">
        <button className="btn small" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}><ChevronLeft size={15} />Back</button>
        <button className="btn small primary" onClick={() => setI((x) => Math.min(steps.length - 1, x + 1))} disabled={i === steps.length - 1}>Next<ChevronRight size={15} /></button>
        <button className="btn small ghost" onClick={() => setI(0)}><RotateCcw size={14} />Restart</button>
      </div>
    </div>
  );
}
