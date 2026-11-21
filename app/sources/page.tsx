import { sources, disclaimers } from '@/content/sources';

export const metadata = { title: 'Sources — Explore Prep' };

const tone = { OFFICIAL: 'good', EDUCATIONAL: 'accent', ANECDOTAL: 'warn', CURATED: '' } as const;

export default function SourcesPage() {
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Sources</div>
        <h1>References and confidence labels</h1>
        <p>All explanations in this app are original. These links are the research basis from your study plan, labeled by how much weight they deserve.</p>
      </div>
      <div className="callout warn">
        <ul style={{ margin: 0 }}>{disclaimers.map((d) => <li key={d}>{d}</li>)}</ul>
      </div>
      <ul className="item-list section">
        {sources.map((s) => (
          <li key={s.url} className="item">
            <div>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="title">{s.title}</a>
              <div className="small muted">{s.note}</div>
            </div>
            <span className={`badge ${tone[s.label]}`}>{s.label}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
