// Saved copies of worker registrations and job applications, so staff can download
// them as a spreadsheet (/registrations on Telegram). Stored in Vercel Blob, encrypted
// with AES-256-GCM because the store is public. Env: BLOB_READ_WRITE_TOKEN, DATA_ENCRYPTION_KEY.
// Never change DATA_ENCRYPTION_KEY: records saved with the old key can no longer be read.
import crypto from 'node:crypto';

const PREFIX = 'records/';
const keyBytes = () => {
  const k = Buffer.from(String(process.env.DATA_ENCRYPTION_KEY || ''), 'base64');
  return k.length === 32 ? k : null;
};
export const recordsReady = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN && keyBytes());

export function encrypt(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', keyBytes(), iv);
  const body = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]);
}

export function decrypt(buf) {
  const d = crypto.createDecipheriv('aes-256-gcm', keyBytes(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8'));
}

// Never throws: a failed save must not stop the Telegram message.
export async function saveRecord(kind, fields) {
  if (!recordsReady()) return;
  try {
    const { put } = await import('@vercel/blob');
    const at = new Date().toISOString();
    await put(`${PREFIX}${kind}/${at.replace(/[:.]/g, '-')}.bin`, encrypt({ kind, at, ...fields }), {
      access: 'public', contentType: 'application/octet-stream', addRandomSuffix: true,
    });
  } catch (err) {
    console.error('Save record:', err.message);
  }
}

export async function loadRecords() {
  const { list } = await import('@vercel/blob');
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const out = [];
  for (let i = 0; i < blobs.length; i += 25) {
    const batch = await Promise.all(blobs.slice(i, i + 25).map(async (b) => {
      try {
        const r = await fetch(b.url, { cache: 'no-store' });
        return decrypt(Buffer.from(await r.arrayBuffer()));
      } catch { return null; }
    }));
    out.push(...batch.filter(Boolean));
  }
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

const COLUMNS = [
  ['at', 'Date'], ['kind', 'Type'], ['name', 'Name'], ['phone', 'Phone / WhatsApp'], ['email', 'Email'],
  ['role', 'Job wanted'], ['country', 'Country'], ['nationality', 'Nationality'], ['location', 'Currently in'],
  ['sector', 'Field'], ['experience', 'Experience'], ['languages', 'Languages'], ['passport', 'Passport'],
  ['available', 'Can start'], ['dob', 'Date of birth'], ['gender', 'Gender'], ['skills', 'Skills'],
  ['message', 'Notes'], ['file', 'CV / photo'],
];
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s) && !/^\+[\d\s()-]+$/.test(s)) s = "'" + s; // stop spreadsheet formulas (phone numbers are fine)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(records) {
  const kindName = { registration: 'Registration', application: 'Job application' };
  const rows = records.map((r) => COLUMNS.map(([k]) =>
    cell(k === 'at' ? String(r.at).slice(0, 16).replace('T', ' ') : k === 'kind' ? kindName[r.kind] || r.kind : r[k])).join(','));
  return '﻿' + [COLUMNS.map(([, h]) => h).join(','), ...rows].join('\r\n');
}
