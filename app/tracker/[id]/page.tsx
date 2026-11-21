import { notFound } from 'next/navigation';
import { ProblemDetail } from '@/components/tracker';
import { problems, getProblem } from '@/content/problems';

export const dynamicParams = false;

export function generateStaticParams() {
  return problems.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProblem(Number(id));
  return { title: p ? `${p.id}. ${p.title} — Tracker` : 'Problem' };
}

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getProblem(Number(id))) notFound();
  return <ProblemDetail key={id} id={Number(id)} />;
}
