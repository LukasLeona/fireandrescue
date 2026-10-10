import { Brand } from '@/components/site/Brand';

export function AuthVisual({ register = false }: { register?: boolean }) {
  return <section className="auth-visual"><Brand /><div><p className="eyebrow">{register ? 'Join the academy' : 'Academy access'}</p><h1>{register ? 'Build readiness that shows.' : 'Welcome back.'}</h1><p>{register ? 'Apply for a role-based learning account. Every application is reviewed to keep training records and instructor access secure.' : 'Continue your professional development, review your progress, or manage your academy team.'}</p></div><p>{register ? 'Verified membership · Role-based access · Progress that follows you' : 'Protected accounts · Approval workflow · Role-based dashboards'}</p></section>;
}
