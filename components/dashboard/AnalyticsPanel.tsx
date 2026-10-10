'use client';

import { useEffect, useMemo, useState } from 'react';
import { Empty, type DashboardContext } from './types';

type Course = { id: string; title: string };
type Enrollment = { student_id: string; status: string; progress_percent: number; student?: { full_name?: string; email?: string } | null };
type Attempt = { user_id: string; percent: number };

export function AnalyticsPanel({ context }: { context: DashboardContext }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    (async () => {
      if (context.profile.role === 'instructor') {
        const { data, error } = await context.supabase.from('course_instructors').select('course:courses(id,title)').eq('instructor_id', context.session.user.id);
        if (error) throw error;
        const assigned = (data || []).map((item) => item.course as unknown as Course).filter(Boolean);
        setCourses(assigned); setCourseId(assigned[0]?.id || '');
      } else {
        const { data, error } = await context.supabase.from('courses').select('id,title').order('title');
        if (error) throw error;
        const available = (data || []) as Course[];
        setCourses(available); setCourseId(available[0]?.id || '');
      }
    })().catch((error) => context.showAlert(error.message));
  }, [context]);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      context.supabase.from('enrollments').select('student_id,status,progress_percent,student:profiles!enrollments_student_id_fkey(full_name,email)').eq('course_id', courseId).neq('status', 'withdrawn'),
      context.supabase.from('quiz_attempts').select('user_id,percent').eq('course_id', courseId)
    ]).then(([enrollmentResult, attemptResult]) => {
      if (enrollmentResult.error) throw enrollmentResult.error;
      if (attemptResult.error) throw attemptResult.error;
      setEnrollments((enrollmentResult.data || []) as unknown as Enrollment[]);
      setAttempts((attemptResult.data || []) as Attempt[]);
    }).catch((error) => context.showAlert(error.message));
  }, [context, courseId]);

  const attemptsByStudent = useMemo(() => {
    const map = new Map<string, Attempt[]>();
    attempts.forEach((attempt) => map.set(attempt.user_id, [...(map.get(attempt.user_id) || []), attempt]));
    return map;
  }, [attempts]);
  const total = enrollments.length;
  const averageProgress = total ? Math.round(enrollments.reduce((sum, item) => sum + Number(item.progress_percent), 0) / total) : 0;
  const completionRate = total ? Math.round(enrollments.filter((item) => item.status === 'completed' || Number(item.progress_percent) >= 100).length / total * 100) : 0;
  const averageScore = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + Number(item.percent), 0) / attempts.length) : 0;
  const ranking = enrollments.map((item) => { const learnerAttempts = attemptsByStudent.get(item.student_id) || []; return { ...item, attempts: learnerAttempts.length, average: learnerAttempts.length ? learnerAttempts.reduce((sum, attempt) => sum + Number(attempt.percent), 0) / learnerAttempts.length : 0 }; }).sort((a, b) => b.average - a.average || Number(b.progress_percent) - Number(a.progress_percent));

  return <section className="dashboard-panel is-active"><div className="panel-heading"><div><p className="eyebrow">Training intelligence</p><h2>Performance analytics</h2><p>Monitor participation, completion, assessment scores, and learner rankings.</p></div></div>{!courses.length ? <div className="dashboard-card"><Empty>No courses are assigned to you yet.</Empty></div> : <><div className="analytics-toolbar"><label htmlFor="analytics-course">Course dashboard</label><select className="compact-control" id="analytics-course" value={courseId} onChange={(event) => setCourseId(event.target.value)}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><span>{context.profile.role === 'instructor' ? 'Assigned courses only' : 'All academy courses'}</span></div><div className="metric-grid analytics-metrics">{[['Enrolled students', total, 'Active learners'], ['Average progress', `${averageProgress}%`, 'Course-wide completion'], ['Completion rate', `${completionRate}%`, 'Learners finished'], ['Average quiz score', `${averageScore}%`, `${attempts.length} recorded attempts`]].map(([title, value, note]) => <article className="metric-card" key={title}><span>{title}</span><strong>{value}</strong><small>{note}</small></article>)}</div><div className="dashboard-two-column analytics-columns"><section className="dashboard-card"><div className="card-heading"><div><p className="eyebrow">Progress distribution</p><h3>Course momentum</h3></div></div><div className="distribution-chart">{[['Not started', enrollments.filter((item) => Number(item.progress_percent) === 0).length], ['In progress', enrollments.filter((item) => Number(item.progress_percent) > 0 && Number(item.progress_percent) < 100).length], ['Complete', enrollments.filter((item) => Number(item.progress_percent) >= 100).length]].map(([name, count]) => <div key={name}><span>{name}</span><div><i style={{ width: `${total ? Math.round(Number(count) / total * 100) : 0}%` }} /></div><strong>{count}</strong></div>)}</div></section><section className="dashboard-card"><div className="card-heading"><div><p className="eyebrow">Top performers</p><h3>Learner ranking</h3></div></div>{!ranking.length ? <Empty>Rankings will appear after students begin training.</Empty> : <ol className="leaderboard">{ranking.slice(0, 10).map((learner, index) => <li key={learner.student_id}><span className="leader-rank">{index + 1}</span><div><strong>{learner.student?.full_name || 'Student'}</strong><small>{learner.attempts} quiz attempts · {Math.round(Number(learner.progress_percent))}% progress</small></div><b>{Math.round(learner.average)}%</b></li>)}</ol>}</section></div><section className="dashboard-card analytics-learners"><div className="card-heading"><div><p className="eyebrow">Roster detail</p><h3>Student performance</h3></div></div><div className="data-table-wrap">{!ranking.length ? <Empty>No students are enrolled in this course yet.</Empty> : <table className="data-table"><thead><tr><th>Learner</th><th>Progress</th><th>Attempts</th><th>Average</th></tr></thead><tbody>{ranking.map((learner) => <tr key={learner.student_id}><td><strong>{learner.student?.full_name || 'Student'}</strong><small>{learner.student?.email || ''}</small></td><td><div className="table-progress"><span style={{ width: `${Math.round(Number(learner.progress_percent))}%` }} /></div><small>{Math.round(Number(learner.progress_percent))}% complete</small></td><td>{learner.attempts}</td><td>{Math.round(learner.average)}%</td></tr>)}</tbody></table>}</div></section></>}</section>;
}
