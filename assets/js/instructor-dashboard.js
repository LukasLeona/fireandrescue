const privilegedRoles = ['super_admin', 'admin', 'instructor'];
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

function metric(label, value, detail) {
  return `<article class="metric-card"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`;
}

function progressBar(value) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return `<div class="table-progress"><span style="width:${percent}%"></span></div><small>${percent}% complete</small>`;
}

function learnerTable(enrollments, attemptsByStudent) {
  if (!enrollments.length) return '<p class="empty-state">No students are enrolled in this course yet.</p>';
  return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Learner</th><th>Progress</th><th>Attempts</th><th>Average</th><th>Best score</th></tr></thead><tbody>${enrollments.map((item) => {
    const attempts = attemptsByStudent.get(item.student_id) || [];
    const average = attempts.length ? attempts.reduce((sum, attempt) => sum + Number(attempt.percent), 0) / attempts.length : 0;
    const best = attempts.length ? Math.max(...attempts.map((attempt) => Number(attempt.percent))) : 0;
    return `<tr><td><strong>${escapeHtml(item.student?.full_name || 'Student')}</strong><small>${escapeHtml(item.student?.email || '')}</small></td><td>${progressBar(item.progress_percent)}</td><td>${attempts.length}</td><td>${Math.round(average)}%</td><td>${Math.round(best)}%</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function leaderboard(enrollments, attemptsByStudent) {
  const ranked = enrollments.map((item) => {
    const attempts = attemptsByStudent.get(item.student_id) || [];
    return { name: item.student?.full_name || 'Student', attempts: attempts.length, average: attempts.length ? attempts.reduce((sum, attempt) => sum + Number(attempt.percent), 0) / attempts.length : 0, progress: Number(item.progress_percent) };
  }).sort((a, b) => b.average - a.average || b.progress - a.progress).slice(0, 10);
  if (!ranked.length) return '<p class="empty-state">Rankings will appear after students begin training.</p>';
  return `<ol class="leaderboard">${ranked.map((learner, index) => `<li><span class="leader-rank">${index + 1}</span><div><strong>${escapeHtml(learner.name)}</strong><small>${learner.attempts} quiz attempt${learner.attempts === 1 ? '' : 's'} · ${Math.round(learner.progress)}% progress</small></div><b>${Math.round(learner.average)}%</b></li>`).join('')}</ol>`;
}

async function availableCourses(state) {
  if (state.profile.role === 'instructor') {
    const { data, error } = await state.supabase.from('course_instructors').select('course:courses(id,title,slug,lesson_count,is_published)').eq('instructor_id', state.session.user.id);
    if (error) throw error;
    return (data || []).map((item) => item.course).filter(Boolean);
  }
  const { data, error } = await state.supabase.from('courses').select('id,title,slug,lesson_count,is_published').order('title');
  if (error) throw error;
  return data || [];
}

async function renderCourseAnalytics(courseId, state) {
  const target = document.querySelector('[data-analytics-body]');
  target.innerHTML = '<p class="empty-state">Calculating course performance…</p>';
  const [{ data: enrollments, error: enrollmentError }, { data: attempts, error: attemptError }] = await Promise.all([
    state.supabase.from('enrollments').select('student_id,status,progress_percent,enrolled_at,student:profiles!enrollments_student_id_fkey(user_id,full_name,email,organization)').eq('course_id', courseId).neq('status', 'withdrawn'),
    state.supabase.from('quiz_attempts').select('user_id,assessment_id,assessment_title,percent,submitted_at').eq('course_id', courseId).order('submitted_at', { ascending: false })
  ]);
  if (enrollmentError) throw enrollmentError;
  if (attemptError) throw attemptError;
  const attemptMap = new Map();
  (attempts || []).forEach((attempt) => { const list = attemptMap.get(attempt.user_id) || []; list.push(attempt); attemptMap.set(attempt.user_id, list); });
  const total = enrollments?.length || 0;
  const completionRate = total ? Math.round(enrollments.filter((item) => item.status === 'completed' || Number(item.progress_percent) >= 100).length / total * 100) : 0;
  const averageProgress = total ? Math.round(enrollments.reduce((sum, item) => sum + Number(item.progress_percent), 0) / total) : 0;
  const averageScore = attempts?.length ? Math.round(attempts.reduce((sum, item) => sum + Number(item.percent), 0) / attempts.length) : 0;
  const distribution = [
    ['Not started', enrollments.filter((item) => Number(item.progress_percent) === 0).length],
    ['In progress', enrollments.filter((item) => Number(item.progress_percent) > 0 && Number(item.progress_percent) < 100).length],
    ['Complete', enrollments.filter((item) => Number(item.progress_percent) >= 100).length]
  ];
  target.innerHTML = `<div class="metric-grid analytics-metrics">${metric('Enrolled students', total, 'Active learners')}${metric('Average progress', `${averageProgress}%`, 'Course-wide completion')}${metric('Completion rate', `${completionRate}%`, 'Learners finished')}${metric('Average quiz score', `${averageScore}%`, `${attempts?.length || 0} recorded attempts`)}</div><div class="dashboard-two-column analytics-columns"><section class="dashboard-card"><div class="card-heading"><div><p class="eyebrow">Progress distribution</p><h3>Course momentum</h3></div></div><div class="distribution-chart">${distribution.map(([name, count]) => `<div><span>${name}</span><div><i style="width:${total ? Math.round(count / total * 100) : 0}%"></i></div><strong>${count}</strong></div>`).join('')}</div></section><section class="dashboard-card"><div class="card-heading"><div><p class="eyebrow">Top performers</p><h3>Learner ranking</h3></div></div>${leaderboard(enrollments || [], attemptMap)}</section></div><section class="dashboard-card analytics-learners"><div class="card-heading"><div><p class="eyebrow">Roster detail</p><h3>Student performance</h3></div></div>${learnerTable(enrollments || [], attemptMap)}</section>`;
}

async function initializeAnalytics(state, showAlert) {
  const courses = await availableCourses(state);
  const container = document.querySelector('[data-analytics-content]');
  if (!courses.length) { container.innerHTML = '<div class="dashboard-card"><p class="empty-state">No courses are assigned to you yet. Ask an administrator to assign a course.</p></div>'; return; }
  container.innerHTML = `<div class="analytics-toolbar"><label for="analytics-course">Course dashboard</label><select class="compact-control" id="analytics-course" data-analytics-course>${courses.map((course) => `<option value="${course.id}">${escapeHtml(course.title)}</option>`).join('')}</select><span>${state.profile.role === 'instructor' ? 'Assigned courses only' : 'All academy courses'}</span></div><div data-analytics-body></div>`;
  const select = document.querySelector('[data-analytics-course]');
  const load = () => renderCourseAnalytics(select.value, state).catch((error) => showAlert(error.message));
  select.addEventListener('change', load);
  await load();
}

window.addEventListener('fra:dashboard-ready', ({ detail: state }) => {
  if (!privilegedRoles.includes(state.profile.role)) return;
  initializeAnalytics(state, window.FRA_DASHBOARD.showAlert).catch((error) => window.FRA_DASHBOARD.showAlert(error.message));
});
