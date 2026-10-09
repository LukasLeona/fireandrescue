import { getSessionProfile, getSupabase, signOut } from './supabase-client.js';

const page = document.body.dataset.authPage;

function friendlyError(error) {
  const message = error?.message || 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(message)) return 'The email or password is incorrect.';
  if (/email not confirmed/i.test(message)) return 'Please verify your email before logging in.';
  if (/user already registered/i.test(message)) return 'An account already exists for this email. Try logging in instead.';
  if (/configuration is unavailable|failed to fetch/i.test(message)) return 'Account services are not connected yet. Please contact the academy administrator.';
  return message;
}

function showMessage(form, text, type = 'error') {
  const target = form.querySelector('[data-auth-message]');
  target.textContent = text;
  target.className = `auth-message is-${type}`;
  target.hidden = false;
}

function setSubmitting(form, active) {
  const button = form.querySelector('[data-submit-button]');
  button.disabled = active;
  button.dataset.originalText ||= button.innerHTML;
  button.innerHTML = active ? '<span class="button-spinner" aria-hidden="true"></span> Please wait' : button.dataset.originalText;
}

async function register(form) {
  if (!form.reportValidity()) return;
  setSubmitting(form, true);
  const values = Object.fromEntries(new FormData(form));
  try {
    const supabase = await getSupabase();
    const redirectTo = new URL('auth-callback.html', window.location.href).href;
    const { error } = await supabase.auth.signUp({
      email: values.email.trim(), password: values.password,
      options: { emailRedirectTo: redirectTo, data: {
        full_name: values.full_name.trim(), phone: values.phone?.trim() || null,
        organization: values.organization.trim(), requested_role: values.requested_role,
        application_note: values.application_note?.trim() || null
      } }
    });
    if (error) throw error;
    window.location.assign('application-status.html?submitted=1');
  } catch (error) { showMessage(form, friendlyError(error)); setSubmitting(form, false); }
}

async function login(form) {
  if (!form.reportValidity()) return;
  setSubmitting(form, true);
  const values = Object.fromEntries(new FormData(form));
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email: values.email.trim(), password: values.password });
    if (error) throw error;
    const { profile } = await getSessionProfile();
    window.location.assign(profile?.status === 'approved' ? 'dashboard.html' : 'application-status.html');
  } catch (error) { showMessage(form, friendlyError(error)); setSubmitting(form, false); }
}

function statusContent(status, reason) {
  const states = {
    pending: ['⌛', 'Application under review', 'Your application has been submitted. An administrator or instructor will review it, and you will receive an email when a decision is made.'],
    rejected: ['!', 'Application needs attention', reason || 'Your application was not approved. Contact the academy if you believe this is an error.'],
    suspended: ['!', 'Account suspended', 'Your academy access is temporarily suspended. Contact a super administrator for assistance.'],
    archived: ['—', 'Account archived', 'This academy account is no longer active. Contact a super administrator for assistance.']
  };
  return states[status] || states.pending;
}

async function showStatus() {
  const title = document.querySelector('[data-status-title]');
  const copy = document.querySelector('[data-status-copy]');
  const icon = document.querySelector('[data-status-icon]');
  const loginLink = document.querySelector('[data-login-link]');
  const signOutButton = document.querySelector('[data-sign-out]');
  try {
    const { session, profile } = await getSessionProfile();
    if (!session) {
      const submitted = new URLSearchParams(location.search).has('submitted');
      icon.textContent = submitted ? '✓' : 'i';
      title.textContent = submitted ? 'Application submitted' : 'Log in to check your status';
      copy.textContent = submitted ? 'Check your inbox and verify your email. Your application remains pending until an administrator or instructor approves it.' : 'Your application status is available after you log in.';
      loginLink.hidden = false; return;
    }
    if (!profile) throw new Error('Your member profile could not be found.');
    if (profile.status === 'approved') { window.location.replace('dashboard.html'); return; }
    const [symbol, heading, description] = statusContent(profile.status, profile.rejection_reason);
    icon.textContent = symbol; title.textContent = heading; copy.textContent = description;
    document.querySelector('[data-status-details]').hidden = false;
    document.querySelector('[data-applicant-name]').textContent = profile.full_name;
    document.querySelector('[data-requested-role]').textContent = profile.requested_role.replace('_', ' ');
    const pill = document.querySelector('[data-status-pill]'); pill.textContent = profile.status; pill.dataset.status = profile.status;
    signOutButton.hidden = false; signOutButton.addEventListener('click', signOut);
  } catch (error) { icon.textContent = '!'; title.textContent = 'Status unavailable'; copy.textContent = friendlyError(error); loginLink.hidden = false; }
}

async function finishCallback() {
  const message = document.querySelector('[data-callback-message]');
  const fallback = document.querySelector('[data-callback-fallback]');
  try {
    const supabase = await getSupabase();
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) { const { error } = await supabase.auth.exchangeCodeForSession(code); if (error) throw error; }
    const { profile } = await getSessionProfile();
    window.location.replace(profile?.status === 'approved' ? 'dashboard.html' : 'application-status.html');
  } catch (error) { message.textContent = friendlyError(error); fallback.hidden = false; }
}

async function setInvitationPassword(form) {
  if (!form.reportValidity()) return;
  setSubmitting(form, true);
  try {
    const supabase = await getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('This invitation link is invalid or has expired. Ask an administrator for a new invitation.');
    const password = new FormData(form).get('password');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    window.location.replace('dashboard.html');
  } catch (error) { showMessage(form, friendlyError(error)); setSubmitting(form, false); }
}

if (page === 'register' || page === 'login') {
  const form = document.querySelector('[data-auth-form]');
  form.addEventListener('submit', (event) => { event.preventDefault(); page === 'register' ? register(form) : login(form); });
} else if (page === 'status') showStatus();
else if (page === 'callback') finishCallback();
else if (page === 'set-password') {
  const form = document.querySelector('[data-auth-form]');
  form.addEventListener('submit', (event) => { event.preventDefault(); setInvitationPassword(form); });
}
