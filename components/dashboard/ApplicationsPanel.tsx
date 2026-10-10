'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AcademyProfile } from '@/lib/supabase/client';
import { apiRequest, Badge, Empty, formatDate, type DashboardContext } from './types';

export function ApplicationsPanel({ context }: { context: DashboardContext }) {
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState<AcademyProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = context.supabase.from('profiles').select('*').eq('status', status).order('created_at', { ascending: false });
    if (context.profile.role !== 'super_admin') query = query.eq('requested_role', 'student');
    const { data, error } = await query;
    if (error) throw error;
    setRows((data || []) as AcademyProfile[]);
    setRoles(Object.fromEntries((data || []).map((profile) => [profile.user_id, profile.requested_role])));
    setLoading(false);
  }, [context, status]);

  useEffect(() => { load().catch((error) => context.showAlert(error.message)); }, [load, context]);

  const review = async (profile: AcademyProfile, decision: 'approve' | 'reject') => {
    let reason: string | null = null;
    if (decision === 'reject') {
      reason = window.prompt('Provide a short reason for the applicant:');
      if (reason === null) return;
      if (!reason.trim()) { context.showAlert('A rejection reason is required.'); return; }
    }
    try {
      await apiRequest('/api/review-application', { userId: profile.user_id, decision, role: roles[profile.user_id] || 'student', reason }, context);
      context.showAlert(`Application ${decision === 'approve' ? 'approved' : 'rejected'}.`, 'success');
      await load();
    } catch (error) { context.showAlert(error instanceof Error ? error.message : 'The application could not be reviewed.'); }
  };

  return <section className="dashboard-panel is-active"><div className="panel-heading"><div><p className="eyebrow">Access control</p><h2>Account applications</h2><p>Review identity, organization, and requested access before admitting a new member.</p></div></div><div className="dashboard-card"><div className="toolbar"><label>Filter <select className="compact-control" value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><button className="btn btn-ghost btn-small" type="button" onClick={() => load()}>Refresh</button></div><div className="data-table-wrap">{loading ? <Empty>Loading applications…</Empty> : !rows.length ? <Empty>No records match this view.</Empty> : <table className="data-table"><thead><tr><th>Applicant</th><th>Organization / note</th><th>Requested role</th><th>Status</th><th>Applied</th><th>Actions</th></tr></thead><tbody>{rows.map((profile) => <tr key={profile.user_id}><td><strong>{profile.full_name || 'Unnamed applicant'}</strong><small>{profile.email}</small></td><td>{profile.organization || '—'}<small>{profile.application_note || 'No application note'}</small></td><td>{context.profile.role === 'super_admin' ? <select className="table-select" value={roles[profile.user_id] || 'student'} onChange={(event) => setRoles((current) => ({ ...current, [profile.user_id]: event.target.value }))}><option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select> : <Badge value="student" />}</td><td><Badge value={profile.status} /></td><td>{formatDate(profile.created_at)}</td><td>{status === 'pending' ? <div className="table-actions"><button className="action-button is-approve" onClick={() => review(profile, 'approve')}>Approve</button><button className="action-button is-reject" onClick={() => review(profile, 'reject')}>Reject</button></div> : '—'}</td></tr>)}</tbody></table>}</div></div></section>;
}
