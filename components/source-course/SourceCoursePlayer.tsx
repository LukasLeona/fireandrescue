'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CourseSyncStatus } from '@/components/course/CourseSyncStatus';
import { Brand } from '@/components/site/Brand';
import { buildSourceLessonOutline, type SourceLessonItem } from '@/lib/source-course-outline';
import type { SourceCourseDefinition, SourceSlide } from '@/lib/source-course-types';
import { SourceCourseAssessment, type SourceTestResult } from './SourceCourseAssessment';
import { SourceModulePractice } from './SourceModulePractice';

const storageVersion = 'unified-v1';

function progressStorageKey(slug: string) {
  return `fire-rescue-academy-${slug}-${storageVersion}-progress`;
}

function chapterStorageKey(slug: string) {
  return `fire-rescue-academy-${slug}-${storageVersion}-chapters`;
}

function practiceStorageKey(slug: string) {
  return `fire-rescue-academy-${slug}-${storageVersion}-practice`;
}

function testStorageKey(slug: string) {
  return `fire-rescue-academy-${slug}-${storageVersion}-tests`;
}

function slideBody(slide: SourceSlide) {
  return slide.content.filter((block, index) => block.trim() && (index !== 0 || block.trim() !== slide.title.trim()));
}

function SourceLessonCards({ item }: { item: SourceLessonItem }) {
  return <>{item.slides.map((slide, index) => {
    const body = slideBody(slide);
    const title = slide.title.trim();
    if (!title && !body.length && !slide.notes.length) return null;
    return <section className="lesson-card source-reformatted-card" key={`${item.id}-${slide.number}`}><div className="source-reformatted-heading"><span>Topic {String(index + 1).padStart(2, '0')}</span>{title && <h3>{title}</h3>}</div>{body.length > 0 && <div className="source-reformatted-copy">{body.map((block, blockIndex) => <p key={blockIndex}>{block}</p>)}</div>}{slide.notes.length > 0 && <details className="source-notes"><summary>Instructor notes</summary>{slide.notes.map((note, noteIndex) => <p key={noteIndex}>{note}</p>)}</details>}</section>;
  })}</>;
}

