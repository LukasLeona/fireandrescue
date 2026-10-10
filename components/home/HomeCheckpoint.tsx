'use client';

import { useState } from 'react';

const options = [
  { text: 'Approach the container and read the label up close.', correct: false },
  { text: 'Maintain distance, recognize available clues, isolate the area, and request trained resources.', correct: true },
  { text: 'Move the container away from traffic.', correct: false },
  { text: 'Use a monitoring device to identify the product.', correct: false }
];

export function HomeCheckpoint() {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = selected === null ? null : options[selected].correct;
  return (
    <div className="checkpoint">
      <h4>Make your decision</h4><p>Select one answer. You will receive immediate feedback.</p>
      <div className="choice-grid">
        {options.map((option, index) => <button key={option.text} className={`choice${selected === index ? (option.correct ? ' correct' : ' wrong') : ''}`} onClick={() => setSelected(index)}>{option.text}</button>)}
      </div>
      <div className="check-feedback" aria-live="polite" style={{ color: correct === null ? undefined : correct ? 'var(--green-600)' : 'var(--danger)' }}>
        {correct === null ? '' : correct ? 'Correct. Awareness-level personnel should recognize the hazard, protect themselves, and request trained resources.' : 'Not quite. Awareness-level personnel should not enter the hot zone or handle the material.'}
      </div>
    </div>
  );
}
