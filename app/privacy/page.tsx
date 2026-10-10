import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicShell } from '@/components/site/PublicShell';

export const metadata: Metadata = { title: 'Privacy Policy', robots: { index: false, follow: false } };

export default function PrivacyPage() {
  return <PublicShell><main id="main"><section className="page-hero"><div className="container"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Privacy Policy</span></div><h1>Privacy Policy</h1><p>Fire and Rescue Academy platform information.</p></div></section><section className="section"><div className="container"><div className="content-card" style={{ maxWidth: 860 }}><h2>Platform notice</h2><p>Fire and Rescue Academy stores account identity, application details, role assignments, enrollment records, lesson progress, and quiz attempts to provide the learning service. Access is controlled through authenticated accounts and database row-level security.</p><p>Contact the academy before submitting sensitive personal information. This document should be reviewed and replaced by qualified legal counsel before a wider production launch.</p></div></div></section></main></PublicShell>;
}
