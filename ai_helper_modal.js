/*
 * Sticky "Question? Ask the AI Project Helper!" button.
 * Load this script on any page that has an "ai_project_helper" bookmark.
 *
 * - Floats in the bottom-right corner.
 * - Teal (#058db5) to green (#16a34a) gradient that fades to a brighter gradient on hover.
 * - Click opens the AI Project Helper as a pop-up (modal); close with ×, Esc
 *   or a click outside. Falls back to scrolling if the helper can't be found.
 * - Only appears once the helper section exists on the page.
 *   It looks for the bookmark first, then the helper question itself.
 * - Every 2 minutes, a soft pulse ring and arrow nudge remind people it's there.
 *   Skipped while hovered, while the tab is hidden, or with reduced motion on.
 *   Stops for good once the button has been clicked.
 */
(function () {
  if (window.__aiHelperButtonLoaded) return;
  window.__aiHelperButtonLoaded = true;

  var BUTTON_ID = 'ai-helper-sticky-btn';
  var STYLE_ID = 'ai-helper-sticky-styles';
  var BOOKMARK_ID = 'ai_project_helper';
  var TARGET_SELECTORS = [
    '[data-bookmark-id="' + BOOKMARK_ID + '"]',
    '[data-label="' + BOOKMARK_ID + '"]'
  ];
  var NUDGE_EVERY_MS = window.AI_HELPER_NUDGE_MS || 120000; // 2 minutes
  var NUDGE_CLASS = 'ai-helper-nudge';

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#' + BUTTON_ID + ' {',
      '  position: fixed; bottom: 24px; right: 24px; z-index: 1000; overflow: hidden;',
      '  display: inline-flex; align-items: center; gap: 10px;',
      '  padding: 12px 22px; border: none; border-radius: 999px; cursor: pointer;',
      '  background: linear-gradient(135deg, #058db5 0%, #16a34a 100%);',
      '  color: #ffffff; font-family: inherit; font-size: 15px; font-weight: 700; line-height: 1.2; white-space: nowrap;',
      '  box-shadow: 0 2px 8px rgba(0,0,0,0.2);',
      '  transition: transform 0.2s ease, box-shadow 0.2s ease;',
      '}',
      /* Hover gradient sits on a layer that fades in, since gradients cannot animate directly */
      '#' + BUTTON_ID + '::before {',
      '  content: ""; position: absolute; inset: 0; border-radius: inherit;',
      '  background: linear-gradient(135deg, #00a8de 0%, #0fc45a 100%);',
      '  opacity: 0; transition: opacity 0.4s ease;',
      '}',
      '#' + BUTTON_ID + ' > span { position: relative; z-index: 1; }',
      '#' + BUTTON_ID + ' .ai-helper-lead { font-weight: 400; }',
      '#' + BUTTON_ID + ':hover::before { opacity: 1; }',
      '#' + BUTTON_ID + ':hover {',
      '  transform: translateY(-2px);',
      '  box-shadow: 0 4px 12px rgba(0,0,0,0.18);',
      '}',
      '#' + BUTTON_ID + ':focus-visible { outline: 3px solid #93e1f5; outline-offset: 2px; }',
      '#' + BUTTON_ID + ' .ai-helper-arrow { transition: transform 0.2s ease; }',
      '#' + BUTTON_ID + ':hover .ai-helper-arrow { transform: translateX(3px); }',
      '#' + BUTTON_ID + '.' + NUDGE_CLASS + ' { animation: aiHelperPulse 1.6s ease-out 1; }',
      '#' + BUTTON_ID + '.' + NUDGE_CLASS + ' .ai-helper-arrow { animation: aiHelperArrow 1.1s ease 1; }',
      '@keyframes aiHelperPulse {',
      '  0% { box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 0 rgba(34,197,94,0.45); }',
      '  100% { box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 12px rgba(34,197,94,0); }',
      '}',
      '@keyframes aiHelperArrow {',
      '  0%, 100% { transform: translateX(0); }',
      '  20%, 60% { transform: translateX(5px); }',
      '  40%, 80% { transform: translateX(0); }',
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      '  #' + BUTTON_ID + ', #' + BUTTON_ID + '::before, #' + BUTTON_ID + ' .ai-helper-arrow { transition: none; }',
      '  #' + BUTTON_ID + ':hover, #' + BUTTON_ID + ':hover .ai-helper-arrow { transform: none; }',
      '  #' + BUTTON_ID + '.' + NUDGE_CLASS + ', #' + BUTTON_ID + '.' + NUDGE_CLASS + ' .ai-helper-arrow { animation: none; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // Find the AI Project Helper section: its bookmark, or failing that the question itself.
  function findHelperSection() {
    for (var i = 0; i < TARGET_SELECTORS.length; i++) {
      var el = document.querySelector(TARGET_SELECTORS[i]);
      if (el) return el;
    }
    return null;
  }

  function addButton() {
    if (document.getElementById(BUTTON_ID)) return true;
    if (!findHelperSection()) return false;

    addStyles();
    var btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.innerHTML = '<span><span class="ai-helper-lead">Question?</span> Ask the AI Project Helper!</span><span class="ai-helper-arrow" aria-hidden="true">→</span>';
    btn.addEventListener('click', function () {
      stopNudges();
      // Open the helper as a pop-up. If it can't be found, fall back to scrolling.
      if (window.aiHelperModal && window.aiHelperModal.toggle()) return;
      var target = findHelperSection();
      if (!target) return;
      // Centre the whole helper box (its table, if it sits in one) so it isn't hidden under the page header.
      var box = target.closest('table') || target;
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.body.appendChild(btn);
    startNudges(btn);
    return true;
  }

  // Gentle reminder: a soft pulse ring plus an arrow nudge, every NUDGE_EVERY_MS.
  var nudgeTimer = null;
  function startNudges(btn) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    nudgeTimer = setInterval(function () {
      if (document.hidden || btn.matches(':hover')) return;
      btn.classList.remove(NUDGE_CLASS);
      void btn.offsetWidth; // restart the animation
      btn.classList.add(NUDGE_CLASS);
      setTimeout(function () { btn.classList.remove(NUDGE_CLASS); }, 1800);
    }, NUDGE_EVERY_MS);
  }
  function stopNudges() {
    if (nudgeTimer) { clearInterval(nudgeTimer); nudgeTimer = null; }
  }

  // The task page renders after load, so keep watching until the helper appears.
  function start() {
    if (addButton()) return;
    var observer = new MutationObserver(function () {
      if (addButton()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();


/*
 * AI Project Helper pop-up (modal).
 * Restyles the helper block in place (React keeps working), dims the page,
 * and adds a × button. Exposes window.aiHelperModal.toggle() for the button.
 */
(function () {
  if (window.aiHelperModal) return;

  var HELPER_SELECTOR = '[data-label="ai_project_helper"]';
  var BUTTON_ID = 'ai-helper-sticky-btn';
  var isOpen = false;
  var box = null, dim = null, closeBtn = null, watcher = null;

  // Created on first open, so it's safe even though this file loads in <head>.
  function setup() {
    if (dim) return;
    var style = document.createElement('style');
    style.textContent = [
      '.aih-modal {',
      '  position: fixed !important; top: 50%; left: 50%;',
      '  transform: translate(-50%, -50%);',
      '  width: min(760px, 92vw); max-height: 85vh; overflow: auto;',
      '  z-index: 10001 !important; background: #fff;',
      '  padding: 32px 24px 24px; border-radius: 12px;',
      '  box-shadow: 0 20px 50px rgba(0,0,0,.3);',
      '}',
      '.aih-lift { z-index: 10000 !important; }',
      '#aih-dim {',
      '  position: fixed; inset: 0; z-index: 10003; pointer-events: none;',
      '  background: rgba(15,23,42,.55); display: none;',
      '}',
      '#aih-close {',
      '  position: fixed; z-index: 10004; width: 32px; height: 32px;',
      '  border: 0; border-radius: 50%; background: #f1f5f9; color: #334155;',
      '  font-size: 20px; line-height: 32px; cursor: pointer; display: none;',
      '}',
      '#aih-close:hover { background: #e2e8f0; }'
    ].join('\n');
    document.head.appendChild(style);

    dim = document.createElement('div');
    dim.id = 'aih-dim';
    document.body.appendChild(dim);

    closeBtn = document.createElement('button');
    closeBtn.id = 'aih-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', close);
    document.body.appendChild(closeBtn);

    if (window.ResizeObserver) watcher = new ResizeObserver(place);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    // A click outside the pop-up closes it (and doesn't click whatever was behind).
    document.addEventListener('mousedown', function (e) {
      if (!isOpen) return;
      if (box.contains(e.target) || e.target === closeBtn) return;
      if (e.target.closest && e.target.closest('#' + BUTTON_ID)) return;
      e.preventDefault();
      e.stopPropagation();
      close();
    }, true);
        // Links inside the pop-up that jump to another part of the page (Surge's
    // jump links, or #anchors): close the pop-up first, so the page can scroll
    // to that section. Links that open another site are left alone.
    document.addEventListener('click', function (e) {
      if (!isOpen || !box) return;
      var link = e.target.closest && e.target.closest('a[href]');
      if (!link || !box.contains(link)) return;
      if (isInPageLink(link)) close();
    }, true);
    window.addEventListener('resize', place);
  }

  function isInPageLink(link) {
    var href = link.getAttribute('href') || '';
    if (href.charAt(0) === '#') return true;
    if (href.indexOf('jumpTo=') !== -1) return true;
    if (link.target === '_blank') return false;
    try {
      var url = new URL(href, window.location.href);
      return url.origin === window.location.origin && url.pathname === window.location.pathname;
    } catch (err) {
      return false;
    }
  }

  function findHelperBox() {
    var item = document.querySelector(HELPER_SELECTOR);
    if (!item) return null;
    return item.closest('[id^="headlessui-disclosure-panel"]') ||
           item.parentElement.parentElement;
  }

  // Raise the page sections around the helper so the pop-up sits on top.
  function setLift(on) {
    var el = box.parentElement;
    while (el && el !== document.body) {
      var s = getComputedStyle(el);
      if (on && (s.position !== 'static' || s.zIndex !== 'auto' || s.isolation === 'isolate')) {
        el.classList.add('aih-lift');
      }
      if (!on) el.classList.remove('aih-lift');
      el = el.parentElement;
    }
  }

  // Keep the see-through hole in the dim layer and the × lined up with the pop-up.
  function place() {
    if (!isOpen) return;
    var r = box.getBoundingClientRect();
    dim.style.clipPath = 'polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ' +
      r.left + 'px ' + r.top + 'px, ' + r.left + 'px ' + r.bottom + 'px, ' +
      r.right + 'px ' + r.bottom + 'px, ' + r.right + 'px ' + r.top + 'px, ' +
      r.left + 'px ' + r.top + 'px)';
    closeBtn.style.top = (r.top + 8) + 'px';
    closeBtn.style.left = (r.right - 40) + 'px';
  }

  function open() {
    setup();
    box = findHelperBox();
    if (!box) return false;
    box.classList.add('aih-modal');
    setLift(true);
    isOpen = true;
    dim.style.display = 'block';
    closeBtn.style.display = 'block';
    place();
    if (watcher) watcher.observe(box);
    var input = box.querySelector('textarea, input[type="text"]');
    if (input) input.focus();
    return true;
  }

  function close() {
    if (!isOpen) return;
    if (watcher) watcher.unobserve(box);
    box.classList.remove('aih-modal');
    setLift(false);
    dim.style.display = 'none';
    closeBtn.style.display = 'none';
    isOpen = false;
  }

  window.aiHelperModal = {
    open: open,
    close: close,
    // Returns true when the pop-up handled the click.
    toggle: function () {
      if (isOpen) { close(); return true; }
      return open();
    }
  };
})();
