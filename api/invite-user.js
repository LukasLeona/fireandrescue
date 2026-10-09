import { authorize, json, requestBody, siteUrl } from './_server.js';
import { canInvite, STAFF_ROLES } from './_authz.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(request, response) {
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); return json(response, 405, { error: 'Method not allowed.' }); }
  try {
    const auth = await authorize(request, STAFF_ROLES);
    if (auth.error) return json(response, auth.status, { error: auth.error });
    const body = requestBody(request);
    const email = String(body.email || '').trim().toLowerCase();
    const role = String(body.role || 'student');
    if (!emailPattern.test(email) || email.length > 254) return json(response, 400, { error: 'Enter a valid email address.' });
    if (!canInvite(auth.actor.role, role)) return json(response, 403, { error: 'You cannot invite a member with that role.' });
    const { data: existingProfile } = await auth.admin.from('profiles').select('user_id').eq('email', email).maybeSingle();
    if (existingProfile) return json(response, 409, { error: 'An academy account already exists for this email.' });
    const { data: existingInvite } = await auth.admin.from('invitations').select('id').ilike('email', email).eq('status', 'sent').gt('expires_at', new Date().toISOString()).maybeSingle();
    if (existingInvite) return json(response, 409, { error: 'An active invitation already exists for this email.' });
    const { data: invitation, error: insertError } = await auth.admin.from('invitations').insert({ email, role, created_by: auth.actor.user_id }).select().single();
    if (insertError) throw insertError;
    const { data: inviteResult, error: inviteError } = await auth.admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${siteUrl(request)}/set-password.html`, data: { requested_role: role, invited: true } });
    if (inviteError) { await auth.admin.from('invitations').update({ status: 'revoked' }).eq('id', invitation.id); throw inviteError; }
    await auth.admin.from('audit_logs').insert({ actor_user_id: auth.actor.user_id, action: 'user_invited', target_user_id: inviteResult.user?.id || null, metadata: { invitation_id: invitation.id, role } });
    return json(response, 200, { ok: true, invitationId: invitation.id });
  } catch (error) { return json(response, 500, { error: error.message || 'The invitation could not be sent.' }); }
}
