'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AcademyProfile } from '@/lib/supabase/client';
import { apiRequest, Badge, Empty, formatDate, type DashboardContext } from './types';

export function MembersPanel({ context }: { context: DashboardContext }) {
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<AcademyProfile[]>([]);
  const load = useCallback(async () => {
    let query = context.supabase.from('profiles').select('*').order('full_name').limit(100);
    if (role !== 'all') query = query.eq('role', role);
    if (search.trim()) {
      const safe = search.replaceAll(',', '');
      query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    setMembers((data || []) as AcademyProfile[]);
  }, [context, role, search]);
  useEffect(() => { load().catch((error) => context.showAlert(error.message)); }, [load, context]);

  const update = async (profile: AcademyProfile, changes: { role?: string; status?: string }) => {
    try {
      await apiRequest('/api/update-user', { userId: profile.user_id, ...changes }, context);
      context.showAlert('Member access updated.', 'success');
      await load();
    } catch (error) { context.showAlert(error instanceof Error ? error.message : 'Member access could not be updated.'); }
  };

  return <section className="dashboard-panel is-active"><div className="panel-heading"><div><p className="eyebrow">Directory</p><h2>Academy members</h2><p>Find approved members, inspect their access, and manage account status.</p></div></div><div className="dashboard-card"><div className="toolbar"><label className="search-control"><span className="sr-only">Search members</span><input className="compact-control" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" /></label><select className="compact-control" value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role"><option value="all">All roles</option><option value="admin">Admins</option><option value="instructor">Instructors</option><option value="student">Students</option></select></div><div className="data-table-wrap">{!members.length ? <Empty>No records match this view.</Empty> : <table className="data-table"><thead><tr><th>Member</th><th>Organization</th><th>Role</th><th>Status</th><th>Last activity</th><th>Access</th></tr></thead><tbody>{members.map((profile) => { const owner = profile.role === 'super_admin'; return <tr key={profile.user_id}><td><strong>{profile.full_name}</strong><small>{profile.email}</small></td><td>{profile.organization || '—'}</td><td>{context.profile.role === 'super_admin' && !owner ? <select className="table-select" value={profile.role} onChange={(event) => update(profile, { role: event.target.value })}><option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select> : <Badge value={profile.role} />}</td><td><Badge value={profile.status} /></td><td>{formatDate(profile.last_seen_at || profile.approved_at)}</td><td>{context.profile.role === 'super_admin' && !owner ? <button className="action-button" onClick={() => update(profile, { status: profile.status === 'suspended' ? 'approved' : 'suspended' })}>{profile.status === 'suspended' ? 'Restore' : 'Suspend'}</button> : '—'}</td></tr>; })}</tbody></table>}</div></div></section>;
}
