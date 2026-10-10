import type { Metadata } from 'next';
import { AuthAccessForm } from '@/components/auth/AuthAccessForm';
import { AuthVisual } from '@/components/auth/AuthVisual';

export const metadata: Metadata = { title: 'Log in', description: 'Log in to Fire and Rescue Academy.', robots: { index: false, follow: false } };

export default function LoginPage() {
  return <><a className="skip-link" href="#main">Skip to content</a><main className="auth-page" id="main"><AuthVisual /><section className="auth-form-wrap"><AuthAccessForm mode="login" /></section></main></>;
}
