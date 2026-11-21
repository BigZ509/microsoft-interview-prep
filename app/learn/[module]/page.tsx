import { notFound } from 'next/navigation';
import { ModuleView } from '@/components/learn-index';
import { getModule, modules } from '@/content/modules';

export const dynamicParams = false;

export function generateStaticParams() {
  return modules.map((m) => ({ module: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return { title: `${getModule(module)?.title ?? 'Module'} — Explore Prep` };
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!getModule(module)) notFound();
  return <ModuleView moduleId={module} />;
}
