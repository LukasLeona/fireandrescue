'use client';

import { FormEvent, useState } from 'react';

type Message = { role: 'user' | 'bot'; text: string };

const replies: Record<string, string> = {
  courses: 'Start with HazMat Awareness. The catalog also previews HazMat Operations, Fire Instructor 1, Fire Inspector 1, Driver Operator – Pumper, and Driver Operator – ARFF.',
  hazmat: 'HazMat Awareness focuses on recognition, role boundaries, hazard clues, safe information gathering, the ERG, and initial protective actions.',
  learning: 'The course includes decisions, matching, sorting, chapter assessments, cloud progress, experience points, achievement badges, and a three-round Daily Drill.',
  account: 'Create an account, verify your email, and wait for an administrator or instructor to approve the application. Approved members receive a role-aware dashboard.'
};

function chooseReply(value: string) {
  const text = value.toLowerCase();
  if (text.includes('haz')) return replies.hazmat;
  if (text.includes('quiz') || text.includes('interactive') || text.includes('learn')) return replies.learning;
  if (text.includes('login') || text.includes('account') || text.includes('register')) return replies.account;
  if (text.includes('course') || text.includes('training')) return replies.courses;
  return 'I can help with courses, HazMat training, learner accounts, or academy access.';
}

export function AcademyAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'bot', text: 'Welcome to Fire and Rescue Academy. How can I help with your training today?' }]);

  const send = (text: string, key?: keyof typeof replies) => {
    if (!text.trim()) return;
    setMessages((items) => [...items, { role: 'user', text }, { role: 'bot', text: key ? replies[key] : chooseReply(text) }]);
    setInput('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  return (
    <div className={`rs-bot${open ? ' open' : ''}`}>
      <button className="rs-bot-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span>Need help?</span></button>
      <div className="rs-bot-panel" role="dialog" aria-label="Academy assistant" hidden={!open}>
        <div className="rs-bot-head"><div><strong>Academy Assistant</strong><small>Training guide</small></div><div className="rs-bot-head-actions"><button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">×</button></div></div>
        <div className="rs-bot-body" aria-live="polite">
          {messages.map((message, index) => <div className={`rs-bot-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}
          {messages.length === 1 && <div className="rs-bot-quick-actions">
            <button type="button" onClick={() => send('What courses can I explore?', 'courses')}>What courses can I explore?</button>
            <button type="button" onClick={() => send('What does HazMat Awareness cover?', 'hazmat')}>What does HazMat Awareness cover?</button>
            <button type="button" onClick={() => send('How is the course interactive?', 'learning')}>How is the course interactive?</button>
            <button type="button" onClick={() => send('How do learner accounts work?', 'account')}>How do learner accounts work?</button>
          </div>}
        </div>
        <form className="rs-bot-compose" onSubmit={submit}><input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Ask the Academy Assistant" placeholder="Ask about courses or training" autoComplete="off" /><button className="rs-bot-send" type="submit" aria-label="Send message">→</button></form>
      </div>
    </div>
  );
}
