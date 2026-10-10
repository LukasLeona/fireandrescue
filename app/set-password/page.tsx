import type { Metadata } from 'next';
import { SetPasswordForm } from '@/components/auth/SetPasswordForm';

export const metadata: Metadata = { title: 'Accept invitation', robots: { index: false, follow: false } };

export default function SetPasswordPage() { return <SetPasswordForm />; }
