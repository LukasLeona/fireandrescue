import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { AcademyProfile } from '@/lib/supabase/client';

export type AlertTone = 'success' | 'error';

export type DashboardContext = {
  supabase: SupabaseClient;
  session: Session;
  profile: AcademyProfile;
  showAlert: (message: string, tone?: AlertTone) => void;
};

export const roleLabels: Record<string, string> = {
  super_admin: 'Super admin', admin: 'Administrator', instructor: 'Instructor', student: 'Student'
};

export function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—';
}

export function label(value = '') {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function apiRequest(path: string, body: Record<string, unknown>, context: DashboardContext) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${context.session.access_token}` }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

export function Badge({ value }: { value: string }) {
  return <span className="table-badge" data-tone={value}>{label(value)}</span>;
}

export function Empty({ children }: { children: string }) {
  return <p className="empty-state">{children}</p>;
}
