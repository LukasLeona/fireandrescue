'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Empty, type DashboardContext } from './types';

type Course = { id: string; slug: string; title: string; description: string; cover_image: string; lesson_count: number };
type Enrollment = { id: string; course_id: string; status: string; progress_percent: number };

export function CoursesPanel({ context }: { context: DashboardContext }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const load = useCallback(async () => {
    const { data, error } = await context.supabase.from('courses').select('id,slug,title,description,cover_image,lesson_count').eq('is_published', true).order('title');
    if (error) throw error;
    setCourses((data || []) as Course[]);
    if (context.profile.role === 'student') {
      const { data: enrollmentData, error: enrollmentError } = await context.supabase.from('enrollments').select('id,course_id,status,progress_percent').eq('student_id', context.session.user.id);
      if (enrollmentError) throw enrollmentError;
      setEnrollments((enrollmentData || []) as Enrollment[]);
    }
  }, [context]);
  useEffect(() => { load().catch((error) => context.showAlert(error.message)); }, [load, context]);

  const enroll = async (courseId: string, enrollment?: Enrollment) => {
    const result = enrollment
      ? await context.supabase.from('enrollments').update({ status: 'active' }).eq('id', enrollment.id).eq('student_id', context.session.user.id)
      : await context.supabase.from('enrollments').insert({ course_id: courseId, student_id: context.session.user.id });
    if (result.error) { context.showAlert(result.error.message); return; }
    context.showAlert('You are enrolled. Your course is ready to begin.', 'success');
    await load();
  };
  const withdraw = async (enrollment: Enrollment) => {
    if (!window.confirm('Withdraw from this course? Your completed lesson history will be preserved.')) return;
    const { error } = await context.supabase.from('enrollments').update({ status: 'withdrawn' }).eq('id', enrollment.id).eq('student_id', context.session.user.id);
    if (error) { context.showAlert(error.message); return; }
    context.showAlert('You have withdrawn from the course.', 'success');
    await load();
  };

  const map = new Map(enrollments.map((item) => [item.course_id, item]));
  return <section className="dashboard-panel is-active"><div className="panel-heading"><div><p className="eyebrow">Learning catalog</p><h2>Courses</h2><p>Enroll, continue training, or monitor the programs assigned to you.</p></div></div><div className="course-dashboard-grid">{!courses.length ? <Empty>No published courses are available yet.</Empty> : courses.map((course) => { const enrollment = map.get(course.id); const progress = Math.round(Number(enrollment?.progress_percent) || 0); const student = context.profile.role === 'student'; const image = course.cover_image?.startsWith('/') ? course.cover_image : `/${course.cover_image || 'assets/images/course-hazmat.svg'}`; return <article className="dashboard-course-card" key={course.id}><div className="course-card-image"><img src={image} alt="" loading="lazy" /><span>{course.lesson_count} sections</span></div><div className="course-card-body"><p className="eyebrow">{course.slug.replaceAll('-', ' ')}</p><h3>{course.title}</h3><p>{course.description || 'Academy course'}</p>{student && enrollment && enrollment.status !== 'withdrawn' ? <div className="course-progress-row"><div className="course-progress-track"><span style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div> : <p className="course-availability">{student ? 'Open enrollment' : `${course.lesson_count} learning sections`}</p>}<div className="course-card-actions">{!student || (enrollment && enrollment.status !== 'withdrawn') ? <Link className="btn btn-primary btn-small" href={course.slug === 'hazmat-awareness' ? '/hazmat-course' : '/courses'}>{student ? (progress ? 'Continue course' : 'Start course') : 'View course'}</Link> : <button className="btn btn-primary btn-small" type="button" onClick={() => enroll(course.id, enrollment)}> {enrollment ? 'Re-enroll' : 'Enroll now'} </button>}{student && enrollment?.status === 'active' && <button className="text-button" type="button" onClick={() => withdraw(enrollment)}>Withdraw</button>}</div></div></article>; })}</div></section>;
}
