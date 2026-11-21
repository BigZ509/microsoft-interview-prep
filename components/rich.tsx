import { Fragment, type ReactNode } from 'react';

/** Renders inline `code` and **bold** inside a string. */
export function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    const token = m[0];
    parts.push(token.startsWith('`') ? <code key={i++}>{token.slice(1, -1)}</code> : <strong key={i++}>{token.slice(2, -2)}</strong>);
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

/** Paragraphs separated by blank lines; consecutive "- " lines become a bullet list. */
export function Rich({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => <li key={li}><Inline text={l.trim().slice(2)} /></li>)}
            </ul>
          );
        }
        const firstBullet = lines.findIndex((l) => l.trim().startsWith('- '));
        if (firstBullet > 0) {
          return (
            <Fragment key={bi}>
              <p><Inline text={lines.slice(0, firstBullet).join(' ')} /></p>
              <ul>{lines.slice(firstBullet).map((l, li) => <li key={li}><Inline text={l.trim().replace(/^- /, '')} /></li>)}</ul>
            </Fragment>
          );
        }
        return <p key={bi}><Inline text={block} /></p>;
      })}
    </>
  );
}
