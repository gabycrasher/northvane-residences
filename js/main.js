/* Northvane Residences: listings, filters, saved homes, room walk-through, neighbourhoods,
   mortgage calculator and a viewing form that never sends anything (concept site). */
(function () {
  'use strict';
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (gsap && ST) gsap.registerPlugin(ST);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var img = function (id, w, h) { return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + w + (h ? '&h=' + h : '') + '&q=78'; };
  /* Prices are stored in US dollars and shown in UGX by default (indicative rate), with a UGX / USD switch. */
  var RATE = 3700, CUR = 'UGX';
  try { CUR = localStorage.getItem('nv-cur') === 'USD' ? 'USD' : 'UGX'; } catch (e) { /* storage blocked */ }
  var trim = function (x, d) { return String(+x.toFixed(d)); };
  // Compact like Ugandan listing sites (UGX 2.07B, UGX 8.9M); full = every digit (used for the monthly repayment).
  function money(usdValue, full) {
    if (CUR === 'USD') return '$' + Math.round(usdValue).toLocaleString('en-US');
    var v = usdValue * RATE;
    if (full || v < 1e6) return 'UGX ' + (Math.round(v / 1000) * 1000).toLocaleString('en-US');
    if (v >= 1e9) return 'UGX ' + trim(v / 1e9, 2) + 'B';
    return 'UGX ' + trim(v / 1e6, v >= 1e8 ? 0 : 1) + 'M';
  }
  var usd = function (n) { return money(n); };
  // Enquiries go to WhatsApp with the details pre-filled (opened from the click, so pop-up blockers allow it).
  var WA_NUMBER = '256756728345';
  function whatsapp(lines) {
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.filter(Boolean).join('\n'));
    var a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    return url;
  }
  var homeLine = function (h) { return h.title + ' (' + h.area + ', ref ' + h.id.toUpperCase() + ') · ' + (h.deal === 'rent' ? usd(h.price) + '/month' : usd(h.price)) + ' · ' + h.beds + ' bed, ' + h.baths + ' bath, ' + h.size + ' m²'; };

  /* ---------- Header + mobile menu ---------- */
  var header = $('[data-header]');
  var onScroll = function () { header.classList.toggle('is-solid', window.scrollY > 40); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  var menuBtn = $('[data-menu-btn]'), menu = $('[data-mobile-menu]');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    header.classList.toggle('is-solid', open || window.scrollY > 40);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- Reveal + counters ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suffix = el.dataset.suffix || '';
    if (reduce || !gsap) { el.textContent = target.toFixed(dec) + suffix; return; }
    var o = { v: 0 };
    gsap.to(o, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = o.v.toFixed(dec) + suffix; } });
  }
  function revealHero() { $$('.hero .reveal-up').forEach(function (el, i) { setTimeout(function () { el.classList.add('is-in'); }, 90 * i); }); countUp($('.hero-badge [data-count]')); }
  if (window.__openingDone) revealHero(); else { window.addEventListener('opening:reveal', revealHero, { once: true }); window.addEventListener('opening:done', revealHero, { once: true }); }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); if (e.target.dataset.count) countUp(e.target); else e.target.classList.add('is-in'); });
  }, { threshold: .3 });
  $$('.stats [data-count]').forEach(function (el) { io.observe(el); });
  if (gsap && ST && !reduce) gsap.to('[data-hero-media]', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Listings ---------- */
  var homes = [
    { id: 'nv-101', title: 'Glass villa with infinity pool', area: 'Kololo', type: 'villa', deal: 'sale', price: 1250000, beds: 5, baths: 5, size: 640, imgs: ['photo-1613977257363-707ba9348227', 'photo-1560448204-e02f11c3d0e2', 'photo-1505693416388-ac5ce068fe85'], extras: ['Solar backup', 'Staff quarters', '2 car garage', 'Gated'] },
    { id: 'nv-102', title: 'White terraced family home', area: 'Naguru', type: 'villa', deal: 'sale', price: 780000, beds: 4, baths: 4, size: 420, imgs: ['photo-1600596542815-ffad4c1539a9', 'photo-1613545325278-f24b0cae1224', 'photo-1722605090433-41d1183a792d'], extras: ['Pool', 'Garden', 'Home office'] },
    { id: 'nv-103', title: 'Sky apartment with sunset balcony', area: 'Bugolobi', type: 'apartment', deal: 'rent', price: 2400, beds: 3, baths: 2, size: 165, imgs: ['photo-1624204386084-dd8c05e32226', 'photo-1758448511322-8bfc73daf606', 'photo-1560185893-a55cbc8c57e8'], extras: ['Gym', 'Lift', 'Backup water'] },
    { id: 'nv-104', title: 'Hillside house with lake views', area: 'Muyenga', type: 'villa', deal: 'sale', price: 560000, beds: 4, baths: 3, size: 360, imgs: ['photo-1580587771525-78b9dba3b914', 'photo-1556911220-bff31c812dba', 'photo-1505693416388-ac5ce068fe85'], extras: ['Lake view', 'Pool', 'Borehole'] },
    { id: 'nv-105', title: 'Modern townhouse in a quiet close', area: 'Lubowa', type: 'townhouse', deal: 'sale', price: 295000, beds: 3, baths: 3, size: 210, imgs: ['photo-1628744448840-55bdb2497bd4', 'photo-1613545325278-f24b0cae1224', 'photo-1560185893-a55cbc8c57e8'], extras: ['Shared pool', 'Playground', 'Security'] },
    { id: 'nv-106', title: 'Lit-up house for evenings outside', area: 'Entebbe', type: 'villa', deal: 'rent', price: 3200, beds: 4, baths: 4, size: 380, imgs: ['photo-1757524492552-d47a66a2b63e', 'photo-1560448204-e02f11c3d0e2', 'photo-1722605090433-41d1183a792d'], extras: ['Near the lake', 'Furnished', 'Garden'] },
    { id: 'nv-107', title: 'Two-storey home with big garden', area: 'Naguru', type: 'townhouse', deal: 'rent', price: 1900, beds: 3, baths: 3, size: 240, imgs: ['photo-1513584684374-8bab748fbf90', 'photo-1758448511322-8bfc73daf606', 'photo-1505693416388-ac5ce068fe85'], extras: ['Pet friendly', 'Garden', 'Parking for 3'] },
    { id: 'nv-108', title: 'Balcony apartment near the golf course', area: 'Kololo', type: 'apartment', deal: 'sale', price: 340000, beds: 2, baths: 2, size: 130, imgs: ['photo-1784853879843-f3c5aacf2569', 'photo-1556911220-bff31c812dba', 'photo-1560185893-a55cbc8c57e8'], extras: ['Concierge', 'Gym', 'Pool'] }
  ];
  var priceLabel = function (h) { return h.deal === 'rent' ? usd(h.price) + '<small> / month</small>' : usd(h.price); };
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('nv-saved') || '[]'); } catch (e) { saved = []; }
  var state = { filter: 'all', area: '', type: '', budget: 0, rentBudget: false };
  var cards = $('[data-cards]'), note = $('[data-result-note]'), savedCount = $('[data-saved-count]');
  var heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 4 4.5 7.3 4.5c2 0 3.5 1.1 4.7 2.7 1.2-1.6 2.7-2.7 4.7-2.7 3.3 0 5.7 3.1 4.5 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>';

  function matches(h) {
    if (state.filter === 'sale' && h.deal !== 'sale') return false;
    if (state.filter === 'rent' && h.deal !== 'rent') return false;
    if (state.filter === 'saved' && saved.indexOf(h.id) < 0) return false;
    if (state.area && h.area !== state.area) return false;
    if (state.type && h.type !== state.type) return false;
    if (state.budget) {
      var monthly = state.rentBudget;
      if (monthly && (h.deal !== 'rent' || h.price > state.budget)) return false;
      if (!monthly && (h.deal !== 'sale' || h.price > state.budget)) return false;
    }
    return true;
  }
  function render() {
    var list = homes.filter(matches);
    savedCount.textContent = saved.length;
    var bits = [];
    if (state.area) bits.push(state.area);
    if (state.type) bits.push(state.type + 's');
    if (state.budget) bits.push('under ' + money(state.budget) + (state.rentBudget ? '/month' : ''));
    note.textContent = list.length + ' home' + (list.length === 1 ? '' : 's') + (bits.length ? ' · ' + bits.join(' · ') : '') + (bits.length ? '  (clear the search to see all)' : '');
    if (!list.length) {
      cards.innerHTML = '<p class="empty">' + (state.filter === 'saved' ? 'Tap the heart on any home to save it here.' : 'No homes match that search yet. Try another area or budget.') + '</p>';
      return;
    }
    cards.innerHTML = list.map(function (h) {
      var on = saved.indexOf(h.id) >= 0;
      return '<article class="card">' +
        '<div class="card-media"><img loading="lazy" src="' + img(h.imgs[0], 900, 675) + '" alt="' + h.title + ' in ' + h.area + '"><span class="card-tag">' + (h.deal === 'rent' ? 'For rent' : 'For sale') + '</span></div>' +
        '<button class="save' + '" type="button" data-save="' + h.id + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove from saved' : 'Save') + ': ' + h.title + '">' + heart + '</button>' +
        '<div class="card-body"><div class="card-price">' + priceLabel(h) + '</div><h3>' + h.title + '</h3><p class="card-area">' + h.area + ', Kampala</p>' +
        '<p class="card-specs"><span>' + h.beds + ' beds</span><span>' + h.baths + ' baths</span><span>' + h.size + ' m²</span></p></div>' +
        '<button class="card-open" type="button" data-open="' + h.id + '"><span class="sr">View details of ' + h.title + '</span></button></article>';
    }).join('');
    if (gsap && !reduce) gsap.from($$('.card', cards), { y: 24, opacity: 0, duration: .6, stagger: .06, ease: 'power3.out' });
  }
  render();

  $('[data-filters]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-filter]');
    if (!b) return;
    state.filter = b.dataset.filter;
    $$('[data-filter]').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    render();
  });
  cards.addEventListener('click', function (e) {
    var s = e.target.closest('[data-save]');
    if (s) {
      var id = s.dataset.save, i = saved.indexOf(id);
      if (i >= 0) saved.splice(i, 1); else saved.push(id);
      try { localStorage.setItem('nv-saved', JSON.stringify(saved)); } catch (err) { /* storage blocked */ }
      if (state.filter === 'saved') { render(); return; }
      s.setAttribute('aria-pressed', String(i < 0));
      s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop');
      savedCount.textContent = saved.length;
      return;
    }
    var o = e.target.closest('[data-open]');
    if (o) openHome(o.dataset.open);
  });
  function applySearch(f) {
    state.area = f.area.value; state.type = f.type.value;
    var opt = f.budget.options[f.budget.selectedIndex];
    state.budget = opt.value ? (CUR === 'UGX' ? +opt.dataset.ugx / RATE : +opt.dataset.usd) : 0;
    state.rentBudget = opt.hasAttribute('data-rent');
    state.filter = 'all';
    $$('[data-filter]').forEach(function (x) { x.classList.toggle('is-on', x.dataset.filter === 'all'); x.setAttribute('aria-pressed', String(x.dataset.filter === 'all')); });
    render();
    $('#homes').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  var optText = function (sel) { return sel.options[sel.selectedIndex].text; };
  $('[data-search]').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    applySearch(f);
    whatsapp(["Hello Northvane, I'm looking for a home.", 'Area: ' + optText(f.area) + ' · Type: ' + optText(f.type) + ' · Budget: ' + optText(f.budget)]);
  });
  note.addEventListener('click', function () { if (!state.area && !state.type && !state.budget) return; state.area = state.type = ''; state.budget = 0; state.rentBudget = false; $('[data-search]').reset(); render(); });

  /* Details dialog */
  var dlg = $('[data-dialog]'), dlgBody = $('[data-dialog-body]');
  var openId = null;
  function openHome(id) {
    openId = id;
    var h = homes.filter(function (x) { return x.id === id; })[0];
    if (!h) return;
    dlgBody.innerHTML = '<div class="dlg-gallery">' + h.imgs.map(function (p, i) { return '<img src="' + img(p, i ? 600 : 1200, i ? 450 : 900) + '" alt="' + h.title + ', photo ' + (i + 1) + '">'; }).join('') + '</div>' +
      '<div class="dlg-info"><p class="eyebrow">' + h.area + ' · ' + (h.deal === 'rent' ? 'For rent' : 'For sale') + ' · Ref ' + h.id.toUpperCase() + '</p><h3 id="dlg-title">' + h.title + '</h3><div class="card-price">' + priceLabel(h) + '</div>' +
      '<ul><li>' + h.beds + ' bedrooms</li><li>' + h.baths + ' bathrooms</li><li>' + h.size + ' m²</li>' + h.extras.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<p>A fictional listing for this concept site. In a live site this panel would hold the floor plan, the full gallery and the land title status.</p>' +
      '<div class="dlg-actions"><button class="btn btn-wa" type="button" data-enquire="' + h.id + '">Enquire on WhatsApp</button><a class="btn btn-line" href="#viewing" data-book="' + h.id + '">Book a viewing</a></div></div>';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function closeDlg() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  $('[data-dialog-close]').addEventListener('click', closeDlg);
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) closeDlg();
    var b = e.target.closest('[data-book]');
    if (b) { homeSelect.value = b.dataset.book; closeDlg(); }
    var q = e.target.closest('[data-enquire]');
    if (q) {
      var h = homes.filter(function (x) { return x.id === q.dataset.enquire; })[0];
      whatsapp(['Hello Northvane, I am interested in this property:', homeLine(h), 'Extras: ' + h.extras.join(', '), '', 'Is it still available, and when could I view it?']);
      q.textContent = 'WhatsApp opened ✓';
    }
  });

  /* ---------- Room walk-through: pinned horizontal scroll on wide screens, swipe on phones ---------- */
  var tour = $('[data-tour]'), track = $('[data-tour-track]'), roomNo = $('[data-tour-room]');
  var rooms = $$('.room', track);
  if (gsap && ST && !reduce && window.matchMedia('(min-width: 900px)').matches) {
    document.documentElement.classList.add('tour-pinned');
    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, {
      x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: {
        trigger: tour, start: 'top top', pin: true, scrub: .4, invalidateOnRefresh: true,
        // Keep the walk-through short: about one screen of scrolling for all four rooms.
        end: function () { return '+=' + Math.round(Math.min(distance() * .6, window.innerHeight * 1.1)); },
        onUpdate: function (self) { roomNo.textContent = '0' + (Math.min(rooms.length - 1, Math.floor(self.progress * rooms.length)) + 1); }
      }
    });
  } else {
    track.addEventListener('scroll', function () {
      var i = Math.round(track.scrollLeft / (rooms[0].offsetWidth + 16));
      roomNo.textContent = '0' + (Math.min(rooms.length - 1, i) + 1);
    }, { passive: true });
  }

  /* ---------- Neighbourhoods ---------- */
  var areas = {
    Kololo: { vibe: 'Embassies, leafy avenues and the airstrip park. Quiet streets five minutes from the city.', price: 950000, commute: '6 min', schools: '9', homes: 'Villas & apartments' },
    Naguru: { vibe: 'Hilltop family homes, cafés along Naguru Drive and some of the city\'s best views.', price: 720000, commute: '12 min', schools: '7', homes: 'Family homes' },
    Bugolobi: { vibe: 'Walkable, social and close to everything. Popular with young professionals.', price: 2100, rent: true, commute: '10 min', schools: '5', homes: 'Apartments' },
    Muyenga: { vibe: 'Tank Hill sunsets, lake glimpses and generous plots on winding roads.', price: 540000, commute: '18 min', schools: '8', homes: 'Hillside villas' },
    Lubowa: { vibe: 'Gated estates, wide lawns and quick access to the Entebbe Expressway.', price: 310000, commute: '25 min', schools: '11', homes: 'Townhouses' },
    Entebbe: { vibe: 'Lakeside living by the botanical gardens, fifteen minutes from the airport.', price: 2800, rent: true, commute: '45 min', schools: '6', homes: 'Lake homes' }
  };
  var tabs = $('[data-area-tabs]'), areaCard = $('[data-area-card]');
  tabs.innerHTML = Object.keys(areas).map(function (n) { return '<button type="button" class="chip" role="tab" aria-selected="false" data-area="' + n + '">' + n + '</button>'; }).join('');
  var currentArea = 'Kololo';
  function showArea(name) {
    currentArea = name;
    var a = areas[name];
    $$('[data-area]').forEach(function (b) {
      var on = b.dataset.area === name;
      b.classList.toggle('is-on', on);
      if (b.getAttribute('role') === 'tab') b.setAttribute('aria-selected', String(on));
    });
    var count = homes.filter(function (h) { return h.area === name; }).length;
    areaCard.innerHTML = '<p class="eyebrow">Neighbourhood</p><h3>' + name + '</h3><p class="vibe">' + a.vibe + '</p>' +
      '<dl class="area-facts"><div><dt>Typical</dt><dd>' + money(a.price) + (a.rent ? '/mo' : '') + '</dd></div><div><dt>To city</dt><dd>' + a.commute + '</dd></div><div><dt>Schools</dt><dd>' + a.schools + '</dd></div></dl>' +
      '<button class="btn" type="button" data-area-search="' + name + '">See ' + count + ' home' + (count === 1 ? '' : 's') + ' in ' + name + '</button>';
    if (gsap && !reduce) gsap.from(areaCard.children, { y: 12, opacity: 0, duration: .45, stagger: .05, ease: 'power2.out' });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-area]');
    if (b && (b.classList.contains('pin') || b.getAttribute('role') === 'tab')) showArea(b.dataset.area);
    var s = e.target.closest('[data-area-search]');
    if (s) { var f = $('[data-search]'); f.area.value = s.dataset.areaSearch; f.type.value = ''; f.budget.value = ''; applySearch(f); }
  });
  showArea('Kololo');

  /* ---------- Mortgage calculator ---------- */
  var calc = $('[data-calc]');
  function calcUpdate() {
    var price = +calc.price.value, dep = +calc.deposit.value, rate = +calc.rate.value, years = +calc.years.value;
    var loan = price * (1 - dep / 100), r = rate / 100 / 12, n = years * 12;
    var monthly = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
    var total = monthly * n, interest = total - loan;
    $('[data-out="price"]').textContent = usd(price);
    $('[data-out="deposit"]').textContent = dep + '% · ' + usd(price * dep / 100);
    $('[data-out="rate"]').textContent = rate.toFixed(2) + '%';
    $('[data-out="years"]').textContent = years + ' years';
    $('[data-monthly]').textContent = money(monthly, true);
    $('[data-loan]').textContent = usd(loan);
    $('[data-interest]').textContent = usd(interest);
    $('[data-total]').textContent = usd(total);
    var share = total ? loan / total * 100 : 100;
    $('[data-donut-principal]').setAttribute('stroke-dasharray', share.toFixed(1) + ' 100');
    $$('input[type=range]', calc).forEach(function (i) { i.style.setProperty('--fill', ((i.value - i.min) / (i.max - i.min) * 100) + '%'); });
  }
  $('[data-donut-principal]').setAttribute('pathLength', '100');
  calc.addEventListener('input', calcUpdate);
  calc.addEventListener('submit', function (e) {
    e.preventDefault();
    var price = +calc.price.value, dep = +calc.deposit.value;
    whatsapp(["Hello Northvane, I'd like to speak to an agent about financing.", 'Price: ' + usd(price) + ' · Deposit: ' + dep + '% (' + usd(price * dep / 100) + ') · Rate: ' + calc.rate.value + '% · Term: ' + calc.years.value + ' years']);
  });
  calcUpdate();

  /* ---------- Currency switch (UGX / USD) ---------- */
  var budgetSel = $('[data-budget]');
  function labelBudgets() {
    $$('option[data-ugx]', budgetSel).forEach(function (o) {
      var rent = o.hasAttribute('data-rent');
      o.textContent = (CUR === 'UGX' ? 'UGX ' + trim(+o.dataset.ugx / (rent ? 1e6 : 1e9), 1) + (rent ? 'M' : 'B') : '$' + (+o.dataset.usd).toLocaleString('en-US')) + (rent ? ' / month' : '');
    });
  }
  function setCurrency(c) {
    CUR = c;
    try { localStorage.setItem('nv-cur', c); } catch (e) { /* storage blocked */ }
    $$('[data-cur]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cur === c)); });
    labelBudgets();
    if (state.budget) applySearchQuiet();
    render(); calcUpdate(); showArea(currentArea);
    if (dlg.open && openId) openHome(openId);
  }
  function applySearchQuiet() { var opt = budgetSel.options[budgetSel.selectedIndex]; state.budget = opt.value ? (CUR === 'UGX' ? +opt.dataset.ugx / RATE : +opt.dataset.usd) : 0; }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-cur]'); if (b && b.dataset.cur !== CUR) setCurrency(b.dataset.cur); });
  setCurrency(CUR);

  /* ---------- Testimonials ---------- */
  var quotes = $$('[data-quotes] blockquote'), dots = $('[data-quote-dots]'), qi = 0, qTimer;
  dots.innerHTML = quotes.map(function (_, i) { return '<button type="button" aria-label="Show testimonial ' + (i + 1) + '"' + (i ? '' : ' aria-current="true"') + '></button>'; }).join('');
  function showQuote(i) {
    qi = (i + quotes.length) % quotes.length;
    quotes.forEach(function (q, k) { q.classList.toggle('is-on', k === qi); });
    $$('button', dots).forEach(function (d, k) { d.setAttribute('aria-current', String(k === qi)); });
  }
  dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; clearInterval(qTimer); showQuote($$('button', dots).indexOf(b)); });
  if (!reduce) qTimer = setInterval(function () { showQuote(qi + 1); }, 6000);

  /* ---------- Viewing form (never sends) ---------- */
  var homeSelect = $('[data-home-select]');
  homes.forEach(function (h) { var o = document.createElement('option'); o.value = h.id; o.textContent = h.title + ' · ' + h.area; homeSelect.appendChild(o); });
  var form = $('[data-viewing-form]'), formNote = $('[data-form-note]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = [];
    ['name', 'contact'].forEach(function (n) { var ok = form[n].value.trim().length > 1; form[n].setAttribute('aria-invalid', String(!ok)); if (!ok) bad.push(n); });
    formNote.classList.toggle('is-error', bad.length > 0);
    if (bad.length) { formNote.textContent = 'Please add your name and a phone number or email.'; form[bad[0]].focus(); return; }
    var home = homeSelect.value ? homeSelect.options[homeSelect.selectedIndex].text : 'a home that fits your search';
    var picked = homeSelect.value ? homes.filter(function (x) { return x.id === homeSelect.value; })[0] : null;
    var url = whatsapp(["Hello Northvane, I'd like to request a viewing.", 'Name: ' + form.name.value.trim() + ' · Contact: ' + form.contact.value.trim(), 'Property: ' + (picked ? picked.title + ' (' + picked.area + ', ref ' + picked.id.toUpperCase() + ')' : 'Any home that fits my search') + ' · Preferred time: ' + form.slot.value]);
    formNote.innerHTML = 'Thanks, ' + form.name.value.trim().split(' ')[0].replace(/[<>&"]/g, '') + '. WhatsApp has opened with your viewing request for ' + home.replace(/[<>&"]/g, '') + '. Just press send. <a href="' + url + '" target="_blank" rel="noopener">Didn\'t open? Tap here.</a>';
    form.reset();
  });

  /* Re-measure the scroll animations once everything has loaded, then honour a #section link (a pinned
     section measured before load could otherwise overlap the section the visitor jumped to). */
  if (ST) window.addEventListener('load', function () {
    ST.refresh();
    if (location.hash.length > 1) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  });
})();
