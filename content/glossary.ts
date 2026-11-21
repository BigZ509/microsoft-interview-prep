import type { Term, TermCategory } from './types';
import { glossaryA } from './glossary-a';
import { glossaryB } from './glossary-b';
import { decideByTerm } from './glossary-decide';

/** Terms are authored without `decide`; it is merged from glossary-decide.ts. */
export const glossary: Term[] = [...glossaryA, ...glossaryB].map((t) => ({ ...t, decide: decideByTerm[t.id] ?? '' }));

export const termCategories: TermCategory[] = [
  'Counting & arrangements',
  'Arrays & sequences',
  'Searching & optimization',
  'Data structures',
  'Recursion & graphs',
  'Complexity & implementation',
];

export function getTerm(id: string): Term | undefined {
  return glossary.find((term) => term.id === id);
}
