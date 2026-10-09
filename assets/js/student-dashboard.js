const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

function courseLink(course) {
  return course.slug === 'hazmat-awareness' ? 'hazmat-course.html' : '#';
}

function card(course, enrollment, role) {
  const progress = Math.round(Number(enrollment?.progress_percent) || 0);
  const student = role === 'student';
  let action = `<a class="btn btn-primary btn-small" href="${courseLink(course)}">View course</a>`;
  if (student && !enrollment) action = `<button class="btn btn-primary btn-small" type="button" data-enroll-course="${course.id}">Enroll now</button>`;
  if (student && enrollment?.status === 'withdrawn') action = `<button class="btn btn-primary btn-small" type="button" data-enroll-course="${course.id}" data-reactivate="${enrollment.id}">Re-enroll</button>`;
  if (student && enrollment && enrollment.status !== 'withdrawn') action = `<a class="btn btn-primary btn-small" href="${courseLink(course)}">${progress ? 'Continue course' : 'Start course'}</a>`;
  const progressMarkup = student && enrollment && enrollment.status !== 'withdrawn'
    ? `<div class="course-progress-row"><div class="course-progress-track"><span style="width:${progress}%"></span></div><strong>${progress}%</strong></div>`
    : `<p class="course-availability">${student ? 'Open enrollment' : `${course.lesson_count} learning sections`}</p>`;
  return `<article class="dashboard-course-card"><div class="course-card-image"><img src="${escapeHtml(course.cover_image || 'assets/images/course-hazmat.svg')}" alt="" loading="lazy"><span>${course.lesson_count} sections</span></div><div class="course-card-body"><p class="eyebrow">${escapeHtml(course.slug.replaceAll('-', ' '))}</p><h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description || 'Academy course')}</p>${progressMarkup}<div class="course-card-actions">${action}${student && enrollment && enrollment.status === 'active' ? `<button class="text-button" type="button" data-withdraw-enrollment="${enrollment.id}">Withdraw</button>` : ''}</div></div></article>`;
}

async function loadCatalog(state) {
  const { data: courses, error: courseError } = await state.supabase.from('courses').select('id,slug,title,description,cover_image,lesson_count,is_published').eq('is_published', true).order('title');
  if (courseError) throw courseError;
  let enrollments = [];
  if (state.profile.role === 'student') {
    const { data, error } = await state.supabase.from('enrollments').select('id,course_id,status,progress_percent,enrolled_at,completed_at').eq('student_id', state.session.user.id);
    if (error) throw error;
    enrollments = data || [];
  }
  const enrollmentMap = new Map(enrollments.map((item) => [item.course_id, item]));
  const grid = document.querySelector('[data-course-grid]');
  grid.innerHTML = courses?.length ? courses.map((course) => card(course, enrollmentMap.get(course.id), state.profile.role)).join('') : '<p class="empty-state">No published courses are available yet.</p>';
}

async function enroll(button, state, showAlert) {
  button.disabled = true;
  const courseId = button.dataset.enrollCourse;
  let error;
  if (button.dataset.reactivate) {
    ({ error } = await state.supabase.from('enrollments').update({ status: 'active' }).eq('id', button.dataset.reactivate).eq('student_id', state.session.user.id));
  } else {
    ({ error } = await state.supabase.from('enrollments').insert({ course_id: courseId, student_id: state.session.user.id }));
  }
  if (error) { showAlert(error.message); button.disabled = false; return; }
  showAlert('You are enrolled. Your course is ready to begin.', 'success');
  await loadCatalog(state);
}

async function withdraw(button, state, showAlert) {
  if (!window.confirm('Withdraw from this course? Your completed lesson history will be preserved.')) return;
  button.disabled = true;
  const { error } = await state.supabase.from('enrollments').update({ status: 'withdrawn' }).eq('id', button.dataset.withdrawEnrollment).eq('student_id', state.session.user.id);
  if (error) { showAlert(error.message); button.disabled = false; return; }
  showAlert('You have withdrawn from the course.', 'success');
  await loadCatalog(state);
}

window.addEventListener('fra:dashboard-ready', async ({ detail: state }) => {
  const showAlert = window.FRA_DASHBOARD.showAlert;
  const grid = document.querySelector('[data-course-grid]');
  grid.addEventListener('click', (event) => {
    const enrollButton = event.target.closest('[data-enroll-course]');
    const withdrawButton = event.target.closest('[data-withdraw-enrollment]');
    if (enrollButton) enroll(enrollButton, state, showAlert);
    if (withdrawButton) withdraw(withdrawButton, state, showAlert);
  });
  try { await loadCatalog(state); } catch (error) { showAlert(error.message); }
});
