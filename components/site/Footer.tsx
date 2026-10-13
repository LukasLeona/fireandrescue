import Link from 'next/link';
import { Brand } from './Brand';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand"><Brand /><p>Professional, scenario-based online learning for firefighters, emergency responders, and fire-service organizations.</p></div>
        <div className="footer-col"><h3>Platform</h3><Link href="/courses">All courses</Link><Link href="/courses/hazmat-awareness">HazMat Awareness</Link><Link href="/login">Learner login</Link><Link href="/register">Create account</Link></div>
        <div className="footer-col"><h3>Company</h3><Link href="/about">About Fire and Rescue Academy</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms</Link></div>
        <div className="footer-col"><h3>Academy access</h3><Link href="/dashboard">Dashboard</Link><Link href="/application-status">Application status</Link><Link href="/contact">Training support</Link></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} Fire and Rescue Academy.</span><span>Built for firefighter professional development.</span></div>
    </footer>
  );
}