export function SourceCoursePlayer({ course }: { course: SourceCourseDefinition }) {
  const chapters = useMemo(() => buildSourceLessonOutline(course), [course]);
  const flatItems = useMemo(() => chapters.flatMap((chapter) => chapter.items.map((item) => ({ ...item, chapterId: chapter.id, chapterHeading: chapter.title, chapterSubtitle: chapter.subtitle }))), [chapters]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const completedRef = useRef(completed);
  const [practiceScores, setPracticeScores] = useState<Record<string, number>>({});
  const [testScores, setTestScores] = useState<Record<string, number>>({});
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set(chapters.map((chapter) => chapter.id)));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const current = flatItems[currentIndex];
  const percent = Math.round(completed.size / flatItems.length * 100) || 0;
  const xp = completed.size * 100 + Object.values(practiceScores).reduce((total, value) => total + value, 0) + Object.values(testScores).reduce((total, value) => total + value * 2, 0);
  const rank = percent >= 100 ? 'Mission Ready' : percent >= 75 ? 'Specialist' : percent >= 40 ? 'Responder' : percent > 0 ? 'Recruit' : 'Rookie';
  const badges = [completed.size >= 1, percent >= 25, percent >= 50, percent >= 75, percent >= 100];

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }, []);

  useEffect(() => { completedRef.current = completed; }, [completed]);
  useEffect(() => {
    document.body.classList.add('player-body');
    try {
      const local = JSON.parse(localStorage.getItem(progressStorageKey(course.slug)) || '[]') as string[];
      const storedChapters = JSON.parse(localStorage.getItem(chapterStorageKey(course.slug)) || '[]') as string[];
      setCompleted(new Set(local));
      setPracticeScores(JSON.parse(localStorage.getItem(practiceStorageKey(course.slug)) || '{}') as Record<string, number>);
      setTestScores(JSON.parse(localStorage.getItem(testStorageKey(course.slug)) || '{}') as Record<string, number>);
      if (storedChapters.length) setOpenChapters(new Set(storedChapters));
    } catch {
      setCompleted(new Set());
    }
    return () => document.body.classList.remove('player-body');
  }, [course.slug]);

  const chooseItem = (index: number) => {
    setCurrentIndex(index);
    setSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleChapter = (id: string) => {
    setOpenChapters((currentSet) => {
      const next = new Set(currentSet);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(chapterStorageKey(course.slug), JSON.stringify([...next]));
      return next;
    });
  };

  const markComplete = useCallback((id: string, quiet = false) => {
    if (completedRef.current.has(id)) return;
    const next = new Set(completedRef.current).add(id);
    completedRef.current = next;
    setCompleted(next);
    localStorage.setItem(progressStorageKey(course.slug), JSON.stringify([...next]));
    showToast(quiet ? '+100 XP. Training progress saved.' : '+100 XP. Lesson item complete.');
  }, [course.slug, showToast]);

  const finishPractice = (score: number) => {
    const nextScores = { ...practiceScores, [current.id]: Math.max(practiceScores[current.id] || 0, score) };
    setPracticeScores(nextScores);
    localStorage.setItem(practiceStorageKey(course.slug), JSON.stringify(nextScores));
    markComplete(current.id, true);
    showToast(`Module practice complete. Best score: ${nextScores[current.id]} XP.`);
  };

  const finishTest = (result: SourceTestResult) => {
    const nextScores = { ...testScores, [result.id]: Math.max(testScores[result.id] || 0, result.percent) };
    setTestScores(nextScores);
    localStorage.setItem(testStorageKey(course.slug), JSON.stringify(nextScores));
    markComplete(current.id, true);
    showToast(`${result.title} submitted. Score: ${result.score}/${result.maxScore}.`);
  };

  const openModulePractice = () => {
    const practiceIndex = flatItems.findIndex((item) => item.moduleIndex === current.moduleIndex && item.type === 'practice');
    if (practiceIndex >= 0) chooseItem(practiceIndex);
  };

  const next = () => {
    if (current.type === 'lesson') markComplete(current.id, true);
    if (currentIndex < flatItems.length - 1) chooseItem(currentIndex + 1);
    else showToast(`Mission complete. You reached the end of ${course.title}.`);
  };

  return <div className="player-shell"><header className="player-topbar"><div className="player-topbar-left"><button className="btn btn-ghost btn-sm player-menu-btn" type="button" aria-label="Open course outline" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((value) => !value)}>☰</button><Brand /></div><div className="player-topbar-center"><span className="player-course-title">{course.title}</span><span className="player-course-subtitle">Interactive course formatted from the supplied curriculum.</span></div><div className="player-topbar-right"><div className="player-hud" aria-label="Training status"><span className="hud-stat"><small>Training XP</small><strong>{xp}</strong></span><span className="hud-stat"><small>Rank</small><strong>{rank}</strong></span></div><div className="top-progress-pill"><span>Progress</span><strong>{percent}%</strong></div><button className="drill-launcher" type="button" onClick={openModulePractice}><span>Module practice</span><strong>Up to 75 XP</strong></button><Link className="btn btn-ghost btn-sm" href="/dashboard">Exit to dashboard</Link></div></header><div className="player-grid"><aside className={`player-sidebar${sidebarOpen ? ' open' : ''}`}><div className="player-sidebar-head"><div><span className="eyebrow">Course outline</span><h2>{course.title}</h2><p>{course.moduleCount} modules organized into focused lessons, practice activities, and course tests.</p></div><button className="btn btn-ghost btn-sm sidebar-close" type="button" onClick={() => setSidebarOpen(false)}>Close</button></div><div className="player-progress-card"><div className="player-progress-label"><span>Completed items</span><strong>{percent}%</strong></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><div className="outline-meta"><span>{completed.size} completed</span><span>{flatItems.length} items</span></div></div><div className="badge-shelf" aria-label="Course achievements"><div className="badge-shelf-title"><span>Achievement badges</span><span>{badges.filter(Boolean).length} / 5</span></div><div className="badge-row">{['FR', 'SA', 'HS', 'RS', 'MR'].map((badge, index) => <span className={`academy-badge${badges[index] ? ' earned' : ''}`} key={badge}>{badge}</span>)}</div></div><div className="course-outline">{chapters.map((chapter) => { const open = openChapters.has(chapter.id); const done = chapter.items.filter((item) => completed.has(item.id)).length; return <section className={`outline-chapter${open ? ' open' : ''}`} key={chapter.id}><button className="outline-chapter-toggle" type="button" aria-expanded={open} onClick={() => toggleChapter(chapter.id)}><span><strong>{chapter.title}</strong><small>{chapter.subtitle}</small></span><span className="outline-toggle-meta"><span className="outline-count">{done} / {chapter.items.length} complete</span><span className="outline-chevron">⌄</span></span></button>{open && <div className="outline-items">{chapter.items.map((item) => { const index = flatItems.findIndex((entry) => entry.id === item.id); return <button className={`outline-item outline-type-${item.type}${currentIndex === index ? ' active' : ''}${completed.has(item.id) ? ' done' : ''}`} type="button" onClick={() => chooseItem(index)} key={item.id}><span className="outline-status">{completed.has(item.id) ? '✓' : ''}</span><span className="outline-text"><small>{item.label}</small><strong>{item.title}</strong></span><span className="outline-badge">{item.type === 'assessment' ? 'Test' : item.type === 'practice' ? 'Practice' : 'Section'}</span></button>; })}</div>}</section>; })}</div><CourseSyncStatus status="Local progress is active. Academy cloud sync will connect after enrollment." tone="preview" /></aside><button className={`player-overlay${sidebarOpen ? ' show' : ''}`} type="button" aria-label="Close course outline" onClick={() => setSidebarOpen(false)} /><main className="player-main" ref={mainRef}><div className="player-lesson-wrapper"><div className="player-breadcrumb"><span>Fire and Rescue Academy</span><span>/</span><span>{current.chapterHeading}</span><span>/</span><span>{current.title}</span></div><article className="lesson-panel active"><header className="lesson-heading"><span className="mission-line">Mission {String(currentIndex + 1).padStart(2, '0')} of {flatItems.length}</span><span className="eyebrow">{current.chapterSubtitle}</span><h1>{current.title}</h1><p>{current.description}</p><div className="lesson-meta-row"><span className="lesson-meta-chip">{current.label}</span><span className="lesson-meta-chip">{current.type === 'assessment' ? 'Assessment' : current.type === 'practice' ? 'Interactive practice' : 'Interactive section'}</span><span className={`lesson-meta-chip${completed.has(current.id) ? ' success' : ''}`}>{completed.has(current.id) ? 'Completed' : 'Not yet completed'}</span></div></header>{current.type === 'lesson' ? <><figure className="lesson-hero-card source-course-hero"><img src={course.meta.illustration} alt={course.meta.illustrationAlt} /><figcaption>{course.title} · {current.chapterSubtitle}</figcaption></figure><SourceLessonCards item={current} /><section className="lesson-card lesson-complete-card"><h3>Ready to continue?</h3><p>Mark this item complete, or move to the next item when you are done reviewing the material.</p><button className="btn btn-secondary" type="button" onClick={() => markComplete(current.id)}>Mark this item complete</button></section></> : current.type === 'practice' ? <SourceModulePractice module={current.module} moduleName={current.chapterSubtitle} previousBest={practiceScores[current.id] || 0} onFinish={finishPractice} /> : <SourceCourseAssessment course={course} test={current.test} bestScore={testScores[current.id] || 0} onFinish={finishTest} />}</article><div className="player-actions"><button className="btn btn-ghost" type="button" disabled={currentIndex === 0} onClick={() => chooseItem(currentIndex - 1)}>Previous</button><button className="btn btn-primary" type="button" onClick={next}>{currentIndex === flatItems.length - 1 ? 'Finish course' : 'Next item'}</button></div></div></main></div><div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div></div>;
}
