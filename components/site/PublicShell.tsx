import type { ReactNode } from 'react';
import { AcademyAssistant } from './AcademyAssistant';
import { Footer } from './Footer';
import { Header } from './Header';
import { SiteEffects } from './SiteEffects';

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      {children}
      <Footer />
      <SiteEffects />
      <AcademyAssistant />
    </>
  );
}
