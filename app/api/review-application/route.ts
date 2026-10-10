import { NextResponse } from 'next/server';
import { canReviewApplication, STAFF_ROLES } from '@/lib/authz';
import { authorize, sendApprovalEmail } from '@/lib/supabase/server';
import type { AcademyProfile } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const auth = await authorize(request, STAFF_ROLES);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { userId, decision, role = 'student', reason } = await request.json();
    if (!userId || !['approve', 'reject'].includes(decision)) return NextResponse.json({ error: 'A valid applicant and decision are required.' }, { status: 400 });
    if (decision === 'reject' && !String(reason || '').trim()) return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 });
    const { data, error: targetError } = await auth.admin.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    const target = data as AcademyProfile | null;
    if (targetError || !target) return NextResponse.json({ error: 'Applicant not found.' }, { status: 404 });
    if (target.status !== 'pending') return NextResponse.json({ error: 'This application has already been reviewed.' }, { status: 409 });
    if (!canReviewApplication(auth.actor.role, target.requested_role, role)) return NextResponse.json({ error: 'You cannot approve this requested role.' }, { status: 403 });
    const approved = decision === 'approve';
    const changes = approved ? { status: 'approved', role, approved_by: auth.actor.user_id, approved_at: new Date().toISOString(), rejection_reason: null } : { status: 'rejected', rejection_reason: String(reason).trim().slice(0, 1000), approved_by: auth.actor.user_id, approved_at: null };
    const { data: updated, error: updateError } = await auth.admin.from('profiles').update(changes).eq('user_id', userId).eq('status', 'pending').select().single();
    if (updateError) throw updateError;
    await Promise.all([
      auth.admin.from('notifications').insert({ user_id: userId, title: approved ? 'Application approved' : 'Application update', message: approved ? `Your ${role.replace('_', ' ')} account is ready.` : 'Your application was not approved. Review the reason on your status page.', action_url: approved ? '/dashboard' : '/application-status' }),
      auth.admin.from('audit_logs').insert({ actor_user_id: auth.actor.user_id, action: approved ? 'application_approved' : 'application_rejected', target_user_id: userId, metadata: { assigned_role: approved ? role : null } })
    ]);
    let emailSent = false;
    try { emailSent = await sendApprovalEmail(updated as AcademyProfile, approved, reason); } catch { /* In-app notification remains authoritative. */ }
    return NextResponse.json({ ok: true, emailSent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The application could not be reviewed.' }, { status: 500 });
  }
}
