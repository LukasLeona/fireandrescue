'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSessionProfile, signOut, type AcademyProfile } from '@/lib/supabase/client';
import { Brand } from '@/components/site/Brand';

type StatusState = { icon: string; title: string; copy: string; profile?: AcademyProfile | null; loggedIn?: boolean };

export function ApplicationStatus() {
  const [state, setState] = useState<StatusState>({ icon: '…', title: 'Checking your status', copy: 'We are loading your academy application.' });
  useEffect(() => {
    getSessionProfile().then(({ session, profile }) => {
      if (!session) {
        const submitted = new URLSearchParams(window.location.search).has('submitted');
        setState({ icon: submitted ? '✓' : 'i', title: submitted ? 'Application submitted' : 'Log in to check your status', copy: submitted ? 'Check your inbox and verify your email. Your application remains pending until an administrator or instructor approves it.' : 'Your application status is available after you log in.' });
        return;
      }
      if (!profile) throw new Error('Your member profile could not be found.');
      if (profile.status === 'approved') { window.location.replace('/dashboard'); return; }
      const states: Record<string, [string, string, string]> = {
        pending: ['⌛', 'Application under review', 'Your application has been submitted. An administrator or instructor will review it, and you will receive an email or in-app notice when a decision is made.'],
        rejected: ['!', 'Application needs attention', profile.rejection_reason || 'Your application was not approved. Contact the academy if you believe this is an error.'],
        suspended: ['!', 'Account suspended', 'Your academy access is temporarily suspended. Contact a super administrator for assistance.'],
        archived: ['—', 'Account archived', 'This academy account is no longer active. Contact a super administrator for assistance.']
      };
      const [icon, title, copy] = states[profile.status] || states.pending;
      setState({ icon, title, copy, profile, loggedIn: true });
    }).catch((error) => setState({ icon: '!', title: 'Status unavailable', copy: error.message || 'Your application could not be loaded.' }));
  }, []);
  return <main className="status-page" id="main"><Brand /><section className="auth-status-card" aria-live="polite"><div className="status-icon">{state.icon}</div><p className="eyebrow">Account application</p><h1>{state.title}</h1><p>{state.copy}</p>{state.profile && <dl className="status-details"><div><dt>Applicant</dt><dd>{state.profile.full_name}</dd></div><div><dt>Requested role</dt><dd>{state.profile.requested_role.replace('_', ' ')}</dd></div><div><dt>Status</dt><dd><span className="status-pill" data-status={state.profile.status}>{state.profile.status}</span></dd></div></dl>}<div className="status-actions">{!state.loggedIn && <Link className="btn btn-primary" href="/login">Log in</Link>}{state.loggedIn && <button className="btn btn-ghost" type="button" onClick={() => signOut()}>Sign out</button>}<Link className="btn btn-ghost" href="/">Return home</Link></div></section></main>;
}
