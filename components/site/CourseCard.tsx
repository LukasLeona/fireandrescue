import Link from 'next/link';
import type { CatalogCourse } from '@/lib/catalog';

export function CourseCard({ course }: { course: CatalogCourse }) {
  return (
    <article className="course-card" data-category={course.category} data-reveal>
      <div className="course-cover"><img src={course.image} alt={`${course.title} course cover`} /><span className="course-pill">100% Free</span></div>
      <div className="course-body">
        <div className="course-meta"><span>▤ {course.lessons}</span><span>◷ {course.duration}</span></div>
        <h3><Link href={course.href}>{course.title}</Link></h3><p>{course.description}</p>
        <div className="course-footer"><span className="free-tag">Free</span><Link className="btn btn-ghost btn-sm" href={course.href}>View course →</Link></div>
      </div>
    </article>
  );
}
