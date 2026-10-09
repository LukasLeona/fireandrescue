import { authorize, json, requestBody } from './_server.js';
import { canManageUser } from './_authz.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); return json(response, 405, { error: 'Method not allowed.' }); }
  try {
    const auth = await authorize(request, ['super_admin']);
    if (auth.error) return json(response, auth.status, { error: auth.error });
    const { userId, role, status } = requestBody(request);
    if (!userId || userId === auth.actor.user_id) return json(response, 400, { error: 'Select another academy member.' });
    const { data: target, error: targetError } = await auth.admin.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (targetError || !target) return json(response, 404, { error: 'Member not found.' });
    const changes = {}; if (role) changes.role = role; if (status) changes.status = status;
    if (!canManageUser(auth.actor.role, target.role, changes)) return json(response, 403, { error: 'This member or access change is protected.' });
    const { error: updateError } = await auth.admin.from('profiles').update(changes).eq('user_id', userId);
    if (updateError) throw updateError;
    await auth.admin.from('audit_logs').insert({ actor_user_id: auth.actor.user_id, action: role ? 'user_role_changed' : 'user_status_changed', target_user_id: userId, metadata: { from_role: target.role, ...changes } });
    await auth.admin.from('notifications').insert({ user_id: userId, title: 'Account access updated', message: role ? `Your academy role is now ${role.replace('_', ' ')}.` : `Your account status is now ${status}.`, action_url: 'dashboard.html' });
    return json(response, 200, { ok: true });
  } catch (error) { return json(response, 500, { error: error.message || 'The member could not be updated.' }); }
}
