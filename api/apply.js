// Job applications from the "Find a job" page, with an optional CV, go to the MVEC Telegram chat.
import { clip, esc, isEmail, readBody, sendDocument, sendMessage } from '../lib/telegram.js';
import { readUpload } from '../lib/files.js';


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = readBody(req);
  if (clip(body.website, 200)) return res.status(200).json({ ok: true }); // honeypot

  const f = {
    name: clip(body.name, 120),
    email: clip(body.email, 160),
    phone: clip(body.phone, 40),
    nationality: clip(body.nationality, 80),
    location: clip(body.location, 80),
    role: clip(body.role, 120),
    experience: clip(body.experience, 40),
    message: clip(body.message, 2000),
  };
  if (!f.name || !f.phone || !f.nationality || !f.role || (f.email && !isEmail(f.email))) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const up = readUpload(body.cv);
  if (up.error) return res.status(400).json({ error: up.error });
  const cv = up.file;

  const line = (label, v) => (v ? `<b>${label}:</b> ${esc(v)}` : null);
  const text = [
    '<b>🧳 New job application</b>',
    '',
    line('Name', f.name),
    line('Role wanted', f.role),
    line('Nationality', f.nationality),
    line('Currently in', f.location),
    line('Experience', f.experience),
    line('Phone / WhatsApp', f.phone),
    line('Email', f.email),
    f.message ? '' : null,
    f.message ? esc(f.message) : null,
    cv ? '' : null,
    cv ? null : '<i>No CV attached</i>',
  ].filter((l) => l !== null).join('\n');

  try {
    if (cv && text.length <= 1000) await sendDocument(cv.buffer, cv.name, cv.mime, text);
    else if (cv) {
      await sendMessage(text);
      await sendDocument(cv.buffer, cv.name, cv.mime, `CV from ${esc(f.name)}`);
    }
    else await sendMessage(text);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Job application:', err.message);
    return res.status(502).json({ error: 'Could not send application.' });
  }
}
