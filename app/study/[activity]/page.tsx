import { notFound } from 'next/navigation';
import { ActivityPlayer } from '@/components/activity-player';
import { allActivities, getActivity } from '@/content/bootcamp';

export const dynamicParams = false;

export function generateStaticParams() {
  return allActivities.map((a) => ({ activity: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ activity: string }> }) {
  const { activity } = await params;
  const a = getActivity(activity);
  // Blind activities keep a neutral title: it must not reveal the question.
  return { title: a ? `Day ${a.day} · ${a.kind === 'blind' ? 'Blind assessment' : a.title} — Explore Prep` : 'Activity — Explore Prep' };
}

export default async function StudyPage({ params }: { params: Promise<{ activity: string }> }) {
  const { activity } = await params;
  if (!getActivity(activity)) notFound();
  return <ActivityPlayer key={activity} id={activity} />;
}
