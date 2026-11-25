import { notFound } from 'next/navigation';
import { OopSession } from '@/components/oop';
import { getOopChallenge, oopChallenges } from '@/content/oop-challenges';

export const dynamicParams = false;

export function generateStaticParams() {
  return oopChallenges.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getOopChallenge(id);
  return { title: c ? `${c.title} — OOP challenge` : 'OOP challenge' };
}

export default async function OopChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getOopChallenge(id)) notFound();
  return <OopSession key={id} id={id} />;
}
