import type { Metadata } from 'next';
import { ApplicationStatus } from '@/components/auth/ApplicationStatus';

export const metadata: Metadata = { title: 'Application status', description: 'Check your Fire and Rescue Academy application status.', robots: { index: false, follow: false } };

export default function ApplicationStatusPage() { return <ApplicationStatus />; }
