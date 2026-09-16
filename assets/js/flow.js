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

  // ───── Rezervace prohlidky (Google Calendar appointment schedule)
  // 60 min osobne v kampusu na Balabence. Menit na jednom miste.
  var BOOKING_URL = 'https://calendar.app.google/YVTTWSvt6Zj56ykV8';
  var ONLINE_URL  = 'https://calendar.app.google/UytpdiarvKwDieUe6';
  // Rezervacni okna. Vkladaji se primo do potvrzeni, protoze u techto dvou
  // typu zajemce jeste zapsany neni, musi si nejdriv zvolit slot.
  var BOOKING_EMBED = {
    'kafe':   'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3N93cfV77dKYDuMRGazbi1HrqazS5qtbeQ4IvREGidzIVdASo24Lxb420L5FMr2sBF2Qkgd69C?gv=true',
    'online': 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1KmkQl_AsS1m_MeKTfNXHyUoZuaHh52N1FkV7qpxW4nrAYW9OEwYCLmBJHR96Xi09Gqnzy-MNF?gv=true'
  };

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

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function showSuccess(name) {
      var firstName = (name || '').split(' ')[0].trim();

      // Vybral si konkretni termin? Pak mu rezervacni odkaz nenabizej —
      // termin uz ma a jen by ho to zmatlo.
      var sel = form.querySelector('[name="meeting"]');
      var picked = '';
      if (sel && sel.value && sel.value !== 'none' && sel.selectedIndex > 0) {
        picked = (sel.options[sel.selectedIndex].textContent || '').trim();
      }

      var icon = '<div class="form-success__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M5 12.5l5 5L20 7"/>' +
        '</svg>' +
      '</div>';

      var bookType = sel && BOOKING_EMBED[sel.value] ? sel.value : '';

      var body;
      if (bookType) {
        var isOnline = bookType === 'online';
        var embedTitle = IS_EN
          ? (isOnline ? 'Book an online meeting' : 'Book a school tour')
          : (isOnline ? 'Rezervace online schůzky' : 'Rezervace termínu prohlídky');
        var embed = '<div class="form-success__embed">' +
          '<iframe src="' + BOOKING_EMBED[bookType] + '" title="' + embedTitle +
          '" width="100%" height="600" frameborder="0" style="border:0"></iframe>' +
        '</div>';
        body = IS_EN
          ? '<h3>One last step, pick a time</h3>' +
            '<p>' + (isOnline
              ? 'We hold online meetings on Tuesdays and Thursdays. Choose a slot below and we\'ll email you the link.'
              : 'We run tours on Tuesdays and Thursdays. Choose a slot below and we\'ll email you a confirmation.') + '</p>' +
            embed
          : '<h3>Ještě si vyberte čas</h3>' +
            '<p>' + (isOnline
              ? 'Online schůzky vedeme v úterý a ve čtvrtek. Vyberte si níže termín, odkaz vám přijde e-mailem.'
              : 'Prohlídky vedeme v úterý a ve čtvrtek. Vyberte si níže termín, který vám sedne, potvrzení vám přijde e-mailem.') + '</p>' +
            embed;
        body += '<p class="form-success__cta">' +
          '<button type="button" class="btn btn-primary" data-booking-done>' +
          (IS_EN ? 'I\'ve booked my slot' : 'Mám rezervováno') +
          '</button></p>';
      } else if (picked) {
        // Cesky BEZ jmena. Pati pad se u libovolnych jmen (vcetne cizich)
        // spolehlive odvodit neda a "Dekujeme, Petr!" je proste spatne.
        body = IS_EN
          ? '<h3>You\'re on the list' + (firstName ? ', ' + firstName : '') + '!</h3>' +
            '<p class="form-success__event">' + esc(picked) + '</p>' +
            '<p>We\'re sending you a confirmation with the details by email.</p>' +
            '<p class="form-success__fallback">Want to talk before then? <a href="' + ONLINE_URL + '" target="_blank" rel="noopener">Book an online meeting</a>.</p>'
          : '<h3>Máme vás zapsané!</h3>' +
            '<p class="form-success__event">' + esc(picked) + '</p>' +
            '<p>Potvrzení s detaily vám posíláme e-mailem.</p>' +
            '<p class="form-success__fallback">Chcete si popovídat ještě předtím? <a href="' + ONLINE_URL + '" target="_blank" rel="noopener">Domluvte si online schůzku</a>.</p>';
      } else {
        body = IS_EN
          ? '<h3>Thanks' + (firstName ? ', ' + firstName : '') + '!</h3>' +
            '<p>Pick a time that suits you, an hour at our Balabenka campus. We\'ll walk you through the school and talk about what you\'re looking for.</p>' +
            '<p class="form-success__cta"><a class="btn btn-primary" href="' + BOOKING_URL + '" target="_blank" rel="noopener">Book a campus visit</a></p>' +
            '<p class="form-success__fallback">Or <a href="' + ONLINE_URL + '" target="_blank" rel="noopener">book an online meeting</a> straight away. If none of the times work, write to <a href="mailto:info@skolaflow.cz">info@skolaflow.cz</a>.</p>'
          : '<h3>Děkujeme za zájem!</h3>' +
            '<p>Vyberte si termín, který vám sedne, hodina u nás na Balabence. Projdeme spolu školu a probereme, co pro dítě hledáte.</p>' +
            '<p class="form-success__cta"><a class="btn btn-primary" href="' + BOOKING_URL + '" target="_blank" rel="noopener">Vybrat termín prohlídky</a></p>' +
            '<p class="form-success__fallback">Nebo si rovnou <a href="' + ONLINE_URL + '" target="_blank" rel="noopener">domluvte online schůzku</a>. Kdyby nesedl žádný termín, napište na <a href="mailto:info@skolaflow.cz">info@skolaflow.cz</a>.</p>';
      }

      var success = document.createElement('div');
      success.className = 'form-success';
      success.innerHTML = icon + body;
      form.parentNode.replaceChild(success, form);
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Po kliknuti sbalime rezervacni okno do klidneho potvrzeni.
      var doneBtn = success.querySelector('[data-booking-done]');
      if (doneBtn) {
        doneBtn.addEventListener('click', function () {
          success.innerHTML = icon + (IS_EN
            ? '<h3>All set!</h3>' +
              '<p>Your confirmation is on its way by email from our calendar. We look forward to meeting you.</p>' +
              '<p class="form-success__fallback">If anything changes, write to <a href="mailto:info@skolaflow.cz">info@skolaflow.cz</a>.</p>'
            : '<h3>Máme to!</h3>' +
              '<p>Potvrzení termínu vám přijde e-mailem z našeho kalendáře. Těšíme se na vás.</p>' +
              '<p class="form-success__fallback">Kdyby se něco změnilo, napište na <a href="mailto:info@skolaflow.cz">info@skolaflow.cz</a>.</p>');
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
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

          // 2) FB Pixel — consent-gated. Lead i CompleteRegistration naraz.
          //    CompleteRegistration visel do 9. 9. 2026 jen na /dekujeme-za-zajem,
          //    kam ale zadny formular neposila — kampane tedy optimalizovaly
          //    na event, ktery se nikdy nestal. Lead zustava kvuli publikum.
          if (window.fbq && window.__flowConsent && window.__flowConsent.marketing) {
            window.fbq('track', 'Lead', {
              content_name: pagePath,
              content_category: 'Callback form submit'
            });
            window.fbq('track', 'CompleteRegistration', {
              content_name: pagePath,
              content_category: 'Callback form submit',
              status: 'submitted'
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

    // Pouzije se, kdyz nejde nacist sheet. ZADNA PEVNA DATA — driv tu visel
    // termin ze 4. cervna a pri vypadku se nabizel jako platny.
    var FALLBACK = IS_EN ? [
      { type: 'kafe',   title: 'School Tour with FLOW leadership', date: '', time: 'Tue and Thu, 9:00–9:45 or 10:45–11:30' },
      { type: 'online', title: 'Online meeting with the leadership team', date: '', time: 'Tue and Thu, 10:00–10:30' }
    ] : [
      { type: 'kafe',   title: 'School Tour s vedením ZŠ FLOW', date: '', time: 'út a čt, 9:00–9:45 nebo 10:45–11:30' },
      { type: 'online', title: 'Online schůzka s vedením',  date: '', time: 'út a čt, 10:00–10:30' }
    ];
    var MONTHS = IS_EN
      ? ['January','February','March','April','May','June','July','August','September','October','November','December']
      : ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
    var DAYS = IS_EN
      ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      : ['ne','po','út','st','čt','pá','so'];
    var DEFAULT_TIME_LABEL = IS_EN ? "we'll arrange a date" : 'sjednáme termín';

    // Datova cast bez titulku. Drive se vytahovala pres split(' — '), coz se
    // rozbilo, jakmile titulek sam obsahoval oddelovac.
    function formatDatePart(row) {
      var time = (IS_EN && row.time_en) ? row.time_en : row.time;
      if (!row.date) return time || DEFAULT_TIME_LABEL;
      var d = new Date(row.date + 'T00:00:00');   // lokalni pulnoc, jinak je v USA o den driv
      if (isNaN(d.getTime())) return '';
      // EN format: "Wed 7 October 2026 · 16:00" (bez tecky); CS: "st 7. října 2026 · 16:00"
      var dateStr = IS_EN
        ? DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
        : DAYS[d.getDay()] + ' ' + d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
      return dateStr + (time ? ' · ' + time : '');
    }

    function formatLabel(row) {
      // EN-aware: pokud CSV poskytuje title_en, pouzij ho na EN webu
      var title = (IS_EN && row.title_en) ? row.title_en : row.title;
      var part  = formatDatePart(row);
      return part ? title + ', ' + part : title;
    }

    function populate(rows) {
      while (select.options.length > 1) select.remove(1);
      rows.forEach(function (row) {
        var opt = document.createElement('option');
        opt.value = row.type;
        opt.textContent = formatLabel(row);
        opt.dataset.title = (IS_EN && row.title_en) ? row.title_en : row.title;
        opt.dataset.dateLabel = formatDatePart(row) || ((IS_EN && row.time_en) ? row.time_en : (row.time || ''));
        select.appendChild(opt);
      });
      var none = document.createElement('option');
      none.value = 'none';
      none.textContent = IS_EN
        ? 'None of these works, please contact me and we\'ll find another'
        : 'Žádný termín mi nevyhovuje, kontaktujte mě a najdeme jiný';
      none.dataset.title = '';
      none.dataset.dateLabel = '';
      select.appendChild(none);
    }

    /* Poradny CSV parser: pole s carkou uvnitr Google Sheets obaluje
       uvozovkami, naivni split(',') takovy radek rozseka. */
    function splitCsvRows(text) {
      var rows = [], row = [], cell = '', inQ = false;
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (inQ) {
          if (c === '"') {
            if (text[i + 1] === '"') { cell += '"'; i++; }
            else { inQ = false; }
          } else { cell += c; }
        } else {
          if (c === '"') inQ = true;
          else if (c === ',') { row.push(cell); cell = ''; }
          else if (c === '\r') { /* skip */ }
          else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
          else cell += c;
        }
      }
      if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
      return rows.filter(function (r) { return r.some(function (v) { return v && v.trim(); }); });
    }

    function parseCSV(text) {
      var lines = splitCsvRows(text);
      if (lines.length < 2) return [];
      var header = lines[0].map(function (h) { return (h || '').trim().toLowerCase(); });
      var idx = {
        type: header.indexOf('type'),
        title: header.indexOf('title'),
        title_en: header.indexOf('title_en'),
        date: header.indexOf('date'),
        time: header.indexOf('time'),
        time_en: header.indexOf('time_en'),
        active: header.indexOf('active')
      };
      return lines.slice(1).map(function (cells) {
        return {
          type: idx.type >= 0 ? (cells[idx.type] || '').trim() : '',
          title: idx.title >= 0 ? (cells[idx.title] || '').trim() : '',
          title_en: idx.title_en >= 0 ? (cells[idx.title_en] || '').trim() : '',
          date: idx.date >= 0 ? (cells[idx.date] || '').trim() : '',
          time: idx.time >= 0 ? (cells[idx.time] || '').trim() : '',
          time_en: idx.time_en >= 0 ? (cells[idx.time_en] || '').trim() : '',
          active: idx.active >= 0 ? (cells[idx.active] || '').trim().toUpperCase() : 'TRUE'
        };
      }).filter(function (r) {
        if (r.active === 'FALSE' || !r.title) return false;
        if (!r.date) return true;                 // kafe/online — bez data, plati vzdy
        var d = new Date(r.date + 'T00:00:00');   // lokalni pulnoc, ne UTC
        var today = new Date(); today.setHours(0, 0, 0, 0);
        return !isNaN(d.getTime()) && d >= today; // minule terminy uz nenabizej
      });
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
        select.dispatchEvent(new CustomEvent('flow:options-ready', { bubbles: true }));
      })
      .catch(function (err) {
        console.warn('Form Closer CSV fetch failed:', err);
        populate(FALLBACK);
        select.dispatchEvent(new CustomEvent('flow:options-ready', { bubbles: true }));
      });
  }

  // ───── Little FLOW — hero open-day kartička (data-driven z Eventy CSV)
  // Zobrazí se POUZE pokud v Eventy sheetu existuje řádek type=ms-od s active≠FALSE a vyplněným datem.
  // Jinak (FALSE / chybí / fetch selže) zůstane kartička skrytá — žádný zásah do kódu není potřeba.

  // ───── MEET — jednotna sekce "Pojdme se poznat"
  // Tri cesty misto rozbalovatka. Rozbalovatko zustava v DOM jako zdroj pravdy
  // (plni ho initFormCloserDropdown a cte z nej odesilani), pilulky a tlacitka
  // cest do nej jen prepinaji vyber pres selectedIndex — jednotlive terminy
  // maji stejnou value 'zs-od', takze podle hodnoty rozlisit nejdou.
  function initMeetSection() {
    var sec = document.querySelector('.meet');
    if (!sec) return;

    var select   = sec.querySelector('[name="meeting"]');
    var panel    = sec.querySelector('.meet__panel');
    var slots    = sec.querySelector('[data-meet-slots]');
    var slotsLbl = sec.querySelector('[data-meet-slots-label]');
    var embed    = sec.querySelector('[data-meet-embed]');
    var form     = sec.querySelector('#callback-form');
    var pTitle   = sec.querySelector('[data-meet-title]');
    var pNote    = sec.querySelector('[data-meet-note]');
    if (!select || !panel) return;

    // Prohlidka a online schuzka nemaji pevny termin: zajemce si vybira slot
    // primo v rezervacnim okne Google Kalendare, formular se u nich neukazuje.
    var BOOK = {
      'kafe':   'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3N93cfV77dKYDuMRGazbi1HrqazS5qtbeQ4IvREGidzIVdASo24Lxb420L5FMr2sBF2Qkgd69C?gv=true',
      'online': 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1KmkQl_AsS1m_MeKTfNXHyUoZuaHh52N1FkV7qpxW4nrAYW9OEwYCLmBJHR96Xi09Gqnzy-MNF?gv=true'
    };

    var COPY = {
      'zs-od':  { t: 'Den otevřených dveří',
                  n: 'Vyberte si termín a nechte nám kontakt. Potvrzení vám pošleme e-mailem.' },
      'kafe':   { t: 'School Tour s vedením ZŠ FLOW',
                  n: 'Vyberte si čas, který vám sedne. Potvrzení vám přijde e-mailem z našeho kalendáře.' },
      'online': { t: 'Online schůzka s vedením',
                  n: 'Vyberte si čas, který vám sedne. Odkaz na hovor vám přijde e-mailem z našeho kalendáře.' }
    };
    var NONE_NOTE = 'Ozveme se do jednoho pracovního dne a domluvíme termín, který vám sedne. Nebo si vyberte School Tour, ta je každé úterý a čtvrtek.';

    function optionsOf(type) {
      var out = [];
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === type) out.push(i);
      }
      return out;
    }

    function pickIndex(i) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Karta 01: nejblizsi termin a kolik jich je celkem
    function fillNext() {
      var idx = optionsOf('zs-od');
      var when  = sec.querySelector('[data-meet-next]');
      var count = sec.querySelector('[data-meet-count]');
      if (!idx.length) {
        if (when) when.textContent = 'termín domluvíme individuálně';
        if (count) count.textContent = '';
        return;
      }
      var first = select.options[idx[0]];
      if (when) when.textContent = 'nejbližší: ' + (first.dataset.dateLabel || first.textContent);
      if (count) {
        count.textContent = idx.length > 1
          ? ('Vypsáno ' + idx.length + ' termínů, vyberete si v dalším kroku.')
          : '';
      }
    }

    function buildSlots() {
      var idx = optionsOf('zs-od');
      slots.innerHTML = '';
      idx.forEach(function (i, k) {
        var o = select.options[i];
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'meet__slot';
        b.setAttribute('aria-pressed', String(k === 0));
        b.dataset.index = String(i);
        b.textContent = o.dataset.dateLabel || o.textContent;
        slots.appendChild(b);
      });
      var noneIdx = optionsOf('none');
      if (noneIdx.length) {
        var nb = document.createElement('button');
        nb.type = 'button';
        nb.className = 'meet__slot meet__slot--none';
        nb.setAttribute('aria-pressed', 'false');
        nb.dataset.index = String(noneIdx[0]);
        nb.dataset.none = '1';
        nb.textContent = 'Žádný mi nevyhovuje';
        slots.appendChild(nb);
      }
      if (idx.length) pickIndex(idx[0]);
    }

    function openPath(type) {
      var c = COPY[type];
      if (!c) return;
      sec.querySelectorAll('.meet__path').forEach(function (p) {
        p.setAttribute('aria-expanded', String(p.dataset.path === type));
      });
      pTitle.textContent = c.t;
      pNote.textContent = c.n;

      var isDod = type === 'zs-od';
      slots.hidden = !isDod;
      slotsLbl.hidden = !isDod;
      if (form) form.hidden = !isDod;
      if (embed) embed.hidden = isDod;

      if (isDod) {
        if (embed) embed.innerHTML = '';
        buildSlots();
      } else {
        var idx = optionsOf(type);
        if (idx.length) pickIndex(idx[0]);
        if (embed && BOOK[type]) {
          embed.innerHTML =
            '<iframe src="' + BOOK[type] + '" title="' +
            (type === 'online' ? 'Rezervace online schůzky' : 'Rezervace termínu prohlídky') +
            '" width="100%" height="620" frameborder="0" style="border:0"></iframe>';
        }
      }
      panel.hidden = false;
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    sec.addEventListener('click', function (e) {
      var cta = e.target.closest('.meet__cta');
      if (cta) {
        var path = cta.closest('.meet__path');
        if (path) openPath(path.dataset.path);
        return;
      }
      var slot = e.target.closest('.meet__slot');
      if (slot) {
        slots.querySelectorAll('.meet__slot').forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
        slot.setAttribute('aria-pressed', 'true');
        pickIndex(parseInt(slot.dataset.index, 10));
        pNote.textContent = slot.dataset.none ? NONE_NOTE : COPY['zs-od'].n;
      }
    });

    document.addEventListener('flow:options-ready', function () {
      fillNext();
      if (!panel.hidden && !slots.hidden) buildSlots();
    });
  }

  function initLittleFlowOpenDay() {
    var card = document.getElementById('lf-openday');
    if (!card) return;

    var SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjlj0pNn0yU3jyhngYBQmmzVrqStYlXxw0-nOlbgv2ua0eCAkJTm44-jUjiXEp2SR4pJk_e9yaqQxN/pub?gid=724100504&single=true&output=csv';
    var MONTHS = IS_EN
      ? ['January','February','March','April','May','June','July','August','September','October','November','December']
      : ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
    var DAYS = IS_EN
      ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      : ['ne','po','út','st','čt','pá','so'];

    var dateEl = document.getElementById('lf-openday-date');
    var metaEl = document.getElementById('lf-openday-meta');

    function reveal(d, time) {
      var dateStr = IS_EN
        ? DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
        : DAYS[d.getDay()] + ' ' + d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
      dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);   // "po" → "Po"
      if (dateEl) dateEl.textContent = dateStr;
      // Místo: všechny DOD probíhají v kampusu na Balabence
      var place = IS_EN
        ? 'Českomoravská 1a, 190 00 Prague 9, Balabenka'
        : 'Českomoravská 1a, 190 00 Praha 9, Balabenka';
      if (metaEl) metaEl.textContent = (time ? (IS_EN ? 'from ' : 'od ') + time + ' · ' : '') + place;
      card.hidden = false;
    }

    fetch(SHEET_CSV_URL + (SHEET_CSV_URL.indexOf('?') > -1 ? '&' : '?') + 't=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (text) {
        var lines = splitCsvRows(text);
        if (lines.length < 2) return;
        var header = lines[0].map(function (h) { return (h || '').trim().toLowerCase(); });
        var iType = header.indexOf('type'), iDate = header.indexOf('date'),
            iTime = header.indexOf('time'), iActive = header.indexOf('active');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var best = null;
        for (var k = 1; k < lines.length; k++) {
          var c = lines[k];
          var type = iType >= 0 ? (c[iType] || '').trim() : '';
          var active = iActive >= 0 ? (c[iActive] || '').trim().toUpperCase() : 'TRUE';
          if (type !== 'ms-od' || active === 'FALSE') continue;
          var date = iDate >= 0 ? (c[iDate] || '').trim() : '';
          if (!date) continue;
          var d = new Date(date + 'T00:00:00');
          if (isNaN(d.getTime()) || d < today) continue;       // schovej minulé termíny
          if (!best || d < best.d) best = { d: d, time: iTime >= 0 ? (c[iTime] || '').trim() : '' };
        }
        if (best) reveal(best.d, best.time);                    // jinak kartička zůstane skrytá
      })
      .catch(function (err) { console.warn('Little FLOW open-day CSV fetch failed:', err); });
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
    initMeetSection();
    initLittleFlowOpenDay();
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
