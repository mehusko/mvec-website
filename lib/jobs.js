// Open jobs: read and saved in Vercel Blob (jobs.json) when a Blob store is connected
// (env BLOB_READ_WRITE_TOKEN). Without it, the jobs.json file in the repo is used.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const KEY = 'jobs/jobs.json';
export const storeReady = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function fromRepo() {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), 'jobs.json'), 'utf8'));
  } catch {
    return { sample: false, jobs: [] };
  }
}

export async function loadJobs() {
  if (storeReady()) {
    try {
      const { head } = await import('@vercel/blob');
      const meta = await head(KEY);
      const r = await fetch(`${meta.url}?v=${Date.now()}`, { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data.jobs)) return data;
      }
    } catch (err) {
      if (!/not.?found/i.test(String(err && (err.name + err.message)))) console.error('Jobs store read:', err.message);
    }
  }
  return fromRepo();
}

export async function saveJobs(data) {
  if (!storeReady()) throw new Error('Job storage is not connected');
  const { put } = await import('@vercel/blob');
  await put(KEY, JSON.stringify({ sample: false, jobs: data.jobs }, null, 2), {
    access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60,
  });
}

export function nextId(jobs) {
  const n = jobs.reduce((m, j) => Math.max(m, parseInt(String(j.id).replace(/\D/g, ''), 10) || 0), 0) + 1;
  return 'J' + String(n).padStart(3, '0');
}

const FIELDS = { title: 'title', job: 'title', role: 'title', place: 'place', location: 'place', island: 'place',
  type: 'type', pay: 'pay', salary: 'pay', sector: 'sector', field: 'sector', requirements: 'requirements', needs: 'requirements' };

// "/addjob" text: either "Key: value" lines, or one line "Title | Place | Type | Pay | Requirements".
export function parseJob(text) {
  const body = String(text).replace(/^\/addjob(@\w+)?/i, '').trim();
  const job = {};
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const keyed = lines.filter((l) => /^[a-z ]+:/i.test(l));
  if (keyed.length) {
    keyed.forEach((l) => {
      const i = l.indexOf(':');
      const k = FIELDS[l.slice(0, i).trim().toLowerCase()];
      if (k) job[k] = l.slice(i + 1).trim().slice(0, 300);
    });
  } else if (lines.length) {
    const p = lines.join(' ').split('|').map((s) => s.trim());
    ['title', 'place', 'type', 'pay', 'requirements'].forEach((k, i) => { if (p[i]) job[k] = p[i].slice(0, 300); });
  }
  return job.title ? job : null;
}
