/**
 * Bandeau cookies + chargement AdSense après choix (personnalisé vs non personnalisé).
 * Consent Mode v2 via dataLayer (gtag) : défaut refusé, mise à jour après action utilisateur.
 */
(function () {
  var STORAGE_KEY = 'p2p_ad_consent';
  var BAR_ID = 'p2pConsentBar';

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  function notifyGameLayout() {
    if (typeof window.p2pNotifyGameLayout === 'function') window.p2pNotifyGameLayout();
  }

  function applyInsAttributes(npa) {
    var cfg = window.P2P_ADSENSE || {};
    var setup = document.getElementById('p2pAdSetupIns');
    var left = document.getElementById('p2pAdGameInsLeft');
    var right = document.getElementById('p2pAdGameInsRight');
    [setup, left, right].forEach(function (el) {
      if (!el) return;
      el.setAttribute('data-ad-client', cfg.client);
      if (el.id === 'p2pAdSetupIns') el.setAttribute('data-ad-slot', cfg.slotSetup);
      if (el.id === 'p2pAdGameInsLeft' || el.id === 'p2pAdGameInsRight')
        el.setAttribute('data-ad-slot', cfg.slotGameVertical);
      el.setAttribute('data-ad-format', 'auto');
      el.setAttribute('data-full-width-responsive', 'true');
      if (npa) el.setAttribute('data-npa', 'true');
      else el.removeAttribute('data-npa');
    });
  }

  function pushSetupOnly() {
    var ins = document.getElementById('p2pAdSetupIns');
    if (!ins || ins.getAttribute('data-p2p-filled')) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      ins.setAttribute('data-p2p-filled', '1');
    } catch (e) {}
  }

  function loadAdsScript(cb) {
    var existing = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );
    if (existing) {
      if (cb) setTimeout(cb, 0);
      return;
    }
    var s = document.createElement('script');
    s.async = true;
    s.src =
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
      encodeURIComponent(window.P2P_ADSENSE.client);
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-p2p-adsense', '1');
    s.onload = function () {
      if (cb) cb();
    };
    document.head.appendChild(s);
  }

  window.p2pApplyAdConsent = function (mode) {
    var personalized = mode === 'full';
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}

    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: personalized ? 'granted' : 'denied',
      ad_personalization: personalized ? 'granted' : 'denied',
      analytics_storage: 'denied'
    });

    var bar = document.getElementById(BAR_ID);
    if (bar) bar.setAttribute('hidden', '');

    if (!window.p2pAdsenseConfigured || !window.p2pAdsenseConfigured()) return;

    applyInsAttributes(!personalized);

    var wrapSetup = document.getElementById('p2pAdSetupWrap');
    if (wrapSetup) wrapSetup.removeAttribute('hidden');

    loadAdsScript(function () {
      requestAnimationFrame(function () {
        pushSetupOnly();
      });
    });
  };

  /** Après affichage du mode jeu : rails verticaux gauche/droite (masqués sur petit écran). */
  window.p2pTryFillGameAd = function () {
    if (!window.p2pAdsenseConfigured || !window.p2pAdsenseConfigured()) return;
    var consented = null;
    try {
      consented = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}
    if (consented !== 'full' && consented !== 'essential') return;

    var g = document.getElementById('game');
    var railL = document.getElementById('gameAdBarLeft');
    var railR = document.getElementById('gameAdBarRight');
    if (!g || !railL || !railR || g.style.display !== 'flex') return;
    if (typeof window.innerWidth === 'number' && window.innerWidth <= 720) return;

    var insL = document.getElementById('p2pAdGameInsLeft');
    var insR = document.getElementById('p2pAdGameInsRight');
    if (insL && insR && insL.getAttribute('data-p2p-filled') && insR.getAttribute('data-p2p-filled'))
      return;

    railL.removeAttribute('hidden');
    railR.removeAttribute('hidden');

    function pushGame() {
      ['p2pAdGameInsLeft', 'p2pAdGameInsRight'].forEach(function (id) {
        var ins = document.getElementById(id);
        if (!ins || ins.getAttribute('data-p2p-filled')) return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          ins.setAttribute('data-p2p-filled', '1');
        } catch (e) {}
      });
      notifyGameLayout();
      setTimeout(notifyGameLayout, 400);
    }

    loadAdsScript(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(pushGame);
      });
    });
  };

  function showBar() {
    var bar = document.getElementById(BAR_ID);
    if (bar) bar.removeAttribute('hidden');
  }

  function init() {
    var a = document.getElementById('p2pConsentAccept');
    var e = document.getElementById('p2pConsentEssential');
    if (a) a.addEventListener('click', function () { window.p2pApplyAdConsent('full'); });
    if (e) e.addEventListener('click', function () { window.p2pApplyAdConsent('essential'); });

    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    if (saved === 'full' || saved === 'essential') {
      window.p2pApplyAdConsent(saved);
      return;
    }
    showBar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
