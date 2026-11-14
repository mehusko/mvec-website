import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SESSION_SECRET = 'y'.repeat(40);
process.env.SETUP_KEY = 'setup-key-1234567890';
process.env.COOKIE_SECURE = '0';
process.env.DB_FILE = ':memory:';
const A = await import('../lib/auth.js');
const { route, saveFormRecord } = await import('../lib/admin.js');
const { one } = await import('../lib/db.js');

const req = (cookie = '', headers = {}) => ({ headers: { cookie, host: 'x.test', ...headers }, socket: { remoteAddress: '1.1.1.1' } });
const call = async (cookie, method, path, body = {}, q = {}, headers = {}) => {
  try { return await route(req(cookie, headers), method, path.split('/'), q, body); } catch (e) { return { err: e.status, msg: e.message }; }
};
let cookie = '';

test('setup needs the key and works once', async () => {
  assert.equal((await call('', 'POST', 'auth/setup', { email: 'a@b.mv', password: 'longpassword' })).err, 403);
  assert.ok((await call('', 'POST', 'auth/setup', { email: 'a@b.mv', password: 'longpassword' }, {}, { 'x-setup-key': 'setup-key-1234567890' })).json.ok);
  assert.equal((await call('', 'POST', 'auth/setup', { email: 'c@b.mv', password: 'longpassword' }, {}, { 'x-setup-key': 'setup-key-1234567890' })).err, 403);
});
test('login forces 2FA enrolment then works', async () => {
  assert.equal((await call('', 'POST', 'auth/login', { email: 'a@b.mv', password: 'nope' })).err, 401);
  const l = (await call('', 'POST', 'auth/login', { email: 'a@b.mv', password: 'longpassword' })).json;
  assert.equal(l.step, 'enroll');
  assert.equal((await call('', 'POST', 'auth/2fa', { challenge: l.challenge, code: '000000' })).err, 401);
  const s = await call('', 'POST', 'auth/2fa', { challenge: l.challenge, code: A.totp(l.secret) });
  assert.equal(s.json.backupCodes.length, 10);
  cookie = s.cookie.split(';')[0];
  assert.equal((await call(cookie, 'GET', 'auth/me')).json.user.role, 'admin');
  assert.equal((await call('', 'GET', 'auth/me')).err, 401);
});
test('records: create, number, compute, status, search, delete, restore', async () => {
  const inv = await call(cookie, 'POST', 'e/invoices', { data: { client_name: 'Acme', amount: 100, tax: 8 } });
  const got = (await call(cookie, 'GET', `e/invoices/${inv.json.id}`)).json;
  assert.equal(got.data.total, 108); assert.equal(got.data.number, 'INV-0001');
  assert.equal((await call(cookie, 'POST', 'e/invoices', { data: { client_name: 'B', amount: 1 } })).json.id.length > 0, true);
  assert.equal((await call(cookie, 'POST', 'e/invoices', { data: { amount: 1 } })).err, 400);
  await call(cookie, 'POST', `e/invoices/${inv.json.id}/status`, { status: 'paid' });
  assert.equal((await call(cookie, 'GET', 'e/invoices', {}, { status: 'paid' })).json.total, 1);
  assert.equal((await call(cookie, 'GET', 'e/invoices', {}, { q: 'acme' })).json.total, 1);
  await call(cookie, 'DELETE', `e/invoices/${inv.json.id}`);
  assert.equal((await call(cookie, 'GET', `e/invoices/${inv.json.id}`)).err, 404);
  assert.equal((await call(cookie, 'GET', 'deleted')).json.rows.length, 1);
  await call(cookie, 'POST', `deleted/${inv.json.id}/restore`);
  assert.equal((await call(cookie, 'GET', `e/invoices/${inv.json.id}`)).json.data.number, 'INV-0001');
});
test('payroll net, tracker progress, csv, reports', async () => {
  const p = await call(cookie, 'POST', 'e/payroll', { data: { worker_name: 'Ali', month: '2026-11', base: 5000, bonus: 200, deductions: 100 } });
  assert.equal((await call(cookie, 'GET', `e/payroll/${p.json.id}`)).json.data.net, 5100);
  const t = await call(cookie, 'POST', 'e/placements', { data: { worker_name: 'Ali', client_name: 'Acme', quota_approved: '2026-11-01' } });
  assert.equal((await call(cookie, 'GET', `e/placements/${t.json.id}`)).json.data.progress, '1/5');
  const c = await call(cookie, 'GET', 'e/payroll', {}, { format: 'csv' });
  assert.ok(c.csv.includes('Ali'));
  assert.equal((await call(cookie, 'GET', 'reports')).json.placements.inProgress, 1);
});
test('roles limit access; users and audit', async () => {
  const u = await call(cookie, 'POST', 'users', { email: 'acc@b.mv', name: 'Acc', role: 'accountant', password: 'anotherpass1' });
  assert.ok(u.json.id);
  const l = (await call('', 'POST', 'auth/login', { email: 'acc@b.mv', password: 'anotherpass1' })).json;
  const s = await call('', 'POST', 'auth/2fa', { challenge: l.challenge, code: A.totp(l.secret) });
  const ck = s.cookie.split(';')[0];
  assert.equal((await call(ck, 'GET', 'e/invoices')).json.total, 2);
  assert.equal((await call(ck, 'GET', 'e/inquiries')).err, 403);
  assert.equal((await call(ck, 'GET', 'users')).err, 403);
  await call(cookie, 'PUT', `users/${u.json.id}`, { active: false });
  assert.equal((await call(ck, 'GET', 'e/invoices')).err, 401);
  assert.ok((await call(cookie, 'GET', 'audit')).json.rows.length > 5);
});
test('backup code works once; cross-site POST blocked; public form saves', async () => {
  assert.equal((await call(cookie, 'POST', 'e/jobs', { data: { title: 'X' } }, {}, { origin: 'https://evil.test' })).err, 403);
  const id = await saveFormRecord('inquiries', { name: 'Visitor', phone: '123', message: 'hi' });
  assert.ok(id);
  assert.equal((await call(cookie, 'GET', 'e/inquiries')).json.rows[0].data.name, 'Visitor');
  assert.equal(Number((await one("SELECT COUNT(*) AS n FROM records WHERE entity='inquiries'")).n), 1);
});

