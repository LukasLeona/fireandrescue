'use client';

import { useState } from 'react';
import type { CourseActivity } from '@/lib/course-types';

export function Activity({ activity, onComplete }: { activity: CourseActivity; onComplete: () => void }) {
  if (activity.type === 'quickCheck') return <QuickCheck activity={activity} onComplete={onComplete} />;
  if (activity.type === 'matching') return <Matching activity={activity} onComplete={onComplete} />;
  return <DragSort activity={activity} onComplete={onComplete} />;
}

function QuickCheck({ activity, onComplete }: { activity: Extract<CourseActivity, { type: 'quickCheck' }>; onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = selected === null ? null : activity.options[selected].correct;
  const choose = (index: number) => { setSelected(index); if (activity.options[index].correct) onComplete(); };
  return <section className="lesson-card interactive-card"><div className="interactive-head"><span className="eyebrow">Learning checkpoint</span><h3>{activity.prompt}</h3></div><div className="option-list">{activity.options.map((option, index) => <button className={`quiz-option${selected === index ? option.correct ? ' correct' : ' wrong' : ''}`} type="button" onClick={() => choose(index)} key={option.text}><span className="quiz-letter">{String.fromCharCode(65 + index)}</span>{option.text}</button>)}</div><p className="quiz-feedback" aria-live="polite" style={{ color: correct === null ? undefined : correct ? 'var(--green-600)' : 'var(--danger)' }}>{correct === null ? '' : correct ? activity.correctMessage : activity.wrongMessage}</p></section>;
}

function Matching({ activity, onComplete }: { activity: Extract<CourseActivity, { type: 'matching' }>; onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const rightOrder = [...activity.pairs.keys()].reverse();
  const chooseRight = (index: number) => {
    if (selected === null || matched.has(index)) return;
    if (selected === index) {
      const next = new Set(matched).add(index);
      setMatched(next); setSelected(null);
      if (next.size === activity.pairs.length) onComplete();
    }
  };
  return <section className="lesson-card interactive-card"><div className="interactive-head"><span className="eyebrow">Matching activity</span><h3>{activity.prompt}</h3></div><div className="match-layout"><div className="match-column-title">{activity.leftTitle}</div><div className="match-column-title">{activity.rightTitle}</div><div className="match-board"><div className="match-column">{activity.pairs.map((pair, index) => <button className={`match-item${selected === index ? ' selected' : ''}${matched.has(index) ? ' matched' : ''}`} type="button" disabled={matched.has(index)} onClick={() => setSelected(index)} key={pair.left}>{pair.left}</button>)}</div><div className="match-column">{rightOrder.map((index) => <button className={`match-item${matched.has(index) ? ' matched' : ''}`} type="button" disabled={matched.has(index)} onClick={() => chooseRight(index)} key={activity.pairs[index].right}>{activity.pairs[index].right}</button>)}</div></div></div><p className="match-feedback" aria-live="polite" style={{ color: matched.size === activity.pairs.length ? 'var(--green-600)' : undefined }}>{matched.size === activity.pairs.length ? activity.successMessage : selected === null ? 'Select a term, then choose its matching description.' : 'Now choose the matching description.'}</p></section>;
}

function DragSort({ activity, onComplete }: { activity: Extract<CourseActivity, { type: 'dragSort' }>; onComplete: () => void }) {
  const [placements, setPlacements] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('Select or drag each clue into a group.');
  const place = (index: number, group: string) => {
    const next = { ...placements, [index]: group };
    setPlacements(next); setSelected(null);
    if (Object.keys(next).length === activity.items.length) {
      const correct = activity.items.every((item, itemIndex) => next[itemIndex] === item.group);
      setFeedback(correct ? activity.successMessage : 'Some cards are in the wrong group. Select a card to move it.');
      if (correct) onComplete();
    }
  };
  const chip = (item: { text: string; group: string }, index: number) => <button className={`drag-chip${selected === index ? ' selected' : ''}`} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))} onClick={() => setSelected(index)} type="button" key={item.text}>{item.text}</button>;
  return <section className="lesson-card interactive-card"><div className="interactive-head"><span className="eyebrow">Drag and drop</span><h3>{activity.prompt}</h3></div><div className="drag-chip-bank">{activity.items.map((item, index) => placements[index] ? null : chip(item, index))}</div><div className="drag-grid">{activity.groups.map((group) => <div className="drop-zone" key={group.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => place(Number(event.dataTransfer.getData('text/plain')), group.id)} onClick={() => selected !== null && place(selected, group.id)}><strong>{group.title}</strong>{activity.items.map((item, index) => placements[index] === group.id ? chip(item, index) : null)}</div>)}</div><p className="drag-feedback" aria-live="polite" style={{ color: feedback === activity.successMessage ? 'var(--green-600)' : undefined }}>{feedback}</p></section>;
}
