'use client';

import { FormEvent, useState } from 'react';

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.currentTarget.reset();
    setSent(true);
  };
  return (
    <form className="contact-form form-grid" onSubmit={submit} data-reveal>
      <div><h2 style={{ margin: '0 0 8px' }}>Send a message</h2><p style={{ margin: 0, color: 'var(--ink-soft)' }}>Share an implementation, course migration, or training-support inquiry.</p></div>
      <div className="form-group"><label htmlFor="name">Name</label><input className="form-control" id="name" name="name" required /></div>
      <div className="form-group"><label htmlFor="email">Email</label><input className="form-control" id="email" name="email" type="email" required /></div>
      <div className="form-group"><label htmlFor="topic">Topic</label><select className="form-control" id="topic" name="topic"><option>General inquiry</option><option>LMS development</option><option>Course migration</option><option>Organization implementation</option></select></div>
      <div className="form-group"><label htmlFor="message">Message</label><textarea className="form-control" id="message" name="message" required /></div>
      {sent && <div className="auth-message is-success" role="status">Message captured. Production email delivery can be connected through the academy mail provider.</div>}
      <button className="btn btn-primary" type="submit">Send message →</button>
    </form>
  );
}
