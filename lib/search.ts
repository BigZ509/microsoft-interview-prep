/** Cross-content search: lessons, dictionary terms, problems, Big-O drills, pattern exercises, mocks. */
import { allLessons } from '@/content/modules';
import { glossary } from '@/content/glossary';
import { problems } from '@/content/problems';
import { drills } from '@/content/drills';
import { scenarios, decoderProblems } from '@/content/patterns';
import { mockProblems } from '@/content/mocks';

export type SearchKind = 'Term' | 'Lesson' | 'Problem' | 'Big-O drill' | 'Pattern exercise' | 'Decoder' | 'Mock interview';

export type SearchResult = { kind: SearchKind; title: string; subtitle: string; href: string; score: number };

type Doc = { kind: SearchKind; title: string; subtitle: string; href: string; names: string[]; body: string };

const KIND_WEIGHT: Record<SearchKind, number> = {
  Term: 6, Lesson: 5, Problem: 4, 'Big-O drill': 3, 'Pattern exercise': 3, Decoder: 2, 'Mock interview': 2,
};

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9ⁿ²³!+\s-]/g, ' ');
}

let index: Doc[] | null = null;

function buildIndex(): Doc[] {
  const docs: Doc[] = [];
  for (const t of glossary) {
    docs.push({
      kind: 'Term', title: t.term, subtitle: t.definition, href: `/dictionary/${t.id}`,
      names: [t.term, ...(t.aliases ?? [])],
      body: [t.definition, t.example, t.implies, t.approaches.join(' '), t.misconception, t.structures.join(' '), t.complexity, t.category].join(' '),
    });
  }
  for (const { module, lesson, key } of allLessons) {
    docs.push({
      kind: 'Lesson', title: lesson.title, subtitle: `Module ${module.number} · ${module.title}`, href: `/learn/${key}`,
      names: [lesson.title],
      body: [lesson.summary, lesson.what, lesson.why, lesson.how.join(' '), lesson.whenToUse.join(' '), lesson.mistakes.join(' '), lesson.complexity.time, lesson.terms.join(' ')].join(' '),
    });
  }
  for (const p of problems) {
    docs.push({
      kind: 'Problem', title: `${p.id}. ${p.title}`, subtitle: `${p.difficulty} · ${p.pattern}`, href: `/tracker/${p.id}`,
      names: [p.title, String(p.id)],
      body: [p.topic, p.pattern, p.why, p.time, p.space, p.terms.join(' '), p.candidateReport ?? ''].join(' '),
    });
  }
  for (const d of drills) {
    docs.push({
      kind: 'Big-O drill', title: d.title, subtitle: 'Big-O Lab drill (answer hidden until you submit)', href: `/big-o/${d.id}`,
      names: [d.title], body: [d.tags.join(' '), d.sizes, d.optimization, d.trap ?? '', d.code].join(' '),
    });
  }
  for (const s of scenarios) {
    docs.push({
      kind: 'Pattern exercise', title: s.wording, subtitle: 'Pattern recognition', href: `/patterns#${s.id}`,
      names: [], body: [s.constraints, s.clues.join(' ')].join(' '),
    });
  }
  for (const d of decoderProblems) {
    docs.push({
      kind: 'Decoder', title: d.title, subtitle: 'Interactive problem decoder', href: `/patterns/decoder#${d.id}`,
      names: [d.title], body: [d.statement, d.keyTerms.map((k) => `${k.text} ${k.meaning}`).join(' '), d.patternOptions[d.pattern], d.label ?? ''].join(' '),
    });
  }
  for (const m of mockProblems) {
    docs.push({
      kind: 'Mock interview', title: m.title, subtitle: m.label ? 'Candidate-reported reconstruction' : 'Guided technical mock', href: `/mock/${m.id}`,
      names: [m.title], body: [m.statement, m.label ?? ''].join(' '),
    });
  }
  return docs.map((d) => ({ ...d, names: d.names.map(normalize), body: normalize(d.body), title: d.title }));
}

/** Simple stemming so "permutations" matches "permutation" and vice versa. */
function variants(word: string): string[] {
  const out = new Set([word]);
  if (word.endsWith('ies') && word.length > 4) out.add(`${word.slice(0, -3)}y`);
  if (word.endsWith('es') && word.length > 4) out.add(word.slice(0, -2));
  if (word.endsWith('s') && word.length > 3) out.add(word.slice(0, -1));
  return [...out];
}

export function search(query: string, limit = 60): SearchResult[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  index ??= buildIndex();
  const results: SearchResult[] = [];
  for (const doc of index) {
    const title = normalize(doc.title);
    let score = 0;
    let all = true;
    for (const word of words) {
      const forms = variants(word);
      const inName = doc.names.some((n) => forms.some((f) => n === f));
      const nameStart = doc.names.some((n) => forms.some((f) => n.startsWith(f)));
      const inTitle = forms.some((f) => title.includes(f));
      const inBody = forms.some((f) => doc.body.includes(f));
      if (!inTitle && !inBody && !nameStart) { all = false; break; }
      score += inName ? 30 : nameStart ? 18 : inTitle ? 12 : 3;
    }
    if (!all) continue;
    results.push({ kind: doc.kind, title: doc.title, subtitle: doc.subtitle, href: doc.href, score: score + KIND_WEIGHT[doc.kind] });
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}
