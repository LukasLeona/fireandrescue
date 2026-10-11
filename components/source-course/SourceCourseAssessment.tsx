'use client';

import { useMemo, useState } from 'react';
import type { SourceCourseDefinition, SourceSlide } from '@/lib/source-course-types';
import type { SourceCourseTest } from '@/lib/source-course-tests';

export type SourceTestResult = {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  percent: number;
  answers: Array<number | null>;
};

type BuiltQuestion = {
  slide: SourceSlide;
  moduleName: string;
  excerpt: string;
  options: string[];
  correct: number;
};

function eligibleSlides(course: SourceCourseDefinition, test: SourceCourseTest) {
  return test.moduleIndexes.map((moduleIndex) => {
    const module = course.modules[moduleIndex];
    const seen = new Set<string>();
    return module.slides.filter((slide) => {
      const body = slide.content.find((block) => block.trim() !== slide.title.trim() && block.trim().length >= 45 && block.trim().length <= 700);
      const title = slide.title.trim().toLowerCase();
      if (!body || !title || title.startsWith('slide ') || seen.has(title)) return false;
      seen.add(title);
      return true;
    });
  });
}

function buildQuestions(course: SourceCourseDefinition, test: SourceCourseTest): BuiltQuestion[] {
  const pools = eligibleSlides(course, test);
  const allSlides = pools.flat();
  return Array.from({ length: test.questionCount }, (_, index) => {
    const poolIndex = index % pools.length;
    const pool = pools[poolIndex];
    const position = Math.min(pool.length - 1, Math.floor(((Math.floor(index / pools.length) + 1) / 4) * pool.length));
    const slide = pool[position];
    const excerpt = slide.content.find((block) => block.trim() !== slide.title.trim() && block.trim().length >= 45 && block.trim().length <= 700) || slide.content[0];
    const options = [slide.title];
    let offset = index + 3;
    while (options.length < 4 && offset < allSlides.length + index + 20) {
      const candidate = allSlides[offset % allSlides.length].title;
      if (!options.includes(candidate)) options.push(candidate);
      offset += 5;
    }
    const rotation = (index + poolIndex + 1) % options.length;
    const rotated = [...options.slice(rotation), ...options.slice(0, rotation)];
    return { slide, moduleName: course.meta.moduleNames[test.moduleIndexes[poolIndex]], excerpt, options: rotated, correct: rotated.indexOf(slide.title) };
  });
}

export function SourceCourseAssessment({ course, test, bestScore, onFinish }: { course: SourceCourseDefinition; test: SourceCourseTest; bestScore: number; onFinish: (result: SourceTestResult) => void }) {
  const questions = useMemo(() => buildQuestions(course, test), [course, test]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const score = questions.reduce((total, question, index) => total + (answers[index] === question.correct ? 1 : 0), 0);
  const percent = Math.round(score / questions.length * 100);
  const question = questions[current];

  const submit = () => {
    setSubmitted(true);
    onFinish({ id: test.id, title: test.title, score, maxScore: questions.length, percent, answers: questions.map((_, index) => answers[index] ?? null) });
  };

  const reset = () => {
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
  };

  return (
    <section className="source-test-card">
      <header className="source-test-heading"><div><span className="eyebrow">Course assessment</span><h2>{test.title}</h2><p>{test.description} Each passage is reproduced from the supplied module content.</p></div><div className="source-test-best"><small>Best score</small><strong>{bestScore}%</strong></div></header>
      <div className="source-test-status"><span>Question {current + 1} of {questions.length}</span><span>{Object.keys(answers).length} answered</span><span>Passing score {test.passingPercent}%</span></div>
      <div className="source-test-nav" aria-label="Test question navigator">{questions.map((entry, index) => <button className={`${current === index ? 'is-active ' : ''}${answers[index] !== undefined ? 'is-answered ' : ''}${submitted ? answers[index] === entry.correct ? 'is-correct' : 'is-wrong' : ''}`.trim()} type="button" key={index} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div>
      <div className="source-test-question">
        <span className="source-test-module">{question.moduleName} · source slide {question.slide.number}</span>
        <h3>Which source heading matches this passage?</h3>
        <blockquote>{question.excerpt}</blockquote>
        <div className="source-test-options">{question.options.map((option, optionIndex) => { const selected = answers[current] === optionIndex; const isCorrect = question.correct === optionIndex; const className = submitted && (selected || isCorrect) ? isCorrect ? 'is-correct' : 'is-wrong' : ''; return <label className={className} key={`${option}-${optionIndex}`}><input type="radio" name={`${test.id}-${current}`} checked={selected} onChange={() => { setAnswers((value) => ({ ...value, [current]: optionIndex })); setSubmitted(false); }} /><span><strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}</span></label>; })}</div>
        {submitted && <p className="source-test-feedback">The supplied module places this passage under “{question.slide.title}.”</p>}
      </div>
      <div className="source-test-controls"><button className="btn btn-ghost" type="button" disabled={current === 0} onClick={() => setCurrent((value) => Math.max(0, value - 1))}>Previous question</button><button className="btn btn-ghost" type="button" disabled={current === questions.length - 1} onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}>Next question</button><button className="btn btn-primary" type="button" onClick={submit}>Submit test</button><button className="text-button" type="button" onClick={reset}>Reset</button></div>
      {submitted && <div className={`source-test-result${percent >= test.passingPercent ? ' is-passed' : ''}`}><strong>{score}/{questions.length} · {percent}%</strong><span>{percent >= test.passingPercent ? 'Passing score achieved' : 'Review the assigned modules and try again'}</span></div>}
    </section>
  );
}
