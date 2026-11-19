(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Add gentle entrance choreography to chapter headings without hiding content
  // when motion is reduced or IntersectionObserver is unavailable.
  const revealItems = [...new Set([
    ...$$('.reveal'),
    ...$$('.chapter-heading'),
    ...$$('.letter-sheet'),
    ...$$('.quiet-sheet')
  ])];
  revealItems.forEach((item, index) => {
    item.classList.add('reveal');
    const siblings = item.parentElement ? $$('.reveal', item.parentElement) : [];
    const siblingIndex = Math.max(0, siblings.indexOf(item));
    item.style.setProperty('--reveal-delay', `${Math.min(siblingIndex * 85, 255)}ms`);
  });

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  // Keep the reading line smooth without doing layout work on every scroll event.
  const progress = $('#progress-fill');
  let progressQueued = false;
  const updateProgress = () => {
    if (progressQueued) return;
    progressQueued = true;
    window.requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const amount = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
      if (progress) progress.style.width = `${amount}%`;
      progressQueued = false;
    });
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  // Envelope and gift reveals share one accessible open/close pattern.
  [['opening-envelope','opening-note'],['gift-button','gift-reveal'],['final-envelope','final-letter']].forEach(([buttonId, panelId]) => {
    const button = document.getElementById(buttonId);
    const panel = document.getElementById(panelId);
    if (!button || !panel) return;
    button.addEventListener('click', () => {
      const opening = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(opening));
      panel.hidden = !opening;
      if (opening) panel.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    });
  });

  $$('.flip-card').forEach(card => card.addEventListener('click', () => {
    card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
  }));
  $$('.note-toggle').forEach(note => note.addEventListener('click', () => {
    note.setAttribute('aria-expanded', String(note.getAttribute('aria-expanded') !== 'true'));
  }));

  const audio = $('#background-audio');
  const audioButton = $('#audio-toggle');
  if (audio && audioButton) audioButton.addEventListener('click', async () => {
    const label = $('span', audioButton);
    if (audio.paused) {
      try {
        await audio.play();
        audioButton.setAttribute('aria-pressed', 'true');
        if (label) label.textContent = 'music on';
      } catch (_) {
        if (label) label.textContent = 'add song file';
        audioButton.setAttribute('aria-pressed', 'false');
      }
    } else {
      audio.pause();
      audioButton.setAttribute('aria-pressed', 'false');
      if (label) label.textContent = 'music off';
    }
  });
})();
