import type { Metadata } from 'next';
import Link from 'next/link';
import { CommandPreview } from '@/components/home/CommandPreview';
import { FaqList } from '@/components/home/FaqList';
import { HomeCheckpoint } from '@/components/home/HomeCheckpoint';
import { CourseCard } from '@/components/site/CourseCard';
import { PublicShell } from '@/components/site/PublicShell';
import { catalogCourses } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Fire and Rescue Academy | Professional Firefighter Training',
  description: 'Interactive online training for firefighters and emergency-response professionals.',
  alternates: { canonical: '/' }
};

const pathways = [
  ['Hazardous Materials', 'Recognition, initial actions, resources, and operational support.', '2 courses'],
  ['Instruction & Leadership', 'Develop effective instructors and confident fire-service leaders.', '1 course'],
  ['Inspection & Prevention', 'Support code awareness, risk reduction, and documentation.', '1 course'],
  ['Driver Operator', 'Strengthen apparatus safety, systems knowledge, and operations.', '2 courses']
];

export default function HomePage() {
  return (
    <PublicShell>
      <main id="main">
        <section className="hero hero-immersive" aria-labelledby="hero-title">
          <img className="hero-backdrop" src="/assets/images/home-hero-firefighters.png" alt="Firefighters planning a training operation inside a station" width="1672" height="941" fetchPriority="high" />
          <div className="hero-shade" aria-hidden="true" />
          <div className="hero-rail" aria-hidden="true"><span>TRAIN</span><span>PREPARE</span><span>RESPOND</span></div>
          <div className="container hero-stage">
            <div className="hero-copy" data-reveal><span className="eyebrow">Professional fire-service learning</span><h1 id="hero-title">Ready for the call.<br /><span>Built in the academy.</span></h1><p>Focused online training for firefighters and emergency-response professionals, with practical scenarios, immediate feedback, and visible progress.</p><div className="hero-actions"><Link className="btn btn-primary" href="/courses">Explore free courses →</Link><Link className="btn btn-hero-quiet" href="/hazmat-course">Experience HazMat Awareness ▶</Link></div></div>
            <div className="hero-mission" data-reveal><span className="mission-number">01</span><div><strong>Current training mission</strong><Link href="/hazmat-course">Recognize the hazard. Protect the scene. Make the safe call.</Link></div></div>
          </div>
          <a className="hero-scroll" href="#pathways"><span>Scroll to explore</span><i aria-hidden="true" /></a>
        </section>

        <section className="trust-strip"><div className="container trust-grid"><p className="trust-title">An LMS designed around the fire-service training environment.</p>{['Interactive checkpoints', 'Safety-first content', 'Cloud progress tracking', 'Professional pathways'].map((item) => <div className="trust-item" key={item}><span className="mark">✓</span>{item}</div>)}</div></section>

        <section className="section" id="pathways"><div className="container"><div className="section-heading" data-reveal><span className="eyebrow">Training pathways</span><h2>Purpose-built learning for the work firefighters do.</h2><p>Browse structured programs across hazardous materials, instruction, prevention, and apparatus operations.</p></div><div className="grid four-col">{pathways.map(([title, copy, count], index) => <div className="category-card" data-reveal key={title}><div className="category-icon">{String(index + 1).padStart(2, '0')}</div><h3>{title}</h3><p>{copy}</p><span className="count">{count}</span></div>)}</div></div></section>

        <section className="section bg-mist"><div className="container"><div className="section-heading" data-reveal><span className="eyebrow">Featured free courses</span><h2>Start with practical, job-relevant training.</h2><p>Every course in the catalog is free, with structured lessons and interactive learning checks.</p></div><div className="course-grid">{catalogCourses.slice(0, 3).map((course) => <CourseCard course={course} key={course.title} />)}</div><div style={{ marginTop: 32, textAlign: 'center' }}><Link className="btn btn-secondary" href="/courses">Browse all courses →</Link></div></div></section>

        <section className="section"><div className="container two-col grid"><div className="about-visual photo-panel" data-reveal><img src="/assets/images/hazmat-training-photo.png" alt="Firefighters reviewing hazmat materials and placards during training" /><div className="hero-badge hero-badge-inline"><span className="badge-icon">✓</span><span><strong>Scenario-focused lessons</strong><small>Visual training moments that keep learners engaged</small></span></div></div><div className="about-copy" data-reveal><span className="eyebrow">More than a reading site</span><h2>Learning that asks the firefighter to participate.</h2><p>Fire and Rescue Academy breaks complex topics into focused instruction, then reinforces understanding through decisions, matching activities, drag-and-drop exercises, and scenario questions.</p><ul className="check-list"><li><span className="check">✓</span><span><strong>Short focused lessons</strong><br />Information is structured for clarity and quick review.</span></li><li><span className="check">✓</span><span><strong>Immediate feedback</strong><br />Learners understand why a response is safe or unsafe.</span></li><li><span className="check">✓</span><span><strong>Visible progress</strong><br />Approved students sync completion to their learner record.</span></li></ul><Link className="btn btn-primary" style={{ marginTop: 28 }} href="/hazmat-course">Try HazMat Awareness →</Link></div></div></section>

        <section className="field-lab" aria-labelledby="field-lab-title"><img src="/assets/images/hazmat-recognition-yard.jpg" alt="Firefighters observing an industrial rail incident from behind a safety perimeter" width="1536" height="1024" loading="lazy" /><div className="field-lab-shade" aria-hidden="true" /><div className="container field-lab-content"><div className="field-lab-copy" data-reveal><span className="eyebrow">Inside the HazMat field lab</span><h2 id="field-lab-title">Train your eyes before you move your feet.</h2><p>The course pairs its original topics with natural incident photography and visual study boards. Learners practice reading the scene from a protected position before choosing an action.</p><ol className="field-clue-list">{['Location and occupancy', 'Containers and shapes', 'Placards and markings', 'Safe information resources'].map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></li>)}</ol><Link className="btn btn-primary" href="/hazmat-course">Enter the visual course →</Link></div></div></section>

        <section className="section bg-dark"><div className="container"><div className="section-heading center" data-reveal><span className="eyebrow" style={{ color: 'var(--cream)' }}>How Fire and Rescue Academy works</span><h2>From first concept to field-ready thinking.</h2><p>Each learning sequence follows a consistent cycle designed to build understanding and reinforce safe decision-making.</p></div><div className="grid three-col">{[['01 / LEARN', 'See the essential information.', 'Clear explanations, key terms, and operational boundaries establish the foundation.'], ['02 / APPLY', 'Make a decision.', 'Scenario prompts and sorting activities require the learner to use what they just studied.'], ['03 / VERIFY', 'Receive useful feedback.', 'Immediate explanations reinforce correct actions and identify unsafe assumptions.']].map(([number, title, copy]) => <div className="feature-card" data-reveal key={number}><span className="feature-no">{number}</span><h3>{title}</h3><p>{copy}</p><div className="feature-icon">✓</div></div>)}</div></div></section>

        <section className="section"><div className="container"><div className="section-heading" data-reveal><span className="eyebrow">Interactive preview</span><h2>A learning checkpoint, directly in the lesson.</h2><p>This preview shows how Fire and Rescue Academy converts course content into decisions—not passive scrolling.</p></div><div className="demo-panel" data-reveal><aside className="demo-sidebar"><div className="demo-progress"><strong><span>Course progress</span><span>25%</span></strong><div className="progress-track"><span style={{ width: '25%' }} /></div></div>{['Defining hazardous materials', 'Roles and responsibilities', 'Seven clues to hazmat', 'Using the ERG'].map((item, index) => <div className={`demo-nav-item${index === 0 ? ' done' : index === 1 ? ' active' : ''}`} key={item}><span className="demo-dot" /><span>{item}</span></div>)}</aside><div className="demo-content"><div className="demo-topline"><span className="demo-label">HazMat Awareness · Checkpoint</span><span className="level-tag">Awareness level</span></div><h3>Choose the safest initial action.</h3><p>You arrive at a transport incident and observe a damaged container with an unknown product. What is the appropriate awareness-level response?</p><HomeCheckpoint /></div></div></div></section>

        <section className="section-sm bg-mist"><div className="container stats-grid">{[['6', 'professional course pathways'], ['100%', 'free courses in this academy'], ['16', 'HazMat Awareness lesson topics'], ['7+', 'visual and interactive learning formats']].map(([value, label]) => <div className="stat-card" data-reveal key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>

        <section className="section academy-command" aria-labelledby="command-title"><div className="container command-grid"><div className="command-copy" data-reveal><span className="eyebrow">Learner command center</span><h2 id="command-title">Your progress should feel alive.</h2><p>The academy turns progress into an active training loop. Complete lesson missions, earn experience points, protect your three lives in the Daily Drill, and unlock achievement badges as your readiness grows.</p><ul className="command-points"><li><span>✓</span> Three-round Daily HazMat Drill</li><li><span>✓</span> Training XP and visible rank progression</li><li><span>✓</span> Five unlockable course achievements</li><li><span>✓</span> Progress synced for enrolled students</li></ul><Link className="btn btn-secondary" style={{ marginTop: 28 }} href="/hazmat-course#daily-drill">Play the Daily Drill →</Link></div><CommandPreview /></div></section>

        <section className="section"><div className="container two-col grid"><div className="section-heading" data-reveal><span className="eyebrow">The academy standard</span><h2>Every screen has a training purpose.</h2><p>Lessons move from recognition to decision-making, then reinforce the safest response with immediate, useful feedback.</p></div><ol className="standard-list" data-reveal>{[['See the operational context', 'Natural photography and clear visual cues connect concepts to environments responders recognize.'], ['Make the decision', 'Checks, matches, and sorting activities turn the lesson into an active training mission.'], ['Track your readiness', 'Progress, experience points, and achievement badges make advancement visible.']].map(([title, copy], index) => <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{title}</strong><p>{copy}</p></div></li>)}</ol></div></section>

        <section className="section bg-mist"><div className="container"><div className="section-heading center" data-reveal><span className="eyebrow">Frequently asked questions</span><h2>What the Fire and Rescue Academy includes.</h2></div><FaqList /></div></section>
        <section className="section"><div className="container"><div className="cta-shell" data-reveal><div><h2>Begin your first academy mission.</h2><p>Open the interactive HazMat Awareness course and experience the complete learning platform.</p></div><Link className="btn btn-cream" href="/hazmat-course">Launch course →</Link></div></div></section>
      </main>
    </PublicShell>
  );
}
