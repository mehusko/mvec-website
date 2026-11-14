// The admin API. One handler, routed by path (see vercel.json: /api/admin/* -> /api/admin?path=*).
import crypto from 'node:crypto';
import { one, query, nextNumber } from './db.js';
import * as A from './auth.js';
import { ENTITIES, GROUPS, TRACKER, DEFAULT_ROLES, allPermissions, trackerProgress, num } from './entities.js';

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (m) => new HttpError(400, m);
const parse = (s) => { try { return JSON.parse(s); } catch { return {}; } };
const PAGE = 50;

async function ensureRoles() {
  const have = new Set((await query('SELECT name FROM roles')).map((r) => r.name));
  for (const [name, r] of Object.entries(DEFAULT_ROLES)) {
    if (!have.has(name)) await query('INSERT INTO roles (name, label, permissions, system) VALUES (?, ?, ?, ?)', [name, r.label, JSON.stringify(r.permissions), 1]);
  }
}

const must = (user, perm) => { if (!A.can(user, perm)) throw new HttpError(403, 'You do not have permission to do this.'); };
const entityOf = (name) => { const e = ENTITIES[name]; if (!e) throw new HttpError(404, 'Unknown module.'); return e; };

// Keep only the fields the module defines, as clean text/number/boolean values.
function cleanData(def, input, existing = {}) {
  const out = { ...existing };
  for (const fld of def.fields) {
    if (fld.computed || !(fld.key in input)) continue;
    let v = input[fld.key];
    if (fld.type === 'checkbox') v = Boolean(v);
    else if (fld.type === 'number' || fld.type === 'money') v = v === '' || v === null ? '' : (Number.isFinite(Number(v)) ? Number(v) : '');
    else v = String(v ?? '').trim().slice(0, fld.type === 'textarea' ? 8000 : 500);
    out[fld.key] = v;
  }
  for (const fld of def.fields) if (fld.required && (out[fld.key] === undefined || out[fld.key] === '')) throw bad(`${fld.label} is required.`);
  return def.compute ? def.compute(out) : out;
}

const rowOut = (def, r) => {
  const data = parse(r.data);
  if (def.tracker) data.progress = trackerProgress(data);
  return { id: r.id, status: r.status, created_at: r.created_at, updated_at: r.updated_at, deleted_at: r.deleted_at || null, data };
};

export function publicMeta(user) {
  const entities = {};
  for (const [k, e] of Object.entries(ENTITIES)) {
    if (!A.can(user, `${k}.view`)) continue;
    const { compute, ...rest } = e;
    entities[k] = { ...rest, canManage: A.can(user, `${k}.manage`) };
  }
  const portal = A.can(user, 'portal.client') && !user.permissions.includes('*') ? 'client' : A.can(user, 'portal.staff') && !user.permissions.includes('*') ? 'staff' : null;
  return { portal, user: { email: user.email, name: user.name, role: user.role, permissions: user.permissions }, groups: GROUPS, tracker: TRACKER, entities };
}

