import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { AcademyProfile } from './client';

export function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error('Server authentication is not configured.');
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

type Authorized = { admin: SupabaseClient; actor: AcademyProfile; user: { id: string; email?: string } };
type Denied = { error: string; status: number };

export async function authorize(request: Request, allowedRoles: readonly string[]): Promise<Authorized | Denied> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return { error: 'Authentication is required.', status: 401 };
  const admin = getAdminClient();
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return { error: 'Your session is invalid or expired.', status: 401 };
  const { data, error: profileError } = await admin.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  const actor = data as AcademyProfile | null;
  if (profileError || !actor || actor.status !== 'approved') return { error: 'This account is not approved.', status: 403 };
  if (!allowedRoles.includes(actor.role)) return { error: 'You do not have permission to perform this action.', status: 403 };
  return { admin, actor, user: { id: user.id, email: user.email } };
}

export function siteUrl(request: Request) {
  return (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
}

export async function sendApprovalEmail(profile: AcademyProfile, approved: boolean, reason?: string) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const site = (process.env.SITE_URL || '').replace(/\/$/, '');
  const subject = approved ? 'Your Fire and Rescue Academy account is approved' : 'Update on your academy application';
  const detail = approved
    ? `<p>Your ${escapeHtml(profile.role.replace('_', ' '))} account has been approved. You can now <a href="${site}/login">log in to the academy</a>.</p>`
    : `<p>Your application was not approved at this time.</p><p><strong>Reason:</strong> ${escapeHtml(reason || '')}</p>`;
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM, to: profile.email, subject, html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h1>Fire &amp; Rescue Academy</h1><p>Hello ${escapeHtml(profile.full_name)},</p>${detail}<p>Stay ready,<br>Fire and Rescue Academy</p></div>` });
  if (error) throw error;
  return true;
}

function escapeHtml(value: string) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
}
