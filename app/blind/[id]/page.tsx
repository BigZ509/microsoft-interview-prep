import { notFound } from 'next/navigation';
import { BlindSession } from '@/components/blind';
import { blindItems, getBlindItem } from '@/content/blind';

export const dynamicParams = false;

export function generateStaticParams() {
  return blindItems.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = getBlindItem(id);
  // Codename only: the title must not reveal the pattern.
  return { title: b ? `${b.codename} — Blind assessment` : 'Blind assessment' };
}

export default async function BlindItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getBlindItem(id)) notFound();
  return <BlindSession key={id} id={id} />;
}
