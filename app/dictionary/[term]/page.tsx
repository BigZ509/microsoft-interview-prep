import { notFound } from 'next/navigation';
import { TermDetail } from '@/components/dictionary';
import { glossary, getTerm } from '@/content/glossary';

export const dynamicParams = false;

export function generateStaticParams() {
  return glossary.map((t) => ({ term: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  return { title: `${getTerm(term)?.term ?? 'Term'} — Interview Dictionary` };
}

export default async function TermPage({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  if (!getTerm(term)) notFound();
  return <TermDetail id={term} />;
}
