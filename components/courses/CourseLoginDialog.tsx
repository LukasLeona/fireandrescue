'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export function CourseLoginDialog({ courseTitle, courseHref, open, onClose }: { courseTitle: string; courseHref: string; open: boolean; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return <div className="course-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="course-dialog" role="dialog" aria-modal="true" aria-labelledby="course-login-title"><span className="course-dialog-icon" aria-hidden="true">↗</span><span className="eyebrow">Academy access</span><h2 id="course-login-title">Log in to continue</h2><p>You need to log in to enroll in {courseTitle} and open the course.</p><div className="course-dialog-actions"><Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(courseHref)}`}>Log in →</Link><button ref={closeButton} className="btn btn-ghost" type="button" onClick={onClose}>Not now</button></div></section></div>;
}
