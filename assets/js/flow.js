/* ============================================================
   FLOW JS v1.0 (refactor 2026-05-14)
   - Mobile nav toggle (burger + drawer)
   - Form handler (callback form → Apps Script)
   - Footer dynamic year
   - Smooth scroll pro anchor odkazy
   ============================================================ */

(function () {
  'use strict';

  // ───── Jazyk: detekce z <html lang="..."> (EN web pouziva stejny script)
  var IS_EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;

  // ───── Footer dynamic year
  function setFooterYear() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ───── Mobile nav toggle
  function initMobileNav() {
    var burger = document.querySelector('.burger');
    var drawer = document.querySelector('.mobile-drawer');
    if (!burger || !drawer) return;

    function open() {
      drawer.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      drawer.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    burger.addEventListener('click', function () {
      if (drawer.classList.contains('is-open')) close();
      else open();
    });

    // Close on backdrop click
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) close();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });

    // Close when navigating
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', close);
    });
  }

  // ───── Callback form handler (Apps Script endpoint)
  function initCallbackForm() {
    var form = document.getElementById('callback-form');
    if (!form) return;

    var SCRIPT_URL = form.dataset.endpoint;
    if (!SCRIPT_URL) {
      console.warn('Callback form: data-endpoint chybí');
      return;
    }

    function showSuccess(name) {
      var firstName = (name || '').split(' ')[0].trim();
      var success = document.createElement('div');
      success.className = 'form-success';
      success.innerHTML =
        '<div class="form-success__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M5 12.5l5 5L20 7"/>' +
          '</svg>' +
        '</div>' +
        (IS_EN
          ? '<h3>Thanks' + (firstName ? ', ' + firstName : '') + '!</h3>' +
            '<p>Your message landed safely. We\'ll get back to you within <strong>one business day</strong>.</p>'
          : '<h3>Děkujeme' + (firstName ? ', ' + firstName : '') + '!</h3>' +
            '<p>Vaše zpráva u nás přistála. Ozveme se vám do <strong>jednoho pracovního dne</strong>.</p>');
      form.parentNode.replaceChild(success, form);
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var name = form.name ? form.name.value.trim() : '';
      var btn = form.querySelector('button[type=submit]');
      var origLabel = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = IS_EN ? 'Submitting…' : 'Odesílám…'; }

      var data = new FormData(form);
      fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: data })
        .then(function () {
          // Source detection — page slug z URL (lepsi nez hardcoded 'homepage')
          var pagePath = window.location.pathname.replace(/^\/|\.html$|\/$/g, '') || 'index';

          // 1) GTM dataLayer event (vse co ma GA4 in GTM dostane tento event)
          if (window.dataLayer) {
            window.dataLayer.push({
              event: 'callback_form_submit',
              source: pagePath,
              form_id: form.id || 'callback-form'
            });
          }

          // 2) FB Pixel Lead event — consent-gated
          if (window.fbq && window.__flowConsent && window.__flowConsent.marketing) {
            window.fbq('track', 'Lead', {
              content_name: pagePath,
              content_category: 'Callback form submit'
            });
          }

          showSuccess(name);
        })
        .catch(function (err) {
          console.error('Form submit error:', err);
          if (btn) { btn.disabled = false; btn.innerHTML = origLabel; }
          alert(IS_EN
            ? 'Submission failed. Please try again or write directly to info@skolaflow.cz.'
            : 'Nepodařilo se odeslat. Zkuste prosím znovu nebo nám napište přímo na info@skolaflow.cz.');
        });
    });
  }

  // ───── Form Closer — CMS dropdown z Google Sheets CSV
  function initFormCloserDropdown() {
    var select = document.getElementById('form-closer-meeting');
    if (!select) return;

    var SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjlj0pNn0yU3jyhngYBQmmzVrqStYlXxw0-nOlbgv2ua0eCAkJTm44-jUjiXEp2SR4pJk_e9yaqQxN/pub?gid=724100504&single=true&output=csv';
    var hiddenTitle = document.getElementById('form-closer-event-title');
    var hiddenDate  = document.getElementById('form-closer-event-date');

    var FALLBACK = IS_EN ? [
      { type: 'zs-od',  title: 'Open Day at FLOW Elementary',            date: '2026-09-17', time: '17:00' },
      { type: 'ms-od',  title: 'Open Day at Little FLOW (Kindergarten)', date: '2026-06-04', time: '17:00' },
      { type: 'kafe',   title: 'Coffee with the Director',                date: '',           time: "we'll arrange a date" },
      { type: 'online', title: 'Online meeting',                          date: '',           time: "we'll arrange a date" }
    ] : [
      { type: 'zs-od',  title: 'Den otevřených dveří ZŠ FLOW',          date: '2026-09-17', time: '17:00' },
      { type: 'ms-od',  title: 'Den otevřených dveří Little FLOW (MŠ)', date: '2026-06-04', time: '17:00' },
      { type: 'kafe',   title: 'Káva s ředitelem',                       date: '',           time: 'sjednáme termín' },
      { type: 'online', title: 'Online schůzka',                         date: '',           time: 'sjednáme termín' }
    ];
    var MONTHS = IS_EN
      ? ['January','February','March','April','May','June','July','August','September','October','November','December']
      : ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
    var DAYS = IS_EN
      ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      : ['ne','po','út','st','čt','pá','so'];
    var DEFAULT_TIME_LABEL = IS_EN ? "we'll arrange a date" : 'sjednáme termín';

    function formatLabel(row) {
      // EN-aware: pokud CSV poskytuje title_en, pouzij ho na EN webu
      var title = (IS_EN && row.title_en) ? row.title_en : row.title;
      var time  = (IS_EN && row.time_en)  ? row.time_en  : row.time;
      if (!row.date) return title + ' — ' + (time || DEFAULT_TIME_LABEL);
      var d = new Date(row.date);
      if (isNaN(d.getTime())) return title;
      // EN format: "Wed 17 September 2026 · 17:00" (bez tecky); CS: "st 17. září 2026 · 17:00"
      var dateStr = IS_EN
        ? DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
        : DAYS[d.getDay()] + ' ' + d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
      return title + ' — ' + dateStr + (time ? ' · ' + time : '');
    }

    function populate(rows) {
      while (select.options.length > 1) select.remove(1);
      rows.forEach(function (row) {
        var opt = document.createElement('option');
        opt.value = row.type;
        opt.textContent = formatLabel(row);
        opt.dataset.title = (IS_EN && row.title_en) ? row.title_en : row.title;
        opt.dataset.dateLabel = formatLabel(row).split(' — ').slice(1).join(' — ') || ((IS_EN && row.time_en) ? row.time_en : (row.time || ''));
        select.appendChild(opt);
      });
      var none = document.createElement('option');
      none.value = 'none';
      none.textContent = IS_EN
        ? 'None of these works — please contact me, we\'ll find another'
        : 'Žádný termín mi nevyhovuje — kontaktujte mě, najdeme jiný';
      none.dataset.title = '';
      none.dataset.dateLabel = '';
      select.appendChild(none);
    }

    function parseCSV(text) {
      var lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return [];
      var header = lines[0].split(',').map(function (h) { return h.trim().toLowerCase(); });
      var idx = {
        type: header.indexOf('type'),
        title: header.indexOf('title'),
        title_en: header.indexOf('title_en'),
        date: header.indexOf('date'),
        time: header.indexOf('time'),
        time_en: header.indexOf('time_en'),
        active: header.indexOf('active')
      };
      return lines.slice(1).map(function (line) {
        var cells = line.split(',');
        return {
          type: idx.type >= 0 ? (cells[idx.type] || '').trim() : '',
          title: idx.title >= 0 ? (cells[idx.title] || '').trim() : '',
          title_en: idx.title_en >= 0 ? (cells[idx.title_en] || '').trim() : '',
          date: idx.date >= 0 ? (cells[idx.date] || '').trim() : '',
          time: idx.time >= 0 ? (cells[idx.time] || '').trim() : '',
          time_en: idx.time_en >= 0 ? (cells[idx.time_en] || '').trim() : '',
          active: idx.active >= 0 ? (cells[idx.active] || '').trim().toUpperCase() : 'TRUE'
        };
      }).filter(function (r) { return r.active !== 'FALSE' && r.title; });
    }

    select.addEventListener('change', function () {
      var opt = select.options[select.selectedIndex];
      if (!opt) return;
      if (hiddenTitle) hiddenTitle.value = opt.dataset.title || '';
      if (hiddenDate)  hiddenDate.value  = opt.dataset.dateLabel || '';
    });

    fetch(SHEET_CSV_URL + (SHEET_CSV_URL.indexOf('?') > -1 ? '&' : '?') + 't=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (text) {
        var rows = parseCSV(text);
        populate(rows.length ? rows : FALLBACK);
      })
      .catch(function (err) {
        console.warn('Form Closer CSV fetch failed:', err);
        populate(FALLBACK);
      });
  }

  // ───── Lightbox (gallery klik → full photo modal s prev/next navigaci)
  function initLightbox() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
    if (!triggers.length) return;

    // Auto-inject lightbox container (jednou per page)
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('hidden', '');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Detail fotografie');
    box.innerHTML =
      '<button class="lightbox__close" aria-label="Zavřít fotografii" type="button">×</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" aria-label="Předchozí fotografie" type="button">‹</button>' +
      '<button class="lightbox__nav lightbox__nav--next" aria-label="Další fotografie" type="button">›</button>' +
      '<img class="lightbox__image" alt="">' +
      '<p class="lightbox__caption"></p>';
    document.body.appendChild(box);

    var imgEl = box.querySelector('.lightbox__image');
    var capEl = box.querySelector('.lightbox__caption');
    var closeBtn = box.querySelector('.lightbox__close');
    var prevBtn = box.querySelector('.lightbox__nav--prev');
    var nextBtn = box.querySelector('.lightbox__nav--next');
    var currentIndex = 0;
    var lastFocused = null;

    function extractSrc(t) {
      var src = t.getAttribute('href') || t.getAttribute('data-lightbox-src') || '';
      if (src) return src;
      // fallback: background-image v dceri
      var photo = t.querySelector('[style*="background-image"]');
      if (photo) {
        var m = photo.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (m) return m[1];
      }
      return '';
    }

    function show(index) {
      currentIndex = (index + triggers.length) % triggers.length;  // wraparound
      var t = triggers[currentIndex];
      var src = extractSrc(t);
      var caption = t.getAttribute('data-caption') || '';
      var alt = '';
      var imgIn = t.querySelector('img');
      if (imgIn) alt = imgIn.alt;
      if (!src) return;

      imgEl.src = src;
      imgEl.alt = alt || caption || '';
      capEl.innerHTML = caption;
    }

    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      imgEl.src = '';
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    function prev() { show(currentIndex - 1); }
    function next() { show(currentIndex + 1); }

    triggers.forEach(function (t, idx) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        open(idx);
      });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); next(); });

    box.addEventListener('click', function (e) {
      if (e.target === box) close();
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    });

    // Touch swipe (mobile)
    var touchStartX = 0;
    var touchEndX = 0;
    var SWIPE_THRESHOLD = 50; // px
    box.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (box.hidden) return;
      if (e.changedTouches.length === 1) {
        touchEndX = e.changedTouches[0].clientX;
        var delta = touchEndX - touchStartX;
        if (delta > SWIPE_THRESHOLD) prev();
        else if (delta < -SWIPE_THRESHOLD) next();
      }
    }, { passive: true });
  }

  // ───── Smooth scroll pro anchor odkazy
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var hash = link.getAttribute('href');
      if (hash === '#' || hash.length < 2) return;
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ───── Messenger FAB — show after 300px scroll
  function initMessengerFab() {
    var fab = document.querySelector('.msg-fab');
    if (!fab) return;
    var threshold = 300;
    var ticking = false;

    function update() {
      if (window.scrollY > threshold) {
        fab.classList.add('is-visible');
      } else {
        fab.classList.remove('is-visible');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    // Initial check (in case page loads scrolled)
    update();
  }

  // ───── Smart hide sticky nav — scroll down hides, scroll up shows
  function initSmartHideNav() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var lastY = window.scrollY;
    var threshold = 100; // px — pod tímto bodem nikdy neskrývat
    var ticking = false;

    function update() {
      var currentY = window.scrollY;
      if (currentY <= threshold) {
        header.classList.remove('is-hidden');
      } else if (currentY > lastY + 4) {
        // scroll dolů (s malou tolerancí proti micro-jitteru)
        header.classList.add('is-hidden');
      } else if (currentY < lastY - 4) {
        // scroll nahoru
        header.classList.remove('is-hidden');
      }
      lastY = currentY;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  // ───── Bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  function init() {
    setFooterYear();
    initMobileNav();
    initCallbackForm();
    initFormCloserDropdown();
    initLightbox();
    initSmoothScroll();
    initSmartHideNav();
    initMessengerFab();
    initConversionPageEvents();
  }

  // ───── Conversion page events (CompleteRegistration on /dekujeme-za-zajem)
  function initConversionPageEvents() {
    var path = window.location.pathname.replace(/\.html$|\/$/g, '');
    var isThankYou = /\/dekujeme-za-zajem$/.test(path);
    if (!isThankYou) return;

    // GTM dataLayer event
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'conversion_complete',
        conversion_type: 'callback_submitted'
      });
    }

    // FB Pixel CompleteRegistration — consent-gated
    if (window.fbq && window.__flowConsent && window.__flowConsent.marketing) {
      window.fbq('track', 'CompleteRegistration', {
        content_name: 'Callback form thank-you',
        status: 'submitted'
      });
    }
  }
})();
