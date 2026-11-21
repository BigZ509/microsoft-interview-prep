import { notFound } from 'next/navigation';
import { LessonView } from '@/components/lesson-view';
import { allLessons, getLesson } from '@/content/modules';

export const dynamicParams = false;

export function generateStaticParams() {
  return allLessons.map(({ module, lesson }) => ({ module: module.id, lesson: lesson.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ module: string; lesson: string }> }) {
  const { module, lesson } = await params;
  return { title: `${getLesson(`${module}/${lesson}`)?.lesson.title ?? 'Lesson'} — Explore Prep` };
}

export default async function LessonPage({ params }: { params: Promise<{ module: string; lesson: string }> }) {
  const { module, lesson } = await params;
  const key = `${module}/${lesson}`;
  const ref = getLesson(key);
  if (!ref) notFound();
  const index = allLessons.findIndex((l) => l.key === key);
  const prev = allLessons[index - 1];
  const next = allLessons[index + 1];
  return (
    <LessonView
      module={{ id: ref.module.id, number: ref.module.number, title: ref.module.title, phase: ref.module.phase }}
      lesson={ref.lesson}
      lessonKey={key}
      prev={prev ? { href: `/learn/${prev.key}`, title: prev.lesson.title } : undefined}
      next={next ? { href: `/learn/${next.key}`, title: next.lesson.title } : undefined}
    />
  );
}
