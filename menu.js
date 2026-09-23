/* Diamonds Discovered — shared site script
   1. Hamburger menu (same on every page, every screen width)
   2. Footer email signup (AJAX to the Netlify "subscribe" form)
   3. Sticky email bar: appears while scrolling, fades 4s after scrolling stops */

(function () {
  var nav = document.querySelector('.site-menu');
  if (!nav) return;
  var btn = nav.querySelector('.site-menu__toggle');
  if (!btn) return;
  var panel = nav.querySelector('.site-menu__links');
  function setOpen(open) {
    if (open && panel) panel.style.top = nav.getBoundingClientRect().bottom + 'px';
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!nav.classList.contains('open'));
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  nav.querySelectorAll('.site-menu__links a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
})();

/* Shared submit helper for the Netlify "subscribe" form */
function ddSubscribe(form, onDone, method) {
  // Record which page the signup came from, and which widget was used.
  var pageField = form.querySelector('input[name="page"]');
  if (pageField) pageField.value = document.title + ' (' + location.pathname + ')';
  var srcField = form.querySelector('input[name="source"]');
  if (srcField) srcField.value = method;
  var body = new URLSearchParams(new FormData(form)).toString();
  return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
    .then(function (r) {
      if (!r.ok) throw new Error('submit failed');
      try { localStorage.setItem('dd_subscribed', '1'); } catch (e) {}
      onDone();
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'sign_up', method: method });
    });
}

/* Footer email signup — runs only on pages that include a .footer-signup block */
(function () {
  var wrap = document.querySelector('.footer-signup');
  if (!wrap) return;
  var form = wrap.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ddSubscribe(form, function () { wrap.classList.add('done'); }, 'footer')
      .catch(function () { window.location.href = '/thank-you.html'; });
  });
})();

/* Sticky email bar.
   Skipped inside iframes, on pages with <body data-no-sticky>, and for
   visitors who already signed up in this browser. */
(function () {
  if (window.self !== window.top) return;
  if (document.body.hasAttribute('data-no-sticky')) return;
  try { if (localStorage.getItem('dd_subscribed')) return; } catch (e) {}

  var bar = document.createElement('div');
  bar.className = 'sticky-signup';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Email updates');
  bar.innerHTML =
    '<span class="sticky-signup__text">Get updates on baseball and integration.</span>' +
    '<form name="subscribe" method="POST" action="/thank-you.html">' +
      '<input type="hidden" name="form-name" value="subscribe">' +
      '<input type="hidden" name="page" value="">' +
      '<input type="hidden" name="source" value="">' +
      '<p class="ss-hp"><label>Don&#8217;t fill this out: <input name="bot-field" tabindex="-1"></label></p>' +
      '<input type="email" name="email" placeholder="you@email.com" aria-label="Email address" required>' +
      '<button type="submit">Subscribe</button>' +
    '</form>' +
    '<p class="ss-success">You&#8217;re on the list &mdash; thanks!</p>';
  document.body.appendChild(bar);

  var HIDE_AFTER = 4000;
  var timer = null;
  var form = bar.querySelector('form');

  function busy() { return bar.contains(document.activeElement); }
  function scheduleHide() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (busy()) { scheduleHide(); return; }   // don't vanish while someone is typing
      bar.classList.remove('visible');
    }, HIDE_AFTER);
  }

  // Hide the sticky bar once the footer signup (or footer) scrolls into view,
  // so we don't show two signups at once near the bottom.
  var nearFooter = false;
  var footEl = document.querySelector('.footer-signup') || document.querySelector('footer');
  if (footEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      nearFooter = entries[0].isIntersecting;
      if (nearFooter) bar.classList.remove('visible');
    }, { rootMargin: '0px 0px -8% 0px' }).observe(footEl);
  }

  window.addEventListener('scroll', function () {
    if (bar.classList.contains('done') || nearFooter) return;
    bar.classList.add('visible');
    scheduleHide();
  }, { passive: true });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ddSubscribe(form, function () {
      bar.classList.add('done', 'visible');
      clearTimeout(timer);
      setTimeout(function () { bar.classList.remove('visible'); }, HIDE_AFTER);
    }, 'sticky_bar').catch(function () { form.submit(); });
  });
})();