// Save a record from a public form (contact, register, apply). Never throws: the form must still work if the database is down.
export async function saveFormRecord(entity, data) {
  try {
    const def = ENTITIES[entity];
    const d = {};
    for (const fld of def.fields) if (data[fld.key] !== undefined) d[fld.key] = String(data[fld.key]).slice(0, 4000);
    const id = A.uid();
    const now = new Date().toISOString();
    await query('INSERT INTO records (id, entity, status, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, entity, def.statuses[0], JSON.stringify(d), now, now]);
    return id;
  } catch (e) { console.error('saveFormRecord:', e.message); return null; }
}

async function login(req, body) {
  const ip = A.clientIp(req);
  if (await A.loginBlocked(ip)) throw new HttpError(429, 'Too many attempts. Wait a minute and try again.');
  await A.noteLoginAttempt(ip);
  const email = String(body.email || '').trim().toLowerCase();
  const u = await one('SELECT * FROM users WHERE email = ?', [email]);
  const ok = u && u.active && await A.verifyPassword(body.password, u.password_hash);
  if (!ok) { await A.audit(req, null, 'login failed', null, null, email); throw new HttpError(401, 'Wrong email or password.'); }
  const challenge = A.signToken({ c: u.id }, 300);
  if (!u.totp_enabled) {
    return { json: { step: 'enroll', challenge, secret: u.totp_secret, otpauth: A.otpauthUrl(u.email, u.totp_secret) } };
  }
  return { json: { step: '2fa', challenge } };
}

async function second(req, body) {
  const t = A.readToken(body.challenge);
  if (!t || !t.c) throw new HttpError(401, 'Sign-in timed out. Start again.');
  if (await A.loginBlocked(A.clientIp(req))) throw new HttpError(429, 'Too many attempts. Wait a minute and try again.');
  await A.noteLoginAttempt(A.clientIp(req));
  const u = await one('SELECT * FROM users WHERE id = ?', [t.c]);
  if (!u || !u.active) throw new HttpError(401, 'Sign-in failed.');
  let backupCodes;
  if (A.verifyTotp(u.totp_secret, body.code)) {
    if (!u.totp_enabled) {
      const b = A.newBackupCodes();
      await query('UPDATE users SET totp_enabled = 1, backup_codes = ? WHERE id = ?', [JSON.stringify(b.hashes), u.id]);
      backupCodes = b.codes;
    }
  } else if (!(u.totp_enabled && await A.useBackupCode(u, body.code))) {
    await A.audit(req, { id: u.id, email: u.email }, '2fa failed');
    throw new HttpError(401, 'That code is not right.');
  }
  await query('UPDATE users SET last_login = ? WHERE id = ?', [new Date().toISOString(), u.id]);
  await A.audit(req, { id: u.id, email: u.email }, 'login');
  return { json: { ok: true, backupCodes }, cookie: A.sessionCookie(u.id) };
}

async function setup(req, body) {
  const n = await one('SELECT COUNT(*) AS n FROM users');
  const key = process.env.SETUP_KEY || '';
  const reset = body.reset === true && process.env.SETUP_RESET === 'yes'; // temporary switch, set in Vercel only when locked out
  if (Number(n.n) > 0 && !reset) throw new HttpError(403, 'Setup is already done.');
  if (key.length < 16 || !crypto.timingSafeEqual(Buffer.from(String(req.headers['x-setup-key'] || '').padEnd(64)), Buffer.from(key.padEnd(64)))) throw new HttpError(403, 'Wrong setup key.');
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw bad('Enter a valid email.');
  const p = A.passwordProblem(body.password); if (p) throw bad(p);
  if (Number(n.n) > 0) { await query('DELETE FROM users'); await A.audit(req, null, 'all users removed by setup reset'); }
  await query('INSERT INTO users (id, email, name, role, password_hash, totp_secret, totp_enabled, backup_codes, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, ?)',
    [A.uid(), email, String(body.name || 'Administrator').slice(0, 100), 'admin', await A.hashPassword(body.password), A.newTotpSecret(), '[]', new Date().toISOString()]);
  await A.audit(req, null, 'first admin created', 'users', null, email);
  return { json: { ok: true } };
}

async function listRecords(def, entity, q, user) {
  const where = ['entity = ?', 'deleted_at IS NULL']; const p = [entity];
  if (q.status) { where.push('status = ?'); p.push(q.status); }
  if (q.q) { where.push('LOWER(data) LIKE ?'); p.push(`%${String(q.q).toLowerCase().replace(/[%_]/g, '')}%`); }
  const w = where.join(' AND ');
  const total = Number((await one(`SELECT COUNT(*) AS n FROM records WHERE ${w}`, p)).n);
  const csv = q.format === 'csv';
  const page = Math.max(1, Number(q.page) || 1);
  const rows = (await query(`SELECT * FROM records WHERE ${w} ORDER BY created_at DESC` + (csv ? '' : ' LIMIT ? OFFSET ?'),
    csv ? p : [...p, PAGE, (page - 1) * PAGE]));
  return { total, page, pageSize: PAGE, rows: rows.map((r) => rowOut(def, r)) };
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;
function toCsv(def, rows) {
  const head = ['Status', 'Created', ...def.fields.map((f) => f.label)];
  return [head, ...rows.map((r) => [r.status, r.created_at, ...def.fields.map((f) => r.data[f.key])])].map((l) => l.map(csvCell).join(',')).join('\n');
}

async function reports() {
  const c = async (e, st) => Number((await one('SELECT COUNT(*) AS n FROM records WHERE entity = ? AND deleted_at IS NULL' + (st ? ' AND status = ?' : ''), st ? [e, st] : [e])).n);
  const sum = async (e, key, st) => (await query('SELECT data FROM records WHERE entity = ? AND deleted_at IS NULL' + (st ? ' AND status = ?' : ''), st ? [e, st] : [e]))
    .reduce((a, r) => a + num(parse(r.data)[key]), 0);
  const trackers = (await query("SELECT data FROM records WHERE entity = 'placements' AND deleted_at IS NULL AND status = 'in progress'")).map((r) => parse(r.data));
  return {
    inquiries: { new: await c('inquiries', 'new'), total: await c('inquiries') },
    applications: { new: await c('applications', 'new'), total: await c('applications') },
    workers: { available: await c('workers', 'available'), total: await c('workers') },
    jobs: { open: await c('jobs', 'open') },
    placements: { inProgress: trackers.length, waitingMedical: trackers.filter((d) => d.arrived && !d.medical_cleared).length },
    invoices: { outstanding: await sum('invoices', 'total', 'sent') + await sum('invoices', 'total', 'overdue'), paid: await sum('invoices', 'total', 'paid') },
    expenses: { total: await sum('expenses', 'amount') },
  };
}


// ---- Client and staff portals: each user sees only the records linked to their own client / worker record ----
async function mine(entity, field, id, extra = () => true) {
  if (!id) return [];
  const rows = (await query('SELECT * FROM records WHERE entity = ? AND deleted_at IS NULL AND data LIKE ? ORDER BY created_at DESC LIMIT 200', [entity, `%"${field}":"${String(id).replace(/[^\w-]/g, '')}"%`]))
    .map((r) => ({ id: r.id, status: r.status, created_at: r.created_at, data: parse(r.data) }));
  return rows.filter((r) => r.data[field] === id && extra(r));
}
async function portal(req, user, method, what, body) {
  const kind = A.can(user, 'portal.client') ? 'client' : A.can(user, 'portal.staff') ? 'staff' : null;
  if (!kind || user.permissions.includes('*')) throw new HttpError(403, 'This area is for client and staff logins.');
  if (!user.linkedId) throw new HttpError(403, 'Your login is not linked to a record yet. Ask MVEC to link it.');
  const rec = await one('SELECT * FROM records WHERE id = ? AND deleted_at IS NULL', [user.linkedId]);
  if (!rec || rec.entity !== (kind === 'client' ? 'clients' : 'workers')) throw new HttpError(403, 'Your login is not linked to a record yet. Ask MVEC to link it.');
  const me = parse(rec.data);
  if (what === 'profile' && method === 'PUT') {
    const keys = kind === 'client' ? ['phone', 'email', 'address'] : ['phone', 'email'];
    const next = { ...me };
    for (const k of keys) if (k in body) next[k] = String(body[k] ?? '').trim().slice(0, 500);
    await query('UPDATE records SET data = ?, updated_at = ? WHERE id = ?', [JSON.stringify(next), new Date().toISOString(), rec.id]);
    await A.audit(req, user, 'portal profile updated', rec.entity, rec.id);
    return { json: { ok: true } };
  }
  if (what !== 'home' || method !== 'GET') throw new HttpError(404, 'Not found.');
  const out = { kind, profile: { name: me.name, phone: me.phone, email: me.email, address: me.address, role: me.role, country: me.country } };
  if (kind === 'client') {
    const placements = await mine('placements', 'client_id', rec.id);
    const workerIds = [...new Set(placements.map((p) => p.data.worker_id).filter(Boolean))];
    out.placements = placements.map((p) => ({ id: p.id, status: p.status, worker_name: p.data.worker_name, role: p.data.role, steps: Object.fromEntries(TRACKER.map(([k]) => [k, p.data[k] || ''])) }));
    out.staff = []; for (const id of workerIds) { const w = await one("SELECT data FROM records WHERE id = ? AND entity = 'workers' AND deleted_at IS NULL", [id]); if (w) { const d = parse(w.data); out.staff.push({ name: d.name, role: d.role, country: d.country }); } }
    out.invoices = (await mine('invoices', 'client_id', rec.id, (r) => !['draft', 'void'].includes(r.status))).map((r) => ({ number: r.data.number, description: r.data.description, total: r.data.total, due_date: r.data.due_date, status: r.status }));
    out.schedules = (await mine('schedules', 'client_id', rec.id)).map((r) => ({ date: r.data.date, worker_name: r.data.worker_name, start: r.data.start, end: r.data.end, status: r.status }));
  } else {
    out.schedules = (await mine('schedules', 'worker_id', rec.id)).map((r) => ({ date: r.data.date, client_name: r.data.client_name, start: r.data.start, end: r.data.end, status: r.status }));
    out.attendance = (await mine('attendance', 'worker_id', rec.id)).map((r) => ({ date: r.data.date, hours: r.data.hours, status: r.status }));
    out.payslips = (await mine('payroll', 'worker_id', rec.id, (r) => ['approved', 'paid'].includes(r.status))).map((r) => ({ month: r.data.month, base: r.data.base, bonus: r.data.bonus, deductions: r.data.deductions, net: r.data.net, status: r.status }));
    out.documents = (await query("SELECT data FROM records WHERE entity = 'documents' AND deleted_at IS NULL AND LOWER(data) LIKE ? LIMIT 100", [`%${String(me.name || '').toLowerCase().replace(/[%_"]/g, '')}%`]))
      .map((r) => parse(r.data)).filter((d) => me.name && String(d.owner || '').toLowerCase() === String(me.name).toLowerCase()).map((d) => ({ name: d.name, type: d.type, expires: d.expires, link: d.link }));
  }
  return { json: out };
}

// A client login must point at a client record, a staff login at a worker record; other roles point at nothing.
async function checkLink(role, id) {
  const want = role === 'client' ? 'clients' : role === 'staff' ? 'workers' : null;
  if (!want) return null;
  const r = id && await one('SELECT entity FROM records WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!r || r.entity !== want) throw bad(`Choose the ${role === 'client' ? 'client' : 'worker'} this login belongs to.`);
  return id;
}

export async function route(req, method, segs, q, body) {
  await ensureRoles();
  const [a, b, c, d] = segs;
  if (method !== 'GET') {
    const o = req.headers.origin; const host = req.headers.host;
    if (o && host && new URL(o).host !== host) throw new HttpError(403, 'Blocked.');
  }
  // --- public auth steps ---
  if (a === 'auth' && b === 'status' && method === 'GET') return { json: { needsSetup: Number((await one('SELECT COUNT(*) AS n FROM users')).n) === 0, canReset: process.env.SETUP_RESET === 'yes' } };
  if (a === 'auth' && b === 'login' && method === 'POST') return login(req, body);
  if (a === 'auth' && b === '2fa' && method === 'POST') return second(req, body);
  if (a === 'auth' && b === 'setup' && method === 'POST') return setup(req, body);
  if (a === 'auth' && b === 'logout' && method === 'POST') { const u = await A.currentUser(req); if (u) await A.audit(req, u, 'logout'); return { json: { ok: true }, cookie: A.clearCookie() }; }

  const user = await A.currentUser(req);
  if (!user) throw new HttpError(401, 'Please sign in.');

  if (a === 'auth' && b === 'me') return { json: publicMeta(user) };
  if (a === 'meta') return { json: publicMeta(user) };
  if (a === 'auth' && b === 'password' && method === 'POST') {
    const u = await one('SELECT password_hash FROM users WHERE id = ?', [user.id]);
    if (!(await A.verifyPassword(body.current, u.password_hash))) throw new HttpError(400, 'Current password is wrong.');
    const p = A.passwordProblem(body.password); if (p) throw bad(p);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [await A.hashPassword(body.password), user.id]);
    await A.audit(req, user, 'password changed');
    return { json: { ok: true } };
  }

  if (a === 'portal') return portal(req, user, method, b, body);

  if (a === 'reports') { must(user, 'reports.view'); return { json: await reports() }; }

  if (a === 'e') {
    const def = entityOf(b); const entity = b;
    if (!c && method === 'GET') {
      must(user, `${entity}.view`);
      const r = await listRecords(def, entity, q, user);
      if (q.format === 'csv') { await A.audit(req, user, 'export csv', entity); return { csv: toCsv(def, r.rows), filename: `${entity}.csv` }; }
      return { json: r };
    }
    if (!c && method === 'POST') {
      must(user, `${entity}.manage`);
      let data = cleanData(def, body.data || {});
      if (def.numbered) data.number = `${def.numbered}-${String(await nextNumber(entity)).padStart(4, '0')}`;
      const id = A.uid(); const now = new Date().toISOString();
      await query('INSERT INTO records (id, entity, status, data, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, entity, def.statuses.includes(body.status) ? body.status : def.statuses[0], JSON.stringify(data), now, now, user.id]);
      await A.audit(req, user, 'create', entity, id);
      return { json: { id } };
    }
    if (c === 'import' && method === 'POST') {
      must(user, `${entity}.manage`);
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, 500) : [];
      let added = 0; let skipped = 0;
      for (const r of rows) {
        const data = cleanData(def, r.data || {});
        if (data.old_id && await one("SELECT id FROM records WHERE entity = ? AND data LIKE ?", [entity, `%"old_id":"${String(data.old_id).replace(/[^\w-]/g, '')}"%`])) { skipped++; continue; }
        const at = /^\d{4}-\d\d-\d\dT[\d:]+Z$/.test(r.created_at || '') ? r.created_at : new Date().toISOString();
        await query('INSERT INTO records (id, entity, status, data, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [A.uid(), entity, def.statuses.includes(r.status) ? r.status : def.statuses[0], JSON.stringify(data), at, at, user.id]);
        added++;
      }
      await A.audit(req, user, 'import', entity, null, `${added} added, ${skipped} already there`);
      return { json: { added, skipped } };
    }
    const row = await one('SELECT * FROM records WHERE id = ? AND entity = ?', [c, entity]);
    if (!row || row.deleted_at) throw new HttpError(404, 'Not found.');
    if (method === 'GET') { must(user, `${entity}.view`); return { json: rowOut(def, row) }; }
    must(user, `${entity}.manage`);
    if (method === 'PUT') {
      const data = cleanData(def, body.data || {}, parse(row.data));
      await query('UPDATE records SET data = ?, updated_at = ? WHERE id = ?', [JSON.stringify(data), new Date().toISOString(), c]);
      await A.audit(req, user, 'update', entity, c);
      return { json: { ok: true } };
    }
    if (method === 'POST' && d === 'status') {
      if (!def.statuses.includes(body.status)) throw bad('Unknown status.');
      await query('UPDATE records SET status = ?, updated_at = ? WHERE id = ?', [body.status, new Date().toISOString(), c]);
      await A.audit(req, user, 'status', entity, c, `${row.status} -> ${body.status}`);
      return { json: { ok: true } };
    }
    if (method === 'DELETE') {
      await query('UPDATE records SET deleted_at = ?, deleted_by = ? WHERE id = ?', [new Date().toISOString(), user.id, c]);
      await A.audit(req, user, 'delete (to Deleted items)', entity, c);
      return { json: { ok: true } };
    }
  }

  if (a === 'deleted') {
    must(user, 'deleted.manage');
    if (!b && method === 'GET') {
      const rows = (await query('SELECT * FROM records WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 200'));
      return { json: { rows: rows.map((r) => ({ ...rowOut(ENTITIES[r.entity] || { fields: [] }, r), entity: r.entity })) } };
    }
    if (b && c === 'restore' && method === 'POST') {
      await query('UPDATE records SET deleted_at = NULL, deleted_by = NULL WHERE id = ?', [b]);
      await A.audit(req, user, 'restore', null, b); return { json: { ok: true } };
    }
    if (b && method === 'DELETE') {
      await query('DELETE FROM records WHERE id = ? AND deleted_at IS NOT NULL', [b]);
      await A.audit(req, user, 'delete forever', null, b); return { json: { ok: true } };
    }
  }

  if (a === 'audit') { must(user, 'audit.view'); return { json: { rows: (await query('SELECT * FROM audit_log ORDER BY at DESC LIMIT 300')) } }; }

  if (a === 'roles') { must(user, 'users.manage'); return { json: { roles: (await query('SELECT name, label, permissions FROM roles')).map((r) => ({ ...r, permissions: parse(r.permissions) })), all: allPermissions() } }; }

  if (a === 'users') {
    must(user, 'users.manage');
    if (!b && method === 'GET') return { json: { rows: (await query('SELECT id, email, name, role, active, totp_enabled, last_login, created_at, linked_id FROM users ORDER BY created_at')) } };
    if (!b && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw bad('Enter a valid email.');
      if (!(await one('SELECT name FROM roles WHERE name = ?', [body.role]))) throw bad('Choose a role.');
      const p = A.passwordProblem(body.password); if (p) throw bad(p);
      if (await one('SELECT id FROM users WHERE email = ?', [email])) throw bad('That email already has an account.');
      const id = A.uid();
      const linked = await checkLink(body.role, body.linked_id);
      await query('INSERT INTO users (id, email, name, role, password_hash, totp_secret, totp_enabled, backup_codes, active, created_at, linked_id) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, ?, ?)',
        [id, email, String(body.name || '').slice(0, 100), body.role, await A.hashPassword(body.password), A.newTotpSecret(), '[]', new Date().toISOString(), linked]);
      await A.audit(req, user, 'user created', 'users', id, email);
      return { json: { id } };
    }
    if (b && method === 'PUT') {
      const t = await one('SELECT * FROM users WHERE id = ?', [b]); if (!t) throw new HttpError(404, 'Not found.');
      if (b === user.id && (body.active === false || (body.role && body.role !== user.role))) throw bad('You cannot lock yourself out or change your own role.');
      if (body.role && !(await one('SELECT name FROM roles WHERE name = ?', [body.role]))) throw bad('Unknown role.');
      const newRole = body.role ?? t.role;
      const linked = 'linked_id' in body || body.role ? await checkLink(newRole, 'linked_id' in body ? body.linked_id : t.linked_id) : t.linked_id;
      await query('UPDATE users SET name = ?, role = ?, active = ?, linked_id = ? WHERE id = ?', [body.name ?? t.name, newRole, body.active === undefined ? t.active : (body.active ? 1 : 0), linked, b]);
      if (body.password) { const p = A.passwordProblem(body.password); if (p) throw bad(p); await query('UPDATE users SET password_hash = ? WHERE id = ?', [await A.hashPassword(body.password), b]); }
      await A.audit(req, user, 'user updated', 'users', b, t.email);
      return { json: { ok: true } };
    }
    if (b && c === 'reset2fa' && method === 'POST') {
      await query('UPDATE users SET totp_enabled = 0, totp_secret = ?, backup_codes = ? WHERE id = ?', [A.newTotpSecret(), '[]', b]);
      await A.audit(req, user, '2fa reset', 'users', b); return { json: { ok: true } };
    }
  }

  if (a === 'settings') {
    must(user, 'settings.manage');
    if (method === 'GET') return { json: Object.fromEntries((await query('SELECT key, value FROM settings')).map((r) => [r.key, r.value])) };
    if (method === 'PUT') {
      for (const [k, v] of Object.entries(body)) {
        if (!/^[a-z_]{1,40}$/.test(k)) continue;
        await query('DELETE FROM settings WHERE key = ?', [k]);
        await query('INSERT INTO settings (key, value) VALUES (?, ?)', [k, String(v).slice(0, 2000)]);
      }
      await A.audit(req, user, 'settings changed'); return { json: { ok: true } };
    }
  }
  throw new HttpError(404, 'Not found.');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const path = String(req.query?.path ?? new URL(req.url, 'http://x').searchParams.get('path') ?? '');
    const segs = path.split('/').filter(Boolean);
    const q = { ...(req.query || {}) }; delete q.path;
    let body = req.body;
    if (typeof body === 'string') body = parse(body);
    const out = await route(req, req.method, segs, q, body || {});
    if (out.cookie) res.setHeader('Set-Cookie', out.cookie);
    if (out.csv !== undefined) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
      return res.status(200).send(out.csv);
    }
    return res.status(200).json(out.json);
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
    console.error('admin api:', e);
    return res.status(500).json({ error: 'Something went wrong on the server.' });
  }
}
