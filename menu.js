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
