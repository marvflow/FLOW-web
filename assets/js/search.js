/* ============================================================
   FLOW — vyhledávání na webu (Marv 11. 11. 2026)
   ------------------------------------------------------------
   Bez build kroku: index si skript postaví sám z živých stránek
   (sitemap.xml → stáhne stránky → vytáhne nadpisy a texty).
   Každá změna textu na webu je tak ve vyhledávání hned po pushi,
   nic se nemusí přegenerovávat. Index se drží v sessionStorage.
   Načítá ho flow.js (loadSearch). Styly: flow.css, sekce SEARCH.
   ============================================================ */
(function () {
  'use strict';
  if (window.__flowSearch) return;
  window.__flowSearch = true;

  var VER = '20261111a';
  var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var T = EN ? {
    btn: 'Search', ph: 'What are you looking for? E.g. clubs, lunches, fees…',
    sugg: 'Parents most often look for', loading: 'Loading website content…',
    none: 'Nothing found for', noneTip: 'Try another word, or write to us: info@skolaflow.cz',
    foot: '↑ ↓ select · Enter open', results: 'results', close: 'Close search', home: 'Home',
    chips: ['After-school clubs', 'Fees', 'Lunches', 'Enrolment', 'English', 'Open day', 'Sibling discount', 'Kindergarten']
  } : {
    btn: 'Hledat', ph: 'Co hledáte? Např. kroužky, obědy, školné…',
    sugg: 'Rodiče nejčastěji hledají', loading: 'Načítám obsah webu…',
    none: 'Nic jsme nenašli pro', noneTip: 'Zkuste jiné slovo, nebo nám napište: info@skolaflow.cz',
    foot: '↑ ↓ vybrat · Enter otevřít', results: 'výsledků', close: 'Zavřít hledání', home: 'Úvod',
    chips: ['Kroužky', 'Družina', 'Obědy', 'Školné', 'Zápisy', 'Angličtina', 'Den otevřených dveří', 'Sourozenecká sleva']
  };

  // Co rodič napíše → slova, která jsou opravdu na webu (bez diakritiky, malými)
  var SYN = EN ? {
    clubs: ['club', 'after-school', 'extracurricular'], club: ['clubs', 'extracurricular'], afternoon: ['clubs', 'after-school', 'aftercare'],
    lunch: ['lunches', 'meals', 'snack'], lunches: ['lunch', 'meals'], food: ['lunch', 'meals', 'snack'], price: ['fees', 'tuition', 'czk'],
    cost: ['fees', 'tuition', 'czk'], fees: ['tuition', 'czk'], tuition: ['fees'], sibling: ['siblings'], discount: ['siblings', 'discount'],
    kindergarten: ['little flow', 'preschool'], preschool: ['little flow', 'kindergarten'], enrolment: ['enrollment', 'admissions', 'zapis'],
    enrollment: ['enrolment', 'admissions'], readiness: ['isophi', 'assessment'], address: ['balabenka', 'ceskomoravska'], where: ['balabenka', 'ceskomoravska'],
    aftercare: ['after-school care', 'druzina'], 'open': ['open day']
  } : {
    odpoledne: ['krouzky', 'druzina'], odpoledni: ['krouzky', 'druzina'], krouzky: ['mimoskolni', 'zajmove'], krouzek: ['krouzky', 'mimoskolni'],
    jidlo: ['obedy', 'svacin', 'stravovani'], obed: ['obedy'], obedy: ['stravovani'], cena: ['skolne', 'poplatky', 'kc'], ceny: ['skolne', 'poplatky', 'kc'],
    kolik: ['skolne', 'poplatky', 'kc'], stoji: ['skolne', 'poplatky'], platba: ['skolne', 'poplatky'], platit: ['skolne', 'poplatky'], skolne: ['poplatky'],
    sourozenec: ['sourozence', 'sourozenecka'], sourozenecka: ['sourozence'], sleva: ['sourozence', 'sleva'], anglictina: ['english', 'clil'],
    prijeti: ['zapisy', 'prestup'], zapis: ['zapisy', 'zapisovy'], skolka: ['little flow', 'ms'], ms: ['little flow', 'skolka'],
    zralost: ['isophi', 'posouzeni'], dod: ['den otevrenych dveri'], adresa: ['balabenka', 'ceskomoravska'], kde: ['balabenka', 'ceskomoravska', 'adresa'],
    rozvrh: ['denni rezim', 'bloky'], rano: ['ranni druzina', '7:30'], druzina: ['druzinu', 'druziny']
  };
  var STOP = {};
  (EN ? 'the a an is are do does for of to in at on and or how what when where your you my our we school flow can i there any much many it this that be will need'
      : 'skola skole skoly skolu flow jak co je se na ve pro to mi me nas vas ma maji jsou nejake nejaky jaky jaka jake mate dite deti ditete u ktery ktera ktere a i v k s z o').split(' ')
    .forEach(function (w) { STOP[w] = 1; });

  var LITTLE = EN
    ? { u: 'https://www.littleflow.cz/', title: 'Little FLOW (kindergarten)', s: [{ h: 'Little FLOW – Czech-English kindergarten, ages 2–6', id: '', t: 'Little FLOW kindergarten (preschool) has its own website littleflow.cz: admissions, fees, open days and contact.' }] }
    : { u: 'https://www.littleflow.cz/', title: 'Little FLOW (MŠ)', s: [{ h: 'Little FLOW – česko-anglická školka 2–6 let', id: '', t: 'Mateřská škola Little FLOW (MŠ, školka) má vlastní web littleflow.cz: přijímání dětí, ceny, den otevřených dveří a kontakt.' }] };

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/></svg>';

  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stem(w) { return w.length > 5 ? w.slice(0, Math.max(5, w.length - 2)) : w; }
  function clean(s) { return (s || '').replace(/\s+/g, ' ').replace(/\s+([.,!?:;)])/g, '$1').trim(); }

  // ───── 1) Tlačítka do menu
  function injectButtons() {
    var nav = document.querySelector('.site-nav');
    if (nav && !nav.querySelector('.flow-search-btn')) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'flow-search-btn';
      b.setAttribute('aria-label', T.btn);
      b.innerHTML = ICON + '<span class="flow-search-btn__lbl">' + T.btn + '</span>';
      var lang = nav.querySelector('[hreflang]');
      var cta = nav.querySelector('.site-nav__cta');
      nav.insertBefore(b, lang || cta || null);
    }
    var burger = document.querySelector('.site-header .burger');
    if (burger && !document.querySelector('.flow-search-btn--m')) {
      var m = document.createElement('button');
      m.type = 'button';
      m.className = 'flow-search-btn flow-search-btn--m';
      m.setAttribute('aria-label', T.btn);
      m.innerHTML = ICON;
      burger.parentNode.insertBefore(m, burger);
    }
    document.querySelectorAll('.flow-search-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { open(''); });
      btn.addEventListener('mouseenter', buildIndex, { once: true });
      btn.addEventListener('touchstart', buildIndex, { once: true, passive: true });
    });
  }

  // ───── 2) Index z živých stránek
  var DOCS = null, building = null;
  var KEY = 'flowSearch:' + (EN ? 'en' : 'cs') + ':' + VER;

  function buildIndex() {
    if (DOCS) return Promise.resolve(DOCS);
    if (building) return building;
    try {
      var c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (c && Date.now() - c.at < 3600e3) { DOCS = toDocs(c.pages); return Promise.resolve(DOCS); }
    } catch (e) {}
    building = fetch('/sitemap.xml').then(function (r) { return r.text(); }).then(function (xml) {
      var urls = (xml.match(/<loc>[^<]+<\/loc>/g) || []).map(function (l) { return l.replace(/<\/?loc>/g, '').trim(); })
        .filter(function (u) { var p = new URL(u).pathname; return EN ? /^\/en(\/|$)/.test(p) : !/^\/en(\/|$)/.test(p); });
      return Promise.all(urls.map(function (u) {
        var path = new URL(u).pathname;
        return fetch(path).then(function (r) { return r.ok ? r.text() : ''; })
          .then(function (html) { return html ? parsePage(path, html) : null; })
          .catch(function () { return null; });
      }));
    }).then(function (pages) {
      pages = pages.filter(Boolean);
      dedupe(pages);
      pages.push(LITTLE);
      try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), pages: pages })); } catch (e) {}
      DOCS = toDocs(pages);
      return DOCS;
    }).catch(function () { building = null; DOCS = toDocs([LITTLE]); return DOCS; });
    return building;
  }

  function parsePage(path, html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var title = clean((doc.title || '').split(/\s[|·–—]\s/)[0]) || path;
    if (path === '/' || path === '/en' || path === '/en/') title = T.home;
    doc.querySelectorAll('br').forEach(function (b) { b.replaceWith(' '); });
    doc.querySelectorAll('header,footer,aside,script,style,noscript,form,nav,svg,template,iframe,.pj,.zapis-bar,.related-links,.meet,#meet-panel,[class*="form-"],[class*="meet"],.fq-list__filters,.flow-search')
      .forEach(function (el) { el.remove(); });
    var body = doc.body;
    if (!body) return null;
    var secs = [], cur = { h: title, id: '', t: [] };
    function flush() { if (cur.t.length) secs.push({ h: cur.h, id: cur.id, t: clean(cur.t.join(' ')).slice(0, 1500) }); }
    var INLINE_PARENT = 'p,li,dd,dt,td,summary,h1,h2,h3,h4,figcaption,blockquote';
    body.querySelectorAll('h1,h2,h3,h4,summary,p,li,dd,dt,td,div,span,small,b,strong,figcaption,blockquote').forEach(function (el) {
      if (/^(H[1-4]|SUMMARY)$/.test(el.tagName)) {
        if (el.parentElement && el.parentElement.closest('h1,h2,h3,h4,summary')) return;
        flush();
        var a = el.closest('[id]');
        cur = { h: clean(el.textContent), id: a && a !== body ? a.id : '', t: [] };
        return;
      }
      if (/^(DIV|SPAN|SMALL|B|STRONG)$/.test(el.tagName) && el.querySelector('p,li,div,h1,h2,h3,h4,summary')) return;
      if (el.parentElement && el.parentElement.closest(INLINE_PARENT)) return;
      if (/^(SPAN|SMALL|B|STRONG)$/.test(el.tagName) && el.parentElement && el.parentElement.closest('span,small,b,strong')) return;
      var tx = clean(el.textContent);
      if (tx.length > 2) cur.t.push(tx);
    });
    flush();
    return { u: path, title: title, s: secs };
  }

  // Bloky, které se opakují na víc stránkách (patičky, CTA), z indexu pryč
  function dedupe(pages) {
    var cnt = {};
    pages.forEach(function (p) { p.s.forEach(function (s) { cnt[s.t] = (cnt[s.t] || 0) + 1; }); });
    pages.forEach(function (p) {
      var seen = {};
      p.s = p.s.filter(function (s) { if (cnt[s.t] > 3 || seen[s.t]) return false; seen[s.t] = 1; return true; });
    });
  }

  function toDocs(pages) {
    var out = [];
    pages.forEach(function (p) {
      p.s.forEach(function (s) {
        out.push({ u: p.u, pg: p.title, h: s.h, id: s.id, t: s.t, nh: norm(s.h), nt: norm(s.t), np: norm(p.title) });
      });
    });
    return out;
  }

  // ───── 3) Hledání
  function terms(q) {
    var base = norm(q).split(/[^a-z0-9:-]+/).filter(function (w) { return w.length > 1; });
    var kept = base.filter(function (w) { return !STOP[w]; });
    if (kept.length) base = kept;
    return base.map(function (w) {
      var alts = (SYN[w] || SYN[stem(w)] || []).map(function (a) { return stem(norm(a)); });
      return { w: stem(w), alts: alts };
    });
  }

  function search(q) {
    var TT = terms(q), hits = [];
    if (!TT.length || !DOCS) return { list: [], T: TT };
    DOCS.forEach(function (d) {
      var score = 0;
      for (var i = 0; i < TT.length; i++) {
        var opts = [TT[i].w].concat(TT[i].alts), best = 0;
        opts.forEach(function (o, j) {
          var m = j === 0 ? 1 : 0.6, s = 0;
          if (d.nh.indexOf(o) >= 0) s += 10 * m;
          if (d.np.indexOf(o) >= 0) s += 3 * m;
          var c = d.nt.split(o).length - 1;
          if (c) s += Math.min(c, 4) * 2 * m;
          if (s > best) best = s;
        });
        if (!best) return;
        score += best;
      }
      hits.push({ d: d, score: score });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    var per = {}, out = [];
    for (var k = 0; k < hits.length && out.length < 12; k++) {
      var u = hits[k].d.u;
      per[u] = (per[u] || 0) + 1;
      if (per[u] <= 2) out.push(hits[k]);
    }
    return { list: out, T: TT };
  }

  function hl(s, TT) {
    var ns = norm(s), marks = [];
    TT.forEach(function (t) {
      [t.w].concat(t.alts).forEach(function (o) {
        if (o.length < 2) return;
        var i = 0;
        while ((i = ns.indexOf(o, i)) >= 0) {
          var e = i + o.length;
          while (e < ns.length && /[a-z0-9]/.test(ns[e])) e++;
          marks.push([i, e]); i = e;
        }
      });
    });
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', last = 0;
    marks.forEach(function (m) {
      if (m[0] < last) return;
      out += esc(s.slice(last, m[0])) + '<mark>' + esc(s.slice(m[0], m[1])) + '</mark>';
      last = m[1];
    });
    return out + esc(s.slice(last));
  }

  function snippet(d, TT) {
    var pos = -1;
    TT.forEach(function (t) { [t.w].concat(t.alts).forEach(function (o) { var i = d.nt.indexOf(o); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }); });
    var a = Math.max(0, pos - 70), b = Math.min(d.t.length, a + 220);
    return hl((a > 0 ? '…' : '') + d.t.slice(a, b) + (b < d.t.length ? '…' : ''), TT);
  }

  // Odkaz rovnou na místo na stránce: kotva + zvýraznění nadpisu (text fragment)
  function link(d) {
    if (/^https?:/.test(d.u)) return d.u;
    var frag = '';
    if (d.h && d.h !== d.pg) {
      var words = d.h.split(/[.!?→]/)[0].trim().split(/\s+/).slice(0, 6).join(' ');
      if (words) frag = ':~:text=' + encodeURIComponent(words).replace(/-/g, '%2D');
    }
    if (d.id) return d.u + '#' + d.id + frag;
    return d.u + (frag ? '#' + frag : '');
  }

  // ───── 4) Okno
  var ov, q, res, cnt, sel = 0, lastTerm = '';
  function buildOverlay() {
    ov = document.createElement('div');
    ov.className = 'flow-search';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', T.btn);
    ov.innerHTML =
      '<div class="flow-search__box">' +
        '<div class="flow-search__top">' + ICON +
          '<input class="flow-search__input" type="search" autocomplete="off" enterkeyhint="search" placeholder="' + esc(T.ph) + '">' +
          '<button class="flow-search__close" type="button" aria-label="' + esc(T.close) + '">Esc</button>' +
        '</div>' +
        '<div class="flow-search__res" aria-live="polite"></div>' +
        '<div class="flow-search__foot"><span>' + esc(T.foot) + '</span><span class="flow-search__cnt"></span></div>' +
      '</div>';
    document.body.appendChild(ov);
    q = ov.querySelector('.flow-search__input');
    res = ov.querySelector('.flow-search__res');
    cnt = ov.querySelector('.flow-search__cnt');
    ov.querySelector('.flow-search__close').addEventListener('click', close);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) close();
      var c = e.target.closest('[data-q]');
      if (c) { q.value = c.getAttribute('data-q'); render(); q.focus(); }
      var h = e.target.closest('.flow-search__hit');
      if (h) track(q.value);
    });
    q.addEventListener('input', render);
  }

  function render() {
    var v = q.value.trim();
    if (!v) {
      cnt.textContent = '';
      res.innerHTML = '<div class="flow-search__empty"><b>' + esc(T.sugg) + '</b><div class="flow-search__chips">' +
        T.chips.map(function (c) { return '<button type="button" class="flow-search__chip" data-q="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') +
        '</div></div>';
      return;
    }
    if (!DOCS) {
      res.innerHTML = '<div class="flow-search__empty">' + esc(T.loading) + '</div>';
      buildIndex().then(function () { if (ov.classList.contains('is-on')) render(); });
      return;
    }
    var r = search(v), L = r.list;
    cnt.textContent = L.length ? L.length + ' ' + T.results : '';
    if (!L.length) {
      res.innerHTML = '<div class="flow-search__empty"><b>' + esc(T.none) + ' „' + esc(v) + '“.</b>' + esc(T.noneTip) + '</div>';
      return;
    }
    sel = 0;
    res.innerHTML = L.map(function (h, i) {
      var ext = /^https?:/.test(h.d.u);
      return '<a class="flow-search__hit' + (i === 0 ? ' is-sel' : '') + '" href="' + esc(link(h.d)) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' +
        '<span class="flow-search__pg">' + esc(h.d.pg) + '</span>' +
        '<span class="flow-search__h"><span>' + hl(h.d.h, r.T) + '</span><span aria-hidden="true">' + (ext ? '↗' : '→') + '</span></span>' +
        '<span class="flow-search__t">' + snippet(h.d, r.T) + '</span></a>';
    }).join('');
  }

  // Co rodiče hledají → GA4 (event "search"), ať víme, co na webu chybí
  function track(term) {
    term = (term || '').trim();
    if (term.length < 3 || term === lastTerm) return;
    lastTerm = term;
    if (window.dataLayer) window.dataLayer.push({ event: 'search', search_term: term, search_lang: EN ? 'en' : 'cs' });
  }

  var lastFocus = null;
  function open(v) {
    if (!ov) buildOverlay();
    lastFocus = document.activeElement;
    ov.classList.add('is-on');
    document.documentElement.classList.add('flow-search-open');
    q.value = v || '';
    render();
    buildIndex().then(function () { if (q.value.trim()) render(); });
    setTimeout(function () { q.focus(); }, 30);
  }
  function close() {
    if (!ov) return;
    track(q.value);
    ov.classList.remove('is-on');
    document.documentElement.classList.remove('flow-search-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('keydown', function (e) {
    var on = ov && ov.classList.contains('is-on');
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (!on && e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag) && !document.activeElement.isContentEditable) {
      e.preventDefault(); open('');
      return;
    }
    if (!on) return;
    var H = res.querySelectorAll('.flow-search__hit');
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && H.length) {
      e.preventDefault();
      H[sel].classList.remove('is-sel');
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + H.length) % H.length;
      H[sel].classList.add('is-sel');
      H[sel].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter' && H[sel] && document.activeElement === q) { e.preventDefault(); track(q.value); H[sel].click(); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectButtons);
  else injectButtons();
})();
