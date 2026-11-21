import type { ReactNode } from 'react';

const KEYWORDS = new Set([
  'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False',
  'class', 'import', 'from', 'as', 'lambda', 'yield', 'try', 'except', 'raise', 'break', 'continue', 'pass',
  'global', 'nonlocal', 'with', 'assert', 'del',
]);

/** Tiny, dependency-free Python highlighter (comments, strings, keywords, numbers). */
function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|\b(\d[\d_]*(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    if (m[1]) out.push(<span key={k++} className="com">{m[1]}</span>);
    else if (m[2]) out.push(<span key={k++} className="str">{m[2]}</span>);
    else if (m[3]) out.push(<span key={k++} className="num">{m[3]}</span>);
    else if (m[4] && KEYWORDS.has(m[4])) out.push(<span key={k++} className="kw">{m[4]}</span>);
    else out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const text = code.replace(/^\n+/, '').replace(/\s+$/, '');
  return (
    <pre className="code" aria-label={label ?? 'Python code'} tabIndex={0}>
      <code style={{ background: 'none', padding: 0 }}>{highlight(text)}</code>
    </pre>
  );
}
