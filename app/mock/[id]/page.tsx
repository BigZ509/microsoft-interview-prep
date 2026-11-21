import { notFound } from 'next/navigation';
import { MockSessionView } from '@/components/mock';
import { mockProblems } from '@/content/mocks';

export const dynamicParams = false;

export function generateStaticParams() {
  return mockProblems.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${mockProblems.find((m) => m.id === id)?.title ?? 'Mock'} — Mock Interview` };
}

export default async function MockSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mockProblems.some((m) => m.id === id)) notFound();
  return <MockSessionView key={id} id={id} />;
}
