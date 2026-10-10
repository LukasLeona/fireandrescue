'use client';

import { useEffect, useState } from 'react';

const questions = [
  { tag: 'Size-up', prompt: 'You see an unknown vapor near a damaged tank. Choose the awareness-level action.', options: ['Approach until the product label is readable.', 'Maintain distance, isolate the area, and request trained resources.', 'Attempt product control with available hand tools.'], correct: 1, explanation: 'Correct priority: recognize the hazard, protect yourself, control access, and notify the appropriate resources.' },
  { tag: 'Identify', prompt: 'You need initial transport-incident information. What is the safest useful sequence?', options: ['Observe a placard or ID number from safety, then use the ERG.', 'Open the container to confirm the product.', 'Wait beside the vehicle until the driver returns.'], correct: 0, explanation: 'Visible identification clues and the ERG can provide initial information without entering the hazard area.' },
  { tag: 'Protect', prompt: 'A bystander starts walking toward the established perimeter. What should you do?', options: ['Let them pass if they promise to stay upwind.', 'Ask them to photograph the placard for you.', 'Deny entry, move them away, and report through incident command.'], correct: 2, explanation: 'Isolation and access control protect the public while trained resources manage the incident.' }
];

export function DailyDrill({ open, onClose, onFinish }: { open: boolean; onClose: () => void; onFinish: (score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('drill-open', open);
    if (open) { setIndex(0); setLives(3); setScore(0); setSelected(null); setFinished(false); }
    return () => document.body.classList.remove('drill-open');
  }, [open]);
  if (!open) return null;
  const question = questions[index];
  const answer = (value: number) => {
    if (selected !== null) return;
    setSelected(value);
    if (value === question.correct) setScore((current) => current + 50); else setLives((current) => Math.max(0, current - 1));
  };
  const next = () => {
    if (lives === 0 || index === questions.length - 1) { setFinished(true); onFinish(score); return; }
    setIndex((current) => current + 1); setSelected(null);
  };
  return <div className="drill-modal"><section className="drill-dialog" role="dialog" aria-modal="true" aria-labelledby="dailyDrillTitle"><header className="drill-head"><div><span className="eyebrow">Bonus mission</span><h2 id="dailyDrillTitle">Daily HazMat Drill</h2></div><button type="button" aria-label="Close Daily Drill" onClick={onClose}>×</button></header><div className="drill-status"><span>Round <strong>{Math.min(index + 1, questions.length)} / {questions.length}</strong></span><span>Lives <strong aria-label={`${lives} lives remaining`}>{'♥ '.repeat(lives)}{'♡ '.repeat(3 - lives)}</strong></span><span>Score <strong>{score} XP</strong></span></div><div className="drill-meter"><span style={{ width: `${finished ? 100 : index / questions.length * 100}%` }} /></div><div className="drill-stage">{finished ? <div className="drill-report"><span className="eyebrow">Mission report</span><h3>{score >= 100 ? 'Drill complete. Strong decisions.' : 'Drill complete. Review and retry.'}</h3><p>You earned {score} XP and finished with {lives} lives remaining.</p><button className="btn btn-primary" type="button" onClick={onClose}>Return to course</button></div> : <><span className="drill-tag">{question.tag}</span><h3>{question.prompt}</h3><div className="drill-options">{question.options.map((option, optionIndex) => <button key={option} className={`${selected !== null && optionIndex === question.correct ? 'correct' : ''}${selected === optionIndex && optionIndex !== question.correct ? ' wrong' : ''}`} disabled={selected !== null} type="button" onClick={() => answer(optionIndex)}>{option}</button>)}</div>{selected !== null && <div className="drill-feedback"><strong>{selected === question.correct ? '+50 XP — correct call.' : 'Life lost — reset the scene.'}</strong><p>{question.explanation}</p><button className="btn btn-secondary btn-sm" type="button" onClick={next}>{lives === 0 || index === questions.length - 1 ? 'View mission report' : 'Next round'}</button></div>}</>}</div></section></div>;
}
