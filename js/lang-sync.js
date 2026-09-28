(function() {
  function applyStoredLang() {
    var lang = localStorage.getItem('lang') || 'es';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-es]').forEach(function(el) {
      el.innerHTML = lang === 'es' ? el.getAttribute('data-es') : el.getAttribute('data-en');
    });
    document.querySelectorAll('[data-ph-es]').forEach(function(el) {
      el.placeholder = lang === 'es' ? el.getAttribute('data-ph-es') : el.getAttribute('data-ph-en');
    });
    document.querySelectorAll('[data-aria-es]').forEach(function(el) {
      el.setAttribute('aria-label', lang === 'es' ? el.getAttribute('data-aria-es') : el.getAttribute('data-aria-en'));
    });
    var titleEl = document.querySelector('title[data-title-es]');
    if (titleEl) document.title = lang === 'es' ? titleEl.getAttribute('data-title-es') : titleEl.getAttribute('data-title-en');
    var metaDesc = document.querySelector('meta[name="description"][data-desc-es]');
    if (metaDesc) metaDesc.setAttribute('content', lang === 'es' ? metaDesc.getAttribute('data-desc-es') : metaDesc.getAttribute('data-desc-en'));
    var flagUrl = lang === 'es'
      ? 'https://res.cloudinary.com/dtw3qx4qq/image/upload/v1790536222/Flag_of_Puerto_Rico.svg_qz6k34.webp'
      : 'https://res.cloudinary.com/dtw3qx4qq/image/upload/v1790536295/Flag_of_the_United_States_jib8ej.svg';
    var flagAlt = lang === 'es' ? 'Español' : 'English';
    document.querySelectorAll('.lang-flag').forEach(function(img) {
      img.src = flagUrl;
      img.alt = flagAlt;
    });
    var langLabelMenu = document.getElementById('langLabelMenu');
    if (langLabelMenu) langLabelMenu.textContent = flagAlt;
    if (window.Iconify) Iconify.scan();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }
  window.getLang = function() {
    return localStorage.getItem('lang') || 'es';
  };
  window.toggleLang = window.toggleLang || function() {
    var next = (localStorage.getItem('lang') || 'es') === 'es' ? 'en' : 'es';
    localStorage.setItem('lang', next);
    applyStoredLang();
  };
  window.setLang = window.setLang || function(lang) {
    localStorage.setItem('lang', lang);
    applyStoredLang();
  };
  window.applyStoredLang = applyStoredLang;
  window.addEventListener('storage', function(e) {
    if (e.key === 'lang') applyStoredLang();
    if (e.key === 'theme') applyStoredTheme();
  });

  function applyStoredTheme() {
    var lang = window.getLang();
    var t = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    var icon = t === 'dark' ? 'lucide:moon' : 'lucide:sun';
    document.querySelectorAll('.theme-icon').forEach(function(el) { el.setAttribute('data-icon', icon); });
    document.querySelectorAll('.theme-label').forEach(function(el) {
      el.textContent = t === 'dark' ? (lang === 'en' ? 'Dark' : 'Oscuro') : (lang === 'en' ? 'Light' : 'Claro');
    });
    if (window.Iconify) Iconify.scan();
  }
  window.toggleTheme = window.toggleTheme || function() {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyStoredTheme();
  };
  window.applyStoredTheme = applyStoredTheme;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { applyStoredLang(); applyStoredTheme(); });
  } else {
    applyStoredLang();
    applyStoredTheme();
  }
})();
