'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { AssessmentResult, CourseItem } from '@/lib/course-types';

export function Assessment({ item, onComplete, onSave }: { item: CourseItem; onComplete: () => void; onSave: (result: AssessmentResult) => Promise<void> | void }) {
  const questions = item.questions || [];
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const answered = Object.keys(answers).length;
  const score = useMemo(() => questions.reduce((total, question, index) => total + (answers[index] === question.correct ? 1 : 0), 0), [answers, questions]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const result = { id: item.id, title: item.title, score, maxScore: questions.length, answers: questions.map((_, index) => answers[index] ?? null) };
    if (answered === questions.length) onComplete();
    void onSave(result);
  };
  const reset = () => { setAnswers({}); setSubmitted(false); setActive(0); };
  const question = questions[active];
  if (!question) return null;
  return <section className="lesson-card assessment-card"><div className="interactive-head"><span className="eyebrow">{item.title.toLowerCase().includes('quiz') ? 'Chapter quiz' : 'Chapter test'}</span><h3>{item.title}</h3><p>{item.description}</p></div>{item.gradingNote && <div className="assessment-note"><strong>Grading note:</strong> {item.gradingNote}</div>}<form className="assessment-form" onSubmit={submit}><div className="assessment-status-bar"><span>Question {active + 1} of {questions.length}</span><span>{answered} answered</span></div><div className="assessment-navigator" aria-label="Question navigator">{questions.map((entry, index) => <button className={`${active === index ? 'active ' : ''}${answers[index] !== undefined ? 'answered ' : ''}${submitted ? answers[index] === entry.correct ? 'correct' : 'wrong' : ''}`.trim()} type="button" onClick={() => setActive(index)} key={`${entry.sourceNumber || index}-${index}`} aria-label={`Go to question ${index + 1}`}>{index + 1}</button>)}</div><div className="assessment-question-stage"><fieldset className="assessment-question active"><legend><span className="question-number">{active + 1}</span>{question.q}</legend><div className="assessment-options">{question.options.map((option, optionIndex) => { const selected = answers[active] === optionIndex; const correct = question.correct === optionIndex; const className = submitted && (selected || correct) ? correct ? ' correct' : ' wrong' : ''; return <label className={`assessment-option${className}`} key={option}><input type="radio" name={`${item.id}-${active}`} value={optionIndex} checked={selected} onChange={() => { setAnswers((current) => ({ ...current, [active]: optionIndex })); setSubmitted(false); }} /><span><strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}</span></label>; })}</div><p className="question-feedback" aria-live="polite" style={{ color: submitted ? answers[active] === question.correct ? 'var(--green-600)' : 'var(--danger)' : undefined }}>{submitted ? answers[active] === undefined ? 'Select an answer to evaluate this question.' : question.explanation : ''}</p></fieldset></div><div className="assessment-step-actions"><button type="button" className="btn btn-ghost" disabled={active === 0} onClick={() => setActive((value) => Math.max(0, value - 1))}>Previous question</button><button type="button" className="btn btn-secondary" onClick={() => setActive((value) => value === questions.length - 1 ? 0 : value + 1)}>{active === questions.length - 1 ? 'Review first question' : 'Next question'}</button></div><div className="assessment-actions"><button type="submit" className="btn btn-primary">Submit {item.title.toLowerCase().includes('quiz') ? 'quiz' : 'test'}</button><button type="button" className="btn btn-ghost" onClick={reset}>Reset answers</button></div>{submitted && <div className="assessment-summary"><strong>Score:</strong> {score} / {questions.length} ({Math.round(score / questions.length * 100)}%)<br /><span>{answered === questions.length ? 'Assessment submitted and reviewed. Use the question navigator to inspect each answer.' : `${questions.length - answered} question(s) remain unanswered.`}</span></div>}</form></section>;
}
