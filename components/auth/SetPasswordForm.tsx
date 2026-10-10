'use client';

import { FormEvent, useState } from 'react';
import { Brand } from '@/components/site/Brand';
import { getSupabase } from '@/lib/supabase/client';

export function SetPasswordForm() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setSubmitting(true);
    try {
      const supabase = await getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('This invitation link is invalid or has expired. Ask an administrator for a new invitation.');
      const values = Object.fromEntries(new FormData(form));
      const fullName = String(values.full_name).trim();
      const organization = String(values.organization).trim();
      const { error } = await supabase.auth.updateUser({ password: String(values.password), data: { full_name: fullName, organization } });
      if (error) throw error;
      const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName, organization }).eq('user_id', session.user.id);
      if (profileError) throw profileError;
      window.location.replace('/dashboard');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Your account could not be updated.'); setSubmitting(false); }
  };
  return <main className="status-page"><Brand /><form className="auth-status-card form-grid" onSubmit={submit}><div className="status-icon">✓</div><p className="eyebrow">Invitation accepted</p><h1>Secure your account</h1><p>Complete your member profile and choose a password.</p><div className="form-row"><div className="form-group form-group-left"><label htmlFor="invited-name">Full name</label><input className="form-control" id="invited-name" name="full_name" autoComplete="name" required /></div><div className="form-group form-group-left"><label htmlFor="invited-organization">Organization / station</label><input className="form-control" id="invited-organization" name="organization" autoComplete="organization" required /></div></div><div className="form-group form-group-left"><label htmlFor="new-password">New password</label><input className="form-control" id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required /><small className="field-help">Use at least 8 characters.</small></div>{message && <div className="auth-message is-error">{message}</div>}<button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Set password and enter academy'}</button></form></main>;
}
