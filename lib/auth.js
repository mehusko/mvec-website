// Login for the admin panel: passwords, two-factor codes (TOTP, works with Google Authenticator),
// signed session cookies, login rate limit and the audit log. Uses only Node's built-in crypto.
// Env: SESSION_SECRET (32+ random characters, required), COOKIE_SECURE=0 only for local testing over http.
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { one, query } from './db.js';

const scrypt = promisify(crypto.scrypt);
const SESSION_HOURS = 8;
export const COOKIE = 'mvec_session';

export const uid = () => crypto.randomBytes(8).toString('hex');
const b64u = (b) => Buffer.from(b).toString('base64url');
const secret = () => {
  const s = process.env.SESSION_SECRET || '';
  if (s.length < 32) throw new Error('SESSION_SECRET is not set (needs 32 or more random characters)');
  return s;
};
const safeEq = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// ---- Signed tokens (session cookie and the short 2FA step) ----
export function signToken(payload, seconds) {
  const body = b64u(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + seconds }));
  return `${body}.${crypto.createHmac('sha256', secret()).update(body).digest('base64url')}`;
}
export function readToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const good = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (!safeEq(sig, good)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p.exp > Date.now() / 1000 ? p : null;
  } catch { return null; }
}

// ---- Passwords ----
export const passwordProblem = (pw) => {
  const s = String(pw || '');
  return s.length < 8 || s.length > 128 ? 'Password must be 8 to 128 characters.' : '';
};
export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(pw), salt, 64);
  return `s1$${salt.toString('base64')}$${key.toString('base64')}`;
}
export async function verifyPassword(pw, stored) {
  const [v, salt, key] = String(stored || '').split('$');
  if (v !== 's1' || !salt || !key) return false;
  const got = await scrypt(String(pw), Buffer.from(salt, 'base64'), 64);
  return safeEq(got.toString('base64'), key);
}

// ---- Two-factor codes (RFC 6238, 6 digits, 30 seconds) ----
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32enc = (buf) => {
  let bits = ''; let out = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
};
const b32dec = (s) => {
  let bits = '';
  for (const c of String(s).replace(/=+$/, '').toUpperCase()) bits += B32.indexOf(c).toString(2).padStart(5, '0');
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
};
export const newTotpSecret = () => b32enc(crypto.randomBytes(20));
export function totp(sec, at = Date.now()) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(Math.floor(at / 30000)));
  const h = crypto.createHmac('sha1', b32dec(sec)).update(buf).digest();
  const o = h[19] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1e6).padStart(6, '0');
}
export function verifyTotp(sec, code, at = Date.now()) {
  const c = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(c)) return false;
  return [-1, 0, 1].some((d) => safeEq(totp(sec, at + d * 30000), c));
}
export const otpauthUrl = (email, sec) =>
  `otpauth://totp/${encodeURIComponent('MVEC Admin:' + email)}?secret=${sec}&issuer=${encodeURIComponent('MVEC Admin')}`;

// Ten single-use backup codes; only their hashes are stored.
const hashCode = (c) => crypto.createHash('sha256').update(String(c).toLowerCase().replace(/[^a-z0-9]/g, '')).digest('hex');
export function newBackupCodes() {
  const codes = Array.from({ length: 10 }, () => {
    const a = crypto.randomBytes(5).toString('hex');
    return `${a.slice(0, 5)}-${a.slice(5)}`;
  });
  return { codes, hashes: codes.map(hashCode) };
}
export async function useBackupCode(user, code) {
  const list = JSON.parse(user.backup_codes || '[]');
  const h = hashCode(code);
  if (!list.includes(h)) return false;
  await query('UPDATE users SET backup_codes = ? WHERE id = ?', [JSON.stringify(list.filter((x) => x !== h)), user.id]);
  return true;
}

// ---- Cookies and the signed-in user ----
export function sessionCookie(userId) {
  const secure = process.env.COOKIE_SECURE === '0' ? '' : '; Secure';
  return `${COOKIE}=${signToken({ u: userId }, SESSION_HOURS * 3600)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}${secure}`;
}
export const clearCookie = () => `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.COOKIE_SECURE === '0' ? '' : '; Secure'}`;

function cookieValue(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

export async function permissionsOf(role) {
  const r = await one('SELECT permissions FROM roles WHERE name = ?', [role]);
  if (!r) return [];
  try { return JSON.parse(r.permissions); } catch { return []; }
}
export const can = (user, perm) => Boolean(user && (user.permissions.includes('*') || user.permissions.includes(perm)));

// The signed-in user, or null. A deactivated user or a changed role takes effect on the very next request.
export async function currentUser(req) {
  const t = readToken(cookieValue(req, COOKIE));
  if (!t || !t.u) return null;
  const u = await one('SELECT id, email, name, role, active, linked_id FROM users WHERE id = ?', [t.u]);
  if (!u || !u.active) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role, linkedId: u.linked_id, permissions: await permissionsOf(u.role) };
}

// ---- Abuse limits ----
export const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'unknown').split(',')[0].trim();

export async function loginBlocked(ip) {
  const r = await one('SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND at > ?', [ip, Date.now() - 60000]);
  return Number(r.n) >= 10;
}
export async function noteLoginAttempt(ip) {
  await query('INSERT INTO login_attempts (ip, at) VALUES (?, ?)', [ip, Date.now()]);
  if (Math.random() < 0.05) await query('DELETE FROM login_attempts WHERE at < ?', [Date.now() - 3600000]);
}

// ---- Audit log ----
export async function audit(req, user, action, entity, entityId, detail) {
  try {
    await query(
      'INSERT INTO audit_log (id, at, user_id, email, action, entity, entity_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uid(), new Date().toISOString(), user ? user.id : null, user ? user.email : null, action, entity || null, entityId || null,
        detail ? String(detail).slice(0, 500) : null, clientIp(req)],
    );
  } catch (e) { console.error('Audit log:', e.message); }
}
