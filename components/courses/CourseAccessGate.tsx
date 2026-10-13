'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { getSessionProfile } from '@/lib/supabase/client';

type AccessState = 'checking' | 'ready' | 'login' | 'pending' | 'unavailable' | 'error';

export function CourseAccessGate({ courseSlug, courseTitle, children }: { courseSlug: string; courseTitle: string; children: ReactNode }) {
  const [state, setState] = useState<AccessState>('checking');
  const [message, setMessage] = useState('Checking academy access…');

  useEffect(() => {
    (async () => {
      try {
        const { supabase, session, profile } = await getSessionProfile();
        if (!session) { setState('login'); return; }
        if (!profile || profile.status !== 'approved') { setState('pending'); return; }
        if (profile.role !== 'student') { setState('ready'); return; }
        const { data: course, error: courseError } = await supabase.from('courses').select('id,is_published').eq('slug', courseSlug).maybeSingle();
        if (courseError) throw courseError;
        if (!course?.is_published) { setState('unavailable'); return; }
        const { data: enrollment, error: enrollmentError } = await supabase.from('enrollments').select('id,status').eq('course_id', course.id).eq('student_id', session.user.id).maybeSingle();
        if (enrollmentError) throw enrollmentError;
        if (!enrollment) {
          const { error } = await supabase.from('enrollments').insert({ course_id: course.id, student_id: session.user.id, status: 'active' });
          if (error) throw error;
        } else if (enrollment.status === 'withdrawn') {
          const { error } = await supabase.from('enrollments').update({ status: 'active' }).eq('id', enrollment.id).eq('student_id', session.user.id);
          if (error) throw error;
        }
        setState('ready');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Course access could not be confirmed.');
        setState('error');
      }
    })();
  }, [courseSlug]);

  if (state === 'ready') return <>{children}</>;
  if (state === 'checking') return <div className="dashboard-loader" aria-live="polite"><span className="button-spinner" /><strong>{message}</strong></div>;

  const next = `/courses/${courseSlug}`;
  const title = state === 'login' ? 'Log in to open this course' : state === 'pending' ? 'Approval required' : state === 'unavailable' ? 'Course not available' : 'Access check failed';
  const copy = state === 'login' ? `You need to log in to enroll in ${courseTitle} and open its lessons.` : state === 'pending' ? 'Your academy application must be approved before you can enroll in courses.' : state === 'unavailable' ? 'This course has not been published to the academy dashboard yet.' : message;
  return <main className="status-page"><section className="auth-status-card"><div className="status-icon">↗</div><p className="eyebrow">Fire and Rescue Academy</p><h1>{title}</h1><p>{copy}</p><div className="status-actions">{state === 'login' && <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(next)}`}>Log in →</Link>}{state === 'pending' && <Link className="btn btn-primary" href="/application-status">View application status</Link>}<Link className="btn btn-ghost" href="/courses">Return to courses</Link></div></section></main>;
}
