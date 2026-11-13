// Telegram bot webhook: the Mvec bot answers clients who message it privately, using AI.
// Each private question and answer is copied to the MVEC group (TELEGRAM_CHAT_ID).
// Messages inside groups are ignored, so the team can talk freely.
// Staff commands (/jobs, /addjob, /closejob, /registrations, /help) work only from the MVEC chat
// (TELEGRAM_CHAT_ID) or from people listed in TELEGRAM_ADMIN_IDS. See lib/jobs.js.
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET, ANTHROPIC_API_KEY,
//      TELEGRAM_ADMIN_IDS (optional, comma separated user ids), BLOB_READ_WRITE_TOKEN (jobs store).
//
// Setup (once): send a request with header  x-setup-key: <TELEGRAM_WEBHOOK_SECRET>
//   GET  /api/telegram  -> current webhook info
//   PUT  /api/telegram  -> points the bot's webhook at this endpoint
import { esc, readBody, sendMessage } from '../lib/telegram.js';
import { aiReady, askAI } from '../lib/ai.js';
import { loadJobs, nextId, parseJob, saveJobs, storeReady } from '../lib/jobs.js';
import { loadRecords, recordsReady, toCsv } from '../lib/records.js';

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
    // Setup only with the x-setup-key header, never in the URL (URLs end up in logs and history).
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
  if (msg && msg.chat && msg.text && isStaff(msg) && /^\/(jobs|addjob|closejob|help|registrations)(@\w+)?\b/i.test(msg.text.trim())) {
    try { await staffCommand(msg); }
    catch (err) {
      console.error('Staff command:', err.message);
      await api('sendMessage', { chat_id: msg.chat.id, text: 'Sorry, that did not work: ' + err.message }).catch(() => {});
    }
    return res.status(200).end();
  }
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

// ---- Staff commands for open jobs ----

function isStaff(msg) {
  const chat = String(process.env.TELEGRAM_CHAT_ID || '');
  const admins = String(process.env.TELEGRAM_ADMIN_IDS || '').split(',').map((x) => x.trim()).filter(Boolean);
  return (chat && String(msg.chat.id) === chat) || (msg.from && admins.includes(String(msg.from.id)));
}

const JOB_HELP = [
  'Open jobs on the website (mvec.mv/jobs):',
  '',
  '/jobs  shows the current list',
  '/closejob J004  removes a job',
  '/addjob  adds a job. Send it like this:',
  '',
  '/addjob',
  'Title: Commis chef',
  'Place: Resort, Baa Atoll',
  'Type: Full time',
  'Pay: USD 600 a month + food and room',
  'Sector: Hospitality',
  'Requirements: 2 years resort kitchen, English',
  '',
  'Only Title is required. Sector can be Domestic, Hospitality, Construction, Retail & office or anything else.',
  '',
  'Workers who registered or applied on the website:',
  '/registrations  sends the full list as a spreadsheet (opens in Excel or Google Sheets)',
].join('\n');

const jobLine = (j) => `${j.id}  ${j.title}${j.place ? ' · ' + j.place : ''}${j.pay ? ' · ' + j.pay : ''}`;

async function staffCommand(msg) {
  const chatId = msg.chat.id;
  const text = String(msg.text).trim().slice(0, 3000);
  const cmd = text.match(/^\/(\w+)/)[1].toLowerCase();
  const reply = (t) => api('sendMessage', { chat_id: chatId, text: t, disable_web_page_preview: true });

  if (cmd === 'help') return reply(JOB_HELP);
  if (cmd === 'registrations') return sendRegistrations(chatId, reply);

  const data = await loadJobs();
  const open = (data.jobs || []).filter((j) => !j.closed);
  if (cmd === 'jobs') {
    if (!open.length) return reply('No open jobs on the website right now. Add one with /addjob (send /help for the format).');
    return reply((data.sample ? 'These are the EXAMPLE jobs. The first /addjob replaces them.\n\n' : 'Open jobs on the website:\n\n') + open.map(jobLine).join('\n'));
  }

  if (!storeReady()) return reply('Job storage is not connected yet, so I cannot change the list. Ask your web person to connect a Vercel Blob store to the mvec-website project.');

  if (cmd === 'addjob') {
    const job = parseJob(text);
    if (!job) return reply('I need at least a title.\n\n' + JOB_HELP);
    const jobs = data.sample ? [] : data.jobs || [];
    job.id = nextId(jobs);
    job.posted = new Date().toISOString().slice(0, 10);
    jobs.push(job);
    await saveJobs({ jobs });
    return reply(`Added ${jobLine(job)}\n\nIt shows on mvec.mv/jobs within a minute. Remove it later with /closejob ${job.id}`);
  }

  if (cmd === 'closejob') {
    const id = (text.split(/\s+/)[1] || '').toUpperCase();
    if (!id) return reply('Which job? For example: /closejob J004. Send /jobs to see the numbers.');
    if (data.sample) return reply('The website still shows example jobs. Add a real job with /addjob and the examples go away.');
    const job = (data.jobs || []).find((j) => String(j.id).toUpperCase() === id);
    if (!job) return reply(`No job ${id}. Send /jobs to see the list.`);
    await saveJobs({ jobs: data.jobs.filter((j) => j !== job) });
    return reply(`Removed ${jobLine(job)}`);
  }
}

async function sendRegistrations(chatId, reply) {
  if (!recordsReady()) return reply('Saving registrations is not set up yet (needs the Blob store and DATA_ENCRYPTION_KEY in Vercel).');
  await api('sendChatAction', { chat_id: chatId, action: 'upload_document' });
  const records = await loadRecords();
  if (!records.length) return reply('No registrations or job applications saved yet. New ones from the website are saved from now on.');
  const week = Date.now() - 7 * 864e5;
  const recent = records.filter((r) => Date.parse(r.at) > week).length;
  const regs = records.filter((r) => r.kind === 'registration').length;
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', `${records.length} in total: ${regs} registrations, ${records.length - regs} job applications. ${recent} in the last 7 days. Newest first.`);
  form.append('document', new Blob([toCsv(records)], { type: 'text/csv' }), `mvec-workers-${new Date().toISOString().slice(0, 10)}.csv`);
  const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`, { method: 'POST', body: form });
  if (!r.ok) throw new Error('Telegram ' + r.status);
}
