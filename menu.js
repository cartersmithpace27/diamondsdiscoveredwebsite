/* Diamonds Discovered — mobile menu toggle */
(function () {
  var nav = document.querySelector('.site-menu');
  if (!nav) return;
  var btn = nav.querySelector('.site-menu__toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

/* Footer email signup — submits to the Netlify "subscribe" form via AJAX,
   stays on the page, shows an inline confirmation, and fires a GA4 sign_up event.
   Runs only on pages that include a .footer-signup block. */
(function () {
  var wrap = document.querySelector('.footer-signup');
  if (!wrap) return;
  var form = wrap.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var body = new URLSearchParams(new FormData(form)).toString();
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
      .then(function () {
        wrap.classList.add('done');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'sign_up', method: 'newsletter_footer' });
      })
      .catch(function () { window.location.href = '/thank-you.html'; });
  });
})();
