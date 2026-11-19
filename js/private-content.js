(() => {
  'use strict';
  const API = (window.LIEZEL_API_BASE || '').replace(/\/$/, '');
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const gate = $('#privacy-gate'), form = $('#passphrase-form'), input = $('#passphrase-input');
  const error = $('#gate-error'), submit = $('#gate-submit'), lock = $('#lock-again');
  const TOKEN_KEY = 'liezel_private_session';
  let token = '';
  const text = (selector, value) => { const el = $(selector); if (el && typeof value === 'string') el.textContent = value; };
  const setList = (selector, values, childSelector) => {
    if (!Array.isArray(values)) return;
    document.querySelectorAll(selector).forEach((el, i) => { if (typeof values[i] === 'string') { const child = childSelector ? $(childSelector, el) : el; if (child) child.textContent = values[i]; } });
  };
  function unlock() { document.body.classList.remove('private-locked'); gate.hidden = true; lock.hidden = false; document.querySelector('main')?.removeAttribute('inert'); document.querySelector('.top-note')?.removeAttribute('inert'); document.querySelector('.site-footer')?.removeAttribute('inert'); }
  function showGate() { document.body.classList.add('private-locked'); gate.hidden = false; lock.hidden = true; document.querySelector('main')?.setAttribute('inert', ''); document.querySelector('.top-note')?.setAttribute('inert', ''); document.querySelector('.site-footer')?.setAttribute('inert', ''); input.value = ''; input.focus(); }
  async function fetchPrivateContent() {
    const response = await fetch(`${API}/api/content`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) throw new Error('Your private letter could not be loaded. Please sign in again.');
    const data = await response.json();
    text('#opening-note .handwritten', data.openingNote);
    text('#chapter-02 .placeholder-copy', data.introduction);
    text('#chapter-02 .letter-meta span:last-child', data.date);
    text('#chapter-02 .letter-signature', data.signature);
    setList('.polaroid-front .photo-caption', data.photoCaptions);
    setList('.polaroid-back > span:nth-child(2)', data.photoNotes);
    if (Array.isArray(data.photos)) {
      for (let i = 0; i < data.photos.length; i++) {
        const photo = data.photos[i];
        const img = $$('.polaroid')[i]?.querySelector('img');
        if (img && photo) {
          const media = await fetch(`${API}/api/media/${encodeURIComponent(photo)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
          if (!media.ok) throw new Error('A private photo could not be loaded. Please sign in again.');
          const blobUrl = URL.createObjectURL(await media.blob());
          img.src = blobUrl; img.alt = `A private memory photograph ${i+1}`;
        }
      }
    }
    setList('.tiny-note .note-hidden', data.littleNotes);
    setList('.memory-entry .memory-date', data.timeline?.map(x => x.date));
    setList('.memory-entry h3', data.timeline?.map(x => x.title));
    setList('.memory-entry p', data.timeline?.map(x => x.description));
    text('#chapter-06 .placeholder-copy', data.heartLetter);
    text('#chapter-06 .handwritten:not(.chapter-kicker)', data.heartSignoff);
    text('.surprise-caption', data.surpriseMessage);
    text('.gift-subnote', data.surpriseExtra);
    text('.final-placeholder', data.finalLetter);
    text('.final-signoff', data.finalSignoff);
  }
  async function signIn(passphrase) {
    if (!API || API.includes('YOUR-WORKER-NAME')) throw new Error('The Worker address has not been added in js/config.js yet.');
    const response = await fetch(`${API}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passphrase }), cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'That passphrase did not match.');
    token = result.token;
    sessionStorage.setItem(TOKEN_KEY, token);
    await fetchPrivateContent();
    unlock();
  }
  form?.addEventListener('submit', async event => {
    event.preventDefault(); error.textContent = ''; submit.disabled = true; submit.textContent = 'one moment…';
    try { await signIn(input.value); }
    catch (err) { error.textContent = err.message; sessionStorage.removeItem(TOKEN_KEY); token = ''; }
    finally { submit.disabled = false; submit.innerHTML = 'open my letter <span aria-hidden="true">→</span>'; }
  });
  lock?.addEventListener('click', () => { sessionStorage.removeItem(TOKEN_KEY); token = ''; showGate(); });
  async function start() {
    token = sessionStorage.getItem(TOKEN_KEY) || '';
    if (token) {
      try { await fetchPrivateContent(); unlock(); return; }
      catch { sessionStorage.removeItem(TOKEN_KEY); token = ''; }
    }
    showGate();
  }
  start();
})();
