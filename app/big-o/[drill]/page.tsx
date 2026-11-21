import { notFound } from 'next/navigation';
import { DrillRunner } from '@/components/big-o-lab';
import { drills, getDrill } from '@/content/drills';

export const dynamicParams = false;

export function generateStaticParams() {
  return drills.map((d) => ({ drill: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ drill: string }> }) {
  const { drill } = await params;
  return { title: `${getDrill(drill)?.title ?? 'Drill'} — Big-O Lab` };
}

export default async function DrillPage({ params }: { params: Promise<{ drill: string }> }) {
  const { drill } = await params;
  if (!getDrill(drill)) notFound();
  return <DrillRunner key={drill} id={drill} />;
}
