'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { Brand } from '@/components/site/Brand';
import { getSessionProfile, signOut, type AcademyProfile } from '@/lib/supabase/client';
import { AnalyticsPanel } from './AnalyticsPanel';
import { ApplicationsPanel } from './ApplicationsPanel';
import { AuditPanel } from './AuditPanel';
import { CoursesPanel } from './CoursesPanel';
import { InvitationsPanel } from './InvitationsPanel';
import { MembersPanel } from './MembersPanel';
import { Empty, formatDate, roleLabels, type AlertTone, type DashboardContext } from './types';

type Metric = { label: string; value: string | number; note: string; tone?: string };
type FeedItem = { id: string; title: string; body?: string; message?: string; published_at?: string; created_at?: string; read_at?: string | null };

const navigation = [
  { id: 'overview', label: 'Overview', icon: '⌂', roles: ['super_admin', 'admin', 'instructor', 'student'] },
  { id: 'applications', label: 'Applications', icon: '✓', roles: ['super_admin', 'admin', 'instructor'] },
  { id: 'users', label: 'Members', icon: '♟', roles: ['super_admin', 'admin'] },
  { id: 'courses', label: 'Courses', icon: '▤', roles: ['super_admin', 'admin', 'instructor', 'student'] },
  { id: 'analytics', label: 'Analytics', icon: '↗', roles: ['super_admin', 'admin', 'instructor'] },
  { id: 'invitations', label: 'Invitations', icon: '＋', roles: ['super_admin', 'admin', 'instructor'] },
  { id: 'audit', label: 'Audit log', icon: '◎', roles: ['super_admin'] }
];

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'FR';
}

