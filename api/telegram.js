// Telegram bot webhook: the Mvec bot answers clients who message it privately, using AI.
// Each private question and answer is copied to the MVEC group (TELEGRAM_CHAT_ID).
// Messages inside groups are ignored, so the team can talk freely.
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET, ANTHROPIC_API_KEY.
//
// Setup (once): send a request with header  x-setup-key: <TELEGRAM_WEBHOOK_SECRET>
//   GET  /api/telegram  -> current webhook info
//   PUT  /api/telegram  -> points the bot's webhook at this endpoint
import { esc, readBody, sendMessage } from '../lib/telegram.js';
import { aiReady, askAI } from '../lib/ai.js';

const api = (method, payload) =>
  fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  }).then((r) => r.json());

const WELCOME = 'Hello! I am the MVEC assistant. Ask me anything about hiring foreign staff, expat quota, work permits, visas, household workers, or finding a job in the Maldives.\n\nFor your own case, our team is on WhatsApp +960 763 7762 (Sun to Thu, 9 AM to 5 PM).';

export default async function handler(req, res) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (req.method === 'GET' || req.method === 'PUT') {
    if (!secret || req.headers['x-setup-key'] !== secret) return res.status(403).json({ error: 'Forbidden' });
    if (req.method === 'GET') return res.status(200).json(await api('getWebhookInfo'));
    const url = `https://${req.headers.host}/api/telegram`;
    const out = await api('setWebhook', { url, secret_token: secret, allowed_updates: ['message'], drop_pending_updates: true });
    return res.status(200).json({ url, ...out });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, PUT, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!secret || req.headers['x-telegram-bot-api-secret-token'] !== secret) return res.status(403).end();

  const msg = readBody(req).message;
  // Only private chats with text; always answer Telegram with 200 so it doesn't retry.
  if (!msg || !msg.chat || msg.chat.type !== 'private' || !msg.text) return res.status(200).end();

  const chatId = msg.chat.id;
  const text = String(msg.text).trim().slice(0, 2000);
  const from = msg.from || {};
  const who = [from.first_name, from.last_name].filter(Boolean).join(' ') + (from.username ? ` (@${from.username})` : '');

  try {
    if (text.startsWith('/start')) {
      await api('sendMessage', { chat_id: chatId, text: WELCOME });
      await sendMessage(`<b>💬 New Telegram chat</b> with ${esc(who)}`).catch(() => {});
      return res.status(200).end();
    }
    if (!aiReady()) {
      await api('sendMessage', { chat_id: chatId, text: 'Thank you! Our team will reply soon. You can also WhatsApp us on +960 763 7762.' });
      await sendMessage(`<b>💬 Telegram message</b> from ${esc(who)}\n\n${esc(text)}`).catch(() => {});
      return res.status(200).end();
    }

    await api('sendChatAction', { chat_id: chatId, action: 'typing' });
    const history = [];
    const prev = msg.reply_to_message && msg.reply_to_message.text;
    if (prev) history.push({ role: 'user', content: '(earlier message)' }, { role: 'assistant', content: String(prev).slice(0, 2000) });
    history.push({ role: 'user', content: text });

    const reply = await askAI(history);
    await api('sendMessage', { chat_id: chatId, text: reply || 'Please WhatsApp us on +960 763 7762 and our team will help.' });
    await sendMessage(`<b>💬 Telegram chat</b> with ${esc(who)}\n\n<b>Q:</b> ${esc(text)}\n\n<b>A:</b> ${esc(reply.slice(0, 2000))}`).catch((e) => console.error('Group copy:', e.message));
  } catch (err) {
    console.error('Telegram bot:', err.message);
    await api('sendMessage', { chat_id: chatId, text: 'Sorry, I could not answer just now. Please WhatsApp us on +960 763 7762.' }).catch(() => {});
  }
  return res.status(200).end();
}
