// Quota applications from employers. Two steps so large uploads fit Vercel's 4.5 MB request limit:
//   1) {action:"start", ...company details}  -> sends a summary to Telegram, returns a reference
//   2) {action:"file", ref, label, file:{name,type,data}} -> sends one document to Telegram (one request per file)
import { clip, esc, isEmail, readBody, sendDocument, sendMessage } from '../lib/telegram.js';
import { saveFormRecord } from '../lib/admin.js';
import { normalizePhone, otpEnabled, verifyCode } from '../lib/otp.js';
import fs from 'node:fs';
import path from 'node:path';

// Quota types and MVEC's internal document checklist per type (also used by the page's dropdown).
let TYPES = null;
function quotaTypes() {
  if (!TYPES) {
    try { TYPES = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'quota-types.json'), 'utf8')); }
    catch (e) { console.error('quota-types.json not readable', e.message); TYPES = { common: [], types: [] }; }
  }
  return TYPES;
}

const MAX_FILE_BYTES = 3.2 * 1024 * 1024;
const ALLOWED = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx' };
const REF_RE = /^Q-\d{6}-[A-Z0-9]{4}$/;

function newRef() {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const rand = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  return `Q-${ymd}-${rand}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = readBody(req);
  if (clip(body.website, 200)) return res.status(200).json({ ok: true, ref: newRef() }); // honeypot

  try {
    if (body.action === 'file') {
      const ref = clip(body.ref, 20);
      const label = clip(body.label, 80) || 'Document';
      const file = body.file || {};
      const mime = clip(file.type, 120);
      if (!REF_RE.test(ref)) return res.status(400).json({ error: 'Invalid reference.' });
      if (!ALLOWED[mime]) return res.status(400).json({ error: `${label}: please upload a PDF, photo or Word file.` });
      const buffer = Buffer.from(String(file.data || ''), 'base64');
      if (!buffer.length) return res.status(400).json({ error: `${label}: file is empty.` });
      if (buffer.length > MAX_FILE_BYTES) return res.status(400).json({ error: `${label}: file is too large (max 3 MB).` });
      const name = clip(file.name, 100).replace(/[^\w.\- ]+/g, '_') || `${label}.${ALLOWED[mime]}`;
      await sendDocument(buffer, name, mime, `📎 <b>${esc(ref)}</b> · ${esc(label)}`);
      return res.status(200).json({ ok: true });
    }

    const f = {
      company: clip(body.company, 160),
      regno: clip(body.regno, 60),
      qtype: clip(body.qtype, 40),
      qother: clip(body.qother, 120),
      island: clip(body.island, 120),
      contact: clip(body.contact, 120),
      position: clip(body.position, 80),
      phone: clip(body.phone, 40),
      email: clip(body.email, 160),
      workers: clip(body.workers, 10),
      roles: clip(body.roles, 500),
      nationality: clip(body.nationality, 120),
      service: clip(body.service, 80),
      message: clip(body.message, 2000),
      files: Math.max(0, Math.min(20, parseInt(body.files, 10) || 0)),
    };
    if (!f.company || !f.qtype || (f.qtype === 'other' && !f.qother) || !f.contact || !f.phone || !f.email || !isEmail(f.email) || !f.workers || !f.roles) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }
    if (otpEnabled()) {
      const ph = normalizePhone(f.phone);
      if (!(await verifyCode(ph, clip(body.otpCode, 10), body.otpExp, clip(body.otpSig, 300)))) {
        return res.status(400).json({ error: 'Please verify your phone number with the code we sent you.' });
      }
    }
    const cfg = quotaTypes();
    const type = cfg.types.find((t) => t.id === f.qtype);
    const typeLabel = f.qtype === 'other' ? `Other: ${f.qother}` : (type ? type.label : f.qtype);
    const checklist = type ? [...(cfg.common || []), ...(type.docs || [])] : (cfg.common || []);
    const ref = newRef();
    await saveFormRecord('quota', { ...f, ref }); // admin copy; never blocks the form
    const line = (label, v) => (v ? `<b>${label}:</b> ${esc(v)}` : null);
    const text = [
      `<b>🏢 New quota application</b>  <code>${ref}</code>`,
      '',
      line('Quota for', typeLabel),
      line('Company', f.company),
      line('Registration no.', f.regno),
      line('Island / site', f.island),
      line('Contact person', f.position ? `${f.contact} (${f.position})` : f.contact),
      line('Phone', otpEnabled() ? `${f.phone} ✅ verified` : f.phone),
      line('Email', f.email),
      '',
      line('Workers needed', f.workers),
      line('Job roles', f.roles),
      line('Preferred nationality', f.nationality),
      line('Service', f.service),
      f.message ? '' : null,
      f.message ? esc(f.message) : null,
      '',
      f.files ? `<i>${f.files} document(s) from the client following…</i>` : '<i>Client uploaded no documents</i>',
      checklist.length ? '' : null,
      checklist.length ? `<b>📋 Documents to collect (${esc(f.qtype === 'other' ? 'general' : typeLabel)}):</b>` : null,
      ...checklist.map((d) => `• ${esc(d.label)}`),
    ].filter((l) => l !== null).join('\n');
    await sendMessage(text);
    return res.status(200).json({ ok: true, ref });
  } catch (err) {
    console.error('Quota application:', err.message);
    return res.status(502).json({ error: 'Could not send your application.' });
  }
}
