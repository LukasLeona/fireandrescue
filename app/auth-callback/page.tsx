import type { Metadata } from 'next';
import { AuthCallback } from '@/components/auth/AuthCallback';

export const metadata: Metadata = { title: 'Completing sign in', robots: { index: false, follow: false } };

export default function AuthCallbackPage() { return <AuthCallback />; }
