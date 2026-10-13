'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Brand } from './Brand';

const links = [
  { href: '/', label: 'Home', match: ['/'] },
  { href: '/courses', label: 'Courses', match: ['/courses'] },
  { href: '/about', label: 'About', match: ['/about'] },
  { href: '/contact', label: 'Contact', match: ['/contact'] }
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    return () => document.body.classList.remove('menu-open');
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const nav = links.map((link) => (
    <Link key={link.href} href={link.href} className={link.match.includes(pathname) ? 'active' : ''}>{link.label}</Link>
  ));

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="container nav-wrap">
        <Brand />
        <nav className="main-nav" aria-label="Primary navigation">{nav}</nav>
        <div className="nav-actions">
          <Link className="btn btn-ghost btn-sm" href="/login">Log in</Link>
          <Link className="btn btn-primary btn-sm" href="/register">Create account</Link>
          <button className={`menu-toggle${open ? ' is-open' : ''}`} type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span /></button>
        </div>
      </div>
      <div className={`mobile-panel${open ? ' open' : ''}`} aria-label="Mobile navigation">
        {nav}
        <div className="mobile-actions">
          <Link className="btn btn-ghost btn-sm" href="/login">Log in</Link>
          <Link className="btn btn-primary btn-sm" href="/register">Create account</Link>
        </div>
      </div>
    </header>
  );
}
