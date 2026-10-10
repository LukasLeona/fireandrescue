'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiRequest, Badge, Empty, formatDate, type DashboardContext } from './types';

type Invitation = { id: string; email: string; role: string; status: string; expires_at: string; created_at: string };

export function InvitationsPanel({ context }: { context: DashboardContext }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const load = useCallback(async () => {
    const { data, error } = await context.supabase.from('invitations').select('id,email,role,status,expires_at,created_at').order('created_at', { ascending: false }).limit(10);
    if (error) throw error;
    setInvitations((data || []) as Invitation[]);
  }, [context]);
  useEffect(() => { load().catch((error) => context.showAlert(error.message)); }, [load, context]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setSubmitting(true); setMessage('');
    try {
      await apiRequest('/api/invite-user', Object.fromEntries(new FormData(form)), context);
      form.reset(); setMessage('Invitation sent successfully.'); await load();
    } catch (error) { context.showAlert(error instanceof Error ? error.message : 'The invitation could not be sent.'); }
    finally { setSubmitting(false); }
  };
  const roles = context.profile.role === 'super_admin' ? [['student', 'Student'], ['instructor', 'Instructor'], ['admin', 'Administrator']] : [['student', 'Student']];
  return <section className="dashboard-panel is-active"><div className="panel-heading"><div><p className="eyebrow">Build your team</p><h2>Invite a member</h2><p>Email a secure invitation with the correct academy role.</p></div></div><div className="dashboard-two-column"><form className="dashboard-card form-grid" onSubmit={submit}><div className="form-group"><label htmlFor="invite-email">Email address</label><input className="form-control" id="invite-email" name="email" type="email" required /></div><div className="form-group"><label htmlFor="invite-role">Role</label><select className="form-control" id="invite-role" name="role" required>{roles.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>{message && <div className="auth-message is-success">{message}</div>}<button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send invitation'}</button></form><section className="dashboard-card"><div className="card-heading"><div><p className="eyebrow">Invitation history</p><h3>Recent invitations</h3></div></div><div className="feed-list">{!invitations.length ? <Empty>No invitations have been sent.</Empty> : invitations.map((invite) => <article className="feed-item" key={invite.id}><span className="feed-mark">✉</span><div><strong>{invite.email}</strong><p><Badge value={invite.role} /> <Badge value={invite.status} /></p><small>Sent {formatDate(invite.created_at)} · Expires {formatDate(invite.expires_at)}</small></div></article>)}</div></section></div></section>;
}
