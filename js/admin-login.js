(window.__supabaseReady || Promise.resolve()).finally(function() {
  var ADMIN_SESSION_KEY = 'adminSessionUser';
  var ATTEMPTS_KEY = 'adminLoginAttempts';
  var LOCK_KEY = 'adminLoginLocked';
  var MAX_ATTEMPTS = 3;
  var panelUrl = 'admin.html';

  function isAuthenticated() {
    try {
      var isAuthed = sessionStorage.getItem('adminAuth') === '1';
      var rawUser = sessionStorage.getItem(ADMIN_SESSION_KEY);
      var user = rawUser ? JSON.parse(rawUser) : null;
      return !!(isAuthed && user && user.username);
    } catch (e) {
      return false;
    }
  }

  function persistSession(user) {
    sessionStorage.setItem('adminAuth', '1');
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user || {}));
  }

  function getAttempts() {
    try { return parseInt(localStorage.getItem(ATTEMPTS_KEY), 10) || 0; } catch (e) { return 0; }
  }

  function isLocked() {
    try { return localStorage.getItem(LOCK_KEY) === '1'; } catch (e) { return false; }
  }

  function showLockedScreen() {
    var loginCard = document.getElementById('adminLoginCard');
    var lockedCard = document.getElementById('loginLockedCard');
    if (loginCard) loginCard.classList.add('hidden');
    if (lockedCard) lockedCard.classList.remove('hidden');
  }

  if (isAuthenticated()) {
    window.location.replace(panelUrl);
    return;
  }

  if (isLocked()) {
    showLockedScreen();
    return;
  }

  var passInput = document.getElementById('loginPass');
  var toggleBtn = document.getElementById('togglePassBtn');
  var toggleIcon = document.getElementById('togglePassIcon');
  if (toggleBtn && passInput && toggleIcon) {
    toggleBtn.addEventListener('click', function() {
      var showing = passInput.type === 'text';
      passInput.type = showing ? 'password' : 'text';
      toggleIcon.setAttribute('data-icon', showing ? 'lucide:eye' : 'lucide:eye-off');
      toggleBtn.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
      if (window.Iconify) Iconify.scan(toggleBtn);
    });
  }

  document.getElementById('adminLoginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    var user = document.getElementById('loginUser').value.trim();
    var pass = document.getElementById('loginPass').value;
    var err = document.getElementById('loginErr');
    var warn = document.getElementById('loginAttemptsWarn');
    var btn = document.getElementById('loginBtn');
    err.classList.add('hidden');
    warn.classList.add('hidden');
    btn.disabled = true;
    var originalText = btn.innerHTML;
    btn.innerHTML = 'Entrando...';

    function registerFailedAttempt(message) {
      var attempts = getAttempts() + 1;
      try { localStorage.setItem(ATTEMPTS_KEY, String(attempts)); } catch (e) {}
      if (attempts >= MAX_ATTEMPTS) {
        try { localStorage.setItem(LOCK_KEY, '1'); } catch (e) {}
        showLockedScreen();
        return;
      }
      err.textContent = message;
      err.classList.remove('hidden');
      var remaining = MAX_ATTEMPTS - attempts;
      warn.textContent = remaining === 1
        ? 'Te queda 1 intento antes de que se bloquee el acceso.'
        : 'Te quedan ' + remaining + ' intentos antes de que se bloquee el acceso.';
      warn.classList.remove('hidden');
    }

    try {
      if (typeof window.supabaseRestRequest !== 'function') {
        throw new Error('Supabase no está disponible');
      }

      var data = await window.supabaseRestRequest('rpc/admin_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_username: user, p_password: pass })
      });

      if (data && data.success && data.user) {
        try { localStorage.removeItem(ATTEMPTS_KEY); localStorage.removeItem(LOCK_KEY); } catch (e) {}
        persistSession(data.user);
        window.location.replace(panelUrl);
        return;
      }

      registerFailedAttempt('Usuario o contraseña incorrectos.');
    } catch (e) {
      console.warn('admin_login RPC error', e);
      err.textContent = 'No se pudo conectar. Intenta de nuevo en unos minutos.';
      err.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
});
