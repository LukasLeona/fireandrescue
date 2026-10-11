'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { UnavailableCourseDialog } from '@/components/courses/UnavailableCourseDialog';
import type { CatalogCourse } from '@/lib/catalog';

export function CourseCard({ course }: { course: CatalogCourse }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const closeDialog = useCallback(() => setDialogOpen(false), []);
  return (
    <><article className="course-card" data-category={course.category} data-reveal>
      <div className="course-cover"><img src={course.image} alt={`${course.title} course cover`} /><span className="course-pill">{course.available ? 'Available now' : 'Coming soon'}</span></div>
      <div className="course-body">
        <div className="course-meta"><span>▤ {course.lessons}</span><span>◷ {course.duration}</span></div>
        <h3>{course.available ? <Link href={course.href}>{course.title}</Link> : course.title}</h3><p>{course.description}</p>
        <div className="course-footer"><span className="free-tag">Free</span>{course.available ? <Link className="btn btn-ghost btn-sm" href={course.href}>View course →</Link> : <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDialogOpen(true)}>View course →</button>}</div>
      </div>
    </article><UnavailableCourseDialog courseTitle={course.title} open={dialogOpen} onClose={closeDialog} /></>
  );
}
