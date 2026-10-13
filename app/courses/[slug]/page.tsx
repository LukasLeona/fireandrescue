import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CoursePlayer } from '@/components/course/CoursePlayer';
import { CourseAccessGate } from '@/components/courses/CourseAccessGate';
import { SourceCoursePlayer } from '@/components/source-course/SourceCoursePlayer';
import { getSourceCourse, isSourceCourseSlug, sourceCourseSlugs } from '@/lib/source-courses';

export function generateStaticParams() {
  return [...sourceCourseSlugs, 'hazmat-awareness'].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'hazmat-awareness') return { title: 'HazMat Awareness Course', description: 'Complete the interactive HazMat Awareness course, knowledge checks, quizzes, and chapter tests.' };
  if (!isSourceCourseSlug(slug)) return {};
  const course = getSourceCourse(slug);
  return { title: course.title, description: course.meta.description };
}

export default async function SourceCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === 'hazmat-awareness') return <CourseAccessGate courseSlug={slug} courseTitle="HazMat Awareness"><CoursePlayer /></CourseAccessGate>;
  if (!isSourceCourseSlug(slug)) notFound();
  const course = getSourceCourse(slug);
  return <CourseAccessGate courseSlug={slug} courseTitle={course.title}><SourceCoursePlayer course={course} /></CourseAccessGate>;
}
