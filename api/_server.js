import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error('Server authentication is not configured.');
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export function json(response, status, body) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(status).json(body);
}

export function requestBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') { try { return JSON.parse(request.body); } catch { return {}; } }
  return {};
}

export async function authorize(request, allowedRoles) {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return { error: 'Authentication is required.', status: 401 };
  const admin = getAdminClient();
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return { error: 'Your session is invalid or expired.', status: 401 };
  const { data: actor, error: profileError } = await admin.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (profileError || !actor || actor.status !== 'approved') return { error: 'This account is not approved.', status: 403 };
  if (!allowedRoles.includes(actor.role)) return { error: 'You do not have permission to perform this action.', status: 403 };
  return { admin, actor, user };
}

export function siteUrl(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${request.headers.host}`;
}

export async function sendApprovalEmail(profile, approved, reason) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const site = (process.env.SITE_URL || '').replace(/\/$/, '');
  const subject = approved ? 'Your Fire and Rescue Academy account is approved' : 'Update on your academy application';
  const detail = approved
    ? `<p>Your ${profile.role.replace('_', ' ')} account has been approved. You can now <a href="${site}/login.html">log in to the academy</a>.</p>`
    : `<p>Your application was not approved at this time.</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p>`;
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM, to: profile.email, subject, html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h1>Fire &amp; Rescue Academy</h1><p>Hello ${escapeHtml(profile.full_name)},</p>${detail}<p>Stay ready,<br>Fire and Rescue Academy</p></div>` });
  if (error) throw error;
  return true;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}