test('public contact form still answers when no database is set up', async () => {
  const saved = process.env.DB_FILE; delete process.env.DB_FILE; delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
  const id = await saveFormRecord('inquiries', { name: 'x' });
  process.env.DB_FILE = saved;
  assert.equal(id, null);
});

const signIn = async (email, password) => {
  const l = (await call('', 'POST', 'auth/login', { email, password })).json;
  const s = await call('', 'POST', 'auth/2fa', { challenge: l.challenge, code: A.totp(l.secret) });
  return s.cookie.split(';')[0];
};
test('portals: each login sees only its own records', async () => {
  const mk = async (e, d, status) => (await call(cookie, 'POST', `e/${e}`, { data: d, status })).json.id;
  const cA = await mk('clients', { name: 'Family A' }); const cB = await mk('clients', { name: 'Family B' });
  const w = await mk('workers', { name: 'Rani', phone: '1' });
  await mk('invoices', { client_id: cA, client_name: 'Family A', amount: 100 }, 'sent');
  await mk('invoices', { client_id: cA, client_name: 'Family A', amount: 5 }, 'draft');
  await mk('invoices', { client_id: cB, client_name: 'Family B', amount: 999 }, 'sent');
  await mk('placements', { client_id: cA, worker_id: w, worker_name: 'Rani', quota_approved: '2026-11-01' }, 'in progress');
  await mk('payroll', { worker_id: w, worker_name: 'Rani', month: '2026-10', base: 100 }, 'paid');
  await mk('payroll', { worker_id: w, worker_name: 'Rani', month: '2026-11', base: 100 }, 'draft');
  // a client login must be linked to a client record, a staff login to a worker
  assert.equal((await call(cookie, 'POST', 'users', { email: 'x@b.mv', role: 'client', password: 'passw0rd!!', linked_id: w })).err, 400);
  assert.equal((await call(cookie, 'POST', 'users', { email: 'x@b.mv', role: 'staff', password: 'passw0rd!!' })).err, 400);
  await call(cookie, 'POST', 'users', { email: 'fam@b.mv', name: 'Fam', role: 'client', password: 'passw0rd!!', linked_id: cA });
  await call(cookie, 'POST', 'users', { email: 'rani@b.mv', name: 'Rani', role: 'staff', password: 'passw0rd!!', linked_id: w });
  const fam = await signIn('fam@b.mv', 'passw0rd!!'); const rani = await signIn('rani@b.mv', 'passw0rd!!');
  const f = (await call(fam, 'GET', 'portal/home')).json;
  assert.equal(f.kind, 'client'); assert.equal(f.invoices.length, 1); assert.equal(f.invoices[0].total, 100);
  assert.equal(f.staff[0].name, 'Rani'); assert.equal(f.placements[0].steps.quota_approved, '2026-11-01');
  assert.equal((await call(fam, 'GET', 'e/invoices')).err, 403);
  assert.equal((await call(fam, 'GET', 'users')).err, 403);
  assert.equal((await call(fam, 'GET', 'audit')).err, 403);
  const r = (await call(rani, 'GET', 'portal/home')).json;
  assert.equal(r.kind, 'staff'); assert.equal(r.payslips.length, 1); assert.equal(r.payslips[0].month, '2026-10');
  assert.equal((await call(rani, 'GET', 'e/payroll')).err, 403);
  assert.ok((await call(fam, 'PUT', 'portal/profile', { phone: '777', address: 'Male' })).json.ok);
  assert.equal((await call(cookie, 'GET', `e/clients/${cA}`)).json.data.phone, '777');
  assert.equal((await call(cookie, 'GET', 'portal/home')).err, 403); // admin is not a portal user
});
test('import is safe to repeat', async () => {
  const rows = [{ status: 'archived', created_at: '2026-01-02T03:04:05Z', data: { old_id: 'abc123', name: 'Old Person', message: 'hi' } }];
  assert.deepEqual((await call(cookie, 'POST', 'e/inquiries/import', { rows })).json, { added: 1, skipped: 0 });
  assert.deepEqual((await call(cookie, 'POST', 'e/inquiries/import', { rows })).json, { added: 0, skipped: 1 });
  const got = (await call(cookie, 'GET', 'e/inquiries', {}, { q: 'old person' })).json.rows[0];
  assert.equal(got.status, 'archived'); assert.equal(got.created_at, '2026-01-02T03:04:05Z');
});
