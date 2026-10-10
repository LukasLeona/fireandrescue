'use client';

import { useEffect, useState } from 'react';
import { Empty, formatDate, label, type DashboardContext } from './types';

type Audit = { id: string; action: string; target_user_id: string | null; created_at: string; actor?: { full_name?: string; email?: string } | null };

export function AuditPanel({ context }: { context: DashboardContext }) {
  const [items, setItems] = useState<Audit[]>([]);
  useEffect(() => {
    context.supabase.from('audit_logs').select('id,action,target_user_id,created_at,actor:profiles!audit_logs_actor_user_id_fkey(full_name,email)').order('created_at', { ascending: false }).limit(100).then(({ data, error }) => {
      if (error) context.showAlert(error.message); else setItems((data || []) as unknown as Audit[]);
    });
  }, [context]);
  return <section className="dashboard-panel is-active"><div className="panel-heading"><div><p className="eyebrow">Security record</p><h2>Audit log</h2><p>Review privileged changes to applications, roles, and account states.</p></div></div><div className="dashboard-card"><div className="data-table-wrap">{!items.length ? <Empty>Audit entries will appear here.</Empty> : <table className="data-table"><thead><tr><th>Action</th><th>Actor</th><th>Target ID</th><th>Date</th></tr></thead><tbody>{items.map((entry) => <tr key={entry.id}><td>{label(entry.action)}</td><td><strong>{entry.actor?.full_name || 'System'}</strong><small>{entry.actor?.email || ''}</small></td><td><code>{entry.target_user_id || '—'}</code></td><td>{formatDate(entry.created_at)}</td></tr>)}</tbody></table>}</div></div></section>;
}
