'use client';

import { useEffect, useRef } from 'react';

export function UnavailableCourseDialog({ courseTitle, open, onClose }: { courseTitle: string; open: boolean; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="course-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="course-dialog" role="dialog" aria-modal="true" aria-labelledby="course-dialog-title">
        <span className="course-dialog-icon" aria-hidden="true">◷</span>
        <span className="eyebrow">Coming soon</span>
        <h2 id="course-dialog-title">{courseTitle}</h2>
        <p>This course is not yet available. It will appear in the academy when its learning materials are ready.</p>
        <button ref={closeButton} className="btn btn-primary" type="button" onClick={onClose}>Return to courses</button>
      </section>
    </div>
  );
}
