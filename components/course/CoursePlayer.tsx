'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brand } from '@/components/site/Brand';
import courseJson from '@/lib/course-data.json';
import type { AssessmentResult, CourseData, CourseItem } from '@/lib/course-types';
import { getSessionProfile } from '@/lib/supabase/client';
import { Activity } from './Activities';
import { Assessment } from './Assessment';
import { CourseSyncStatus } from './CourseSyncStatus';
import { DailyDrill } from './DailyDrill';
import { LessonMedia, VisualBoard } from './LessonVisuals';

const course = courseJson as CourseData;
const storageKey = 'fire-rescue-academy-hazmat-v2-progress';
const chapterStateKey = 'fire-rescue-academy-hazmat-v2-openchapters';
const drillBonusKey = 'fire-rescue-academy-hazmat-v2-drill-xp';

type SyncClient = {
  saveLesson: (lessonId: string) => Promise<void>;
  saveAssessment: (result: AssessmentResult) => Promise<void>;
};

export function CoursePlayer() {
  const flatItems = useMemo(() => course.chapters.flatMap((chapter) => chapter.items.map((item) => ({ ...item, chapterId: chapter.id, chapterHeading: chapter.title, chapterSubtitle: chapter.subtitle || '' }))), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const completedRef = useRef(completed);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set(course.chapters.map((chapter) => chapter.id)));
  const [drillBonus, setDrillBonus] = useState(0);
  const [drillOpen, setDrillOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ text: 'Checking academy progress sync…', tone: 'preview' });
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | null>(null);
  const syncRef = useRef<SyncClient | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const current = flatItems[currentIndex];
  const percent = Math.round(completed.size / flatItems.length * 100) || 0;
  const xp = completed.size * 100 + drillBonus;
  const rank = percent >= 100 ? 'Mission Ready' : percent >= 75 ? 'Specialist' : percent >= 40 ? 'Responder' : percent > 0 ? 'Recruit' : 'Rookie';
  const badges = [completed.size >= 1, percent >= 25, percent >= 50, drillBonus >= 100, percent >= 100];

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }, []);

  useEffect(() => { completedRef.current = completed; }, [completed]);
  useEffect(() => {
    document.body.classList.add('player-body');
    const local = JSON.parse(localStorage.getItem(storageKey) || '[]') as string[];
    const storedChapters = JSON.parse(localStorage.getItem(chapterStateKey) || '[]') as string[];
    setCompleted(new Set(local));
    if (storedChapters.length) setOpenChapters(new Set(storedChapters));
    setDrillBonus(Number(localStorage.getItem(drillBonusKey) || 0));
    if (window.location.hash === '#daily-drill') setDrillOpen(true);
    return () => document.body.classList.remove('player-body', 'drill-open');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { supabase, session, profile } = await getSessionProfile();
        if (!session) { setSyncStatus({ text: 'Preview mode · Log in and enroll to save progress across devices.', tone: 'preview' }); return; }
        if (!profile || profile.status !== 'approved') { setSyncStatus({ text: 'Your application must be approved before training progress can be recorded.', tone: 'warning' }); return; }
        const { data: remoteCourse, error: courseError } = await supabase.from('courses').select('id,slug,title').eq('slug', 'hazmat-awareness').single();
        if (courseError) throw courseError;
        if (profile.role !== 'student') { setSyncStatus({ text: `${profile.role.replace('_', ' ')} view · Course changes are not recorded.`, tone: 'staff' }); return; }
        const { data: enrollment, error: enrollmentError } = await supabase.from('enrollments').select('id,status').eq('course_id', remoteCourse.id).eq('student_id', session.user.id).maybeSingle();
        if (enrollmentError) throw enrollmentError;
        if (!enrollment || !['active', 'completed'].includes(enrollment.status)) { setSyncStatus({ text: 'Enrollment required · Return to your dashboard to enroll in this course.', tone: 'warning' }); return; }
        const { data: progress, error: progressError } = await supabase.from('lesson_progress').select('lesson_id').eq('course_id', remoteCourse.id).eq('user_id', session.user.id).eq('completed', true);
        if (progressError) throw progressError;
        const remoteIds = new Set((progress || []).map((item) => item.lesson_id));
        setCompleted((local) => { const merged = new Set([...local, ...remoteIds]); localStorage.setItem(storageKey, JSON.stringify([...merged])); return merged; });
        syncRef.current = {
          async saveLesson(lessonId) {
            if (remoteIds.has(lessonId)) return;
            const payload = { course_id: remoteCourse.id, user_id: session.user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() };
            const { error } = await supabase.from('lesson_progress').insert(payload);
            if (error?.code === '23505') {
              const { error: updateError } = await supabase.from('lesson_progress').update({ completed: true, completed_at: payload.completed_at }).eq('course_id', remoteCourse.id).eq('user_id', session.user.id).eq('lesson_id', lessonId);
              if (updateError) throw updateError;
            } else if (error) throw error;
            remoteIds.add(lessonId);
          },
          async saveAssessment(result) {
            const { error } = await supabase.from('quiz_attempts').insert({ course_id: remoteCourse.id, user_id: session.user.id, assessment_id: result.id, assessment_title: result.title, score: result.score, max_score: result.maxScore, answers: result.answers });
            if (error) throw error;
          }
        };
        setSyncStatus({ text: 'Cloud sync active · Progress and quiz scores are saved to your academy record.', tone: 'synced' });
        showToast('Your academy progress has been synced.');
      } catch (error) {
        console.warn('Course sync unavailable:', error);
        setSyncStatus({ text: 'Local mode · Cloud sync is temporarily unavailable. Your progress remains in this browser.', tone: 'warning' });
      }
    })();
  }, [showToast]);

  const markComplete = useCallback((id: string, quiet = false) => {
    if (completedRef.current.has(id)) return;
    const next = new Set(completedRef.current).add(id);
    completedRef.current = next;
    setCompleted(next);
    localStorage.setItem(storageKey, JSON.stringify([...next]));
    showToast(quiet ? '+100 XP. Training progress saved.' : '+100 XP. Lesson item complete.');
    syncRef.current?.saveLesson(id).catch(() => showToast('Saved locally. Cloud sync will retry on your next visit.'));
  }, [showToast]);

  const saveAssessment = async (result: AssessmentResult) => {
    try { await syncRef.current?.saveAssessment(result); } catch { showToast('Score saved locally; cloud score sync is unavailable.'); }
    showToast(`${result.title} submitted. Score: ${result.score} / ${result.maxScore}.`);
  };

  const chooseItem = (index: number) => {
    setCurrentIndex(index); setSidebarOpen(false); mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toggleChapter = (id: string) => {
    setOpenChapters((currentSet) => {
      const next = new Set(currentSet);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(chapterStateKey, JSON.stringify([...next]));
      return next;
    });
  };
  const next = () => {
    if (current.type === 'lesson') markComplete(current.id, true);
    if (currentIndex < flatItems.length - 1) chooseItem(currentIndex + 1); else showToast('Mission complete. You reached the end of HazMat Awareness.');
  };
  const finishDrill = (score: number) => {
    if (score > drillBonus) { setDrillBonus(score); localStorage.setItem(drillBonusKey, String(score)); }
  };

  return <div className="player-shell"><header className="player-topbar"><div className="player-topbar-left"><button className="btn btn-ghost btn-sm player-menu-btn" type="button" aria-label="Open course outline" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((value) => !value)}>☰</button><Brand /></div><div className="player-topbar-center"><span className="player-course-title">HazMat Awareness</span><span className="player-course-subtitle">Interactive course aligned to the supplied chapter content, quizzes, and tests.</span></div><div className="player-topbar-right"><div className="player-hud" aria-label="Training status"><span className="hud-stat"><small>Training XP</small><strong>{xp}</strong></span><span className="hud-stat"><small>Rank</small><strong>{rank}</strong></span></div><div className="top-progress-pill"><span>Progress</span><strong>{percent}%</strong></div><button className="drill-launcher" type="button" onClick={() => setDrillOpen(true)}><span>Daily Drill</span><strong>+150 XP</strong></button><Link className="btn btn-ghost btn-sm" href="/dashboard">Exit to dashboard</Link></div></header><div className="player-grid"><aside className={`player-sidebar${sidebarOpen ? ' open' : ''}`}><div className="player-sidebar-head"><div><span className="eyebrow">Course outline</span><h2>HazMat Awareness</h2><p>Three chapters, lesson sections, quizzes, and tests in one structured player.</p></div><button className="btn btn-ghost btn-sm sidebar-close" type="button" onClick={() => setSidebarOpen(false)}>Close</button></div><div className="player-progress-card"><div className="player-progress-label"><span>Completed items</span><strong>{percent}%</strong></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><div className="outline-meta"><span>{completed.size} completed</span><span>{flatItems.length} items</span></div></div><div className="badge-shelf" aria-label="Course achievements"><div className="badge-shelf-title"><span>Achievement badges</span><span>{badges.filter(Boolean).length} / 5</span></div><div className="badge-row">{['FR', 'SA', 'HS', 'DA', 'MR'].map((badge, index) => <span className={`academy-badge${badges[index] ? ' earned' : ''}`} key={badge}>{badge}</span>)}</div></div><div className="course-outline">{course.chapters.map((chapter) => { const open = openChapters.has(chapter.id); const done = chapter.items.filter((item) => completed.has(item.id)).length; return <section className={`outline-chapter${open ? ' open' : ''}`} key={chapter.id}><button className="outline-chapter-toggle" type="button" aria-expanded={open} onClick={() => toggleChapter(chapter.id)}><span><strong>{chapter.title}</strong>{chapter.subtitle && <small>{chapter.subtitle}</small>}</span><span className="outline-toggle-meta"><span className="outline-count">{done} / {chapter.items.length} complete</span><span className="outline-chevron">⌄</span></span></button><div className="outline-items">{chapter.items.map((item) => { const index = flatItems.findIndex((entry) => entry.id === item.id); return <button className={`outline-item outline-type-${item.type}${currentIndex === index ? ' active' : ''}${completed.has(item.id) ? ' done' : ''}`} type="button" onClick={() => chooseItem(index)} key={item.id}><span className="outline-status">{completed.has(item.id) ? '✓' : ''}</span><span className="outline-text"><small>{item.label}</small><strong>{item.title}</strong></span><span className="outline-badge">{item.type === 'assessment' ? item.title.toLowerCase().includes('quiz') ? 'Quiz' : 'Test' : 'Section'}</span></button>; })}</div></section>; })}</div><CourseSyncStatus status={syncStatus.text} tone={syncStatus.tone} /></aside><button className={`player-overlay${sidebarOpen ? ' show' : ''}`} type="button" aria-label="Close course outline" onClick={() => setSidebarOpen(false)} /><main className="player-main" ref={mainRef}><div className="player-lesson-wrapper"><div className="player-breadcrumb"><span>Fire and Rescue Academy</span><span>/</span><span>{current.chapterHeading}</span><span>/</span><span>{current.title}</span></div><article className="lesson-panel active"><header className="lesson-heading"><span className="mission-line">Mission {String(currentIndex + 1).padStart(2, '0')} of {flatItems.length}</span><span className="eyebrow">{current.chapterHeading}</span><h1>{current.title}</h1><p>{current.description || ''}</p><div className="lesson-meta-row"><span className="lesson-meta-chip">{current.label}</span><span className="lesson-meta-chip">{current.type === 'assessment' ? 'Assessment' : 'Interactive section'}</span><span className={`lesson-meta-chip${completed.has(current.id) ? ' success' : ''}`}>{completed.has(current.id) ? 'Completed' : 'Not yet completed'}</span></div></header><LessonMedia item={current} eager={currentIndex === 0} />{current.type === 'lesson' && <VisualBoard itemId={current.id} />}{current.type === 'assessment' ? <Assessment key={current.id} item={current} onComplete={() => markComplete(current.id, true)} onSave={saveAssessment} /> : <>{(current.blocks || []).map((block) => <section className="lesson-card" key={block.title}><h3>{block.title}</h3><div dangerouslySetInnerHTML={{ __html: block.body }} /></section>)}{current.activity && <Activity key={current.id} activity={current.activity} onComplete={() => markComplete(current.id, true)} />}<section className="lesson-card lesson-complete-card"><h3>Ready to continue?</h3><p>Mark this item complete, or move to the next item when you are done reviewing the material.</p><button className="btn btn-secondary" type="button" onClick={() => markComplete(current.id)}>Mark this item complete</button></section></>}</article><div className="player-actions"><button className="btn btn-ghost" type="button" disabled={currentIndex === 0} onClick={() => chooseItem(currentIndex - 1)}>Previous</button><button className="btn btn-primary" type="button" onClick={next}>{currentIndex === flatItems.length - 1 ? 'Finish course' : 'Next item'}</button></div></div></main></div><DailyDrill open={drillOpen} onClose={() => setDrillOpen(false)} onFinish={finishDrill} /><div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div></div>;
}
