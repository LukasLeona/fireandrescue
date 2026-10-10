'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSessionProfile, getSupabase } from '@/lib/supabase/client';

export function AuthCallback() {
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const supabase = await getSupabase();
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }
        const { profile } = await getSessionProfile();
        window.location.replace(profile?.status === 'approved' ? '/dashboard' : '/application-status');
      } catch (caught) { setError(caught instanceof Error ? caught.message : 'The secure sign-in link could not be completed.'); }
    })();
  }, []);
  return <main className="status-page"><section className="auth-status-card"><div className="status-icon is-loading">…</div><p className="eyebrow">Secure sign in</p><h1>Completing your request</h1><p>{error || 'Please keep this page open for a moment.'}</p>{error && <Link className="btn btn-ghost" href="/login">Return to login</Link>}</section></main>;
}
