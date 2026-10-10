import type { Metadata } from 'next';
import { CoursePlayer } from '@/components/course/CoursePlayer';

export const metadata: Metadata = {
  title: 'HazMat Awareness Course',
  description: 'Complete the interactive HazMat Awareness course, knowledge checks, quizzes, and chapter tests.'
};

export default function HazmatCoursePage() {
  return <CoursePlayer />;
}
