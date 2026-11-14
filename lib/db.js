// Database access for the admin panel.
//
// Production: a Postgres database (for example Neon, added from the Vercel Marketplace). Vercel sets
//   DATABASE_URL (or POSTGRES_URL). Queries go over HTTPS to Neon's SQL endpoint, so no package is needed.
// Local testing: set DB_FILE to a path and a SQLite file is used instead (Node's built-in node:sqlite).
//
// All SQL in this project is written with ? placeholders and works on both.
import { SCHEMA } from './schema.js';

const pgUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
export const dbReady = () => Boolean(pgUrl() || process.env.DB_FILE);

let sqlite = null;
let sqliteFile = '';
async function lite() {
  if (!sqlite || sqliteFile !== process.env.DB_FILE) {
    const { DatabaseSync } = await import('node:sqlite');
    sqlite = new DatabaseSync(process.env.DB_FILE);
    sqliteFile = process.env.DB_FILE;
    schemaDone = false;
  }
  return sqlite;
}

const toPg = (sql) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
const clean = (p) => p.map((v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v));

async function run(sql, params) {
  const args = clean(params);
  if (process.env.DB_FILE) {
    const db = await lite();
    const st = db.prepare(sql);
    return /^\s*(select|with)\b|\breturning\b/i.test(sql) ? st.all(...args).map((r) => ({ ...r })) : (st.run(...args), []);
  }
  const url = pgUrl();
  if (!url) throw new Error('Database is not connected (set DATABASE_URL)');
  const host = new URL(url).hostname;
  const r = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': url },
    body: JSON.stringify({ query: toPg(sql), params: args.map((v) => (v === null ? null : String(v))) }),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Database error: ${out.message || r.status}`);
  return out.rows || [];
}

let schemaDone = false;
export async function query(sql, params = []) {
  if (!schemaDone) {
    schemaDone = true;
    try { for (const s of SCHEMA) await run(s, []); } catch (e) { schemaDone = false; throw e; }
  }
  return run(sql, params);
}

// Run one statement and return the first row (or null).
export async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Atomic counter, used for invoice numbers: next('invoice') -> 1, 2, 3 ...
export async function nextNumber(name) {
  await query('INSERT INTO counters (name, value) VALUES (?, 0) ON CONFLICT (name) DO NOTHING', [name]);
  const row = await one('UPDATE counters SET value = value + 1 WHERE name = ? RETURNING value', [name]);
  return Number(row.value);
}
