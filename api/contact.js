// Website inquiries (contact form and worker requests) go to the MVEC Telegram chat.
import { clip, esc, isEmail, readBody, sendMessage } from '../lib/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = readBody(req);
  if (clip(body.website, 200)) return res.status(200).json({ ok: true }); // honeypot

  const f = {
    name: clip(body.name, 120),
    company: clip(body.company, 160),
    email: clip(body.email, 160),
    phone: clip(body.phone, 40),
    service: clip(body.service, 80),
    source: clip(body.source, 80),
    worker: clip(body.worker, 200),
    count: clip(body.count, 20),
    message: clip(body.message, 3000),
  };
  const isWorkerRequest = !!f.worker;
  if (!f.name || !f.email || !f.phone || !isEmail(f.email) || (!isWorkerRequest && (!f.service || !f.message))) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const line = (label, v) => (v ? `<b>${label}:</b> ${esc(v)}` : null);
  const text = [
    isWorkerRequest ? '<b>👷 New worker request</b>' : '<b>📩 New website inquiry</b>',
    '',
    line('Name', f.name),
    line('Company', f.company),
    line('Email', f.email),
    line('Phone', f.phone),
    line('Worker', f.worker),
    line('How many', f.count),
    line('Service', f.service),
    line('Heard via', f.source),
    f.message ? '' : null,
    f.message ? esc(f.message) : null,
  ].filter((l) => l !== null).join('\n');

  try {
    await sendMessage(text);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form:', err.message);
    return res.status(502).json({ error: 'Could not send message.' });
  }
}
