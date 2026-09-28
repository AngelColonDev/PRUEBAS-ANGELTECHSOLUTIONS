/* ============================================================
   SOPORTE TÉCNICO — íconos grandes que llevan directo al contenido.
   Registro de apps: SoporteTecnico.registerApp({id,name,icon,
   permission,render,afterRender}) sin tocar este archivo.
   ============================================================ */
(function () {
  var apps = [];
  var iconsEl, contentEl, contentBodyEl, headerEl, backBtn;

  function escST(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getCurrentUser() {
    return window.__STCurrentUser || null;
  }

  function hasPermission(app) {
    if (!app.permission) return true;
    var user = getCurrentUser();
    if (!user) return true;
    if (user.role === 'superadmin') return true;
    return Array.isArray(user.perms) && user.perms.indexOf(app.permission) !== -1;
  }

  function registerApp(app) {
    if (!app || !app.id) return;
    apps = apps.filter(function (a) { return a.id !== app.id; });
    apps.push(app);
    if (iconsEl) renderIcons();
  }

  function toast(message, type) {
    var container = document.getElementById('adminToastContainer');
    if (!container) return;
    var el = document.createElement('div');
    el.className = 'admin-toast ' + (type === 'error' ? 'error' : 'success');
    var icon = type === 'error' ? 'lucide:x-circle' : 'lucide:check-circle';
    el.innerHTML = '<span class="iconify" data-icon="' + icon + '" data-width="16"></span><span>' + escST(message) + '</span>';
    container.appendChild(el);
    if (window.Iconify) Iconify.scan(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 250);
    }, 3200);
  }

  function renderIcons() {
    if (!iconsEl) return;
    var visible = apps.filter(hasPermission);
    iconsEl.innerHTML = visible.map(function (app) {
      return '<button type="button" class="st-icon" data-st-app="' + app.id + '" aria-label="Entrar a ' + escST(app.name) + '">' +
        '<span class="st-icon-glyph"><span class="iconify" data-icon="' + app.icon + '" data-width="26" style="color:#f87171" aria-hidden="true"></span></span>' +
        '<span class="st-icon-label">' + escST(app.name) + '</span></button>';
    }).join('');
    iconsEl.querySelectorAll('[data-st-app]').forEach(function (btn) {
      btn.addEventListener('click', function () { openApp(btn.getAttribute('data-st-app')); });
    });
    if (window.Iconify) Iconify.scan(iconsEl);
  }

  function openApp(appId) {
    var app = apps.find(function (a) { return a.id === appId; });
    if (!app) return;
    iconsEl.classList.add('hidden');
    if (headerEl) headerEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
    try {
      contentBodyEl.innerHTML = app.render ? app.render({ toast: toast, escST: escST }) : '<p class="text-sm text-slate-500">Esta app no tiene contenido.</p>';
    } catch (e) {
      contentBodyEl.innerHTML = '<p class="text-sm text-red-400">Error al cargar esta sección.</p>';
      console.error('[SoporteTecnico]', appId, e);
    }
    if (app.afterRender) { try { app.afterRender(contentBodyEl, { toast: toast }); } catch (e) {} }
    if (window.Iconify) Iconify.scan(contentBodyEl);
    contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeApp() {
    contentEl.classList.add('hidden');
    iconsEl.classList.remove('hidden');
    if (headerEl) headerEl.classList.remove('hidden');
  }

  var initialized = false;
  function init() {
    iconsEl = document.getElementById('stIcons');
    if (!iconsEl) return;
    contentEl = document.getElementById('stContent');
    contentBodyEl = document.getElementById('stContentBody');
    headerEl = document.getElementById('stHeader');
    backBtn = document.getElementById('stBackBtn');

    renderIcons();
    contentEl.classList.add('hidden');
    iconsEl.classList.remove('hidden');
    if (headerEl) headerEl.classList.remove('hidden');

    if (initialized) return;
    initialized = true;
    if (backBtn) backBtn.addEventListener('click', closeApp);
  }

  window.SoporteTecnico = {
    apps: apps,
    registerApp: registerApp,
    openApp: openApp,
    init: init,
    toast: toast
  };

  // ---------- Apps incluidas ----------
  registerApp({
    id: 'diagnostico',
    name: 'Diagnóstico Rápido',
    icon: 'lucide:stethoscope',
    render: function () {
      return '' +
        '<div class="st-app-section">' +
          '<p class="text-sm font-semibold text-white mb-1">Conexión con la base de datos</p>' +
          '<p class="text-xs text-slate-500 mb-2" id="stDiagConnStatus">Sin probar todavía</p>' +
          '<button type="button" class="btn btn-outline btn-sm" id="stDiagTestBtn"><span class="iconify" data-icon="lucide:radio" data-width="13"></span>Probar conexión</button>' +
        '</div>' +
        '<div class="st-app-section">' +
          '<p class="text-sm font-semibold text-white mb-1">Sincronización</p>' +
          '<p class="text-xs text-slate-500 mb-2" id="stDiagSyncStatus">El panel se actualiza solo cada 15 segundos.</p>' +
          '<button type="button" class="btn btn-primary btn-sm" id="stDiagSyncBtn"><span class="iconify" data-icon="lucide:zap" data-width="13"></span>Sincronizar ahora</button>' +
        '</div>' +
        '<div class="st-app-section">' +
          '<p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Problemas comunes</p>' +
          '<details class="card support-card mb-2"><summary><div class="support-icon" style="background:rgba(251,191,36,.1)"><span class="iconify" data-icon="lucide:star" data-width="20" style="color:#fbbf24"></span></div><p class="text-sm font-semibold text-white mt-2">Las reseñas no aparecen en el sitio</p><span class="iconify support-chevron" data-icon="lucide:chevron-down" data-width="15"></span></summary><div class="support-body"><p>Ve a <strong>Reseñas</strong> y presiona <strong>Aprobar</strong>. Si el cliente marcó "No autorizo", nunca se publica — es intencional.</p></div></details>' +
          '<details class="card support-card mb-2"><summary><div class="support-icon" style="background:rgba(59,130,246,.1)"><span class="iconify" data-icon="lucide:package" data-width="20" style="color:#60a5fa"></span></div><p class="text-sm font-semibold text-white mt-2">Los productos no se ven</p><span class="iconify support-chevron" data-icon="lucide:chevron-down" data-width="15"></span></summary><div class="support-body"><p>Confirma los datos en <strong>Productos</strong>, sincroniza y revisa <a href="productos.html" class="text-red-400">la tienda</a>.</p></div></details>' +
          '<details class="card support-card mb-2"><summary><div class="support-icon" style="background:rgba(239,68,68,.1)"><span class="iconify" data-icon="lucide:key-round" data-width="20" style="color:#f87171"></span></div><p class="text-sm font-semibold text-white mt-2">Olvidé mi contraseña</p><span class="iconify support-chevron" data-icon="lucide:chevron-down" data-width="15"></span></summary><div class="support-body"><p>Corre <strong>crear-admin.sql</strong> en el SQL Editor de Supabase con una contraseña nueva.</p></div></details>' +
          '<details class="card support-card"><summary><div class="support-icon" style="background:rgba(236,72,153,.1)"><span class="iconify" data-icon="lucide:refresh-ccw-dot" data-width="20" style="color:#f472b6"></span></div><p class="text-sm font-semibold text-white mt-2">El sitio se ve desactualizado</p><span class="iconify support-chevron" data-icon="lucide:chevron-down" data-width="15"></span></summary><div class="support-body"><p>Presiona <strong>Ctrl + Shift + R</strong> (Cmd + Shift + R en Mac) para recargar sin caché.</p></div></details>' +
        '</div>';
    },
    afterRender: function (body, ctx) {
      var connEl = body.querySelector('#stDiagConnStatus');
      var testBtn = body.querySelector('#stDiagTestBtn');
      var syncEl = body.querySelector('#stDiagSyncStatus');
      var syncBtn = body.querySelector('#stDiagSyncBtn');
      if (testBtn) testBtn.addEventListener('click', async function () {
        connEl.textContent = 'Probando conexión...';
        try {
          if (!window.supabaseRestRequest) throw new Error('no disponible');
          await window.supabaseRestRequest('site_metrics?select=metric_key&limit=1');
          connEl.textContent = '✅ Conectado — ' + new Date().toLocaleTimeString('es-PR');
          connEl.style.color = '#10b981';
        } catch (e) {
          connEl.textContent = '❌ Error de conexión: ' + (e && e.message ? e.message : 'sin respuesta');
          connEl.style.color = '#f87171';
        }
      });
      if (syncBtn) syncBtn.addEventListener('click', function () {
        syncEl.textContent = 'Sincronizando...';
        if (window.renderKPIs) window.renderKPIs();
        if (window.initCharts) window.initCharts();
        setTimeout(function () {
          syncEl.textContent = 'Última sincronización: ' + new Date().toLocaleTimeString('es-PR');
          ctx.toast('Datos sincronizados correctamente.', 'success');
        }, 500);
      });
    }
  });

  registerApp({
    id: 'contactar-soporte',
    name: 'Contactar Soporte',
    icon: 'lucide:life-buoy',
    render: function () {
      return '<div class="text-center">' +
        '<div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3"><span class="iconify text-red-400" data-icon="lucide:life-buoy" data-width="22"></span></div>' +
        '<p class="text-sm font-semibold text-white mb-1">¿Necesitas ayuda?</p>' +
        '<p class="text-xs text-slate-500 mb-4">Escríbenos directamente y te ayudamos lo antes posible.</p>' +
        '<a href="mailto:soporte-tecnico@angeltechsolutions.dev?subject=Problema%20en%20el%20panel%20de%20administraci%C3%B3n" class="btn btn-primary btn-sm"><span class="iconify" data-icon="lucide:send" data-width="13"></span>Enviar correo</a>' +
        '</div>';
    }
  });
})();
