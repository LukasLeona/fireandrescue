import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/contact/ContactForm';
import { PublicShell } from '@/components/site/PublicShell';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Fire and Rescue Academy about firefighter LMS implementation and support.',
  alternates: { canonical: '/contact' }
};

export default function ContactPage() {
  return <PublicShell><main id="main"><section className="page-hero"><div className="container"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Contact</span></div><h1>Let’s discuss the next phase of Fire and Rescue Academy.</h1><p>Use the contact form for implementation questions, content migration, integrations, and LMS development planning.</p></div></section><section className="section"><div className="container contact-grid"><aside className="contact-card" data-reveal><h2>Fire and Rescue Academy support</h2><p>The academy supports authentication, learner records, role-based dashboards, invitations, progress, assessments, and reporting.</p>{[['Message', 'Use the form to share your inquiry'], ['Account support', 'Include the email connected to your academy profile'], ['Availability', 'Web-based training and implementation inquiries']].map(([title, copy]) => <div className="contact-method" key={title}><span className="badge-icon">✓</span><span><strong>{title}</strong><br /><span style={{ color: 'rgba(255,255,255,.66)' }}>{copy}</span></span></div>)}</aside><ContactForm /></div></section></main></PublicShell>;
}
