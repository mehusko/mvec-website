// Shared Telegram helpers for the website's serverless functions.
// Env: TELEGRAM_BOT_TOKEN (required), TELEGRAM_CHAT_ID (optional, auto-detected if missing).

export const clip = (v, n) => String(v ?? '').trim().slice(0, n);
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export function readBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body || {};
}

async function findChatId(token) {
  const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates?allowed_updates=["message","my_chat_member"]`);
  if (!r.ok) return null;
  const data = await r.json();
  const all = (data.result || []).map((u) => (u.message || u.my_chat_member || {}).chat).filter(Boolean);
  const groups = all.filter((c) => c.type === 'group' || c.type === 'supergroup');
  // Prefer a group; otherwise fall back to a private chat with the bot.
  const chat = groups[groups.length - 1] || all[all.length - 1];
  if (!chat) return null;
  console.log(`Telegram: using ${chat.type} chat "${chat.title || chat.first_name || ''}" (${chat.id}). Set TELEGRAM_CHAT_ID to pin it.`);
  return chat.id;
}

async function target() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  let chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) chatId = await findChatId(token);
  if (!chatId) throw new Error('No Telegram chat found. Send the bot /start (in a group or privately).');
  return { token, chatId };
}

async function check(r) {
  if (!r.ok) throw new Error(`Telegram ${r.status}: ${await r.text()}`);
}

export async function sendMessage(text) {
  const { token, chatId } = await target();
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  await check(r);
}

export async function sendDocument(buffer, filename, mime, caption) {
  const { token, chatId } = await target();
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', caption);
  form.append('parse_mode', 'HTML');
  form.append('document', new Blob([buffer], { type: mime || 'application/octet-stream' }), filename);
  const r = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body: form });
  await check(r);
}
