'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brand } from '@/components/site/Brand';
import type { SourceCourseDefinition, SourceModule } from '@/lib/source-course-types';
import { SourceModulePractice } from './SourceModulePractice';

function moduleStorageKey(slug: string) {
  return `fire-rescue-academy-${slug}-completed-v1`;
}

function practiceStorageKey(slug: string) {
  return `fire-rescue-academy-${slug}-practice-v1`;
}

function nearestVisual(module: SourceModule, slideNumber: number) {
  return module.visuals.reduce((nearest, visual) => Math.abs(visual.slide - slideNumber) < Math.abs(nearest.slide - slideNumber) ? visual : nearest, module.visuals[0]);
}

export function SourceCoursePlayer({ course }: { course: SourceCourseDefinition }) {
  const [moduleIndex, setModuleIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [practiceScores, setPracticeScores] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<'lesson' | 'practice'>('lesson');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | null>(null);
  const module = course.modules[moduleIndex];
  const slide = module.slides[slideIndex];
  const moduleName = course.meta.moduleNames[moduleIndex] || module.title;
  const visual = nearestVisual(module, slide.number);
  const overallSlide = useMemo(() => course.modules.slice(0, moduleIndex).reduce((total, entry) => total + entry.slideCount, 0) + slideIndex + 1, [course.modules, moduleIndex, slideIndex]);
  const completionPercent = Math.round(completed.size / course.modules.length * 100);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }, []);

  useEffect(() => {
    document.body.classList.add('source-course-body');
    try {
      const saved = JSON.parse(localStorage.getItem(moduleStorageKey(course.slug)) || '[]') as string[];
      setCompleted(new Set(saved));
      setPracticeScores(JSON.parse(localStorage.getItem(practiceStorageKey(course.slug)) || '{}') as Record<string, number>);
    } catch {
      setCompleted(new Set());
    }
    return () => document.body.classList.remove('source-course-body');
  }, [course.slug]);

  const openModule = (index: number) => {
    setModuleIndex(index);
    setSlideIndex(0);
    setMode('lesson');
    setSidebarOpen(false);
    document.querySelector('.source-reader')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishPractice = (score: number) => {
    const next = { ...practiceScores, [module.id]: Math.max(practiceScores[module.id] || 0, score) };
    setPracticeScores(next);
    localStorage.setItem(practiceStorageKey(course.slug), JSON.stringify(next));
    showToast(`Module exercise complete. Best score: ${next[module.id]} XP`);
  };

  const markModuleComplete = () => {
    const next = new Set(completed).add(module.id);
    setCompleted(next);
    localStorage.setItem(moduleStorageKey(course.slug), JSON.stringify([...next]));
    showToast(`Module complete. +250 training XP`);
  };

  const goPrevious = () => {
    if (slideIndex > 0) { setSlideIndex(slideIndex - 1); return; }
    if (moduleIndex > 0) {
      const previousModule = course.modules[moduleIndex - 1];
      setModuleIndex(moduleIndex - 1);
      setSlideIndex(previousModule.slides.length - 1);
    }
  };

  const goNext = () => {
    if (slideIndex < module.slides.length - 1) { setSlideIndex(slideIndex + 1); return; }
    markModuleComplete();
    if (moduleIndex < course.modules.length - 1) openModule(moduleIndex + 1);
  };

  const bodyBlocks = slide.content.filter((block, index) => index !== 0 || block.trim() !== slide.title.trim());

  return (
    <div className={`source-course-shell source-theme-${course.meta.accent}`}>
      <header className="source-course-topbar">
        <button className="source-menu-button" type="button" aria-label="Open course outline" onClick={() => setSidebarOpen((value) => !value)}>☰</button>
        <Brand />
        <div className="source-course-identity"><small>{course.meta.eyebrow}</small><strong>{course.title}</strong></div>
        <div className="source-course-stats"><span><small>Training XP</small><strong>{completed.size * 250 + Object.values(practiceScores).reduce((total, value) => total + value, 0)}</strong></span><span><small>Modules</small><strong>{completed.size}/{course.moduleCount}</strong></span><span className="source-progress-chip">{completionPercent}%</span></div>
        <Link className="btn btn-ghost btn-sm" href="/dashboard">Exit course</Link>
      </header>

      <div className="source-course-layout">
        <aside className={`source-course-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="source-sidebar-heading"><span className="eyebrow">Course curriculum</span><h2>{course.title}</h2><p>{course.moduleCount} modules · {course.slideCount.toLocaleString()} source slides</p></div>
          <div className="source-progress"><div><span>Course progress</span><strong>{completionPercent}%</strong></div><div className="progress-track"><span style={{ width: `${completionPercent}%` }} /></div></div>
          <nav className="source-module-list" aria-label="Course modules">
            {course.modules.map((entry, index) => (
              <button className={`${moduleIndex === index ? 'is-active ' : ''}${completed.has(entry.id) ? 'is-complete' : ''}`.trim()} type="button" key={entry.id} onClick={() => openModule(index)}>
                <span className="source-module-number">{completed.has(entry.id) ? '✓' : String(index + 1).padStart(2, '0')}</span>
                <span><small>Module {index + 1} · {entry.slideCount} slides</small><strong>{course.meta.moduleNames[index] || entry.title}</strong></span>
              </button>
            ))}
          </nav>
          <div className="source-integrity-note"><strong>Source integrity</strong><p>{course.sourceNotice}</p></div>
        </aside>
        <button className={`source-sidebar-scrim${sidebarOpen ? ' is-visible' : ''}`} type="button" aria-label="Close course outline" onClick={() => setSidebarOpen(false)} />

        <main className="source-reader">
          <div className="source-reader-inner">
            <nav className="source-breadcrumb" aria-label="Course location"><span>{course.title}</span><span>/</span><span>Module {moduleIndex + 1}</span><span>/</span><span>Slide {slide.number}</span></nav>
            <section className="source-module-hero">
              <div><span className="eyebrow">Module {String(moduleIndex + 1).padStart(2, '0')}</span><h1>{moduleName}</h1><p>Source module: {module.sourceFile}</p></div>
              <span className="source-module-xp">+250 XP</span>
            </section>

            <div className="source-mode-tabs" role="tablist" aria-label="Module views"><button className={mode === 'lesson' ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === 'lesson'} onClick={() => setMode('lesson')}>Source lesson</button><button className={mode === 'practice' ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === 'practice'} onClick={() => setMode('practice')}>Practice · up to 75 XP</button></div>

            {mode === 'lesson' ? <><section className="source-slide-card" aria-live="polite">
              <div className="source-slide-toolbar"><span>Source slide {slide.number} of {module.slideCount}</span><span>Course screen {overallSlide} of {course.slideCount}</span></div>
              <div className="source-slide-grid">
                <article className="source-slide-copy">
                  <span className="source-slide-label">Supplied course content</span>
                  <h2>{slide.title}</h2>
                  <div className="source-text-blocks">
                    {bodyBlocks.length ? bodyBlocks.map((block, index) => <p key={`${slide.number}-${index}`}>{block}</p>) : <p className="source-empty-slide">This source slide is primarily visual. Review the original slide image beside this text.</p>}
                  </div>
                  {slide.notes.length > 0 && <details className="source-notes"><summary>Source presenter notes</summary>{slide.notes.map((note, index) => <p key={index}>{note}</p>)}</details>}
                </article>
                <figure className="source-slide-visual"><img src={visual.src} alt={visual.alt} /><figcaption>Original module visual · source slide {visual.slide}</figcaption></figure>
              </div>
            </section>

            <div className="source-slide-jump"><label htmlFor="source-slide-range">Slide navigator</label><input id="source-slide-range" type="range" min="1" max={module.slides.length} value={slideIndex + 1} onChange={(event) => setSlideIndex(Number(event.target.value) - 1)} /><strong>{slideIndex + 1}/{module.slides.length}</strong></div>
            <div className="source-reader-actions"><button className="btn btn-ghost" type="button" onClick={goPrevious} disabled={moduleIndex === 0 && slideIndex === 0}>Previous</button><button className="btn btn-secondary" type="button" onClick={markModuleComplete}>{completed.has(module.id) ? 'Module completed' : 'Mark module complete'}</button><button className="btn btn-primary" type="button" onClick={goNext}>{moduleIndex === course.modules.length - 1 && slideIndex === module.slides.length - 1 ? 'Complete course reading' : 'Next'}</button></div></> : <SourceModulePractice module={module} moduleName={moduleName} previousBest={practiceScores[module.id] || 0} onFinish={finishPractice} />}
          </div>
        </main>
      </div>
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
