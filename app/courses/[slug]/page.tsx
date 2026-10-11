import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SourceCoursePlayer } from '@/components/source-course/SourceCoursePlayer';
import { getSourceCourse, isSourceCourseSlug, sourceCourseSlugs } from '@/lib/source-courses';

export function generateStaticParams() {
  return sourceCourseSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSourceCourseSlug(slug)) return {};
  const course = getSourceCourse(slug);
  return { title: course.title, description: course.meta.description };
}

export default async function SourceCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSourceCourseSlug(slug)) notFound();
  return <SourceCoursePlayer course={getSourceCourse(slug)} />;
}
