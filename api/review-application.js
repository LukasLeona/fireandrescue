import { authorize, json, requestBody, sendApprovalEmail } from './_server.js';
import { canReviewApplication, STAFF_ROLES } from './_authz.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); return json(response, 405, { error: 'Method not allowed.' }); }
  try {
    const auth = await authorize(request, STAFF_ROLES);
    if (auth.error) return json(response, auth.status, { error: auth.error });
    const { userId, decision, role = 'student', reason } = requestBody(request);
    if (!userId || !['approve', 'reject'].includes(decision)) return json(response, 400, { error: 'A valid applicant and decision are required.' });
    if (decision === 'reject' && !String(reason || '').trim()) return json(response, 400, { error: 'A rejection reason is required.' });
    const { data: target, error: targetError } = await auth.admin.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (targetError || !target) return json(response, 404, { error: 'Applicant not found.' });
    if (target.status !== 'pending') return json(response, 409, { error: 'This application has already been reviewed.' });
    if (!canReviewApplication(auth.actor.role, target.requested_role, role)) return json(response, 403, { error: 'You cannot approve this requested role.' });
    const approved = decision === 'approve';
    const changes = approved
      ? { status: 'approved', role, approved_by: auth.actor.user_id, approved_at: new Date().toISOString(), rejection_reason: null }
      : { status: 'rejected', rejection_reason: String(reason).trim().slice(0, 1000), approved_by: auth.actor.user_id, approved_at: null };
    const { data: updated, error: updateError } = await auth.admin.from('profiles').update(changes).eq('user_id', userId).eq('status', 'pending').select().single();
    if (updateError) throw updateError;
    await Promise.all([
      auth.admin.from('notifications').insert({ user_id: userId, title: approved ? 'Application approved' : 'Application update', message: approved ? `Your ${role.replace('_', ' ')} account is ready.` : 'Your application was not approved. Please review the reason on your status page.', action_url: approved ? 'dashboard.html' : 'application-status.html' }),
      auth.admin.from('audit_logs').insert({ actor_user_id: auth.actor.user_id, action: approved ? 'application_approved' : 'application_rejected', target_user_id: userId, metadata: { assigned_role: approved ? role : null } })
    ]);
    let emailSent = false;
    try { emailSent = await sendApprovalEmail(updated, approved, reason); } catch { /* The in-app decision remains authoritative if email delivery fails. */ }
    return json(response, 200, { ok: true, emailSent });
  } catch (error) { return json(response, 500, { error: error.message || 'The application could not be reviewed.' }); }
}
