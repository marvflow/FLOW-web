/* ============================================================
   FLOW Cookie Consent — GDPR / ePrivacy compliant
   Vanilla JS, ~5 KB, no dependencies.
   Implements Google Consent Mode v2 + Meta Pixel consent gating.

   Categories:
     - necessary  (always granted, required for site to work)
     - analytics  (GA4 — measure traffic, behavior)
     - marketing  (Meta Pixel, ad targeting)

   Storage: localStorage key "flow-consent-v1"
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'flow-consent-v1';
  var STORAGE_VERSION = 1;
  var FB_PIXEL_ID = '1250403810500269';

  // ---------- texts (CS) ----------
  var T = {
    bannerTitle: 'Tato stránka používá cookies 🍪',
    bannerBody:
      'Cookies používáme pro fungování webu, měření návštěvnosti a marketingové účely. ' +
      'Kliknutím na <strong>Přijmout vše</strong> souhlasíte s jejich používáním. ' +
      'Můžete také <strong>nastavit</strong>, které kategorie povolíte, nebo vše odmítnout.',
    btnAcceptAll: 'Přijmout vše',
    btnRejectAll: 'Odmítnout vše',
    btnSettings: 'Nastavení',
    modalTitle: 'Nastavení cookies',
    modalIntro:
      'Spravujte své preference pro jednotlivé kategorie cookies. ' +
      'Nezbytné cookies jsou potřeba pro fungování webu a nelze je vypnout.',
    catNecessary: 'Nezbytné',
    catNecessaryDesc: 'Cookies potřebné pro základní fungování webu (CMS, formuláře). Nelze vypnout.',
    catAnalytics: 'Analytické',
    catAnalyticsDesc: 'Google Analytics 4 — anonymizované statistiky návštěvnosti a chování.',
    catMarketing: 'Marketingové',
    catMarketingDesc: 'Meta Pixel (Facebook), Google Ads — měření efektivity reklam, remarketing.',
    btnSavePrefs: 'Uložit volby',
    btnAcceptAllModal: 'Přijmout vše',
    btnRejectAllModal: 'Odmítnout vše',
    footerLink: 'Nastavení cookies',
    learnMore: 'Více v',
    learnMoreLink: 'zásadách ochrany osobních údajů',
    learnMoreHref: 'gdpr.html'
  };

  // EN texts (auto-switch by <html lang>)
  if (document.documentElement.lang === 'en') {
    T = {
      bannerTitle: 'This site uses cookies 🍪',
      bannerBody:
        'We use cookies for site functionality, traffic measurement and marketing. ' +
        'Click <strong>Accept all</strong> to agree, customise via <strong>Settings</strong>, or reject all.',
      btnAcceptAll: 'Accept all',
      btnRejectAll: 'Reject all',
      btnSettings: 'Settings',
      modalTitle: 'Cookie settings',
      modalIntro:
        'Manage your preferences for each cookie category. ' +
        'Necessary cookies are required and cannot be disabled.',
      catNecessary: 'Necessary',
      catNecessaryDesc: 'Cookies required for the basic functioning of the site (CMS, forms). Cannot be turned off.',
      catAnalytics: 'Analytics',
      catAnalyticsDesc: 'Google Analytics 4 — anonymised traffic and behaviour stats.',
      catMarketing: 'Marketing',
      catMarketingDesc: 'Meta Pixel (Facebook), Google Ads — ad effectiveness, remarketing.',
      btnSavePrefs: 'Save preferences',
      btnAcceptAllModal: 'Accept all',
      btnRejectAllModal: 'Reject all',
      footerLink: 'Cookie settings',
      learnMore: 'More in',
      learnMoreLink: 'privacy policy',
      learnMoreHref: 'gdpr.html'
    };
  }

  // Adjust gdpr.html link based on current path depth (en/, blog-post/, pro-zajemce/)
  var pathDepth = (window.location.pathname.match(/\//g) || []).length - 1;
  var gdprHref = T.learnMoreHref;
  if (pathDepth > 0) {
    // Same lang folder: ../gdpr.html for subdirs
    var depth = window.location.pathname.replace(/[^\/]+$/, '').split('/').filter(Boolean).length;
    gdprHref = '../'.repeat(depth) + (document.documentElement.lang === 'en' ? 'en/gdpr.html' : 'gdpr.html');
    // But if we're already in en/, simpler:
    if (document.documentElement.lang === 'en' && window.location.pathname.indexOf('/en/') === 0) {
      var enDepth = window.location.pathname.replace(/^\/en\//, '').replace(/[^\/]+$/, '').split('/').filter(Boolean).length;
      gdprHref = '../'.repeat(enDepth) + 'gdpr.html';
    } else if (document.documentElement.lang !== 'en') {
      gdprHref = '../'.repeat(depth) + 'gdpr.html';
    }
  }

  // ---------- consent state ----------
  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data.v !== STORAGE_VERSION) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(consent) {
    var data = {
      v: STORAGE_VERSION,
      ts: new Date().toISOString(),
      necessary: true,
      analytics: !!consent.analytics,
      marketing: !!consent.marketing
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
    applyConsent(data);
  }

  function applyConsent(consent) {
    // 1) Google Consent Mode v2 — update
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('consent', 'update', {
      'ad_storage': consent.marketing ? 'granted' : 'denied',
      'ad_user_data': consent.marketing ? 'granted' : 'denied',
      'ad_personalization': consent.marketing ? 'granted' : 'denied',
      'analytics_storage': consent.analytics ? 'granted' : 'denied'
    });

    // 2) Meta Pixel consent
    if (typeof window.fbq === 'function') {
      if (consent.marketing) {
        window.fbq('consent', 'grant');
        // If first time granting after page load, fire PageView (otherwise already fired by GTM tag)
        if (!window.__flowFbPvFired) {
          window.fbq('track', 'PageView');
          window.__flowFbPvFired = true;
        }
      } else {
        window.fbq('consent', 'revoke');
      }
    }

    // 3) dataLayer event for GTM custom triggers
    window.dataLayer.push({
      event: 'flow_consent_update',
      consent_analytics: consent.analytics,
      consent_marketing: consent.marketing
    });
  }

  // ---------- UI ----------
  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'flow-cmp-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', T.bannerTitle);
    el.innerHTML =
      '<div class="flow-cmp-banner__inner">' +
        '<div class="flow-cmp-banner__text">' +
          '<h3 class="flow-cmp-banner__title">' + T.bannerTitle + '</h3>' +
          '<p class="flow-cmp-banner__body">' + T.bannerBody + ' ' +
            T.learnMore + ' <a href="' + gdprHref + '" class="flow-cmp-banner__link">' + T.learnMoreLink + '</a>.' +
          '</p>' +
        '</div>' +
        '<div class="flow-cmp-banner__actions">' +
          '<button type="button" class="flow-cmp-btn flow-cmp-btn--ghost" data-action="reject">' + T.btnRejectAll + '</button>' +
          '<button type="button" class="flow-cmp-btn flow-cmp-btn--ghost" data-action="settings">' + T.btnSettings + '</button>' +
          '<button type="button" class="flow-cmp-btn flow-cmp-btn--primary" data-action="accept">' + T.btnAcceptAll + '</button>' +
        '</div>' +
      '</div>';
    return el;
  }

  function buildModal() {
    var el = document.createElement('div');
    el.className = 'flow-cmp-modal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'flow-cmp-modal-title');
    var current = readConsent() || { analytics: false, marketing: false };
    el.innerHTML =
      '<div class="flow-cmp-modal__overlay" data-action="close"></div>' +
      '<div class="flow-cmp-modal__box">' +
        '<div class="flow-cmp-modal__head">' +
          '<h3 id="flow-cmp-modal-title" class="flow-cmp-modal__title">' + T.modalTitle + '</h3>' +
          '<button type="button" class="flow-cmp-modal__close" data-action="close" aria-label="Close">×</button>' +
        '</div>' +
        '<div class="flow-cmp-modal__body">' +
          '<p class="flow-cmp-modal__intro">' + T.modalIntro + '</p>' +
          '<div class="flow-cmp-cat">' +
            '<label class="flow-cmp-cat__head">' +
              '<input type="checkbox" checked disabled>' +
              '<span class="flow-cmp-cat__name">' + T.catNecessary + '</span>' +
              '<span class="flow-cmp-cat__lock" aria-hidden="true">🔒</span>' +
            '</label>' +
            '<p class="flow-cmp-cat__desc">' + T.catNecessaryDesc + '</p>' +
          '</div>' +
          '<div class="flow-cmp-cat">' +
            '<label class="flow-cmp-cat__head">' +
              '<input type="checkbox" data-cat="analytics"' + (current.analytics ? ' checked' : '') + '>' +
              '<span class="flow-cmp-cat__name">' + T.catAnalytics + '</span>' +
            '</label>' +
            '<p class="flow-cmp-cat__desc">' + T.catAnalyticsDesc + '</p>' +
          '</div>' +
          '<div class="flow-cmp-cat">' +
            '<label class="flow-cmp-cat__head">' +
              '<input type="checkbox" data-cat="marketing"' + (current.marketing ? ' checked' : '') + '>' +
              '<span class="flow-cmp-cat__name">' + T.catMarketing + '</span>' +
            '</label>' +
            '<p class="flow-cmp-cat__desc">' + T.catMarketingDesc + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="flow-cmp-modal__actions">' +
          '<button type="button" class="flow-cmp-btn flow-cmp-btn--ghost" data-action="reject-modal">' + T.btnRejectAllModal + '</button>' +
          '<button type="button" class="flow-cmp-btn flow-cmp-btn--ghost" data-action="accept-modal">' + T.btnAcceptAllModal + '</button>' +
          '<button type="button" class="flow-cmp-btn flow-cmp-btn--primary" data-action="save">' + T.btnSavePrefs + '</button>' +
        '</div>' +
      '</div>';
    return el;
  }

  function removeBanner() {
    var b = document.querySelector('.flow-cmp-banner');
    if (b) b.parentNode.removeChild(b);
  }
  function removeModal() {
    var m = document.querySelector('.flow-cmp-modal');
    if (m) m.parentNode.removeChild(m);
  }

  function showBanner() {
    if (document.querySelector('.flow-cmp-banner')) return;
    var el = buildBanner();
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-action');
      if (act === 'accept') {
        saveConsent({ analytics: true, marketing: true });
        removeBanner();
      } else if (act === 'reject') {
        saveConsent({ analytics: false, marketing: false });
        removeBanner();
      } else if (act === 'settings') {
        showModal();
      }
    });
  }

  function showModal() {
    if (document.querySelector('.flow-cmp-modal')) return;
    var el = buildModal();
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-action');
      if (act === 'close') {
        removeModal();
      } else if (act === 'save') {
        var analytics = !!el.querySelector('[data-cat="analytics"]').checked;
        var marketing = !!el.querySelector('[data-cat="marketing"]').checked;
        saveConsent({ analytics: analytics, marketing: marketing });
        removeModal();
        removeBanner();
      } else if (act === 'accept-modal') {
        saveConsent({ analytics: true, marketing: true });
        removeModal();
        removeBanner();
      } else if (act === 'reject-modal') {
        saveConsent({ analytics: false, marketing: false });
        removeModal();
        removeBanner();
      }
    });
    // ESC closes
    document.addEventListener('keydown', function escListener(ev) {
      if (ev.key === 'Escape') {
        removeModal();
        document.removeEventListener('keydown', escListener);
      }
    });
  }

  // ---------- public API (for footer "Cookie settings" link) ----------
  window.FlowCMP = {
    openSettings: function () { showModal(); },
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      showBanner();
    },
    getConsent: function () { return readConsent(); }
  };

  // ---------- init ----------
  function init() {
    var existing = readConsent();
    if (existing) {
      applyConsent(existing);
    } else {
      // Default state is already DENIED (set in inline GTM block).
      // Show banner so user can decide.
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
