'use client';

import { useState } from 'react';

const modes = {
  drill: { kicker: 'Bonus mission', title: 'Daily HazMat Drill', copy: 'Make three rapid awareness-level decisions. Correct calls earn XP; unsafe calls cost a life.', label: 'Available reward', reward: '+150 XP' },
  progress: { kicker: 'Readiness path', title: 'Mission Progress', copy: 'Each completed lesson adds 100 XP and advances a saved course-progress path from Rookie to Mission Ready.', label: 'Current completion', reward: '25%' },
  badges: { kicker: 'Achievements', title: 'Badge Locker', copy: 'Unlock First Response, Scene Aware, Hazard Spotter, Drill Ace, and Mission Ready through course actions.', label: 'Achievements', reward: '2 / 5' }
};

export function CommandPreview() {
  const [mode, setMode] = useState<keyof typeof modes>('drill');
  const current = modes[mode];
  return (
    <div className="command-console" data-reveal>
      <div className="console-head"><div className="console-profile"><span className="console-avatar">FR</span><span><strong>Academy learner</strong><small>Rank: Recruit</small></span></div><div className="console-xp"><small>Training XP</small><strong>450</strong></div></div>
      <div className="console-body">
        <div className="console-tabs" role="tablist" aria-label="Command center preview">
          {(Object.keys(modes) as Array<keyof typeof modes>).map((key) => <button key={key} className={mode === key ? 'active' : ''} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key)}>{key === 'drill' ? 'Daily drill' : key[0].toUpperCase() + key.slice(1)}</button>)}
        </div>
        <div className="console-panel" aria-live="polite"><span className="eyebrow">{current.kicker}</span><h3>{current.title}</h3><p>{current.copy}</p><div className="mission-reward"><span>{current.label}</span><strong>{current.reward}</strong></div><div className="console-badges" aria-label="Achievement preview"><span className="earned">FR</span><span className="earned">SA</span><span>HS</span><span>DA</span><span>MR</span></div></div>
      </div>
    </div>
  );
}
