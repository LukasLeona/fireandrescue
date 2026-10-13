'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { CourseLoginDialog } from '@/components/courses/CourseLoginDialog';
import { UnavailableCourseDialog } from '@/components/courses/UnavailableCourseDialog';
import type { CatalogCourse } from '@/lib/catalog';
import { getSessionProfile } from '@/lib/supabase/client';

export function CourseCard({ course }: { course: CatalogCourse }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const router = useRouter();
  const closeDialog = useCallback(() => setDialogOpen(false), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const viewCourse = async () => {
    if (!course.available) { setDialogOpen(true); return; }
    setCheckingAccess(true);
    try {
      const { session, profile } = await getSessionProfile();
      if (!session) { setLoginOpen(true); return; }
      if (!profile || profile.status !== 'approved') { router.push('/application-status'); return; }
      router.push(course.href);
    } catch {
      setLoginOpen(true);
    } finally {
      setCheckingAccess(false);
    }
  };
  return (
    <><article className="course-card" data-category={course.category} data-reveal>
      <div className="course-cover"><img src={course.image} alt={`${course.title} course cover`} /><span className="course-pill">{course.available ? 'Available now' : 'Coming soon'}</span></div>
      <div className="course-body">
        <div className="course-meta"><span>▤ {course.lessons}</span><span>◷ {course.duration}</span></div>
        <h3>{course.title}</h3><p>{course.description}</p>
        <div className="course-footer"><span className="free-tag">Free</span><button className="btn btn-ghost btn-sm" type="button" onClick={viewCourse} disabled={checkingAccess}>{checkingAccess ? 'Checking…' : 'View course →'}</button></div>
      </div>
    </article><UnavailableCourseDialog courseTitle={course.title} open={dialogOpen} onClose={closeDialog} /><CourseLoginDialog courseTitle={course.title} courseHref={course.href} open={loginOpen} onClose={closeLogin} /></>
  );
}
