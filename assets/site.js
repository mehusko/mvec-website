// Shared behaviour for every page: menu, footer year, forms, floating WhatsApp button.
(function () {
  var WA = 'https://wa.me/9607637762';

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var t = document.querySelector('.nav-toggle'), l = document.querySelector('.nav-links');
  if (t && l) {
    t.addEventListener('click', function () { var o = l.classList.toggle('open'); t.setAttribute('aria-expanded', o); });
    l.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { l.classList.remove('open'); }); });
  }

  // Floating WhatsApp button
  var fab = document.createElement('a');
  fab.href = WA + '?text=' + encodeURIComponent('Hi MVEC, I have a question.');
  fab.target = '_blank'; fab.rel = 'noopener'; fab.className = 'wa-fab';
  fab.setAttribute('aria-label', 'Chat with us on WhatsApp');
  fab.innerHTML = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.7c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.7 10.7 0 1 1 16 26.7zm5.9-8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.8 8.8 0 0 1-4.3-3.8c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5l-.6-.3z"/></svg>';
  document.body.appendChild(fab);

  // AI chat box (assets/chat.js) — shows itself only when enabled.
  var cs = document.createElement('script'); cs.src = '/assets/chat.js'; cs.defer = true; document.body.appendChild(cs);

  // Forms with data-endpoint post JSON to that endpoint.
  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1]); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  document.querySelectorAll('form[data-endpoint]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type=submit]');
    var label = btn.textContent;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var data = {};
      new FormData(form).forEach(function (v, k) { if (!(v instanceof File)) data[k] = v; });
      var fileInput = form.querySelector('input[type=file]');
      if (fileInput && fileInput.files[0]) {
        var file = fileInput.files[0];
        if (file.size > 3 * 1024 * 1024) {
          status.textContent = 'Your CV is larger than 3 MB. Please send a smaller file, or WhatsApp it to us.';
          status.classList.add('err');
          return;
        }
        data.cv = { name: file.name, type: file.type, data: await readFile(file) };
      }

      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        var res = await fetch(form.dataset.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        var out = {};
        try { out = await res.json(); } catch (_) {}
        if (!res.ok) throw new Error(out.error || '');
        form.reset();
        status.textContent = form.dataset.success || "Thank you! We'll get back to you within 24 hours.";
        status.classList.add('ok');
        if (window.va) window.va('event', { name: 'form_submit', data: { form: form.id } });
      } catch (err) {
        status.textContent = (err.message && err.message !== 'Failed to fetch' ? err.message + ' ' : 'Sorry, something went wrong. ') + 'You can also WhatsApp us on +960 763 7762.';
        status.classList.add('err');
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
  });

  // Pre-fill the worker request form when someone clicks "Request" on a worker card.
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-request]');
    if (!b) return;
    var input = document.querySelector('#request-form [name=worker]');
    if (input) { input.value = b.dataset.request; document.getElementById('request').scrollIntoView({ behavior: 'smooth' }); setTimeout(function(){ input.focus(); }, 400); }
  });
})();
