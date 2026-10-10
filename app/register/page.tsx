import type { Metadata } from 'next';
import { AuthAccessForm } from '@/components/auth/AuthAccessForm';
import { AuthVisual } from '@/components/auth/AuthVisual';

export const metadata: Metadata = { title: 'Apply for access', description: 'Apply for a Fire and Rescue Academy learning account.', robots: { index: false, follow: false } };

export default function RegisterPage() {
  return <><a className="skip-link" href="#main">Skip to content</a><main className="auth-page" id="main"><AuthVisual register /><section className="auth-form-wrap"><AuthAccessForm mode="register" /></section></main></>;
}
