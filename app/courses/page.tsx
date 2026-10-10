import type { Metadata } from 'next';
import Link from 'next/link';
import { CourseCatalog } from '@/components/courses/CourseCatalog';
import { PublicShell } from '@/components/site/PublicShell';

export const metadata: Metadata = {
  title: 'Free Firefighter Courses',
  description: 'Browse free firefighter and emergency-response training courses.',
  alternates: { canonical: '/courses' }
};

export default function CoursesPage() {
  return <PublicShell><main id="main"><section className="page-hero"><div className="container"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Courses</span></div><h1>Professional firefighter training, available free.</h1><p>Explore the Fire and Rescue Academy course catalog. Each program is designed for a focused, practical online learning experience.</p></div></section><section className="section"><div className="container"><CourseCatalog /></div></section></main></PublicShell>;
}