export function DashboardApp() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AcademyProfile | null>(null);
  const [panel, setPanel] = useState('overview');
  const [navOpen, setNavOpen] = useState(false);
  const [alert, setAlert] = useState<{ message: string; tone: AlertTone } | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [announcements, setAnnouncements] = useState<FeedItem[]>([]);
  const [notifications, setNotifications] = useState<FeedItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const showAlert = useCallback((message: string, tone: AlertTone = 'error') => {
    setAlert({ message, tone });
    window.setTimeout(() => setAlert((current) => current?.message === message ? null : current), 6000);
  }, []);

  useEffect(() => {
    document.body.classList.add('dashboard-page');
    return () => document.body.classList.remove('dashboard-page', 'nav-open');
  }, []);
  useEffect(() => {
    document.body.classList.toggle('nav-open', navOpen);
  }, [navOpen]);

  useEffect(() => {
    getSessionProfile().then((result) => {
      if (!result.session) { window.location.replace('/login'); return; }
      if (!result.profile || result.profile.status !== 'approved') { window.location.replace('/application-status'); return; }
      setSupabase(result.supabase); setSession(result.session); setProfile(result.profile); setLoading(false);
    }).catch((error) => { showAlert(error.message); setLoading(false); });
  }, [showAlert]);

  const context = useMemo<DashboardContext | null>(() => supabase && session && profile ? { supabase, session, profile, showAlert } : null, [supabase, session, profile, showAlert]);

  useEffect(() => {
    if (!context) return;
    const staff = ['super_admin', 'admin', 'instructor'].includes(context.profile.role);
    const overviewQueries = staff
      ? [context.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'), context.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'), context.supabase.from('enrollments').select('*', { count: 'exact', head: true }), context.supabase.from('quiz_attempts').select('*', { count: 'exact', head: true })]
      : [context.supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('student_id', context.session.user.id), context.supabase.from('enrollments').select('progress_percent').eq('student_id', context.session.user.id), context.supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('user_id', context.session.user.id).eq('completed', true), context.supabase.from('quiz_attempts').select('percent').eq('user_id', context.session.user.id)];
    Promise.all([...overviewQueries, context.supabase.from('announcements').select('id,title,body,published_at').order('published_at', { ascending: false }).limit(4), context.supabase.from('notifications').select('id,title,message,read_at,created_at').eq('user_id', context.session.user.id).order('created_at', { ascending: false }).limit(6)]).then((results) => {
      const [one, two, three, four, announcementResult, notificationResult] = results;
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
      if (staff) {
        setPendingCount(one.count || 0);
        setMetrics([{ label: 'Pending applications', value: one.count || 0, note: 'Awaiting review', tone: 'is-alert' }, { label: 'Approved members', value: two.count || 0, note: 'Active academy accounts' }, { label: 'Enrollments', value: three.count || 0, note: 'Across all courses' }, { label: 'Quiz attempts', value: four.count || 0, note: 'Recorded assessments' }]);
      } else {
        const progress = (two.data || []) as Array<{ progress_percent: number }>;
        const attempts = (four.data || []) as Array<{ percent: number }>;
        const average = progress.length ? Math.round(progress.reduce((sum, item) => sum + Number(item.progress_percent), 0) / progress.length) : 0;
        const best = attempts.length ? Math.max(...attempts.map((item) => Number(item.percent))) : 0;
        setMetrics([{ label: 'Enrolled courses', value: one.count || 0, note: 'Active learning plans' }, { label: 'Overall progress', value: `${average}%`, note: 'Across your courses' }, { label: 'Lessons complete', value: three.count || 0, note: 'Readiness checkpoints' }, { label: 'Best quiz score', value: `${Math.round(best)}%`, note: 'Personal best' }]);
      }
      setAnnouncements((announcementResult.data || []) as FeedItem[]);
      setNotifications((notificationResult.data || []) as FeedItem[]);
    }).catch((error) => showAlert(error.message));
  }, [context, showAlert]);

  if (loading || !context) return <div className="dashboard-loader" aria-live="polite"><span className="button-spinner" /><strong>Securing your dashboard</strong></div>;
  const activeProfile = context.profile;
  const visibleNav = navigation.filter((item) => item.roles.includes(context.profile.role));
  const selected = visibleNav.find((item) => item.id === panel) || visibleNav[0];
  const unread = notifications.filter((item) => !item.read_at).length;

  const openPanel = (id: string) => { setPanel(id); setNavOpen(false); };
  return <><a className="skip-link" href="#dashboard-content">Skip to dashboard</a><div className="dashboard-shell"><aside className="dashboard-sidebar" aria-label="Academy navigation"><Brand /><div className="dashboard-profile"><span className="dashboard-avatar">{initials(activeProfile.full_name)}</span><div><strong>{activeProfile.full_name}</strong><small>{roleLabels[activeProfile.role]}</small></div></div><nav className="dashboard-nav">{visibleNav.map((item) => <button className={selected.id === item.id ? 'is-active' : ''} type="button" onClick={() => openPanel(item.id)} key={item.id}><span aria-hidden="true">{item.icon}</span> {item.label}{item.id === 'applications' && pendingCount > 0 && <b>{pendingCount}</b>}</button>)}</nav><div className="dashboard-sidebar-foot"><Link href="/">Public website</Link><button type="button" onClick={() => signOut()}>Sign out</button></div></aside><main className="dashboard-main" id="dashboard-content"><header className="dashboard-topbar"><button className="mobile-menu-button" type="button" onClick={() => setNavOpen((value) => !value)} aria-label="Toggle navigation">☰</button><div><p className="eyebrow">Operations center</p><h1>{selected.label}</h1></div><div className="topbar-actions"><span className="role-chip">{roleLabels[activeProfile.role]}</span><button className="notification-button" type="button" onClick={() => openPanel('overview')} aria-label="Notifications">●<span>{unread}</span></button></div></header>{alert && <div className={`dashboard-alert is-${alert.tone}`} role="status">{alert.message}</div>}{selected.id === 'overview' && <section className="dashboard-panel is-active"><div className="dashboard-welcome"><div><p className="eyebrow">Today at the academy</p><h2>Ready when it matters.</h2><p>{activeProfile.role === 'student' ? 'Continue your courses, build your readiness score, and keep your learning streak alive.' : 'Review new applications, monitor course activity, and keep your academy moving.'}</p></div><Link className="btn btn-primary" href="/hazmat-course">Continue training</Link></div><div className="metric-grid" aria-label="Academy summary">{metrics.map((metric) => <article className={`metric-card ${metric.tone || ''}`} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}</div><div className="dashboard-two-column"><section className="dashboard-card"><div className="card-heading"><div><p className="eyebrow">Academy feed</p><h3>Announcements</h3></div></div><div className="feed-list">{!announcements.length ? <Empty>No academy announcements yet.</Empty> : announcements.map((item) => <article className="feed-item" key={item.id}><span className="feed-mark">A</span><div><strong>{item.title}</strong><p>{item.body}</p><small>{formatDate(item.published_at)}</small></div></article>)}</div></section><section className="dashboard-card"><div className="card-heading"><div><p className="eyebrow">Your inbox</p><h3>Notifications</h3></div></div><div className="feed-list">{!notifications.length ? <Empty>You are all caught up.</Empty> : notifications.map((item) => <article className={`feed-item${item.read_at ? '' : ' is-unread'}`} key={item.id}><span className="feed-mark">{item.read_at ? '○' : '●'}</span><div><strong>{item.title}</strong><p>{item.message}</p><small>{formatDate(item.created_at)}</small></div></article>)}</div></section></div></section>}{selected.id === 'applications' && <ApplicationsPanel context={context} />}{selected.id === 'users' && <MembersPanel context={context} />}{selected.id === 'courses' && <CoursesPanel context={context} />}{selected.id === 'analytics' && <AnalyticsPanel context={context} />}{selected.id === 'invitations' && <InvitationsPanel context={context} />}{selected.id === 'audit' && <AuditPanel context={context} />}</main></div></>;
}
