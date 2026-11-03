// GET  -> { enabled }               whether phone verification is switched on
// POST { phone, channel } -> { exp, sig }   sends a 6-digit code by WhatsApp or Viber
import { clip, readBody } from '../lib/telegram.js';
import { channels, createCode, normalizePhone, otpEnabled, sendCode } from '../lib/otp.js';

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ enabled: otpEnabled(), channels: channels() });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!otpEnabled()) return res.status(200).json({ enabled: false });
  const body = readBody(req);
  const phone = normalizePhone(clip(body.phone, 40));
  const channel = clip(body.channel, 20);
  if (!phone) return res.status(400).json({ error: 'Please enter a valid phone number with country code.' });
  try {
    const { code, exp, sig } = createCode(phone);
    await sendCode(phone, code, channel);
    return res.status(200).json({ enabled: true, exp, sig });
  } catch (err) {
    console.error('OTP send failed:', err.message);
    return res.status(502).json({ error: 'Could not send the code. Check the number uses this app, try the other option, or call us.' });
  }
}
