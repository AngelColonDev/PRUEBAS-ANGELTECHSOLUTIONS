(function() {
  var KEYS = {
    grayscale: 'a11yGrayscale',
    contrast: 'a11yContrast',
    underline: 'a11yUnderline',
    readable: 'a11yReadable',
    fontScale: 'a11yFontScale'
  };
  var state = { grayscale: false, contrast: false, underline: false, readable: false, fontScale: 100 };

  function load() {
    try {
      state.grayscale = localStorage.getItem(KEYS.grayscale) === '1';
      state.contrast = localStorage.getItem(KEYS.contrast) === '1';
      state.underline = localStorage.getItem(KEYS.underline) === '1';
      state.readable = localStorage.getItem(KEYS.readable) === '1';
      state.fontScale = parseInt(localStorage.getItem(KEYS.fontScale), 10) || 100;
    } catch (e) {}
  }

  function save() {
    try {
      localStorage.setItem(KEYS.grayscale, state.grayscale ? '1' : '0');
      localStorage.setItem(KEYS.contrast, state.contrast ? '1' : '0');
      localStorage.setItem(KEYS.underline, state.underline ? '1' : '0');
      localStorage.setItem(KEYS.readable, state.readable ? '1' : '0');
      localStorage.setItem(KEYS.fontScale, String(state.fontScale));
    } catch (e) {}
  }

  function apply() {
    var html = document.documentElement;
    var filters = [];
    if (state.grayscale) filters.push('grayscale(1)');
    if (state.contrast) filters.push('contrast(1.3)');
    html.style.filter = filters.join(' ');
    html.classList.toggle('a11y-underline-links', state.underline);
    html.classList.toggle('a11y-readable-font', state.readable);
    html.style.fontSize = state.fontScale + '%';

    document.querySelectorAll('[data-a11y]').forEach(function(btn) {
      var key = btn.getAttribute('data-a11y');
      var isActive = (key === 'grayscale' && state.grayscale) ||
        (key === 'contrast' && state.contrast) ||
        (key === 'underline' && state.underline) ||
        (key === 'readable' && state.readable);
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  load();
  if (document.documentElement) {
    var filters = [];
    if (state.grayscale) filters.push('grayscale(1)');
    if (state.contrast) filters.push('contrast(1.3)');
    document.documentElement.style.filter = filters.join(' ');
    document.documentElement.classList.toggle('a11y-underline-links', state.underline);
    document.documentElement.classList.toggle('a11y-readable-font', state.readable);
    document.documentElement.style.fontSize = state.fontScale + '%';
  }

  function init() {
    apply();

    var toggleBtn = document.getElementById('a11yToggleBtn');
    var panel = document.getElementById('a11yPanel');
    var closeBtn = document.getElementById('a11yCloseBtn');
    if (!toggleBtn || !panel) return;

    function openPanel() {
      panel.classList.remove('hidden');
      toggleBtn.setAttribute('aria-expanded', 'true');
      if (window.Iconify) Iconify.scan(panel);
    }
    function closePanel() {
      panel.classList.add('hidden');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
    toggleBtn.addEventListener('click', function() {
      if (panel.classList.contains('hidden')) openPanel(); else closePanel();
    });
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    document.addEventListener('click', function(e) {
      if (panel.classList.contains('hidden')) return;
      if (!panel.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closePanel();
    });

    document.querySelectorAll('[data-a11y]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = btn.getAttribute('data-a11y');
        if (key === 'text-up') state.fontScale = Math.min(150, state.fontScale + 10);
        else if (key === 'text-down') state.fontScale = Math.max(85, state.fontScale - 10);
        else if (key === 'grayscale') state.grayscale = !state.grayscale;
        else if (key === 'contrast') state.contrast = !state.contrast;
        else if (key === 'underline') state.underline = !state.underline;
        else if (key === 'readable') state.readable = !state.readable;
        else if (key === 'reset') { state = { grayscale: false, contrast: false, underline: false, readable: false, fontScale: 100 }; }
        save();
        apply();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
