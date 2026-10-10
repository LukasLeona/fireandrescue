import { NextResponse } from 'next/server';
import { canManageUser } from '@/lib/authz';
import { authorize } from '@/lib/supabase/server';
import type { AcademyProfile } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const auth = await authorize(request, ['super_admin']);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { userId, role, status } = await request.json();
    if (!userId || userId === auth.actor.user_id) return NextResponse.json({ error: 'Select another academy member.' }, { status: 400 });
    const { data, error: targetError } = await auth.admin.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    const target = data as AcademyProfile | null;
    if (targetError || !target) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    const changes: { role?: string; status?: string } = {};
    if (role) changes.role = role;
    if (status) changes.status = status;
    if (!canManageUser(auth.actor.role, target.role, changes)) return NextResponse.json({ error: 'This member or access change is protected.' }, { status: 403 });
    const { error: updateError } = await auth.admin.from('profiles').update(changes).eq('user_id', userId);
    if (updateError) throw updateError;
    await Promise.all([
      auth.admin.from('audit_logs').insert({ actor_user_id: auth.actor.user_id, action: role ? 'user_role_changed' : 'user_status_changed', target_user_id: userId, metadata: { from_role: target.role, ...changes } }),
      auth.admin.from('notifications').insert({ user_id: userId, title: 'Account access updated', message: role ? `Your academy role is now ${role.replace('_', ' ')}.` : `Your account status is now ${status}.`, action_url: '/dashboard' })
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The member could not be updated.' }, { status: 500 });
  }
}
