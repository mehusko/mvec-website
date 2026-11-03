// Phone verification codes. Stateless: the server signs (phone, code, expiry) with a secret and the
// browser keeps the signature; the code itself is only sent to the phone.
// Enabled only when a sender is configured:
//   WhatsApp Cloud API: WA_TOKEN, WA_PHONE_NUMBER_ID, WA_OTP_TEMPLATE (an approved "authentication"
//   template with a copy-code button), optional WA_OTP_LANG (default en_US).
// Secret: OTP_SECRET (falls back to TELEGRAM_BOT_TOKEN so it works without extra setup).
import crypto from 'node:crypto';

const TTL_MS = 10 * 60 * 1000;

//   Viber (through Infobip Viber Business Messages): INFOBIP_BASE_URL, INFOBIP_API_KEY, VIBER_SENDER.
//   SMS: SMS_PROVIDER = twilio | infobip | http
//     twilio:  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (number or sender ID)
//     infobip: INFOBIP_BASE_URL, INFOBIP_API_KEY, SMS_SENDER
//     http:    SMS_GATEWAY_URL (a local gateway such as Dhiraagu/Ooredoo bulk SMS). {to} and {text}
//              in the URL are replaced; optional SMS_GATEWAY_METHOD (GET|POST, default GET),
//              SMS_GATEWAY_AUTH (sent as the Authorization header), SMS_GATEWAY_BODY (POST body template).

export function channels() {
  const c = [];
  // Order = order shown to clients; the first one is pre-selected.
  if (smsReady()) c.push('sms');
  if (process.env.INFOBIP_BASE_URL && process.env.INFOBIP_API_KEY && process.env.VIBER_SENDER) c.push('viber');
  if (process.env.WA_TOKEN && process.env.WA_PHONE_NUMBER_ID && process.env.WA_OTP_TEMPLATE) c.push('whatsapp');
  return c;
}

function smsReady() {
  const e = process.env;
  switch ((e.SMS_PROVIDER || '').toLowerCase()) {
    case 'twilio': return !!(e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN && e.TWILIO_FROM);
    case 'infobip': return !!(e.INFOBIP_BASE_URL && e.INFOBIP_API_KEY && e.SMS_SENDER);
    case 'http': return !!e.SMS_GATEWAY_URL;
    default: return false;
  }
}

export function otpEnabled() {
  return channels().length > 0;
}

export function normalizePhone(raw) {
  let d = String(raw || '').replace(/[^\d]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 7) d = '960' + d; // local Maldives number
  return d.length >= 8 && d.length <= 15 ? d : '';
}

function secret() {
  const s = process.env.OTP_SECRET || process.env.TELEGRAM_BOT_TOKEN;
  if (!s) throw new Error('OTP secret missing');
  return s;
}

function sign(phone, code, exp) {
  return crypto.createHmac('sha256', secret()).update(`${phone}|${code}|${exp}`).digest('base64url');
}

export function createCode(phone) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const exp = Date.now() + TTL_MS;
  return { code, exp, sig: sign(phone, code, exp) };
}

export function verifyCode(phone, code, exp, sig) {
  if (!phone || !/^\d{6}$/.test(String(code || '')) || !sig) return false;
  const e = Number(exp);
  if (!e || e < Date.now() || e > Date.now() + TTL_MS + 60000) return false;
  const want = Buffer.from(sign(phone, String(code), e));
  const got = Buffer.from(String(sig));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

export async function sendCode(phone, code, channel) {
  const list = channels();
  const use = list.includes(channel) ? channel : list[0];
  if (use === 'viber') return sendViber(phone, code);
  if (use === 'sms') return sendSms(phone, `Your MVEC verification code is ${code}. It expires in 10 minutes.`);
  return sendWhatsApp(phone, code);
}

async function sendSms(phone, text) {
  const e = process.env;
  const provider = (e.SMS_PROVIDER || '').toLowerCase();
  let r;
  if (provider === 'twilio') {
    r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${e.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${e.TWILIO_ACCOUNT_SID}:${e.TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: '+' + phone, From: e.TWILIO_FROM, Body: text }),
    });
  } else if (provider === 'infobip') {
    const base = e.INFOBIP_BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
    r = await fetch(`https://${base}/sms/2/text/advanced`, {
      method: 'POST',
      headers: { Authorization: `App ${e.INFOBIP_API_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ messages: [{ from: e.SMS_SENDER, destinations: [{ to: phone }], text }] }),
    });
  } else {
    const fill = (t) => t.replace(/\{to\}/g, encodeURIComponent(phone)).replace(/\{text\}/g, encodeURIComponent(text));
    const method = (e.SMS_GATEWAY_METHOD || 'GET').toUpperCase();
    const headers = {};
    if (e.SMS_GATEWAY_AUTH) headers.Authorization = e.SMS_GATEWAY_AUTH;
    let body;
    if (method === 'POST' && e.SMS_GATEWAY_BODY) {
      body = e.SMS_GATEWAY_BODY.replace(/\{to\}/g, phone).replace(/\{text\}/g, text.replace(/"/g, '\\"'));
      headers['Content-Type'] = body.trim().startsWith('{') ? 'application/json' : 'application/x-www-form-urlencoded';
    }
    r = await fetch(fill(e.SMS_GATEWAY_URL), { method, headers, body });
  }
  if (!r.ok) throw new Error(`SMS ${r.status}: ${await r.text()}`);
}

async function sendViber(phone, code) {
  const base = process.env.INFOBIP_BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const r = await fetch(`https://${base}/viber/2/messages`, {
    method: 'POST',
    headers: { Authorization: `App ${process.env.INFOBIP_API_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      messages: [{
        sender: process.env.VIBER_SENDER,
        destinations: [{ to: phone }],
        content: { type: 'TEXT', text: `Your MVEC verification code is ${code}. It expires in 10 minutes.` },
      }],
    }),
  });
  if (!r.ok) throw new Error(`Viber ${r.status}: ${await r.text()}`);
}

async function sendWhatsApp(phone, code) {
  const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.WA_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: process.env.WA_OTP_TEMPLATE,
        language: { code: process.env.WA_OTP_LANG || 'en_US' },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: code }] },
          { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
        ],
      },
    }),
  });
  if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${await r.text()}`);
}
