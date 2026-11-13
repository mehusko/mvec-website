// Worker registration (/register): a job seeker's profile, with an optional CV or photo,
// goes to the MVEC Telegram chat.
import { clip, esc, isEmail, readBody, sendDocument, sendMessage } from '../lib/telegram.js';
import { readUpload } from '../lib/files.js';
import { saveRecord } from '../lib/records.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = readBody(req);
  if (clip(body.website, 200)) return res.status(200).json({ ok: true }); // honeypot

  const f = {
    name: clip(body.name, 120),
    dob: clip(body.dob, 20),
    gender: clip(body.gender, 20),
    country: clip(body.country, 80),
    phone: clip(body.phone, 40),
    email: clip(body.email, 160),
    location: clip(body.location, 80),
    sector: clip(body.sector, 80),
    role: clip(body.role, 120),
    experience: clip(body.experience, 40),
    languages: clip(body.languages, 200),
    passport: clip(body.passport, 60),
    available: clip(body.available, 60),
    skills: clip(body.skills, 2000),
  };
  if (!f.name || !f.phone || (f.dob && !/^\d{4}-\d{2}-\d{2}$/.test(f.dob)) || (f.email && !isEmail(f.email))) {
    return res.status(400).json({ error: 'Please fill in your name and phone number.' });
  }
  if (!body.consent) return res.status(400).json({ error: 'Please tick the box to agree.' });

  const up = readUpload(body.cv, 'profile');
  if (up.error) return res.status(400).json({ error: up.error });
  const file = up.file;

  const age = f.dob && Math.floor((Date.now() - Date.parse(f.dob)) / (365.25 * 864e5));
  const line = (label, v) => (v ? `<b>${label}:</b> ${esc(v)}` : null);
  const text = [
    '<b>🪪 New worker registration</b>',
    '',
    line('Name', f.name),
    line('Date of birth', f.dob && f.dob + (age > 0 && age < 100 ? ` (age ${age})` : '')),
    line('Gender', f.gender),
    line('Country', f.country),
    line('Currently in', f.location),
    line('Field', f.sector),
    line('Job wanted', f.role),
    line('Experience', f.experience),
    line('Languages', f.languages),
    line('Passport', f.passport),
    line('Can start', f.available),
    line('Phone / WhatsApp', f.phone),
    line('Email', f.email),
    f.skills ? '' : null,
    f.skills ? esc(f.skills) : null,
    file ? null : '',
    file ? null : '<i>No CV or photo attached</i>',
  ].filter((l) => l !== null).join('\n');

  await saveRecord('registration', { ...f, file: file ? file.name : '' });

  try {
    if (file && text.length <= 1000) await sendDocument(file.buffer, file.name, file.mime, text);
    else if (file) {
      await sendMessage(text);
      await sendDocument(file.buffer, file.name, file.mime, `From ${esc(f.name)} (registration)`);
    } else await sendMessage(text);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Worker registration:', err.message);
    return res.status(502).json({ error: 'Could not send your registration.' });
  }
}
