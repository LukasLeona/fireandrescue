'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type AcademyProfile = {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  organization?: string | null;
  application_note?: string | null;
  requested_role: 'super_admin' | 'admin' | 'instructor' | 'student';
  role: 'super_admin' | 'admin' | 'instructor' | 'student';
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived';
  rejection_reason?: string | null;
  approved_at?: string | null;
  last_seen_at?: string | null;
  created_at: string;
};

let clientPromise: Promise<SupabaseClient> | null = null;

export function getSupabase() {
  if (!clientPromise) {
    clientPromise = fetch('/api/config', { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const config = await response.json();
        if (!response.ok || !config.url || !config.anonKey) throw new Error(config.error || 'Authentication configuration is unavailable.');
        return createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      });
  }
  return clientPromise;
}

export async function getSessionProfile() {
  const supabase = await getSupabase();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) return { supabase, session: null, profile: null };
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle();
  if (error) throw error;
  return { supabase, session, profile: data as AcademyProfile | null };
}

export async function signOut() {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  window.location.assign('/login');
}
