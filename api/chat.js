// Website AI chat. Clients sign in with a phone code (see lib/otp.js), then ask questions.
// GET                                      -> { enabled, channels }
// POST { action:'login', phone, code, exp, sig } -> { token, phone }   (code from POST /api/otp)
// POST { action:'ask', token, messages }   -> { reply }
// Every question and answer is also posted to the MVEC Telegram group.
import crypto from 'node:crypto';
import { clip, esc, readBody, sendMessage } from '../lib/telegram.js';
import { channels, normalizePhone, otpEnabled, verifyCode } from '../lib/otp.js';
import { aiReady, askAI, cleanHistory } from '../lib/ai.js';

const SESSION_MS = 24 * 60 * 60 * 1000;
const secret = () => process.env.OTP_SECRET || process.env.TELEGRAM_BOT_TOKEN;
const mac = (s) => crypto.createHmac('sha256', secret()).update('chat|' + s).digest('base64url');

function makeToken(phone) {
  const exp = Date.now() + SESSION_MS;
  return `${phone}.${exp}.${mac(`${phone}.${exp}`)}`;
}

function readToken(token) {
  const [phone, exp, sig] = String(token || '').split('.');
  if (!phone || !exp || !sig || Number(exp) < Date.now()) return null;
  const want = Buffer.from(mac(`${phone}.${exp}`)), got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got) ? phone : null;
}

// Sign-in is required only once a phone-code sender is set up. Until then guests can chat,
// with a small per-visitor limit (per server instance) to keep costs safe.
const enabled = () => aiReady();
const signinRequired = () => otpEnabled();
const GUEST_LIMIT = 15, GUEST_WINDOW_MS = 60 * 60 * 1000;
const guestHits = new Map();
function guestAllowed(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const hits = (guestHits.get(ip) || []).filter((t) => now - t < GUEST_WINDOW_MS);
  if (hits.length >= GUEST_LIMIT) return false;
  hits.push(now); guestHits.set(ip, hits);
  if (guestHits.size > 5000) guestHits.clear();
  return true;
}

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ enabled: enabled(), signin: signinRequired(), channels: channels() });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!enabled()) return res.status(503).json({ error: 'Chat is not available right now. Please WhatsApp us on +960 763 7762.' });
  const body = readBody(req);

  if (body.action === 'login') {
    const phone = normalizePhone(clip(body.phone, 40));
    if (!phone) return res.status(400).json({ error: 'Please enter a valid phone number.' });
    if (!(await verifyCode(phone, clip(body.code, 10), body.exp, clip(body.sig, 300)))) {
      return res.status(400).json({ error: 'That code is wrong or has expired. Please try again.' });
    }
    try { await sendMessage(`<b>💬 Website chat sign-in</b>\nPhone: +${esc(phone)}`); } catch (e) { console.error('Chat notify:', e.message); }
    return res.status(200).json({ token: makeToken(phone), phone });
  }

  if (body.action === 'ask') {
    let phone = readToken(body.token);
    if (!phone && signinRequired()) return res.status(401).json({ error: 'Please sign in again.', signin: true });
    if (!phone) {
      if (!guestAllowed(req)) return res.status(429).json({ error: 'You have sent a lot of questions. Please WhatsApp us on +960 763 7762 and a colleague will help.' });
      phone = null;
    }
    const history = cleanHistory(body.messages);
    if (!history.length) return res.status(400).json({ error: 'Please type a question.' });
    let reply;
    try {
      reply = await askAI(history);
    } catch (err) {
      console.error('Chat AI:', err.message);
      return res.status(502).json({ error: 'Sorry, I could not answer just now. Please WhatsApp us on +960 763 7762.' });
    }
    const q = history[history.length - 1].content;
    try {
      await sendMessage(`<b>💬 Website chat</b> (${phone ? '+' + esc(phone) : 'guest'})\n\n<b>Q:</b> ${esc(q.slice(0, 1500))}\n\n<b>A:</b> ${esc(reply.slice(0, 2000))}`);
    } catch (e) { console.error('Chat notify:', e.message); }
    return res.status(200).json({ reply });
  }

  return res.status(400).json({ error: 'Unknown action.' });
}
