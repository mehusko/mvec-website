// MVEC admin screens. Everything is built from /api/admin/meta, so new modules appear without editing this file.
// All text is inserted with textContent (never innerHTML), so nothing typed into a public form can run as code.
(() => {
  const app = document.getElementById('app');
  let meta = null; let route = 'home'; const open = {};

  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const api = async (method, path, body, extra) => {
    const r = await fetch('/api/admin/' + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(extra || {}) }, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch { /* csv */ }
    if (!r.ok) { const e = new Error(j.error || 'Error'); e.status = r.status; throw e; }
    return path.includes('format=csv') ? t : j;
  };
  const say = (box, text, err) => { box.replaceChildren(h('div', { class: 'msg' + (err ? ' err' : '') }, text)); };
  const nice = (s) => String(s || '').replace(/_/g, ' ');
  const dt = (s) => (s ? String(s).slice(0, 10) : '');
  const money = (v) => (v === '' || v == null ? '' : Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const pillClass = (s) => (['won', 'paid', 'completed', 'hired', 'placed', 'approved', 'published', 'present', 'done', 'posted', 'active', 'open', 'available'].includes(s) ? 'good'
    : ['lost', 'rejected', 'cancelled', 'void', 'failed', 'absent', 'overdue', 'closed', 'hidden'].includes(s) ? 'bad' : ['new', 'draft', 'sent', 'late', 'scheduled', 'planned'].includes(s) ? 'warn' : '');

  // ---------- Sign in ----------
  async function loginScreen() {
    let needsSetup = false; let canReset = false;
    try { const st = await api('GET', 'auth/status'); needsSetup = st.needsSetup; canReset = st.canReset; } catch { /* ignore */ }
    if (needsSetup) return setupScreen(false);
    if (canReset && location.hash === '#reset') return setupScreen(true);
    const box = h('div'); const form = h('div');
    const email = h('input', { type: 'email', autocomplete: 'username' }); const pw = h('input', { type: 'password', autocomplete: 'current-password' });
    const go = h('button', { class: 'btn', onclick: async () => {
      try {
        const r = await api('POST', 'auth/login', { email: email.value, password: pw.value });
        codeStep(r);
      } catch (e) { say(box, e.message, true); }
    } }, 'Sign in');
    pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') go.click(); });
    form.append(h('label', {}, 'Email'), email, h('label', {}, 'Password'), pw, h('p', {}, go));
    app.replaceChildren(h('div', { class: 'login' }, h('h1', {}, 'MVEC Admin'), h('p', { style: 'color:#5b6578' }, 'Staff sign-in'), box, form));

    function codeStep(r) {
      const code = h('input', { inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: '6-digit code' });
      const ok = h('button', { class: 'btn', onclick: async () => {
        try {
          const o = await api('POST', 'auth/2fa', { challenge: r.challenge, code: code.value });
          if (o.backupCodes) return showBackup(o.backupCodes);
          start();
        } catch (e) { say(box, e.message, true); }
      } }, 'Continue');
      code.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok.click(); });
      const intro = r.step === 'enroll'
        ? [h('p', {}, 'First sign-in: set up the 2-step code. Open Google Authenticator (or any authenticator app), add an account by "Enter a setup key", and type this key:'), h('code', { class: 'sec' }, r.secret),
          h('p', {}, 'Then type the 6-digit code the app shows.')]
        : [h('p', {}, 'Type the 6-digit code from your authenticator app. A backup code also works.')];
      form.replaceChildren(...intro, code, h('p', {}, ok));
      code.focus();
    }
    function showBackup(codes) {
      app.replaceChildren(h('div', { class: 'login' }, h('h1', {}, 'Save your backup codes'),
        h('p', {}, 'If you lose your phone, each of these codes can be used once instead of the 6-digit code. Write them down and keep them safe. They will not be shown again.'),
        h('code', { class: 'sec' }, codes.join('   ')), h('p', {}, h('button', { class: 'btn', onclick: start }, 'I saved them, continue'))));
    }
  }

  function setupScreen(reset) {
    const box = h('div'); const key = h('input', { type: 'password' }); const name = h('input'); const email = h('input', { type: 'email' }); const pw = h('input', { type: 'password' });
    const go = h('button', { class: 'btn', onclick: async () => {
      try { await api('POST', 'auth/setup', { name: name.value, email: email.value, password: pw.value, reset: reset || undefined }, { 'x-setup-key': key.value }); history.replaceState(null, '', location.pathname); loginScreen(); }
      catch (e) { say(box, e.message, true); }
    } }, 'Create administrator');
    app.replaceChildren(h('div', { class: 'login' }, h('h1', {}, reset ? 'Reset administrator' : 'First-time setup'), h('p', { style: 'color:#5b6578' }, reset ? 'This removes the existing staff accounts and creates a new administrator. You need the setup key.' : 'Create the first administrator. You need the one-time setup key.'), box,
      h('label', {}, 'Setup key'), key, h('label', {}, 'Your name'), name, h('label', {}, 'Email'), email, h('label', {}, 'Password (8 or more characters)'), pw, h('p', {}, go)));
  }

  // ---------- Shell ----------
  const can = (p) => meta.user.permissions.includes('*') || meta.user.permissions.includes(p);
  function shell(content, title) {
    const nav = h('div', { class: 'side' }, h('h2', {}, 'MVEC Admin'), h('button', { class: 'menu-btn', onclick: () => nav.classList.toggle('open') }, '☰ Menu'));
    const links0 = h('div', { class: 'links' }, h('a', { class: route === 'home' ? 'on' : '', onclick: () => go('home') }, 'Dashboard')); nav.append(links0);
    for (const g of meta.groups) {
      const items = Object.entries(meta.entities).filter(([, e]) => e.group === g);
      const extra = [];
      if (g === 'Finance' && can('reports.view')) extra.push(['reports', 'Reports']);
      if (g === 'Admin') {
        if (can('users.manage')) extra.push(['users', 'Users & roles']);
        if (can('deleted.manage')) extra.push(['deleted', 'Deleted items']);
        if (can('audit.view')) extra.push(['audit', 'Audit log']);
      }
      if (g === 'Config' && can('settings.manage')) extra.push(['settings', 'Settings']);
      if (!items.length && !extra.length) continue;
      const links = h('div', {}, ...items.map(([k, e]) => h('a', { class: route === 'e/' + k ? 'on' : '', onclick: () => go('e/' + k) }, e.label)),
        ...extra.map(([k, l]) => h('a', { class: route === k ? 'on' : '', onclick: () => go(k) }, l)));
      if (open[g] === undefined) open[g] = true;
      links.style.display = open[g] ? '' : 'none';
      links0.append(h('div', { class: 'grp' }, h('button', { onclick: () => { open[g] = !open[g]; links.style.display = open[g] ? '' : 'none'; } }, g), links));
    }
    links0.append(h('div', { class: 'grp' }, h('a', { onclick: changePassword }, 'Change my password'),
      h('a', { onclick: async () => { await api('POST', 'auth/logout', {}); meta = null; loginScreen(); } }, `Sign out (${meta.user.name || meta.user.email})`)));
    app.replaceChildren(h('div', { class: 'layout' }, nav, h('div', { class: 'main' }, h('div', { class: 'bar' }, h('h1', {}, title)), content)));
  }
  function go(r) { route = r; draw(); window.scrollTo(0, 0); }
  async function draw() {
    const box = h('div');
    try {
      if (route === 'home') return shell(await home(), 'Dashboard');
      if (route === 'reports') return shell(await home(), 'Reports');
      if (route.startsWith('e/')) { const k = route.slice(2); shell(box, meta.entities[k].label); return list(box, k); }
      if (route === 'deleted') { shell(box, 'Deleted items'); return deleted(box); }
      if (route === 'audit') { shell(box, 'Audit log'); return audit(box); }
      if (route === 'users') { shell(box, 'Users & roles'); return users(box); }
      if (route === 'settings') { shell(box, 'Settings'); return settings(box); }
    } catch (e) { if (e.status === 401) { meta = null; return loginScreen(); } shell(h('div', { class: 'msg err' }, e.message), 'Error'); }
  }

  // ---------- Dashboard ----------
  async function home() {
    const wrap = h('div');
    if (can('reports.view')) {
      const r = await api('GET', 'reports');
      const s = (n, l) => h('div', { class: 'card stat' }, h('b', {}, n), h('span', {}, l));
      wrap.append(h('div', { class: 'grid' }, s(r.inquiries.new, 'New inquiries'), s(r.applications.new, 'New worker applications'), s(r.workers.available, 'Workers available'),
        s(r.jobs.open, 'Open jobs'), s(r.placements.inProgress, 'Hires in progress'), s(r.placements.waitingMedical, 'Arrived, medical not cleared'),
        s('MVR ' + money(r.invoices.outstanding), 'Invoices outstanding'), s('MVR ' + money(r.invoices.paid), 'Invoices paid'), s('MVR ' + money(r.expenses.total), 'Expenses recorded')));
    } else wrap.append(h('p', {}, 'Welcome. Pick a module on the left.'));
    return wrap;
  }

  // ---------- Lists ----------
  async function list(box, key, state = { q: '', status: '', page: 1 }) {
    const def = meta.entities[key];
    const qs = new URLSearchParams({ ...(state.q && { q: state.q }), ...(state.status && { status: state.status }), page: state.page }).toString();
    const r = await api('GET', `e/${key}?${qs}`);
    const search = h('input', { placeholder: 'Search', value: state.q });
    const sel = h('select', {}, h('option', { value: '' }, 'All statuses'), ...def.statuses.map((s) => h('option', { value: s, selected: s === state.status }, nice(s))));
    const again = () => list(box, key, { q: search.value, status: sel.value, page: 1 });
    search.addEventListener('keydown', (e) => { if (e.key === 'Enter') again(); }); sel.addEventListener('change', again);
    const csvBtn = h('button', { class: 'btn ghost', onclick: async () => {
      const t = await api('GET', `e/${key}?format=csv${state.q ? '&q=' + encodeURIComponent(state.q) : ''}${state.status ? '&status=' + state.status : ''}`);
      const a = h('a', { href: URL.createObjectURL(new Blob([t], { type: 'text/csv' })), download: key + '.csv' }); a.click();
    } }, 'Download CSV');
    const fileIn = h('input', { type: 'file', accept: '.json', style: 'display:none', onchange: async (e) => {
      try {
        const j = JSON.parse(await e.target.files[0].text());
        if (j.entity !== key) throw new Error(`This file is for "${j.entity}", not ${def.label}.`);
        const r = await api('POST', `e/${key}/import`, { rows: j.rows });
        alert(`Imported ${r.added} records (${r.skipped} were already there).`); again();
      } catch (x) { alert(x.message); }
    } });
    const bar = h('div', { class: 'bar' }, search, sel, h('button', { class: 'btn ghost', onclick: again }, 'Search'), csvBtn, def.canManage && h('button', { class: 'btn ghost', onclick: () => fileIn.click() }, 'Import file'), fileIn, def.canManage && h('button', { class: 'btn', onclick: () => form(box, key) }, '+ New'));
    const cols = def.list.map((c) => c);
    const label = (c) => (def.fields.find((f) => f.key === c) || {}).label || (c === 'created_at' ? 'Received' : c === 'progress' ? 'Progress' : nice(c));
    const cell = (row, c) => {
      const v = c === 'created_at' ? dt(row.created_at) : row.data[c];
      const f = def.fields.find((x) => x.key === c);
      return f && (f.type === 'money') || (def.money || []).includes(c) ? money(v) : v;
    };
    const table = h('table', {}, h('thead', {}, h('tr', {}, ...cols.map((c) => h('th', {}, label(c))), h('th', {}, 'Status'))),
      h('tbody', {}, ...(r.rows.length ? r.rows.map((row) => h('tr', { onclick: () => detail(box, key, row.id) },
        ...cols.map((c) => h('td', {}, cell(row, c))), h('td', {}, h('span', { class: 'pill ' + pillClass(row.status) }, nice(row.status)))))
        : [h('tr', {}, h('td', { colspan: cols.length + 1 }, 'Nothing here yet.'))])));
    const pages = Math.ceil(r.total / r.pageSize);
    const pager = pages > 1 ? h('div', { class: 'bar' }, state.page > 1 && h('button', { class: 'btn ghost sm', onclick: () => list(box, key, { ...state, page: state.page - 1 }) }, 'Previous'),
      `Page ${state.page} of ${pages} (${r.total} records)`, state.page < pages && h('button', { class: 'btn ghost sm', onclick: () => list(box, key, { ...state, page: state.page + 1 }) }, 'Next'))
      : h('div', { style: 'color:#5b6578;margin-top:8px' }, `${r.total} records`);
    box.replaceChildren(bar, h('div', { class: 'wrap' }, table), pager);
    box._back = () => list(box, key, state);
  }

  // ---------- Detail and form ----------
  async function detail(box, key, id) {
    const def = meta.entities[key]; const back = box._back;
    const row = await api('GET', `e/${key}/${id}`);
    const msg = h('div');
    const dl = h('div', { class: 'form' }, ...def.fields.filter((f) => row.data[f.key] !== undefined && row.data[f.key] !== '').map((f) =>
      h('div', { class: f.type === 'textarea' ? 'full' : '' }, h('label', {}, f.label),
        h('div', { style: 'white-space:pre-wrap' }, f.type === 'money' ? money(row.data[f.key]) : f.type === 'checkbox' ? 'Yes' : row.data[f.key]))));
    if (row.data.number) dl.prepend(h('div', {}, h('label', {}, 'Number'), h('b', {}, row.data.number)));
    const steps = def.tracker && h('div', { class: 'steps' }, ...meta.tracker.map(([k, l]) => h('span', { class: 'step' + (row.data[k] ? ' done' : '') }, row.data[k] ? `${l}: ${row.data[k]}` : l)));
    const status = def.canManage && h('select', { onchange: async (e) => { try { await api('POST', `e/${key}/${id}/status`, { status: e.target.value }); say(msg, 'Status updated.'); } catch (x) { say(msg, x.message, true); } } },
      ...def.statuses.map((s) => h('option', { value: s, selected: s === row.status }, nice(s))));
    const publish = key === 'social' && def.canManage && row.status !== 'posted' && h('button', { class: 'btn', onclick: async (e) => {
      if (!confirm('Send this post to Buffer now? It will be scheduled or posted on the chosen channels.')) return;
      e.target.disabled = true;
      try { const r = await api('POST', `e/${key}/${id}/publish`, {}); say(msg, r.result, Boolean(r.failed)); setTimeout(() => detail(box, key, id), 1500); }
      catch (x) { say(msg, x.message, true); e.target.disabled = false; }
    } }, 'Send to Buffer');
    const acts = h('div', { class: 'bar' }, h('button', { class: 'btn ghost', onclick: back }, 'Back'), status, publish,
      def.canManage && h('button', { class: 'btn', onclick: () => form(box, key, row) }, 'Edit'),
      def.canManage && h('button', { class: 'btn red', onclick: async () => { if (confirm('Move this to Deleted items? You can restore it later.')) { await api('DELETE', `e/${key}/${id}`); back(); } } }, 'Delete'));
    box.replaceChildren(acts, msg, h('div', { class: 'card' }, steps, dl, h('p', { style: 'color:#5b6578;font-size:12px' }, `Received ${dt(row.created_at)} · Last changed ${dt(row.updated_at)}`)));
  }

  async function form(box, key, row) {
    const def = meta.entities[key]; const back = box._back; const msg = h('div');
    const refs = {};
    for (const f of def.fields) if (f.type === 'ref') refs[f.key] = (await api('GET', `e/${f.ref}?page=1`)).rows;
    const inputs = {};
    let chans = null;
    if (key === 'social') { try { chans = await api('GET', 'social/channels'); } catch { chans = null; } }
    const fields = def.fields.filter((f) => !f.computed).map((f) => {
      if (key === 'social' && f.key === 'channels') {
        const chosen = String((row && row.data.channels) || '').split(',').map((x) => x.trim()).filter(Boolean);
        const box2 = h('div', {});
        const list = (chans && chans.channels) || [];
        if (!chans || !chans.connected) box2.append(h('p', { style: 'color:#5b6578;font-size:13px' }, 'Buffer is not connected yet. Add the BUFFER_API_KEY in Vercel (see ADMIN-SETUP.md), then channels will appear here.'));
        else if (chans.error) box2.append(h('p', { style: 'color:#b42318;font-size:13px' }, chans.error));
        else if (!list.length) box2.append(h('p', { style: 'font-size:13px' }, 'No channels found in Buffer.'));
        const boxes = list.map((c) => { const cb = h('input', { type: 'checkbox', value: c.id }); cb.checked = chosen.includes(c.id); box2.append(h('label', { style: 'display:block;font-weight:normal' }, cb, ` ${c.name} (${c.service})`)); return cb; });
        inputs.channels = { get value() { return boxes.filter((b) => b.checked).map((b) => b.value).join(','); } };
        return h('div', { class: 'full' }, h('label', {}, f.label), box2);
      }
      const v = row ? row.data[f.key] : undefined; let inp;
      if (f.type === 'textarea') inp = h('textarea', { rows: 3 });
      else if (f.type === 'select') inp = h('select', {}, h('option', { value: '' }, ''), ...f.options.map((o) => h('option', { value: o }, o)));
      else if (f.type === 'checkbox') inp = h('input', { type: 'checkbox' });
      else if (f.type === 'ref') inp = h('select', {}, h('option', { value: '' }, '— none —'), ...refs[f.key].map((r) => h('option', { value: r.id }, r.data.name || r.data.title || r.id)));
      else inp = h('input', { type: ({ number: 'number', money: 'number', date: 'date', datetime: 'datetime-local', email: 'email', tel: 'tel', url: 'url' })[f.type] || 'text', step: f.type === 'money' ? '0.01' : undefined });
      if (f.type === 'checkbox') inp.checked = Boolean(v); else if (v !== undefined) inp.value = v;
      inputs[f.key] = inp;
      return h('div', { class: f.type === 'textarea' ? 'full' : '' }, h('label', {}, f.label + (f.required ? ' *' : '')), inp);
    });
    const val = (f) => (f.type === 'checkbox' ? inputs[f.key].checked : inputs[f.key].value);
    const save = h('button', { class: 'btn', onclick: async () => {
      const data = {}; for (const f of def.fields) if (!f.computed) data[f.key] = val(f);
      // Fill the readable name when a Client or Worker was picked from the list.
      for (const f of def.fields) if (f.type === 'ref' && data[f.key]) {
        const hit = refs[f.key].find((r) => r.id === data[f.key]); const nameKey = f.key.replace('_id', '_name');
        if (hit && inputs[nameKey] && !data[nameKey]) data[nameKey] = hit.data.name;
      }
      try {
        if (row) await api('PUT', `e/${key}/${row.id}`, { data }); else await api('POST', `e/${key}`, { data });
        back();
      } catch (e) { say(msg, e.message, true); }
    } }, 'Save');
    box.replaceChildren(h('div', { class: 'bar' }, h('button', { class: 'btn ghost', onclick: row ? () => detail(box, key, row.id) : back }, 'Cancel'), save), msg, h('div', { class: 'card' }, h('div', { class: 'form' }, ...fields)));
  }

  // ---------- Admin screens ----------
  async function deleted(box) {
    const r = await api('GET', 'deleted');
    box.replaceChildren(h('p', {}, 'Deleted records stay here until you restore or erase them.'), h('div', { class: 'wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ...['Module', 'Record', 'Deleted', ''].map((c) => h('th', {}, c)))),
      h('tbody', {}, ...(r.rows.length ? r.rows.map((x) => h('tr', { style: 'cursor:default' }, h('td', {}, x.entity), h('td', {}, x.data.name || x.data.title || x.data.number || x.data.worker_name || x.id), h('td', {}, dt(x.deleted_at)),
        h('td', {}, h('button', { class: 'btn sm', onclick: async () => { await api('POST', `deleted/${x.id}/restore`, {}); deleted(box); } }, 'Restore'), ' ',
          h('button', { class: 'btn red sm', onclick: async () => { if (confirm('Erase forever? This cannot be undone.')) { await api('DELETE', `deleted/${x.id}`); deleted(box); } } }, 'Erase forever'))))
        : [h('tr', {}, h('td', { colspan: 4 }, 'Nothing deleted.'))])))));
  }
  async function audit(box) {
    const r = await api('GET', 'audit');
    box.replaceChildren(h('div', { class: 'wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ...['When', 'Who', 'Action', 'Module', 'Detail', 'IP'].map((c) => h('th', {}, c)))),
      h('tbody', {}, ...r.rows.map((x) => h('tr', { style: 'cursor:default' }, h('td', {}, String(x.at).replace('T', ' ').slice(0, 19)), h('td', {}, x.email || ''), h('td', {}, x.action), h('td', {}, x.entity || ''), h('td', {}, x.detail || ''), h('td', {}, x.ip || '')))))));
  }
  async function users(box) {
    const [u, ro, cl, wk] = await Promise.all([api('GET', 'users'), api('GET', 'roles'), api('GET', 'e/clients?page=1'), api('GET', 'e/workers?page=1')]); const msg = h('div');
    const f = { name: h('input', { placeholder: 'Name' }), email: h('input', { type: 'email', placeholder: 'Email' }), pw: h('input', { type: 'text', placeholder: 'Starting password (8+)' }),
      role: h('select', {}, ...ro.roles.map((r) => h('option', { value: r.name }, r.label))), link: h('select', { style: 'display:none' }) };
    const fillLink = () => {
      const list = f.role.value === 'client' ? cl.rows : f.role.value === 'staff' ? wk.rows : null;
      f.link.style.display = list ? '' : 'none';
      f.link.replaceChildren(h('option', { value: '' }, f.role.value === 'client' ? '— which client? —' : '— which worker? —'), ...(list || []).map((r) => h('option', { value: r.id }, r.data.name)));
    };
    f.role.addEventListener('change', fillLink);
    const add = h('button', { class: 'btn', onclick: async () => { try { await api('POST', 'users', { name: f.name.value, email: f.email.value, password: f.pw.value, role: f.role.value, linked_id: f.link.value || null }); users(box); } catch (e) { say(msg, e.message, true); } } }, 'Add user');
    const rows = u.rows.map((x) => {
      const role = h('select', { onchange: (e) => api('PUT', `users/${x.id}`, { role: e.target.value }).then(() => say(msg, 'Saved.')).catch((er) => say(msg, er.message, true)) },
        ...ro.roles.map((r) => h('option', { value: r.name, selected: r.name === x.role }, r.label)));
      return h('tr', { style: 'cursor:default' }, h('td', {}, x.name || ''), h('td', {}, x.email), h('td', {}, role), h('td', {}, x.totp_enabled ? 'On' : 'Not set up'), h('td', {}, dt(x.last_login)),
        h('td', {}, h('button', { class: 'btn ghost sm', onclick: async () => { try { await api('PUT', `users/${x.id}`, { active: !x.active }); users(box); } catch (e) { say(msg, e.message, true); } } }, x.active ? 'Lock' : 'Unlock'), ' ',
          h('button', { class: 'btn ghost sm', onclick: async () => { const p = prompt('New password for ' + x.email + ' (8+ characters)'); if (p) { try { await api('PUT', `users/${x.id}`, { password: p }); say(msg, 'Password changed.'); } catch (e) { say(msg, e.message, true); } } } }, 'New password'), ' ',
          h('button', { class: 'btn ghost sm', onclick: async () => { if (confirm('Reset 2-step code? They must set it up again on next sign-in.')) { await api('POST', `users/${x.id}/reset2fa`, {}); users(box); } } }, 'Reset 2-step')));
    });
    box.replaceChildren(msg, h('div', { class: 'card' }, h('b', {}, 'Add a staff member'), h('div', { class: 'form' }, f.name, f.email, f.pw, f.role, f.link), h('p', {}, add)),
      h('div', { class: 'wrap', style: 'margin-top:14px' }, h('table', {}, h('thead', {}, h('tr', {}, ...['Name', 'Email', 'Role', '2-step', 'Last sign-in', ''].map((c) => h('th', {}, c)))), h('tbody', {}, ...rows))));
  }
  async function settings(box) {
    const s = await api('GET', 'settings'); const msg = h('div');
    const keys = [['company_name', 'Company name'], ['phone', 'Phone'], ['email', 'Email'], ['address', 'Address'], ['hours', 'Opening hours']];
    const ins = {}; const fields = keys.map(([k, l]) => { ins[k] = h('input', { value: s[k] || '' }); return h('div', {}, h('label', {}, l), ins[k]); });
    box.replaceChildren(msg, h('div', { class: 'card' }, h('div', { class: 'form' }, ...fields), h('p', {}, h('button', { class: 'btn', onclick: async () => {
      try { await api('PUT', 'settings', Object.fromEntries(keys.map(([k]) => [k, ins[k].value]))); say(msg, 'Saved.'); } catch (e) { say(msg, e.message, true); } } }, 'Save'))));
  }
  function changePassword() {
    const cur = prompt('Your current password'); if (!cur) return;
    const nw = prompt('New password (8 or more characters)'); if (!nw) return;
    api('POST', 'auth/password', { current: cur, password: nw }).then(() => alert('Password changed.')).catch((e) => alert(e.message));
  }


  // ---------- Client and staff portal ----------
  async function portalScreen() {
    let d; try { d = await api('GET', 'portal/home'); } catch (e) { return app.replaceChildren(h('div', { class: 'login' }, h('h1', {}, 'MVEC Portal'), h('div', { class: 'msg err' }, e.message), h('p', {}, h('button', { class: 'btn ghost', onclick: async () => { await api('POST', 'auth/logout', {}); loginScreen(); } }, 'Sign out')))); }
    const tabs = d.kind === 'client' ? ['Dashboard', 'My staff', 'Invoices', 'Schedules', 'Profile'] : ['Dashboard', 'Schedules', 'Attendance', 'Pay slips', 'Documents', 'Profile'];
    let tab = tabs[0];
    const table = (cols, rows, empty) => h('div', { class: 'wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ...cols.map((c) => h('th', {}, c[0])))),
      h('tbody', {}, ...(rows.length ? rows.map((r) => h('tr', { style: 'cursor:default' }, ...cols.map((c) => h('td', {}, c[2] ? c[2](r[c[1]]) : r[c[1]] ?? '')))) : [h('tr', {}, h('td', { colspan: cols.length }, empty))]))));
    const pill = (v) => h('span', { class: 'pill ' + pillClass(v) }, nice(v));
    const views = {
      'Dashboard': () => {
        const box = h('div');
        if (d.kind === 'client') {
          if (!d.placements.length) box.append(h('p', {}, 'No hires in progress yet.'));
          for (const p of d.placements) box.append(h('div', { class: 'card', style: 'margin-bottom:12px' }, h('b', {}, `${p.worker_name || 'Your hire'}${p.role ? ' — ' + p.role : ''}`), pill(p.status),
            h('div', { class: 'steps' }, ...meta.tracker.map(([k, l]) => h('span', { class: 'step' + (p.steps[k] ? ' done' : '') }, p.steps[k] ? `${l}: ${p.steps[k]}` : l)))));
          const due = d.invoices.filter((i) => ['sent', 'overdue'].includes(i.status));
          box.append(h('div', { class: 'grid' }, h('div', { class: 'card stat' }, h('b', {}, d.staff.length), h('span', {}, 'Staff with you')), h('div', { class: 'card stat' }, h('b', {}, due.length), h('span', {}, 'Invoices to pay'))));
        } else {
          const up = d.schedules.filter((s) => s.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
          box.append(h('h3', {}, 'Upcoming'), table([['Date', 'date'], ['Client', 'client_name'], ['From', 'start'], ['To', 'end']], up, 'Nothing scheduled.'));
        }
        return box;
      },
      'My staff': () => table([['Name', 'name'], ['Role', 'role'], ['Country', 'country']], d.staff, 'No staff yet.'),
      'Invoices': () => table([['Number', 'number'], ['Description', 'description'], ['Total (MVR)', 'total', money], ['Due', 'due_date'], ['Status', 'status', pill]], d.invoices, 'No invoices.'),
      'Schedules': () => table(d.kind === 'client' ? [['Date', 'date'], ['Worker', 'worker_name'], ['From', 'start'], ['To', 'end']] : [['Date', 'date'], ['Client', 'client_name'], ['From', 'start'], ['To', 'end']], d.schedules, 'Nothing scheduled.'),
      'Attendance': () => table([['Date', 'date'], ['Hours', 'hours'], ['Status', 'status', pill]], d.attendance, 'No attendance yet.'),
      'Pay slips': () => table([['Month', 'month'], ['Base', 'base', money], ['Bonus', 'bonus', money], ['Deductions', 'deductions', money], ['Net pay (MVR)', 'net', money], ['Status', 'status', pill]], d.payslips, 'No pay slips yet.'),
      'Documents': () => table([['Document', 'name'], ['Type', 'type'], ['Expires', 'expires']], d.documents, 'No documents.'),
      'Profile': () => {
        const msg = h('div'); const phone = h('input', { value: d.profile.phone || '' }); const email = h('input', { value: d.profile.email || '' }); const addr = h('input', { value: d.profile.address || '' });
        return h('div', { class: 'card' }, msg, h('p', {}, h('b', {}, d.profile.name || '')), h('div', { class: 'form' }, h('div', {}, h('label', {}, 'Phone'), phone), h('div', {}, h('label', {}, 'Email'), email), d.kind === 'client' && h('div', {}, h('label', {}, 'Address'), addr)),
          h('p', {}, h('button', { class: 'btn', onclick: async () => { try { await api('PUT', 'portal/profile', { phone: phone.value, email: email.value, address: addr.value }); say(msg, 'Saved.'); } catch (e) { say(msg, e.message, true); } } }, 'Save')),
          h('p', {}, h('button', { class: 'btn ghost', onclick: changePassword }, 'Change my password')));
      },
    };
    const draw2 = () => {
      const nav = h('div', { class: 'side' }, h('h2', {}, 'MVEC Portal'), h('button', { class: 'menu-btn', onclick: () => nav.classList.toggle('open') }, '☰ ' + tab));
      nav.append(h('div', { class: 'links' }, ...tabs.map((t) => h('a', { class: t === tab ? 'on' : '', onclick: () => { tab = t; draw2(); } }, t)),
        h('div', { class: 'grp' }, h('a', { onclick: async () => { await api('POST', 'auth/logout', {}); meta = null; loginScreen(); } }, `Sign out (${d.profile.name || meta.user.email})`))));
      app.replaceChildren(h('div', { class: 'layout' }, nav, h('div', { class: 'main' }, h('div', { class: 'bar' }, h('h1', {}, tab)), views[tab]())));
    };
    draw2();
  }

  async function start() {
    try { meta = await api('GET', 'meta'); route = 'home'; if (meta.portal) return portalScreen(); draw(); } catch { loginScreen(); }
  }
  start();
})();
