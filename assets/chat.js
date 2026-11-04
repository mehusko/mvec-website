// "Ask MVEC" chat box: the client signs in with a code sent to their phone, then asks the AI.
// Shown only when /api/chat says it is enabled (AI key and a code sender are set up).
(function () {
  var KEY = 'mvec-chat';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var state = load(); // { token, phone, messages: [] }
  state.messages = state.messages || [];
  var channels = [], otp = null;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  async function post(data) {
    var r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    var out = {}; try { out = await r.json(); } catch (e) {}
    if (!r.ok) { var err = new Error(out.error || 'Something went wrong.'); err.signin = out.signin; throw err; }
    return out;
  }

  fetch('/api/chat').then(function (r) { return r.json(); }).then(function (d) {
    if (!d || !d.enabled) return;
    channels = d.channels || [];
    build();
  }).catch(function () {});

  function build() {
    var btn = el('button', 'chat-fab');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Ask MVEC a question');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="#fff" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 6.5a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01z"/></svg>';
    var panel = el('section', 'chat-panel');
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Ask MVEC');
    var head = el('div', 'chat-head');
    head.appendChild(el('strong', '', 'Ask MVEC'));
    var close = el('button', 'chat-x', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close');
    head.appendChild(close);
    var body = el('div', 'chat-body');
    panel.appendChild(head); panel.appendChild(body);
    document.body.appendChild(btn); document.body.appendChild(panel);
    btn.addEventListener('click', function () { panel.hidden = !panel.hidden; if (!panel.hidden) render(body); });
    close.addEventListener('click', function () { panel.hidden = true; });
  }

  function render(body) {
    body.innerHTML = '';
    if (state.token) chatView(body); else signInView(body);
  }

  function signInView(body) {
    body.appendChild(el('p', 'chat-note', 'Sign in with your phone number to chat. We will send you a code' + (channels.length === 1 && channels[0] === 'whatsapp' ? ' on WhatsApp.' : '.')));
    var form = el('form', 'chat-form-col');
    var phone = el('input'); phone.type = 'tel'; phone.placeholder = '+960 XXX XXXX'; phone.required = true; phone.autocomplete = 'tel'; phone.maxLength = 40;
    var send = el('button', 'btn btn-small', 'Send code'); send.type = 'submit';
    var code = el('input'); code.placeholder = 'Enter the code'; code.autocomplete = 'one-time-code'; code.maxLength = 10; code.hidden = true;
    var msg = el('p', 'chat-msg');
    form.appendChild(phone); form.appendChild(code); form.appendChild(send); form.appendChild(msg);
    body.appendChild(form);
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      msg.textContent = ''; send.disabled = true;
      try {
        if (!otp) {
          var ch = channels.indexOf('whatsapp') >= 0 ? 'whatsapp' : channels[0];
          var r = await fetch('/api/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone.value, channel: ch }) });
          var d = await r.json();
          if (!r.ok || !d.sig) throw new Error(d.error || 'Could not send the code.');
          otp = { phone: phone.value, exp: d.exp, sig: d.sig };
          phone.readOnly = true; code.hidden = false; code.required = true; code.focus();
          send.textContent = 'Sign in';
          msg.textContent = 'Code sent. It is valid for 10 minutes.';
        } else {
          var out = await post({ action: 'login', phone: otp.phone, code: code.value, exp: otp.exp, sig: otp.sig });
          state = { token: out.token, phone: out.phone, messages: [] };
          save(state); otp = null; render(body);
        }
      } catch (err) {
        msg.textContent = err.message;
      } finally { send.disabled = false; }
    });
  }

  function chatView(body) {
    var log = el('div', 'chat-log');
    if (!state.messages.length) log.appendChild(el('div', 'chat-bubble bot', 'Hello! Ask me anything about hiring staff, quota, work permits, visas or jobs in the Maldives.'));
    state.messages.forEach(function (m) { log.appendChild(el('div', 'chat-bubble ' + (m.role === 'user' ? 'me' : 'bot'), m.content)); });
    var form = el('form', 'chat-form');
    var input = el('input'); input.placeholder = 'Type your question…'; input.maxLength = 2000; input.required = true;
    var send = el('button', 'btn btn-small', 'Send'); send.type = 'submit';
    form.appendChild(input); form.appendChild(send);
    var foot = el('p', 'chat-foot');
    var out = el('button', 'chat-link', 'Sign out'); out.type = 'button';
    foot.appendChild(document.createTextNode('Need a person? WhatsApp +960 763 7762 · ')); foot.appendChild(out);
    body.appendChild(log); body.appendChild(form); body.appendChild(foot);
    log.scrollTop = log.scrollHeight; input.focus();

    out.addEventListener('click', function () { state = { messages: [] }; save(state); render(body); });
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var q = input.value.trim(); if (!q) return;
      state.messages.push({ role: 'user', content: q });
      log.appendChild(el('div', 'chat-bubble me', q));
      var wait = el('div', 'chat-bubble bot wait', '…'); log.appendChild(wait);
      log.scrollTop = log.scrollHeight; input.value = ''; send.disabled = true;
      try {
        var d = await post({ action: 'ask', token: state.token, messages: state.messages.slice(-12) });
        state.messages.push({ role: 'assistant', content: d.reply });
        wait.className = 'chat-bubble bot'; wait.textContent = d.reply;
      } catch (err) {
        state.messages.pop();
        wait.className = 'chat-bubble bot err'; wait.textContent = err.message;
        if (err.signin) { state = { messages: [] }; save(state); setTimeout(function () { render(body); }, 1500); return; }
      } finally { send.disabled = false; }
      state.messages = state.messages.slice(-30); save(state);
      log.scrollTop = log.scrollHeight;
    });
  }
})();
