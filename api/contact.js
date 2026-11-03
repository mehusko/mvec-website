// Sends website inquiries to the MVEC Telegram group.
// Needs the Vercel environment variable TELEGRAM_BOT_TOKEN. TELEGRAM_CHAT_ID is optional:
// if it's missing, the most recent group (or else private chat) the bot has seen is used.

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
async function findGroupChatId(token) {
  const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates?allowed_updates=["message","my_chat_member"]`);
  if (!r.ok) return null;
  const data = await r.json();
  const all = (data.result || []).map((u) => (u.message || u.my_chat_member || {}).chat).filter(Boolean);
  const groups = all.filter((c) => c.type === 'group' || c.type === 'supergroup');
  // Prefer a group; otherwise fall back to a private chat with the bot.
  const chat = groups[groups.length - 1] || all[all.length - 1];
  if (!chat) return null;
  console.log(`Contact form: using Telegram ${chat.type} chat "${chat.title || chat.first_name || ''}" (${chat.id}). Set TELEGRAM_CHAT_ID to pin it.`);
  return chat.id;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: bots fill the hidden "website" field.
  if (clip(body.website, 200)) return res.status(200).json({ ok: true });

  const name = clip(body.name, 120);
  const email = clip(body.email, 160);
  const phone = clip(body.phone, 40);
  const service = clip(body.service, 80);
  const source = clip(body.source, 80);
  const message = clip(body.message, 3000);

  if (!name || !email || !phone || !service || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('Contact form: TELEGRAM_BOT_TOKEN is not set');
    return res.status(500).json({ error: 'Form is not configured yet.' });
  }
  let chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    try { chatId = await findGroupChatId(token); } catch (e) { console.error('getUpdates failed', e); }
  }
  if (!chatId) {
    console.error('Contact form: no Telegram chat found. Send the bot /start (in a group or privately).');
    return res.status(500).json({ error: 'Form is not configured yet.' });
  }

  const text = [
    '<b>New website inquiry</b>',
    '',
    `<b>Name:</b> ${esc(name)}`,
    `<b>Email:</b> ${esc(email)}`,
    `<b>Phone:</b> ${esc(phone)}`,
    `<b>Service:</b> ${esc(service)}`,
    source ? `<b>Heard via:</b> ${esc(source)}` : null,
    '',
    esc(message),
  ].filter((l) => l !== null).join('\n');

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!r.ok) {
      console.error('Telegram error', r.status, await r.text());
      return res.status(502).json({ error: 'Could not send message.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram request failed', err);
    return res.status(502).json({ error: 'Could not send message.' });
  }
}
