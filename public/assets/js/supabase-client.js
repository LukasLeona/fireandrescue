import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';

let clientPromise;

async function loadConfig() {
  if (window.__FRA_SUPABASE_CONFIG__?.url && window.__FRA_SUPABASE_CONFIG__?.anonKey) {
    return window.__FRA_SUPABASE_CONFIG__;
  }

  const response = await fetch('/api/config', { headers: { Accept: 'application/json' } });
  const config = await response.json().catch(() => ({}));
  if (!response.ok || !config.url || !config.anonKey) {
    throw new Error(config.error || 'Authentication configuration is unavailable.');
  }
  return config;
}

export function getSupabase() {
  if (!clientPromise) {
    clientPromise = loadConfig().then(({ url, anonKey }) => createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }));
  }
  return clientPromise;
}

export async function getSessionProfile() {
  const supabase = await getSupabase();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) return { supabase, session: null, profile: null };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  return { supabase, session, profile };
}

export async function signOut() {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  window.location.assign('login.html');
}
