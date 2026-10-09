const staffRoles = ['super_admin', 'admin', 'instructor'];

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const label = (value = '') => String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function badge(value) {
  return `<span class="table-badge" data-tone="${escapeHtml(value)}">${escapeHtml(label(value))}</span>`;
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—';
}

async function apiRequest(path, body, state) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.session.access_token}` },
    body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

function table(headers, rows) {
  if (!rows.length) return '<p class="empty-state">No records match this view.</p>';
  return `<table class="data-table"><thead><tr>${headers.map((item) => `<th>${item}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

async function loadApplications(context) {
  const { state } = context;
  const status = document.querySelector('[data-application-filter]').value;
  let query = state.supabase.from('profiles').select('user_id,email,full_name,organization,application_note,requested_role,role,status,created_at,rejection_reason').eq('status', status).order('created_at', { ascending: false });
  if (state.profile.role !== 'super_admin') query = query.eq('requested_role', 'student');
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data || []).map((profile) => {
    const roleControl = state.profile.role === 'super_admin'
      ? `<select class="table-select" data-application-role><option value="student" ${profile.requested_role === 'student' ? 'selected' : ''}>Student</option><option value="instructor" ${profile.requested_role === 'instructor' ? 'selected' : ''}>Instructor</option><option value="admin" ${profile.requested_role === 'admin' ? 'selected' : ''}>Admin</option></select>`
      : badge('student');
    const actions = status === 'pending' ? `<div class="table-actions"><button class="action-button is-approve" data-review="approve">Approve</button><button class="action-button is-reject" data-review="reject">Reject</button></div>` : '—';
    return `<tr data-user-id="${profile.user_id}"><td><strong>${escapeHtml(profile.full_name || 'Unnamed applicant')}</strong><small>${escapeHtml(profile.email)}</small></td><td>${escapeHtml(profile.organization || '—')}<small>${escapeHtml(profile.application_note || 'No application note')}</small></td><td>${roleControl}</td><td>${badge(profile.status)}</td><td>${formatDate(profile.created_at)}</td><td>${actions}</td></tr>`;
  });
  document.querySelector('[data-applications-table]').innerHTML = table(['Applicant', 'Organization / note', 'Requested role', 'Status', 'Applied', 'Actions'], rows);
}

async function reviewApplication(button, context) {
  const row = button.closest('[data-user-id]');
  const decision = button.dataset.review;
  const role = row.querySelector('[data-application-role]')?.value || 'student';
  let reason = null;
  if (decision === 'reject') {
    reason = window.prompt('Provide a short reason for the applicant:');
    if (reason === null) return;
    if (!reason.trim()) { context.showAlert('A rejection reason is required.'); return; }
  }
  button.disabled = true;
  try {
    await apiRequest('/api/review-application', { userId: row.dataset.userId, decision, role, reason }, context.state);
    context.showAlert(`Application ${decision === 'approve' ? 'approved' : 'rejected'}.`, 'success');
    await Promise.all([loadApplications(context), loadMembers(context)]);
  } catch (error) { context.showAlert(error.message); button.disabled = false; }
}

async function loadMembers(context) {
  if (!['super_admin', 'admin'].includes(context.state.profile.role)) return;
  const role = document.querySelector('[data-member-role-filter]').value;
  const search = document.querySelector('[data-member-search]').value.trim();
  let query = context.state.supabase.from('profiles').select('user_id,email,full_name,organization,role,status,approved_at,last_seen_at').order('full_name');
  if (role !== 'all') query = query.eq('role', role);
  if (search) query = query.or(`full_name.ilike.%${search.replaceAll(',', '')}%,email.ilike.%${search.replaceAll(',', '')}%`);
  const { data, error } = await query.limit(100);
  if (error) throw error;
  const rows = (data || []).map((profile) => {
    const protectedOwner = profile.role === 'super_admin';
    const roleCell = context.state.profile.role === 'super_admin' && !protectedOwner
      ? `<select class="table-select" data-role-change><option value="student" ${profile.role === 'student' ? 'selected' : ''}>Student</option><option value="instructor" ${profile.role === 'instructor' ? 'selected' : ''}>Instructor</option><option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>Admin</option></select>`
      : badge(profile.role);
    const statusAction = context.state.profile.role === 'super_admin' && !protectedOwner
      ? `<button class="action-button" data-account-toggle="${profile.status === 'suspended' ? 'approved' : 'suspended'}">${profile.status === 'suspended' ? 'Restore' : 'Suspend'}</button>` : '—';
    return `<tr data-user-id="${profile.user_id}"><td><strong>${escapeHtml(profile.full_name)}</strong><small>${escapeHtml(profile.email)}</small></td><td>${escapeHtml(profile.organization || '—')}</td><td>${roleCell}</td><td>${badge(profile.status)}</td><td>${formatDate(profile.last_seen_at || profile.approved_at)}</td><td>${statusAction}</td></tr>`;
  });
  document.querySelector('[data-members-table]').innerHTML = table(['Member', 'Organization', 'Role', 'Status', 'Last activity', 'Access'], rows);
}

async function updateMember(target, context) {
  const row = target.closest('[data-user-id]');
  const body = { userId: row.dataset.userId };
  if (target.matches('[data-role-change]')) body.role = target.value;
  else body.status = target.dataset.accountToggle;
  target.disabled = true;
  try {
    await apiRequest('/api/update-user', body, context.state);
    context.showAlert('Member access updated.', 'success');
    await loadMembers(context);
  } catch (error) { context.showAlert(error.message); target.disabled = false; }
}

async function loadInvitations(context) {
  const { data, error } = await context.state.supabase.from('invitations').select('id,email,role,status,expires_at,created_at').order('created_at', { ascending: false }).limit(10);
  if (error) throw error;
  document.querySelector('[data-invitation-list]').innerHTML = data?.length ? data.map((invite) => `<article class="feed-item"><span class="feed-mark">✉</span><div><strong>${escapeHtml(invite.email)}</strong><p>${badge(invite.role)} ${badge(invite.status)}</p><small>Sent ${formatDate(invite.created_at)} · Expires ${formatDate(invite.expires_at)}</small></div></article>`).join('') : '<p class="empty-state">No invitations have been sent.</p>';
}

async function sendInvitation(event, context) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  const message = form.querySelector('[data-form-message]');
  button.disabled = true;
  try {
    await apiRequest('/api/invite-user', Object.fromEntries(new FormData(form)), context.state);
    form.reset(); message.textContent = 'Invitation sent successfully.'; message.className = 'auth-message is-success'; message.hidden = false;
    await loadInvitations(context);
  } catch (error) { message.textContent = error.message; message.className = 'auth-message is-error'; message.hidden = false; }
  finally { button.disabled = false; }
}

async function loadAudit(context) {
  if (context.state.profile.role !== 'super_admin') return;
  const { data, error } = await context.state.supabase.from('audit_logs').select('id,action,target_user_id,metadata,created_at,actor:profiles!audit_logs_actor_user_id_fkey(full_name,email)').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  const rows = (data || []).map((entry) => `<tr><td>${escapeHtml(label(entry.action))}</td><td><strong>${escapeHtml(entry.actor?.full_name || 'System')}</strong><small>${escapeHtml(entry.actor?.email || '')}</small></td><td><code>${escapeHtml(entry.target_user_id || '—')}</code></td><td>${formatDate(entry.created_at)}</td></tr>`);
  document.querySelector('[data-audit-table]').innerHTML = table(['Action', 'Actor', 'Target ID', 'Date'], rows);
}

function makeContext(state) {
  return { state, showAlert: window.FRA_DASHBOARD.showAlert };
}

window.addEventListener('fra:dashboard-ready', async ({ detail: state }) => {
  if (!staffRoles.includes(state.profile.role)) return;
  const context = makeContext(state);
  document.querySelector('[data-application-filter]').addEventListener('change', () => loadApplications(context).catch((error) => context.showAlert(error.message)));
  document.querySelector('[data-refresh-applications]').addEventListener('click', () => loadApplications(context).catch((error) => context.showAlert(error.message)));
  document.querySelector('[data-applications-table]').addEventListener('click', (event) => { const button = event.target.closest('[data-review]'); if (button) reviewApplication(button, context); });
  document.querySelector('[data-members-table]')?.addEventListener('change', (event) => { if (event.target.matches('[data-role-change]')) updateMember(event.target, context); });
  document.querySelector('[data-members-table]')?.addEventListener('click', (event) => { const target = event.target.closest('[data-account-toggle]'); if (target) updateMember(target, context); });
  document.querySelector('[data-member-role-filter]')?.addEventListener('change', () => loadMembers(context).catch((error) => context.showAlert(error.message)));
  document.querySelector('[data-member-search]')?.addEventListener('input', () => loadMembers(context).catch((error) => context.showAlert(error.message)));
  document.querySelector('[data-invite-form]').addEventListener('submit', (event) => sendInvitation(event, context));
  try { await Promise.all([loadApplications(context), loadMembers(context), loadInvitations(context), loadAudit(context)]); } catch (error) { context.showAlert(error.message); }
});
