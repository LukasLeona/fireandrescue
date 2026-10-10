'use client';

import { useState } from 'react';

const faqs = [
  ['Are the courses free?', 'Yes. Every course displayed in the current academy catalog is marked free.'],
  ['Do login and registration work?', 'Yes. Registration, email verification, the approval workflow, role-based access, and secure dashboards are connected to Supabase.'],
  ['Does the HazMat course track progress?', 'Yes. Preview progress is stored in the browser, and enrolled students also sync completed lessons and quiz attempts to their academy record.'],
  ['Is the site responsive?', 'Yes. The homepage, catalog, account flows, dashboards, and course player adapt to desktop, tablet, and mobile screens.']
];

export function FaqList() {
  const [open, setOpen] = useState(0);
  return <div className="faq-list">{faqs.map(([question, answer], index) => <div className={`faq-item${open === index ? ' open' : ''}`} key={question}><button className="faq-question" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}><span>{question}</span><span>+</span></button><div className="faq-answer"><div><p>{answer}</p></div></div></div>)}</div>;
}
