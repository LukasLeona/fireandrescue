import { getSessionProfile } from './supabase-client.js';

function setStatus(message, tone = '') {
  const target = document.querySelector('[data-course-sync-status]');
  if (!target) return;
  target.textContent = message;
  target.dataset.tone = tone;
}

export async function initializeCourseSync(slug) {
  try {
    const { supabase, session, profile } = await getSessionProfile();
    if (!session) { setStatus('Preview mode · Log in and enroll to save progress across devices.', 'preview'); return null; }
    if (!profile || profile.status !== 'approved') { setStatus('Your application must be approved before training progress can be recorded.', 'warning'); return null; }
    const { data: course, error: courseError } = await supabase.from('courses').select('id,slug,title').eq('slug', slug).single();
    if (courseError) throw courseError;
    if (profile.role !== 'student') { setStatus(`${profile.role.replace('_', ' ')} view · Course changes are not recorded.`, 'staff'); return { remoteCompleted: [], readOnly: true }; }
    const { data: enrollment, error: enrollmentError } = await supabase.from('enrollments').select('id,status').eq('course_id', course.id).eq('student_id', session.user.id).maybeSingle();
    if (enrollmentError) throw enrollmentError;
    if (!enrollment || !['active', 'completed'].includes(enrollment.status)) { setStatus('Enrollment required · Return to your dashboard to enroll in this course.', 'warning'); return null; }
    const { data: progress, error: progressError } = await supabase.from('lesson_progress').select('lesson_id').eq('course_id', course.id).eq('user_id', session.user.id).eq('completed', true);
    if (progressError) throw progressError;
    const remoteCompleted = new Set((progress || []).map((item) => item.lesson_id));
    setStatus('Cloud sync active · Progress and quiz scores are saved to your academy record.', 'synced');

    return {
      remoteCompleted: [...remoteCompleted],
      async saveLesson(lessonId) {
        if (remoteCompleted.has(lessonId)) return;
        const payload = { course_id: course.id, user_id: session.user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() };
        const { error } = await supabase.from('lesson_progress').insert(payload);
        if (error?.code === '23505') {
          const { error: updateError } = await supabase.from('lesson_progress').update({ completed: true, completed_at: payload.completed_at }).eq('course_id', course.id).eq('user_id', session.user.id).eq('lesson_id', lessonId);
          if (updateError) throw updateError;
        } else if (error) throw error;
        remoteCompleted.add(lessonId);
      },
      async saveAssessment({ id, title, score, maxScore, answers }) {
        const { error } = await supabase.from('quiz_attempts').insert({ course_id: course.id, user_id: session.user.id, assessment_id: id, assessment_title: title, score, max_score: maxScore, answers });
        if (error) throw error;
      }
    };
  } catch (error) {
    setStatus('Local mode · Cloud sync is temporarily unavailable. Your progress remains in this browser.', 'warning');
    console.warn('Course sync unavailable:', error.message);
    return null;
  }
}
