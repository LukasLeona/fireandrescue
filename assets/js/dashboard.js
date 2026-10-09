import { getSessionProfile, signOut } from './supabase-client.js';
import './admin-dashboard.js';
import './instructor-dashboard.js';

const state = { supabase: null, session: null, profile: null };
const roleLabels = { super_admin: 'Super admin', admin: 'Administrator', instructor: 'Instructor', student: 'Student' };

function allowedFor(element, role) {
  return !element.dataset.roles || element.dataset.roles.split(',').includes(role);
}

function showAlert(message, type = 'error') {
  const alert = document.querySelector('[data-dashboard-alert]');
  alert.textContent = message;
  alert.className = `dashboard-alert is-${type}`;
  alert.hidden = false;
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'FR';
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function empty(message) {
  return `<p class="empty-state">${message}</p>`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function renderMetric(label, value, note, tone = '') {
  return `<article class="metric-card ${tone}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}

async function loadOverview() {
  const { supabase, profile, session } = state;
  const metrics = document.querySelector('[data-overview-metrics]');
  const staff = ['super_admin', 'admin', 'instructor'].includes(profile.role);
  const queries = staff
    ? [supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'), supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'), supabase.from('enrollments').select('*', { count: 'exact', head: true }), supabase.from('quiz_attempts').select('*', { count: 'exact', head: true })]
    : [supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('student_id', session.user.id), supabase.from('enrollments').select('progress_percent').eq('student_id', session.user.id), supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('completed', true), supabase.from('quiz_attempts').select('percent').eq('user_id', session.user.id)];
  const results = await Promise.all(queries);
  if (results.some((result) => result.error)) throw results.find((result) => result.error).error;
  if (staff) {
    metrics.innerHTML = renderMetric('Pending applications', results[0].count || 0, 'Awaiting review', 'is-alert') + renderMetric('Approved members', results[1].count || 0, 'Active academy accounts') + renderMetric('Enrollments', results[2].count || 0, 'Across all courses') + renderMetric('Quiz attempts', results[3].count || 0, 'Recorded assessments');
    document.querySelector('[data-pending-count]').textContent = results[0].count || 0;
    document.querySelector('[data-pending-count]').hidden = !(results[0].count > 0);
    document.querySelector('[data-welcome-copy]').textContent = 'Review new applications, monitor course activity, and keep your academy moving.';
  } else {
    const progress = results[1].data || []; const attempts = results[3].data || [];
    const averageProgress = progress.length ? Math.round(progress.reduce((sum, item) => sum + Number(item.progress_percent), 0) / progress.length) : 0;
    const bestScore = attempts.length ? Math.max(...attempts.map((item) => Number(item.percent))) : 0;
    metrics.innerHTML = renderMetric('Enrolled courses', results[0].count || 0, 'Active learning plans') + renderMetric('Overall progress', `${averageProgress}%`, 'Across your courses') + renderMetric('Lessons complete', results[2].count || 0, 'Readiness checkpoints') + renderMetric('Best quiz score', `${Math.round(bestScore)}%`, 'Personal best');
    document.querySelector('[data-welcome-copy]').textContent = 'Continue your courses, build your readiness score, and keep your learning streak alive.';
  }
}

async function loadFeed() {
  const { supabase, session } = state;
  const [{ data: announcements, error: announcementError }, { data: notifications, error: notificationError }] = await Promise.all([
    supabase.from('announcements').select('id,title,body,published_at').order('published_at', { ascending: false }).limit(4),
    supabase.from('notifications').select('id,title,message,action_url,read_at,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(6)
  ]);
  if (announcementError) throw announcementError;
  if (notificationError) throw notificationError;
  document.querySelector('[data-announcement-list]').innerHTML = announcements?.length ? announcements.map((item) => `<article class="feed-item"><span class="feed-mark">A</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><small>${formatDate(item.published_at)}</small></div></article>`).join('') : empty('No academy announcements yet.');
  document.querySelector('[data-notification-list]').innerHTML = notifications?.length ? notifications.map((item) => `<article class="feed-item ${item.read_at ? '' : 'is-unread'}"><span class="feed-mark">${item.read_at ? '○' : '●'}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.message)}</p><small>${formatDate(item.created_at)}</small></div></article>`).join('') : empty('You are all caught up.');
  document.querySelector('[data-notification-count]').textContent = notifications?.filter((item) => !item.read_at).length || 0;
}

function configureNavigation() {
  document.querySelectorAll('[data-roles]').forEach((element) => { if (!allowedFor(element, state.profile.role)) element.hidden = true; });
  document.querySelectorAll('[data-panel-target]').forEach((button) => button.addEventListener('click', () => {
    const panelName = button.dataset.panelTarget;
    document.querySelectorAll('[data-panel-target]').forEach((item) => item.classList.toggle('is-active', item === button));
    document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === panelName));
    document.querySelector('[data-page-title]').textContent = button.textContent.replace(/\d+$/, '').trim();
    document.body.classList.remove('nav-open');
    window.dispatchEvent(new CustomEvent('fra:panel-open', { detail: { panel: panelName, state } }));
  }));
  document.querySelector('[data-menu-toggle]').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.querySelector('[data-sign-out]').addEventListener('click', signOut);
}

async function init() {
  try {
    Object.assign(state, await getSessionProfile());
    if (!state.session) { window.location.replace('login.html'); return; }
    if (!state.profile || state.profile.status !== 'approved') { window.location.replace('application-status.html'); return; }
    const label = roleLabels[state.profile.role] || 'Academy member';
    document.querySelector('[data-profile-name]').textContent = state.profile.full_name;
    document.querySelector('[data-profile-role]').textContent = label;
    document.querySelector('[data-role-chip]').textContent = label;
    document.querySelector('[data-avatar]').textContent = initials(state.profile.full_name);
    if (state.profile.role !== 'super_admin') document.querySelector('[data-invite-role] option[value="admin"]')?.remove();
    if (state.profile.role === 'instructor') document.querySelector('[data-invite-role] option[value="instructor"]')?.remove();
    configureNavigation();
    await Promise.all([loadOverview(), loadFeed()]);
    document.body.classList.remove('is-loading');
    window.FRA_DASHBOARD = { state, showAlert, empty, formatDate, escapeHtml };
    window.dispatchEvent(new CustomEvent('fra:dashboard-ready', { detail: state }));
  } catch (error) {
    document.body.classList.remove('is-loading');
    showAlert(error.message || 'The dashboard could not be loaded.');
  }
}

init();
