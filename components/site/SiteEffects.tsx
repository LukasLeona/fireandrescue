'use client';

import { useEffect } from 'react';

export function SiteEffects() {
  useEffect(() => {
    const revealItems = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      observer.observe(item);
    });

    const progress = document.createElement('span');
    progress.className = 'site-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
    const update = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${available > 0 ? Math.min(1, window.scrollY / available) : 0})`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      progress.remove();
    };
  }, []);

  return null;
}
