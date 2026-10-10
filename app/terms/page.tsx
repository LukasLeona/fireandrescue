import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicShell } from '@/components/site/PublicShell';

export const metadata: Metadata = { title: 'Terms and Conditions', robots: { index: false, follow: false } };

export default function TermsPage() {
  return <PublicShell><main id="main"><section className="page-hero"><div className="container"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Terms and Conditions</span></div><h1>Terms and Conditions</h1><p>Fire and Rescue Academy training information.</p></div></section><section className="section"><div className="container"><div className="content-card" style={{ maxWidth: 860 }}><h2>Training notice</h2><p>Fire and Rescue Academy course interactions and completion records support online professional development. The platform does not independently issue formal certification or replace agency-approved instruction, practical skills evaluation, medical direction, local procedures, or regulatory requirements.</p><p>This document should be reviewed and replaced by qualified legal counsel before a wider production launch.</p></div></div></section></main></PublicShell>;
}
