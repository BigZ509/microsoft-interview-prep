import { sources, disclaimers } from '@/content/sources';
import { PageHeader } from '@/components/ui';

export const metadata = { title: 'Sources — Explore Prep' };

const tone = { OFFICIAL: 'good', EDUCATIONAL: 'accent', ANECDOTAL: 'warn', CURATED: '' } as const;

export default function SourcesPage() {
  return (
    <>
      <PageHeader eyebrow="Sources" title="References and confidence labels" description="All explanations in this app are original. These links are the research basis from your study plan, labeled by how much weight they deserve." />
      <div className="callout warn">
        <ul style={{ margin: 0 }}>{disclaimers.map((d) => <li key={d}>{d}</li>)}</ul>
      </div>
      <ul className="item-list section">
        {sources.map((s) => (
          <li key={s.url} className="item">
            <div style={{ minWidth: 0, flex: 1 }}>
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
