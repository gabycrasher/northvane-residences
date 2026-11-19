/* Northvane signature opening: a blueprint of a house draws itself while the dimensions tick up,
   the windows light up warm, and the blueprint lifts away like a sheet of drafting paper to reveal
   the real home. About 3 seconds, once per visit, skippable; skipped for reduced motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  var overlay = document.querySelector('[data-opening]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem('nv-opening') === '1'; } catch (e) { /* storage blocked */ }

  function done() {
    root.classList.remove('opening-on');
    if (overlay) overlay.remove();
    window.__openingDone = true;
    window.dispatchEvent(new Event('opening:done'));
  }
  if (!overlay || reduce || seen || !window.gsap) { done(); return; }
  try { sessionStorage.setItem('nv-opening', '1'); } catch (e) { /* ignore */ }

  overlay.hidden = false;
  root.classList.add('opening-on');
  var gsap = window.gsap;
  var q = function (s) { return overlay.querySelector(s); };
  var lines = overlay.querySelectorAll('.op-lines path, .op-dim path');
  var lights = overlay.querySelectorAll('.op-lights rect');
  var width = q('[data-op-width]'), height = q('[data-op-height]');
  var caption = q('[data-op-caption]');

  lines.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  var dims = { w: 0, h: 0 };

  var tl = gsap.timeline({ onComplete: done });
  tl.to(lines, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: .04 })
    .to(dims, { w: 18.4, h: 9.6, duration: 1.1, ease: 'power2.out', onUpdate: function () {
      width.textContent = dims.w.toFixed(1) + ' m';
      height.textContent = dims.h.toFixed(1) + ' m';
    } }, 0)
    .to(lights, { opacity: .9, duration: .35, stagger: .09, ease: 'power1.out' }, '-=.25')
    .call(function () { caption.textContent = 'Welcome home.'; }, null, '<')
    .to(q('.op-brand'), { opacity: 1, y: -8, duration: .5, ease: 'power3.out' }, '<.05')
    .addLabel('lift', '+=.35')
    // The blueprint lifts away from the bottom edge, like a drafting sheet being pulled up.
    .to(overlay, { clipPath: 'inset(0 0 100% 0)', duration: .85, ease: 'expo.inOut' }, 'lift')
    .to(q('.op-plan'), { y: -60, scale: .96, duration: .85, ease: 'expo.inOut' }, 'lift')
    .call(function () { window.dispatchEvent(new Event('opening:reveal')); }, null, 'lift+=.3');
  gsap.set(overlay, { clipPath: 'inset(0 0 0% 0)' });

  function skip() { tl.kill(); gsap.to(overlay, { opacity: 0, duration: .35, onComplete: done }); }
  q('[data-skip]').addEventListener('click', skip);
  document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); skip(); } });
})();
