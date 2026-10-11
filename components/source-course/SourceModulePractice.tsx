'use client';

import { useMemo, useState } from 'react';
import type { SourceModule, SourceSlide } from '@/lib/source-course-types';

type PracticeQuestion = {
  source: SourceSlide;
  excerpt: string;
  options: string[];
};

function uniqueSlides(module: SourceModule) {
  const seen = new Set<string>();
  return module.slides.filter((slide) => {
    const body = slide.content.find((block) => block.trim() !== slide.title.trim() && block.trim().length >= 35 && block.trim().length <= 650);
    const key = slide.title.trim().toLowerCase();
    if (!body || !key || key.startsWith('slide ') || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildQuestions(module: SourceModule): PracticeQuestion[] {
  const slides = uniqueSlides(module);
  if (slides.length < 4) return [];
  const targetIndexes = [0.22, 0.5, 0.78].map((ratio) => Math.min(slides.length - 1, Math.floor(slides.length * ratio)));
  return targetIndexes.map((targetIndex, questionIndex) => {
    const source = slides[targetIndex];
    const excerpt = source.content.find((block) => block.trim() !== source.title.trim() && block.trim().length >= 35 && block.trim().length <= 650) || source.content[0];
    const distractors = [1, 2, 3].map((offset) => slides[(targetIndex + offset * (questionIndex + 2)) % slides.length].title);
    const options = [source.title, ...distractors].filter((value, index, values) => values.indexOf(value) === index);
    while (options.length < 4) options.push(slides[(targetIndex + options.length + 5) % slides.length].title);
    const rotation = (module.chapter + questionIndex) % options.length;
    return { source, excerpt, options: [...options.slice(rotation), ...options.slice(0, rotation)] };
  });
}

export function SourceModulePractice({ module, moduleName, previousBest, onFinish }: { module: SourceModule; moduleName: string; previousBest: number; onFinish: (score: number) => void }) {
  const questions = useMemo(() => buildQuestions(module), [module]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[questionIndex];

  if (!question) return <section className="source-practice-card"><span className="eyebrow">Module exercise</span><h2>{moduleName}</h2><p>This module is primarily visual. Continue reviewing the original source slides to complete the module.</p></section>;

  const choose = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === question.source.title) setScore((value) => value + 25);
  };

  const advance = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      setSelected(null);
      return;
    }
    setFinished(true);
    onFinish(score);
  };

  const restart = () => {
    setQuestionIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return <section className="source-practice-card source-practice-result"><span className="source-practice-medal">{score === 75 ? '★' : '✓'}</span><span className="eyebrow">Module exercise complete</span><h2>{moduleName}</h2><strong>{score} / 75 XP</strong><p>{score === 75 ? 'Perfect source recall. All three passages matched their original headings.' : 'Review the source slides, then replay this exercise to improve your score.'}</p>{previousBest > 0 && <small>Previous best: {previousBest} XP</small>}<button className="btn btn-secondary" type="button" onClick={restart}>Play again</button></section>;
  }

  return (
    <section className="source-practice-card">
      <div className="source-practice-heading"><div><span className="eyebrow">Module source challenge</span><h2>{moduleName}</h2></div><div className="source-practice-score"><span>Round {questionIndex + 1}/{questions.length}</span><strong>{score} XP</strong></div></div>
      <div className="source-practice-meter"><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
      <div className="source-practice-prompt"><small>Match this exact passage to its source heading</small><blockquote>{question.excerpt}</blockquote></div>
      <div className="source-practice-options">
        {question.options.map((option, index) => {
          const isCorrect = option === question.source.title;
          const className = selected ? isCorrect ? 'is-correct' : selected === option ? 'is-wrong' : '' : '';
          return <button className={className} type="button" key={`${option}-${index}`} onClick={() => choose(option)} disabled={Boolean(selected)}><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong></button>;
        })}
      </div>
      {selected && <div className={`source-practice-feedback${selected === question.source.title ? ' is-correct' : ' is-wrong'}`}><strong>{selected === question.source.title ? '+25 XP · Correct' : 'Review this source heading'}</strong><p>The passage appears on source slide {question.source.number}, “{question.source.title}.”</p><button className="btn btn-primary" type="button" onClick={advance}>{questionIndex === questions.length - 1 ? 'Finish exercise' : 'Next passage'}</button></div>}
    </section>
  );
}
