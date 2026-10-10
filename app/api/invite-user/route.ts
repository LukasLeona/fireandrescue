import { NextResponse } from 'next/server';
import { canInvite, STAFF_ROLES } from '@/lib/authz';
import { authorize, siteUrl } from '@/lib/supabase/server';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const auth = await authorize(request, STAFF_ROLES);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const role = String(body.role || 'student');
    if (!emailPattern.test(email) || email.length > 254) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (!canInvite(auth.actor.role, role)) return NextResponse.json({ error: 'You cannot invite a member with that role.' }, { status: 403 });
    const { data: existingProfile } = await auth.admin.from('profiles').select('user_id').eq('email', email).maybeSingle();
    if (existingProfile) return NextResponse.json({ error: 'An academy account already exists for this email.' }, { status: 409 });
    const { data: existingInvite } = await auth.admin.from('invitations').select('id').ilike('email', email).eq('status', 'sent').gt('expires_at', new Date().toISOString()).maybeSingle();
    if (existingInvite) return NextResponse.json({ error: 'An active invitation already exists for this email.' }, { status: 409 });
    const { data: invitation, error: insertError } = await auth.admin.from('invitations').insert({ email, role, created_by: auth.actor.user_id }).select().single();
    if (insertError) throw insertError;
    const { data: inviteResult, error: inviteError } = await auth.admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${siteUrl(request)}/set-password`, data: { requested_role: role, invited: true } });
    if (inviteError) {
      await auth.admin.from('invitations').update({ status: 'revoked' }).eq('id', invitation.id);
      throw inviteError;
    }
    await auth.admin.from('audit_logs').insert({ actor_user_id: auth.actor.user_id, action: 'user_invited', target_user_id: inviteResult.user?.id || null, metadata: { invitation_id: invitation.id, role } });
    return NextResponse.json({ ok: true, invitationId: invitation.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The invitation could not be sent.' }, { status: 500 });
  }
}
