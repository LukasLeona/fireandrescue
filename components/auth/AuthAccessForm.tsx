'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { getSessionProfile, getSupabase } from '@/lib/supabase/client';

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(message)) return 'The email or password is incorrect.';
  if (/email not confirmed/i.test(message)) return 'Please verify your email before logging in.';
  if (/user already registered/i.test(message)) return 'An account already exists for this email. Try logging in instead.';
  if (/configuration is unavailable|failed to fetch/i.test(message)) return 'Account services are unavailable. Please contact the academy administrator.';
  return message;
}

export function AuthAccessForm({ mode }: { mode: 'login' | 'register' }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const register = mode === 'register';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setSubmitting(true);
    setMessage('');
    const values = Object.fromEntries(new FormData(form));
    try {
      const supabase = await getSupabase();
      if (register) {
        const redirectTo = new URL('/auth-callback', window.location.origin).href;
        const { error } = await supabase.auth.signUp({
          email: String(values.email).trim(),
          password: String(values.password),
          options: { emailRedirectTo: redirectTo, data: { full_name: String(values.full_name).trim(), phone: String(values.phone || '').trim() || null, organization: String(values.organization).trim(), requested_role: String(values.requested_role), application_note: String(values.application_note || '').trim() || null } }
        });
        if (error) throw error;
        window.location.assign('/application-status?submitted=1');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: String(values.email).trim(), password: String(values.password) });
        if (error) throw error;
        const { profile } = await getSessionProfile();
        window.location.assign(profile?.status === 'approved' ? '/dashboard' : '/application-status');
      }
    } catch (error) {
      setMessage(friendlyError(error));
      setSubmitting(false);
    }
  };

  return <form className="auth-form form-grid" onSubmit={submit} noValidate><div><h2>{register ? 'Create your application' : 'Log in'}</h2><p>{register ? 'Tell the academy who you are and how you will use the platform.' : 'Use your approved academy account.'}</p></div>{register && <><div className="form-row"><div className="form-group"><label htmlFor="full-name">Full name</label><input className="form-control" id="full-name" name="full_name" autoComplete="name" required /></div><div className="form-group"><label htmlFor="phone">Phone <span className="optional">Optional</span></label><input className="form-control" id="phone" name="phone" type="tel" autoComplete="tel" /></div></div><div className="form-group"><label htmlFor="organization">Organization / station</label><input className="form-control" id="organization" name="organization" autoComplete="organization" placeholder="e.g. City Fire Department" required /></div><div className="form-group"><label htmlFor="requested-role">Requested role</label><select className="form-control" id="requested-role" name="requested_role" required><option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Administrator</option></select><small className="field-help">Instructor and administrator requests receive additional review.</small></div></>}<div className="form-group"><label htmlFor="email">Email address</label><input className="form-control" id="email" name="email" type="email" autoComplete="email" required /></div><div className="form-group"><label htmlFor="password">Password</label><input className="form-control" id="password" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} required />{register && <small className="field-help">Use at least 8 characters.</small>}</div>{register && <><div className="form-group"><label htmlFor="application-note">Why are you joining? <span className="optional">Optional</span></label><textarea className="form-control" id="application-note" name="application_note" rows={3} maxLength={1000} placeholder="Share your training goals or role at your organization." /></div><label className="consent-row"><input name="terms" type="checkbox" required /><span>I confirm that the information above is accurate and understand that access requires approval.</span></label></>}{message && <div className="auth-message is-error" role="status">{message}</div>}<button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : register ? 'Submit application →' : 'Log in →'}</button><div className="auth-links"><Link href={register ? '/login' : '/register'}>{register ? 'Already have an account? Log in' : 'Apply for an account'}</Link><br /><Link href="/">Return to homepage</Link></div></form>;
}
