(window.__supabaseReady || Promise.resolve()).finally(function(){
// ========== AUTH ==========
var ADMIN_SESSION_KEY = 'adminSessionUser';
var currentUser = null;

function getUsers(){ return JSON.parse(localStorage.getItem('adminUsers')||'[]'); }
function saveUsers(u){
  var sanitized = (u||[]).map(function(user){
    return {
      username: user.username || '',
      name: user.name || user.username || '',
      role: user.role || 'editor',
      perms: Array.isArray(user.perms) ? user.perms : []
    };
  });
  localStorage.setItem('adminUsers', JSON.stringify(sanitized));
}
function persistAdminSession(){ sessionStorage.setItem('adminAuth','1'); sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(currentUser||{})); }
function restoreAdminSession(){ try { var raw = sessionStorage.getItem(ADMIN_SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; } }
function sanitizeLegacyUserStore(){
  try {
    var users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    if(Array.isArray(users) && users.some(function(user){ return user && Object.prototype.hasOwnProperty.call(user, 'pass'); })){
      saveUsers(users);
    }
  } catch(e){}
}

async function doLogin(){
  var u = document.getElementById('loginUser').value.trim();
  var p = document.getElementById('loginPass').value;
  var err = document.getElementById('loginErr');
  var btn = document.querySelector('#loginScreen .btn.btn-primary');
  err.classList.add('hidden');
  if(btn){ btn.disabled=true; btn.dataset.originalText = btn.innerHTML; btn.innerHTML='Entrando...'; }
  try {
    if(typeof window.supabaseRestRequest !== 'function') throw new Error('Supabase no está disponible');
    var data = await window.supabaseRestRequest('rpc/admin_login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_username: u, p_password: p })
    });
    if(data && data.success && data.user){
      currentUser = data.user;
      startApp();
      return;
    }
    err.textContent = 'Usuario o contraseña incorrectos.';
    err.classList.remove('hidden');
  } catch(e){
    console.warn('admin_login RPC error', e);
    err.textContent = 'No se pudo conectar. Intenta de nuevo en unos minutos.';
    err.classList.remove('hidden');
  } finally {
    if(btn){ btn.disabled=false; btn.innerHTML = btn.dataset.originalText || 'Entrar'; }
  }
}

function doLogout(){
  currentUser=null;
  sessionStorage.removeItem('adminAuth');
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.replace('index.html');
}

function startApp(){
  persistAdminSession();
  sanitizeLegacyUserStore();
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminApp').classList.remove('hidden');
  window.__STCurrentUser = currentUser;
  document.getElementById('currentUserLabel').textContent = currentUser.name||currentUser.username;
  var initialEl = document.getElementById('currentUserInitial');
  if (initialEl) initialEl.textContent = (currentUser.name||currentUser.username||'A')[0].toUpperCase();
  // Aplicar permisos al sidebar
  document.querySelectorAll('#sidebarNav .nav-item').forEach(function(btn){
    var page = btn.getAttribute('data-page');
    var always = ['dashboard','searchconsole','soporte'];
    if(page && currentUser.perms && !currentUser.perms.includes(page) && !always.includes(page)){
      btn.style.display='none';
    }
  });
  // Inicializar gestión de horario
  try {
    var schedRaw = localStorage.getItem('SITE_SCHEDULE');
    if (schedRaw) {
      try {
        var sObj = JSON.parse(schedRaw);
        document.getElementById('adminScheduleDays').value = sObj.days || '';
        document.getElementById('adminScheduleStart').value = sObj.start || '';
        document.getElementById('adminScheduleEnd').value = sObj.end || '';
        if(document.getElementById('adminScheduleWarn')) document.getElementById('adminScheduleWarn').value = sObj.warnMin || 30;
        // Marcar checkboxes de días
        if(sObj.daysOfWeek && sObj.daysOfWeek.length){
          document.querySelectorAll('.sched-day').forEach(function(cb){ cb.checked = sObj.daysOfWeek.includes(parseInt(cb.value)); });
        }
      } catch(e){}
    }
    var saveSched = document.getElementById('saveScheduleBtn'); if (saveSched) saveSched.addEventListener('click', function(){
      var days = document.getElementById('adminScheduleDays').value.trim();
      var start = document.getElementById('adminScheduleStart').value;
      var end = document.getElementById('adminScheduleEnd').value;
      if(!days||!start||!end){ adminToast('Completa los días (texto), hora inicio y hora fin.', 'error'); return; }
      var daysOfWeek = [];
      document.querySelectorAll('.sched-day:checked').forEach(function(cb){ daysOfWeek.push(parseInt(cb.value)); });
      var warnMin = parseInt((document.getElementById('adminScheduleWarn')||{}).value||'30',10) || 30;
      var obj = { days: days, start: start, end: end, daysOfWeek: daysOfWeek, warnMin: warnMin };
      localStorage.setItem('SITE_SCHEDULE', JSON.stringify(obj));
      adminToast('Horario guardado.', 'success');
    });
    var clearSched = document.getElementById('clearScheduleBtn'); if (clearSched) clearSched.addEventListener('click', function(){
      if(!confirm('¿Borrar el horario público?')) return;
      localStorage.removeItem('SITE_SCHEDULE');
      document.getElementById('adminScheduleDays').value='';
      document.getElementById('adminScheduleStart').value='';
      document.getElementById('adminScheduleEnd').value='';
      document.querySelectorAll('.sched-day').forEach(function(cb){ cb.checked=false; });
      adminToast('Horario borrado.', 'success');
    });
  } catch(e){}
  // Actualizar badge de dispositivos pendientes al abrir admin
  try{ renderDispositivosBadge(); }catch(e){}

  goTo('dashboard');
  initCharts();
  renderAll();
  startAdminClock();
  startAutoRefresh();
}

// ========== RELOJ DEL HEADER ==========
function startAdminClock(){
  var dateEl = document.getElementById('adminClockDate');
  var timeEl = document.getElementById('adminClockTime');
  if (!dateEl || !timeEl) return;
  function tick(){
    var now = new Date();
    dateEl.textContent = now.toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long' });
    timeEl.textContent = now.toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

// ========== AUTO-REFRESH (cada 15 segundos) ==========
function startAutoRefresh(){
  setInterval(function(){
    if (document.hidden) return;
    renderKPIs();
    goTo(_currentAdminPage);
  }, 15000);
}

// ========== NAVIGATION ==========
var _currentAdminPage = 'dashboard';
async function goTo(page){
  _currentAdminPage = page;
  document.querySelectorAll('.section-page').forEach(function(s){ s.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  var el = document.getElementById('page-'+page);
  if(el) el.classList.add('active');
  var btn = document.querySelector('[data-page="'+page+'"]');
  if(btn) btn.classList.add('active');
  var titles={'dashboard':'Dashboard','solicitudes':'Solicitudes','resenas':'Reseñas','productos':'Productos','dispositivos':'Dispositivos en Venta','colaboradores':'Colaboradores','gastos':'Gastos','searchconsole':'Search Console','configuracion':'Configuración','usuarios':'Usuarios','soporte':'Soporte técnico'};
  document.getElementById('pageTitle').textContent = titles[page]||'';

  // Refrescar datos de Supabase antes de renderizar cada sección
  if (window.supabaseRestRequest && window.supabaseDirectSet) {
    try {
      if (page === 'solicitudes') {
        var rows = await window.supabaseRestRequest('contact_requests?select=*&order=created_at.asc');
        if (rows) window.supabaseDirectSet('messages', JSON.stringify(rows.map(function(m){ return {id:m.id,name:m.name,email:m.email,phone:m.phone,service:m.service,otro_service:m.other_service,device_type:m.device_type||'',device_model:m.device_model||'',message:m.message,status:m.status,date:m.created_at}; })));
      } else if (page === 'productos') {
        var prows = await window.supabaseRestRequest('products?select=*&order=sort_order.asc,id.asc');
        if (prows) {
          window.supabaseDirectSet('products', JSON.stringify(prows.map(function(p){ return {id:p.id,name:p.name,price:p.price_text,condition:p.condition,category:p.category,icon:p.icon,color:p.color,desc:p.description,images:[]}; })));
        }
      } else if (page === 'colaboradores') {
        var rows = await window.supabaseRestRequest('partners?select=*&order=sort_order.asc,id.asc');
        if (rows) window.supabaseDirectSet('partners', JSON.stringify(rows.map(function(p){ return {id:p.id,name:p.name,role:p.role,icon:p.icon,color:p.color,desc:p.description,url:p.url}; })));
      } else if (page === 'gastos') {
        var rows = await window.supabaseRestRequest('expenses?select=*&order=spent_on.asc,id.asc');
        if (rows) window.supabaseDirectSet('gastos', JSON.stringify(rows.map(function(g){ return {id:g.id,descripcion:g.description,monto:g.amount,categoria:g.category,fecha:g.spent_on}; })));
      }
    } catch(e) { console.warn('[goTo refresh]', page, e); }
  }

  if(page==='dashboard'){ initCharts(); gscLoadDash(); }
  if(page==='solicitudes') renderSolicitudes();
  if(page==='resenas') renderResenas();
  if(page==='productos') renderProductos();
  if(page==='dispositivos') renderDispositivos();
  if(page==='colaboradores') renderColaboradores();
  if(page==='gastos') renderGastos();
  if(page==='searchconsole') gscAutoLoad();
  if(page==='configuracion') renderConfig();
  if(page==='usuarios') renderUsuarios();
  if(page==='soporte' && window.SoporteTecnico) window.SoporteTecnico.init();
  document.getElementById('sidebar').classList.remove('open');
}

function renderAll(){
  renderKPIs();
}

// ========== NOTIFICACIONES (toast) ==========
function adminToast(message, type){
  var container = document.getElementById('adminToastContainer');
  if (!container) { if (type === 'error') alert(message); return; }
  var el = document.createElement('div');
  el.className = 'admin-toast ' + (type === 'error' ? 'error' : 'success');
  var icon = type === 'error' ? 'lucide:x-circle' : 'lucide:check-circle';
  el.innerHTML = '<span class="iconify" data-icon="' + icon + '" data-width="16"></span><span>' + escH(message) + '</span>';
  container.appendChild(el);
  if (window.Iconify) Iconify.scan(el);
  requestAnimationFrame(function(){ el.classList.add('show'); });
  setTimeout(function(){
    el.classList.remove('show');
    setTimeout(function(){ el.remove(); }, 250);
  }, 3500);
}

// ========== SOPORTE TÉCNICO ==========
async function testSupabaseConnection(){
  var el = document.getElementById('soporteConnStatus');
  if (!el) return;
  el.textContent = 'Probando conexión...';
  try {
    if (!window.supabaseRestRequest) throw new Error('Supabase no está disponible en esta página');
    await window.supabaseRestRequest('site_metrics?select=metric_key&limit=1');
    el.textContent = '✅ Conectado correctamente — ' + new Date().toLocaleTimeString('es-PR');
    el.style.color = '#10b981';
  } catch (e) {
    el.textContent = '❌ Error de conexión: ' + (e && e.message ? e.message : 'sin respuesta');
    el.style.color = '#f87171';
  }
}

function forceSyncNow(){
  var el = document.getElementById('soporteSyncStatus');
  if (el) el.textContent = 'Sincronizando...';
  renderKPIs();
  initCharts();
  goTo(_currentAdminPage === 'soporte' ? 'dashboard' : _currentAdminPage);
  setTimeout(function(){
    if (el) el.textContent = 'Última sincronización: ' + new Date().toLocaleTimeString('es-PR');
    adminToast('Datos sincronizados correctamente.', 'success');
  }, 600);
}

// ========== KPIs ==========
async function renderKPIs(){
  var msgs, reviews, products, gastos, views;
  try {
    if (!window.supabaseRestRequest) throw new Error('no supabase');
    var _r = await Promise.all([
      window.supabaseRestRequest('contact_requests?select=id,status'),
      window.supabaseRestRequest('reviews?select=id,status'),
      window.supabaseRestRequest('products?select=id'),
      window.supabaseRestRequest('expenses?select=amount'),
      window.supabaseRestRequest('site_metrics?metric_key=eq.pageViews&select=metric_value')
    ]);
    msgs     = _r[0] || [];
    reviews  = _r[1] || [];
    products = _r[2] || [];
    gastos   = _r[3] || [];
    views    = _r[4] && _r[4][0] ? Number(_r[4][0].metric_value) : parseInt(localStorage.getItem('pageViews')||'0');
  } catch(e) {
    msgs     = JSON.parse(localStorage.getItem('messages')||'[]');
    reviews  = JSON.parse(localStorage.getItem('reviews')||'[]');
    products = JSON.parse(localStorage.getItem('products')||'[]');
    gastos   = JSON.parse(localStorage.getItem('gastos')||'[]').map(function(g){ return {amount:g.monto}; });
    views    = parseInt(localStorage.getItem('pageViews')||'0');
  }

  // Si hay conexión activa con Search Console, usar clicks reales de Google
  var viewsLabel = 'Visitas totales';
  var viewsEditBtn = true;
  if(gscTokenValid()){
    try {
      var _gr = await gscQuery(Object.assign({}, gscDateRange(28), {dimensions:[], rowLimit:1}));
      var _gt = _gr.rows && _gr.rows[0] ? _gr.rows[0] : null;
      if(_gt !== null){ views = _gt.clicks; viewsLabel = 'Clicks Google (28d)'; viewsEditBtn = false; }
    } catch(e){}
  }

  var total_gastos = gastos.reduce(function(s,g){ return s+parseFloat(g.amount||g.monto||0); }, 0);
  var approved = reviews.filter(function(r){ return r.status==='aprobada'; }).length;
  var kpis = [
    {label:viewsLabel, value:views,                                 icon:'lucide:eye',     color:'#3b82f6',bg:'rgba(59,130,246,.1)'},
    {label:'Solicitudes',     value:msgs.length,                           icon:'lucide:inbox',   color:'#10b981',bg:'rgba(16,185,129,.1)'},
    {label:'Reseñas',         value:reviews.length+' / '+approved+' ap.', icon:'lucide:star',    color:'#fbbf24',bg:'rgba(245,158,11,.1)'},
    {label:'Productos',       value:products.length,                       icon:'lucide:package', color:'#a78bfa',bg:'rgba(139,92,246,.1)'},
    {label:'Gastos totales',  value:'$'+total_gastos.toFixed(2),           icon:'lucide:wallet',  color:'#f87171',bg:'rgba(239,68,68,.1)'}
  ];
  var g = document.getElementById('kpiGrid');
  g.innerHTML = kpis.map(function(k, idx){
    var editBtn = (idx===0 && viewsEditBtn) ? '<button onclick="editPageViews()" title="Corregir contador" style="font-size:10px;color:#475569;text-decoration:underline;background:none;border:none;cursor:pointer;padding:0;margin-top:2px">Corregir</button>' : '';
    return '<div class="stat-card"><div class="flex items-start justify-between mb-4"><div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:'+k.bg+'"><span class="iconify" data-icon="'+k.icon+'" data-width="18" style="color:'+k.color+'"></span></div></div><p class="text-2xl font-bold text-white mb-1">'+k.value+'</p><p class="text-xs text-slate-500">'+k.label+'</p>'+editBtn+'</div>';
  }).join('');
  if(window.Iconify) Iconify.scan(g);
}

async function editPageViews(){
  var current = parseInt(localStorage.getItem('pageViews')||'0');
  var val = prompt('Visitas actuales en Supabase: '+current+'\n\nEscribe el número correcto de visitas:', '0');
  if(val===null) return;
  val = parseInt(val);
  if(isNaN(val)||val<0){ adminToast('Número inválido.', 'error'); return; }
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    await window.supabaseRestRequest('site_metrics?on_conflict=metric_key', {
      method:'POST',
      headers:{'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify([{metric_key:'pageViews',metric_value:val,updated_at:new Date().toISOString()}])
    });
    if(window.supabaseDirectSet) window.supabaseDirectSet('pageViews', String(val));
    else localStorage.setItem('pageViews', String(val));
  } catch(e){ adminToast('Error al actualizar: '+e.message, 'error'); return; }
  renderKPIs();
  adminToast('Visitas actualizadas correctamente.', 'success');
}

// ========== CHARTS ==========
var _charts = {};
async function initCharts(){
  var msgs, reviews, gastos, views;
  try {
    if (!window.supabaseRestRequest) throw new Error('no supabase');
    var _r = await Promise.all([
      window.supabaseRestRequest('contact_requests?select=service,status,created_at&order=created_at.asc'),
      window.supabaseRestRequest('reviews?select=status,rating&order=id.desc'),
      window.supabaseRestRequest('expenses?select=amount,category&order=spent_on.asc'),
      window.supabaseRestRequest('site_metrics?metric_key=eq.pageViews&select=metric_value')
    ]);
    msgs    = (_r[0]||[]).map(function(m){ return {service:m.service,status:m.status,date:m.created_at}; });
    reviews = _r[1] || [];
    gastos  = (_r[2]||[]).map(function(g){ return {monto:g.amount,categoria:g.category}; });
    views   = _r[3] && _r[3][0] ? Number(_r[3][0].metric_value) : parseInt(localStorage.getItem('pageViews')||'0');
  } catch(e) {
    msgs    = JSON.parse(localStorage.getItem('messages')||'[]');
    reviews = JSON.parse(localStorage.getItem('reviews')||'[]');
    gastos  = JSON.parse(localStorage.getItem('gastos')||'[]');
    views   = parseInt(localStorage.getItem('pageViews')||'0');
  }
  Chart.defaults.color = '#64748b';
  Chart.defaults.borderColor = 'rgba(255,255,255,.06)';

  // --- BAR: servicios ---
  var svcCounts = {diseno:0,frontend:0,chatbot:0,producto:0,otro:0};
  msgs.forEach(function(m){ if(svcCounts[m.service]!==undefined) svcCounts[m.service]++; else svcCounts.otro++; });
  if(_charts.bar){ _charts.bar.destroy(); }
  var ctx1 = document.getElementById('chartBar');
  if(ctx1) _charts.bar = new Chart(ctx1,{type:'bar',data:{labels:['Diseño Web','Frontend','Chatbot IA','Producto','Otro'],datasets:[{data:[svcCounts.diseno,svcCounts.frontend,svcCounts.chatbot,svcCounts.producto,svcCounts.otro],backgroundColor:['rgba(239,68,68,.7)','rgba(59,130,246,.7)','rgba(139,92,246,.7)','rgba(16,185,129,.7)','rgba(245,158,11,.7)'],borderRadius:6,borderSkipped:false}]},options:{plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,ticks:{stepSize:1}}}}});

  // --- DONA: reseñas ---
  var aprobadas=reviews.filter(function(r){return r.status==='aprobada';}).length;
  var pendientes=reviews.filter(function(r){return !r.status||r.status==='pendiente';}).length;
  var rechazadas=reviews.filter(function(r){return r.status==='rechazada';}).length;
  document.getElementById('donaTotal').textContent=reviews.length;
  document.getElementById('donaAprobadas').textContent=aprobadas;
  document.getElementById('donaPendientes').textContent=pendientes;
  document.getElementById('donaRechazadas').textContent=rechazadas;
  if(_charts.dona){ _charts.dona.destroy(); }
  var ctx2 = document.getElementById('chartDona');
  if(ctx2) _charts.dona = new Chart(ctx2,{type:'doughnut',data:{labels:['Aprobadas','Pendientes','Rechazadas'],datasets:[{data:[aprobadas||1,pendientes,rechazadas],backgroundColor:['rgba(16,185,129,.8)','rgba(245,158,11,.8)','rgba(239,68,68,.8)'],borderWidth:0,hoverOffset:4}]},options:{cutout:'70%',plugins:{legend:{display:false}}}});

  // --- PIE: gastos por categoría ---
  var catTotals = {};
  gastos.forEach(function(g){ catTotals[g.categoria]=(catTotals[g.categoria]||0)+parseFloat(g.monto||0); });
  var catKeys = Object.keys(catTotals);
  var pieColors = ['rgba(239,68,68,.7)','rgba(59,130,246,.7)','rgba(16,185,129,.7)','rgba(245,158,11,.7)','rgba(139,92,246,.7)','rgba(236,72,153,.7)'];
  if(_charts.pie){ _charts.pie.destroy(); }
  var ctx6 = document.getElementById('chartPie');
  if(ctx6) _charts.pie = new Chart(ctx6,{type:'pie',data:{labels:catKeys.length?catKeys:['Sin gastos'],datasets:[{data:catKeys.length?catKeys.map(function(k){return catTotals[k];}):[1],backgroundColor:catKeys.length?pieColors.slice(0,catKeys.length):['rgba(100,116,139,.3)'],borderWidth:0}]},options:{plugins:{legend:{position:'bottom',labels:{color:'#64748b',font:{size:10},padding:8,boxWidth:10}}}}});
}

// ========== DISPOSITIVOS EN VENTA ==========
var _dispCache = [];
function renderDispositivosBadge(){
  var badge = document.getElementById('dispositivosBadge');
  if(!badge) return;
  window.supabaseRestRequest('device_listings?select=status')
    .then(function(rows){
      var pending = (rows||[]).filter(function(l){ return l.status==='pending'; }).length;
      badge.textContent=pending; badge.classList.toggle('hidden', pending===0);
    })
    .catch(function(){});
}
function renderDispositivos(){
  var el = document.getElementById('dispositivosList');
  if(!el) return;
  el.innerHTML = '<div class="card text-center py-12 text-slate-500 text-sm">Cargando...</div>';
  window.supabaseRestRequest('device_listings?select=*&order=created_at.desc,id.desc')
    .then(function(rows){
      _dispCache = (rows || []).map(function(r){ return {id:r.id,name:r.name,phone:r.phone,contact_method:r.contact_method,device_type:r.device_type,device_model:r.device_model,message:r.message,photos:r.photos||[],status:r.status,date:r.created_at}; });
      paintDispositivos();
    })
    .catch(function(e){
      el.innerHTML='<div class="card text-center py-12 text-red-500 text-sm">Error al cargar dispositivos: '+(e&&e.message?e.message:'sin conexión')+'</div>';
    });
}
function paintDispositivos(){
  var filterEl = document.getElementById('dispositivoFilter');
  var filter = filterEl ? filterEl.value : '';
  var filtered = filter ? _dispCache.filter(function(l){ return l.status===filter; }) : _dispCache;
  var el = document.getElementById('dispositivosList');
  if(!el) return;

  var badge = document.getElementById('dispositivosBadge');
  if(badge){
    var pending = _dispCache.filter(function(l){ return l.status==='pending'; }).length;
    badge.textContent=pending; badge.classList.toggle('hidden', pending===0);
  }

  if(!filtered.length){ el.innerHTML='<div class="card text-center py-12 text-slate-500 text-sm">No hay solicitudes'+(filter?' con ese estado':'')+'.</div>'; return; }

  var statusCfg = {
    pending:{cls:'badge-yellow',label:'Pendiente'},
    approved:{cls:'badge-green',label:'Aprobado'},
    rejected:{cls:'badge-red',label:'Rechazado'}
  };
  var contactLabels = {whatsapp:'WhatsApp',llamada:'Llamada',mensaje:'Mensaje de texto'};
  var deviceLabels = {iphone:'iPhone',android:'Android',ipad:'iPad/Tablet',macbook:'MacBook/Laptop',nintendo:'Nintendo',playstation:'PlayStation',xbox:'Xbox',smartwatch:'Smartwatch',otro_dispositivo:'Otro'};

  el.innerHTML = filtered.map(function(l){
    var st = statusCfg[l.status] || statusCfg.pending;
    var d = new Date(l.date);
    var dateStr = isNaN(d)?l.date:d.toLocaleDateString('es-PR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    var waLink = l.contact_method==='whatsapp' ? '<a href="https://wa.me/'+l.phone.replace(/[^+0-9]/g,'')+'" target="_self" rel="noopener" class="btn btn-primary btn-sm"><span class="iconify" data-icon="lucide:message-circle" data-width="13"></span>WhatsApp</a>' : '';
    var callLink = '<a href="tel:'+l.phone.replace(/[^+0-9]/g,'')+'" class="btn btn-outline btn-sm"><span class="iconify" data-icon="lucide:phone" data-width="13"></span>Llamar</a>';
    var approveBtn = l.status!=='approved' ? '<button onclick="updateDisp(\''+l.id+'\',\'approved\')" class="btn btn-primary btn-sm"><span class="iconify" data-icon="lucide:check" data-width="13"></span>Aprobar</button>' : '';
    var rejectBtn = l.status!=='rejected' ? '<button onclick="updateDisp(\''+l.id+'\',\'rejected\')" class="btn btn-outline btn-sm text-red-400 border-red-500/30 hover:bg-red-500/10"><span class="iconify" data-icon="lucide:x" data-width="13"></span>Rechazar</button>' : '';
    var deleteBtn = '<button onclick="deleteDisp(\''+l.id+'\')" class="btn btn-ghost btn-sm text-slate-500 hover:text-red-400"><span class="iconify" data-icon="lucide:trash-2" data-width="13"></span></button>';
    return '<div class="card">'
      +'<div class="flex flex-wrap items-start justify-between gap-3 mb-3">'
      +'<div class="flex items-center gap-3">'
      +'<div class="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0"><span class="iconify text-red-400" data-icon="lucide:smartphone" data-width="18"></span></div>'
      +'<div>'
      +'<p class="text-sm font-semibold text-white">'+escH(l.device_model||'Sin modelo')+'</p>'
      +'<p class="text-xs text-slate-500">'+(deviceLabels[l.device_type]||l.device_type||'Dispositivo')+'</p>'
      +'</div></div>'
      +'<span class="badge '+st.cls+'">'+st.label+'</span>'
      +'</div>'
      +'<div class="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-400 mb-3">'
      +'<div><span class="text-slate-600">Vendedor:</span> <span class="text-white font-medium">'+escH(l.name||'—')+'</span></div>'
      +'<div><span class="text-slate-600">Teléfono:</span> <span class="text-white font-medium">'+escH(l.phone||'—')+'</span></div>'
      +'<div><span class="text-slate-600">Contacto:</span> <span class="text-amber-400 font-medium">'+(contactLabels[l.contact_method]||l.contact_method||'—')+'</span></div>'
      +'<div><span class="text-slate-600">Fecha:</span> '+dateStr+'</div>'
      +(l.message?'<div class="col-span-2"><span class="text-slate-600">Nota:</span> '+escH(l.message)+'</div>':'')
      +'</div>'
      +(l.photos&&l.photos.length?'<div class="flex gap-2 flex-wrap mb-3">'+l.photos.map(function(src){ return '<img src="'+src+'" class="w-16 h-16 rounded-lg object-cover border border-white/10" loading="lazy">'; }).join('')+'</div>':'')
      +'<div class="flex flex-wrap gap-2 pt-3 border-t border-white/[0.05]">'
      +(l.contact_method==='whatsapp'?waLink:callLink)+(l.contact_method==='whatsapp'?callLink:'')
      +approveBtn+rejectBtn+deleteBtn
      +'</div></div>';
  }).join('');
  if(window.Iconify) Iconify.scan(el);
}

function updateDisp(id, newStatus){
  window.supabaseRestRequest('device_listings?id=eq.'+id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ status: newStatus })
  }).then(function(){ renderDispositivos(); adminToast('Estado del dispositivo actualizado.', 'success'); })
  .catch(function(e){ adminToast('Error al cambiar estado: '+(e&&e.message?e.message:'Verifica conexión y políticas RLS'), 'error'); });
}

function deleteDisp(id){
  if(!confirm('¿Eliminar esta solicitud de venta?')) return;
  window.supabaseRestRequest('device_listings?id=eq.'+id, { method: 'DELETE' })
    .then(function(){ renderDispositivos(); adminToast('Solicitud de venta eliminada.', 'success'); })
    .catch(function(e){ adminToast('Error al eliminar: '+(e&&e.message?e.message:'Verifica conexión y políticas RLS'), 'error'); });
}

function escH(str){ return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ========== SOLICITUDES ==========
var svcLabels = {diseno:'Diseño Web',frontend:'Programación Frontend',chatbot:'Agente IA / Chatbot',producto:'Producto',otro:'Otro'};
var _solicitudesCache = [];

async function renderSolicitudes(){
  var el = document.getElementById('solicitudesList');
  if(!el) return;
  el.innerHTML='<div class="card text-center py-6 text-slate-500 text-sm">Cargando...</div>';
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    _solicitudesCache = await window.supabaseRestRequest('contact_requests?select=*&order=created_at.desc,id.desc') || [];
  } catch(e) {
    _solicitudesCache = JSON.parse(localStorage.getItem('messages')||'[]').slice().reverse().map(function(m){ return Object.assign({},m,{created_at:m.date,other_service:m.otro_service,status:m.status||'pendiente'}); });
  }
  var filterEl = document.getElementById('solicitudFilter');
  var filter = filterEl ? filterEl.value : '';
  var filtered = filter ? _solicitudesCache.filter(function(m){ return (m.status||'pendiente')===filter; }) : _solicitudesCache;
  if(!filtered.length){ el.innerHTML='<div class="card text-center py-12 text-slate-500 text-sm">No hay solicitudes'+(filter?' con ese estado':'')+'.</div>'; return; }

  var statusCfg = {
    pendiente:   {cls:'badge-yellow', label:'Pendiente'},
    en_proceso:  {cls:'badge-blue',   label:'En proceso'},
    completada:  {cls:'badge-green',  label:'Completada'},
    rechazada:   {cls:'badge-red',    label:'Rechazada'}
  };

  el.innerHTML = filtered.map(function(m){
    var svc = svcLabels[m.service]||m.service||'—';
    if(m.service==='otro' && m.other_service) svc = 'Otro: '+m.other_service;
    var d = m.created_at ? new Date(m.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
    var status = m.status||'pendiente';
    var sc = statusCfg[status]||{cls:'badge-slate',label:status};
    var id = m.id;

    var btns = '';
    if(status!=='pendiente')   btns += '<button onclick="setSolicitudStatus('+id+',\'pendiente\')" class="btn btn-outline btn-sm"><span class="iconify" data-icon="lucide:clock" data-width="12"></span>Pendiente</button>';
    if(status!=='en_proceso')  btns += '<button onclick="setSolicitudStatus('+id+',\'en_proceso\')" class="btn btn-outline btn-sm" style="color:#60a5fa;border-color:rgba(59,130,246,.3)"><span class="iconify" data-icon="lucide:loader" data-width="12"></span>En proceso</button>';
    if(status!=='completada')  btns += '<button onclick="setSolicitudStatus('+id+',\'completada\')" class="btn btn-primary btn-sm"><span class="iconify" data-icon="lucide:check" data-width="12"></span>Completar</button>';
    if(status!=='rechazada')   btns += '<button onclick="setSolicitudStatus('+id+',\'rechazada\')" class="btn btn-outline btn-sm" style="color:#f87171;border-color:rgba(239,68,68,.3)"><span class="iconify" data-icon="lucide:x" data-width="12"></span>Rechazar</button>';
    btns += '<button onclick="deleteSolicitud('+id+')" class="btn btn-ghost btn-sm" style="color:#475569;margin-left:auto"><span class="iconify" data-icon="lucide:trash-2" data-width="12"></span></button>';

    return '<div class="card-sm">'+
      '<div class="flex flex-wrap items-start justify-between gap-3 mb-4">'+
        '<div class="flex items-center gap-3">'+
          '<div class="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-red-400">'+((m.name||'?')[0].toUpperCase())+'</div>'+
          '<div><p class="text-sm font-semibold text-white">'+(m.name||'—')+'</p><p class="text-xs text-slate-500">'+d+'</p></div>'+
        '</div>'+
        '<span class="badge '+sc.cls+'">'+sc.label+'</span>'+
      '</div>'+
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4 text-xs">'+
        '<div class="flex gap-2"><span class="text-slate-500 flex-shrink-0 w-20">Teléfono</span><span class="text-slate-300">'+(m.phone||'—')+'</span></div>'+
        '<div class="flex gap-2"><span class="text-slate-500 flex-shrink-0 w-20">Email</span><span class="text-slate-300">'+(m.email||'—')+'</span></div>'+
        '<div class="flex gap-2"><span class="text-slate-500 flex-shrink-0 w-20">Servicio</span><span class="text-blue-400 font-medium">'+svc+'</span></div>'+
        (m.message ? '<div class="sm:col-span-2 flex gap-2"><span class="text-slate-500 flex-shrink-0 w-20">Mensaje</span><span class="text-slate-300">'+m.message+'</span></div>' : '')+
      '</div>'+
      '<div class="flex flex-wrap gap-2 pt-3 border-t border-white/[0.05]">'+btns+'</div>'+
    '</div>';
  }).join('');
  if(window.Iconify) Iconify.scan(el);
}

async function setSolicitudStatus(id, status){
  var ok = false;
  try {
    if(window.supabaseRestRequest){
      await window.supabaseRestRequest('contact_requests?id=eq.'+id, {
        method:'PATCH',
        headers:{'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify({status:status})
      });
      ok = true;
    }
  } catch(e){ console.warn('[setSolicitudStatus]', e); }
  if(!ok){
    var arr = JSON.parse(localStorage.getItem('messages')||'[]');
    var idx = arr.findIndex(function(m){ return String(m.id)===String(id); });
    if(idx>=0){ arr[idx].status=status; window.supabaseDirectSet('messages',JSON.stringify(arr)); }
  }
  renderSolicitudes();
  renderKPIs();
  adminToast(ok ? 'Estado de la solicitud actualizado.' : 'Actualizado local — sin conexión con la base de datos.', ok ? 'success' : 'error');
}

async function deleteSolicitud(id){
  if(!confirm('¿Eliminar esta solicitud?')) return;
  var ok = false;
  try {
    if(window.supabaseRestRequest){
      await window.supabaseRestRequest('contact_requests?id=eq.'+id, {method:'DELETE'});
      ok = true;
    }
  } catch(e){ console.warn('[deleteSolicitud]', e); }
  if(!ok){
    var arr = JSON.parse(localStorage.getItem('messages')||'[]');
    window.supabaseDirectSet('messages',JSON.stringify(arr.filter(function(m){ return String(m.id)!==String(id); })));
  }
  renderSolicitudes();
  renderKPIs();
  adminToast(ok ? 'Solicitud eliminada.' : 'Eliminado local — sin conexión con la base de datos.', ok ? 'success' : 'error');
}

async function clearMessages(){
  if(!confirm('¿Eliminar TODAS las solicitudes? Esta acción no se puede deshacer.')) return;
  var synced = true;
  try {
    if(window.supabaseRestRequest)
      await window.supabaseRestRequest('contact_requests?id=gt.0', {method:'DELETE'});
  } catch(e){ synced = false; localStorage.removeItem('messages'); }
  renderSolicitudes();
  renderKPIs();
  adminToast(synced ? 'Todas las solicitudes fueron eliminadas.' : 'Eliminado local — sin conexión con la base de datos.', synced ? 'success' : 'error');
}

// ========== RESEÑAS ==========
function copyReviewLink(){
  var url = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'dejar-resena.html';
  function done(){
    var btn = document.querySelector('[onclick="copyReviewLink()"]');
    if(!btn) return;
    var original = btn.innerHTML;
    btn.innerHTML = '<span class="iconify" data-icon="lucide:check" data-width="14"></span>¡Enlace copiado!';
    if(window.Iconify) Iconify.scan(btn);
    setTimeout(function(){ btn.innerHTML = original; if(window.Iconify) Iconify.scan(btn); }, 2000);
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(done).catch(function(){ prompt('Copia este enlace:', url); });
  } else {
    prompt('Copia este enlace:', url);
  }
}

function renderResenas(){
  var el = document.getElementById('resenasList');
  if(!el) return;
  var filter = document.getElementById('resenaFilter') ? document.getElementById('resenaFilter').value : '';
  el.innerHTML = '<div class="card text-center py-12 text-slate-500 text-sm">Cargando...</div>';
  window.supabaseRestRequest('reviews?select=*&order=created_at.desc,id.desc')
    .then(function(rows) {
      rows = rows || [];
      if (filter) rows = rows.filter(function(r){ return (r.status||'pendiente')===filter; });
      if(!rows.length){ el.innerHTML='<div class="card text-center py-12 text-slate-500 text-sm">No hay reseñas'+(filter?' con ese filtro':'')+'.</div>'; renderKPIs(); return; }
      paintResenas(rows);
    })
    .catch(function(e) {
      el.innerHTML='<div class="card text-center py-12 text-red-500 text-sm">Error al cargar reseñas: '+(e&&e.message?e.message:'sin conexión')+'</div>';
    });
}
function paintResenas(rows){
  var el = document.getElementById('resenasList');
  if(!el) return;
  el.innerHTML = rows.map(function(r){
    var stars = '';
    for(var s=0;s<5;s++) stars += s<parseInt(r.rating||5)?'★':'☆';
    var status = r.status||'pendiente';
    var badgeCls = status==='aprobada'?'badge-green':status==='rechazada'?'badge-red':'badge-yellow';
    var d = r.created_at ? new Date(r.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'short',year:'numeric'}) : '—';
    var id = r.id;
    var photo = r.photo || '';
    var avatarHtml = photo
      ? '<img src="'+escH(photo)+'" alt="'+escH(r.name||'')+'" style="width:2.25rem;height:2.25rem;border-radius:50%;object-fit:cover;border:1.5px solid rgba(239,68,68,.3);flex-shrink:0">'
      : '<div style="width:2.25rem;height:2.25rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.875rem;font-weight:700;color:#cbd5e1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);flex-shrink:0">'+((r.name||'?')[0].toUpperCase())+'</div>';
    var metaBits = [];
    if (r.municipio) metaBits.push('<span class="badge badge-slate"><span class="iconify" data-icon="lucide:map-pin" data-width="10"></span>'+escH(r.municipio)+'</span>');
    if (r.servicio) metaBits.push('<span class="badge badge-blue"><span class="iconify" data-icon="lucide:briefcase" data-width="10"></span>'+escH(r.servicio)+'</span>');
    metaBits.push(r.autoriza_publicar === false
      ? '<span class="badge badge-red"><span class="iconify" data-icon="lucide:eye-off" data-width="10"></span>No autoriza publicar</span>'
      : '<span class="badge badge-green"><span class="iconify" data-icon="lucide:eye" data-width="10"></span>Autoriza publicar</span>');
    var metaHtml = metaBits.length ? '<div class="flex flex-wrap gap-1.5 mb-2">'+metaBits.join('')+'</div>' : '';
    return '<div class="card-sm"><div class="flex flex-wrap items-start justify-between gap-3 mb-3"><div class="flex items-center gap-3">'+avatarHtml+'<div><p class="text-sm font-semibold text-white">'+(r.name||'—')+'</p><p class="text-xs text-slate-500">'+(r.role||'Usuario')+'</p></div></div><div class="flex items-center gap-2"><span class="badge '+badgeCls+'">'+status.charAt(0).toUpperCase()+status.slice(1)+'</span><span class="text-[10px] text-slate-600">'+d+'</span></div></div>'+metaHtml+'<div class="flex items-center gap-2 mb-2"><span style="color:#fbbf24;font-size:.8125rem;letter-spacing:.05em">'+stars+'</span></div><p class="text-xs text-slate-400 bg-white/[0.02] rounded-lg p-3 border border-white/[0.05] mb-3">"'+(r.text||'')+'"</p><div class="flex gap-2">'+(status!=='aprobada'?'<button onclick="setReviewStatus('+id+',\'aprobada\')" class="btn btn-primary btn-sm"><span class="iconify" data-icon="lucide:check" data-width="12"></span>Aprobar</button>':'')+(status!=='pendiente'?'<button onclick="setReviewStatus('+id+',\'pendiente\')" class="btn btn-outline btn-sm"><span class="iconify" data-icon="lucide:clock" data-width="12"></span>Pendiente</button>':'')+(status!=='rechazada'?'<button onclick="setReviewStatus('+id+',\'rechazada\')" class="btn btn-outline btn-sm" style="color:#f87171"><span class="iconify" data-icon="lucide:x" data-width="12"></span>Rechazar</button>':'')+'<button onclick="openEditReview('+id+')" class="btn btn-outline btn-sm"><span class="iconify" data-icon="lucide:pencil" data-width="12"></span>Editar</button>'+'<button onclick="deleteReview('+id+')" class="btn btn-ghost btn-sm" style="color:#475569;margin-left:auto"><span class="iconify" data-icon="lucide:trash-2" data-width="12"></span></button></div></div>';
  }).join('');
  if(window.Iconify) Iconify.scan(el);
  renderKPIs();
}

function setReviewStatus(id, status){
  window.supabaseRestRequest('reviews?id=eq.'+id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ status: status })
  }).then(function(){ renderResenas(); adminToast('Estado de la reseña actualizado.', 'success'); })
  .catch(function(e){ adminToast('Error al cambiar estado: '+(e&&e.message?e.message:'Verifica conexión y políticas RLS'), 'error'); });
}

function deleteReview(id){
  if(!confirm('¿Eliminar esta reseña?')) return;
  window.supabaseRestRequest('reviews?id=eq.'+id, { method: 'DELETE' })
    .then(function(){ renderResenas(); adminToast('Reseña eliminada.', 'success'); })
    .catch(function(e){ adminToast('Error al eliminar: '+(e&&e.message?e.message:'Verifica conexión y políticas RLS'), 'error'); });
}

// ========== EDITAR RESEÑAS (Modal + acciones) ==========
function openEditReview(id){
  var modalHtml = document.getElementById('modalReview');
  if (!modalHtml) {
    // Crear modal dinámicamente si no existe (poco frecuente)
    var container = document.createElement('div');
    container.innerHTML = '<div id="modalReview" class="modal-bg"><div class="modal"><div class="flex items-center justify-between mb-5"><h3 class="text-base font-bold text-white" id="modalReviewTitle">Editar reseña</h3><button onclick="closeReviewModal()" class="btn-ghost btn btn-sm"><span class="iconify" data-icon="lucide:x" data-width="16"></span></button></div><div class="space-y-4"><input type="hidden" id="editReviewId"><div><label class="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Nombre</label><input id="editReviewName" class="input" /></div><div><label class="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Rol</label><input id="editReviewRole" class="input" /></div><div><label class="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Calificación</label><select id="editReviewRating" class="input"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div><div><label class="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Texto</label><textarea id="editReviewText" class="input" rows="4"></textarea></div><div><label class="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Estado</label><select id="editReviewStatus" class="input"><option value="pendiente">Pendiente</option><option value="aprobada">Aprobada</option><option value="rechazada">Rechazada</option></select></div><div class="flex gap-3 pt-2"><button onclick="saveReview()" class="btn btn-primary flex-1 justify-center">Guardar</button><button onclick="closeReviewModal()" class="btn btn-outline flex-1 justify-center">Cancelar</button></div></div></div></div>';
    document.body.appendChild(container.firstChild);
    if(window.Iconify) Iconify.scan();
  }
  // Cargar datos
  var idNum = id;
  if (window.supabaseRestRequest) {
    window.supabaseRestRequest('reviews?id=eq.'+idNum+'&select=*').then(function(rows){
      var r = rows && rows[0];
      if (!r) { adminToast('Reseña no encontrada.', 'error'); return; }
      document.getElementById('editReviewId').value = r.id;
      document.getElementById('editReviewName').value = r.name || '';
      document.getElementById('editReviewRole').value = r.role || '';
      document.getElementById('editReviewText').value = r.text || '';
      document.getElementById('editReviewRating').value = String(r.rating || 5);
      document.getElementById('editReviewStatus').value = r.status || 'pendiente';
      document.getElementById('modalReview').classList.add('open');
    }).catch(function(e){ adminToast('Error al cargar reseña: '+e.message, 'error'); });
  }
}

function closeReviewModal(){ var m=document.getElementById('modalReview'); if(m) m.classList.remove('open'); }

function saveReview(){
  var id = document.getElementById('editReviewId').value;
  var payload = {
    name: (document.getElementById('editReviewName').value||'').trim(),
    role: (document.getElementById('editReviewRole').value||'').trim(),
    text: (document.getElementById('editReviewText').value||'').trim(),
    rating: parseInt(document.getElementById('editReviewRating').value||'5',10)||5,
    status: document.getElementById('editReviewStatus').value || 'pendiente'
  };
  if (!id) { adminToast('ID de reseña inválido.', 'error'); return; }
  window.supabaseRestRequest('reviews?id=eq.'+encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(payload)
  }).then(function(){ closeReviewModal(); renderResenas(); adminToast('Reseña guardada correctamente.', 'success'); })
  .catch(function(e){ adminToast('Error al guardar reseña: '+(e&&e.message?e.message:'Verifica conexión y políticas RLS'), 'error'); });
}

// ========== PRODUCTOS ==========
var _prodsCache = [];
async function renderProductos(){
  var el = document.getElementById('productosList');
  if(!el) return;
  el.innerHTML='<div class="card text-center py-6 text-slate-500 text-sm">Cargando...</div>';
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    var rows = await window.supabaseRestRequest('products?select=*&order=sort_order.asc,id.asc') || [];
    _prodsCache = rows.map(function(r){ return {id:r.id,name:r.name,price:r.price_text,condition:r.condition,category:r.category,icon:r.icon,color:r.color,desc:r.description,sort_order:r.sort_order}; });
  } catch(e) {
    _prodsCache = JSON.parse(localStorage.getItem('products')||'[]');
  }
  if(!_prodsCache.length){ el.innerHTML='<div class="card text-center py-12 text-slate-500 text-sm">Sin productos.</div>'; return; }
  el.innerHTML = _prodsCache.map(function(p){
    var badge = p.condition==='Nuevo'?'badge-green':'badge-yellow';
    return '<div class="card-sm"><div class="flex items-center gap-4"><div class="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0"><span class="iconify '+p.color+'" data-icon="'+p.icon+'" data-width="18"></span></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><p class="text-sm font-semibold text-white">'+p.name+'</p><span class="badge '+badge+'">'+p.condition+'</span></div><p class="text-xs text-slate-500 truncate">'+p.category+' · '+p.desc+'</p></div><div class="flex items-center gap-3 flex-shrink-0"><span class="text-base font-bold text-white">'+p.price+'</span><button onclick="editProd('+p.id+')" class="btn btn-outline btn-sm"><span class="iconify" data-icon="lucide:pencil" data-width="12"></span></button><button onclick="deleteProd('+p.id+')" class="btn btn-ghost btn-sm" style="color:#f87171"><span class="iconify" data-icon="lucide:trash-2" data-width="12"></span></button></div></div></div>';
  }).join('');
  if(window.Iconify) Iconify.scan(el);
}

var _editProdId = null;
function openProdModal(){ _editProdId=null; document.getElementById('modalProdTitle').textContent='Nuevo producto'; clearProdForm(); document.getElementById('modalProducto').classList.add('open'); }
function closeProdModal(){ document.getElementById('modalProducto').classList.remove('open'); }
function clearProdForm(){ ['prodId','prodName','prodPrice','prodDesc'].forEach(function(id){ document.getElementById(id).value=''; }); document.getElementById('prodCondition').value='Nuevo'; document.getElementById('prodColor').value='text-slate-300'; document.getElementById('prodIcon').value='lucide:smartphone'; document.getElementById('prodCategory').value=''; }

function editProd(id){
  var p = _prodsCache.find(function(x){ return x.id===id; });
  if(!p) return;
  _editProdId = id;
  document.getElementById('modalProdTitle').textContent='Editar producto';
  document.getElementById('prodId').value = id;
  document.getElementById('prodName').value = p.name||'';
  document.getElementById('prodPrice').value = p.price||'';
  document.getElementById('prodCondition').value = p.condition||'Nuevo';
  document.getElementById('prodCategory').value = p.category||'';
  document.getElementById('prodIcon').value = p.icon||'lucide:smartphone';
  document.getElementById('prodColor').value = p.color||'text-slate-300';
  document.getElementById('prodDesc').value = p.desc||'';
  document.getElementById('modalProducto').classList.add('open');
}

async function saveProd(){
  var name = document.getElementById('prodName').value.trim();
  if(!name){ adminToast('El nombre es obligatorio.', 'error'); return; }
  var obj = {name:name, price_text:document.getElementById('prodPrice').value.trim()||'—', condition:document.getElementById('prodCondition').value, category:document.getElementById('prodCategory').value.trim(), icon:document.getElementById('prodIcon').value.trim()||'lucide:smartphone', color:document.getElementById('prodColor').value, description:document.getElementById('prodDesc').value.trim()};
  var synced = true;
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    if(_editProdId!=null){
      await window.supabaseRestRequest('products?id=eq.'+_editProdId, {method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(obj)});
    } else {
      obj.sort_order = (_prodsCache.length ? Math.max.apply(null,_prodsCache.map(function(p){return p.sort_order||0;})) : 0) + 1;
      await window.supabaseRestRequest('products', {method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify([obj])});
    }
  } catch(e) {
    synced = false;
    var prods=JSON.parse(localStorage.getItem('products')||'[]');
    var lsObj={name:name,price:obj.price_text,condition:obj.condition,category:obj.category,icon:obj.icon,color:obj.color,desc:obj.description};
    if(_editProdId!=null){ var idx=prods.findIndex(function(p){return p.id===_editProdId;}); if(idx>=0){lsObj.id=_editProdId;prods[idx]=lsObj;} } else {lsObj.id=Date.now();prods.push(lsObj);}
    localStorage.setItem('products',JSON.stringify(prods));
  }
  closeProdModal();
  renderProductos();
  renderKPIs();
  adminToast(synced ? 'Producto guardado correctamente.' : 'Guardado local — sin conexión con la base de datos.', synced ? 'success' : 'error');
}

async function deleteProd(id){
  if(!confirm('¿Eliminar este producto?')) return;
  var synced = true;
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    await window.supabaseRestRequest('products?id=eq.'+id, {method:'DELETE'});
  } catch(e) {
    synced = false;
    var prods=JSON.parse(localStorage.getItem('products')||'[]');
    localStorage.setItem('products',JSON.stringify(prods.filter(function(p){return p.id!==id;})));
  }
  renderProductos();
  renderKPIs();
  adminToast(synced ? 'Producto eliminado.' : 'Eliminado local — sin conexión con la base de datos.', synced ? 'success' : 'error');
}

// ========== COLABORADORES ==========
var _partsCache = [];
async function renderColaboradores(){
  var el = document.getElementById('colaboradoresList');
  if(!el) return;
  el.innerHTML='<div class="card text-center py-6 text-slate-500 text-sm">Cargando...</div>';
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    var rows = await window.supabaseRestRequest('partners?select=*&order=sort_order.asc,id.asc') || [];
    _partsCache = rows.map(function(r){ return {id:r.id,name:r.name,role:r.role,icon:r.icon,color:r.color,desc:r.description,url:r.url,sort_order:r.sort_order}; });
  } catch(e) {
    _partsCache = JSON.parse(localStorage.getItem('partners')||'[]');
  }
  if(!_partsCache.length){ el.innerHTML='<div class="card text-center py-12 text-slate-500 text-sm">Sin colaboradores.</div>'; return; }
  el.innerHTML = _partsCache.map(function(p){
    return '<div class="card-sm"><div class="flex items-center gap-4"><div class="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0"><span class="iconify '+p.color+'" data-icon="'+p.icon+'" data-width="18"></span></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><p class="text-sm font-semibold text-white">'+p.name+'</p><span class="badge badge-blue">'+p.role+'</span></div><p class="text-xs text-slate-500 truncate">'+p.desc+'</p></div><div class="flex items-center gap-2 flex-shrink-0"><button onclick="editPart('+p.id+')" class="btn btn-outline btn-sm"><span class="iconify" data-icon="lucide:pencil" data-width="12"></span></button><button onclick="deletePart('+p.id+')" class="btn btn-ghost btn-sm" style="color:#f87171"><span class="iconify" data-icon="lucide:trash-2" data-width="12"></span></button></div></div></div>';
  }).join('');
  if(window.Iconify) Iconify.scan(el);
}

var _editPartId = null;
function openPartModal(){ _editPartId=null; document.getElementById('modalPartTitle').textContent='Nuevo colaborador'; ['partId','partName','partRole','partIcon','partUrl','partDesc'].forEach(function(id){document.getElementById(id).value='';}); document.getElementById('modalPartner').classList.add('open'); }
function closePartModal(){ document.getElementById('modalPartner').classList.remove('open'); }

function editPart(id){
  var p = _partsCache.find(function(x){ return x.id===id; }); if(!p) return;
  _editPartId=id;
  document.getElementById('modalPartTitle').textContent='Editar colaborador';
  document.getElementById('partId').value=id;
  document.getElementById('partName').value=p.name||'';
  document.getElementById('partRole').value=p.role||'';
  document.getElementById('partIcon').value=p.icon||'';
  document.getElementById('partColor').value=p.color||'text-white';
  document.getElementById('partUrl').value=p.url||'';
  document.getElementById('partDesc').value=p.desc||'';
  document.getElementById('modalPartner').classList.add('open');
}

async function savePart(){
  var name=document.getElementById('partName').value.trim(); if(!name){adminToast('El nombre es obligatorio.', 'error');return;}
  var obj={name:name,role:document.getElementById('partRole').value.trim(),icon:document.getElementById('partIcon').value.trim()||'lucide:globe',color:document.getElementById('partColor').value,url:document.getElementById('partUrl').value.trim(),description:document.getElementById('partDesc').value.trim()};
  var synced = true;
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    if(_editPartId!=null){
      await window.supabaseRestRequest('partners?id=eq.'+_editPartId, {method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(obj)});
    } else {
      obj.sort_order = (_partsCache.length ? Math.max.apply(null,_partsCache.map(function(p){return p.sort_order||0;})) : 0) + 1;
      obj.is_active = true;
      await window.supabaseRestRequest('partners', {method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify([obj])});
    }
  } catch(e) {
    synced = false;
    var parts=JSON.parse(localStorage.getItem('partners')||'[]');
    var lsObj={name:name,role:obj.role,icon:obj.icon,color:obj.color,url:obj.url,desc:obj.description};
    if(_editPartId!=null){ var idx=parts.findIndex(function(p){return p.id===_editPartId;}); if(idx>=0){lsObj.id=_editPartId;parts[idx]=lsObj;} } else {lsObj.id=Date.now();parts.push(lsObj);}
    localStorage.setItem('partners',JSON.stringify(parts));
  }
  closePartModal();
  renderColaboradores();
  adminToast(synced ? 'Colaborador guardado correctamente.' : 'Guardado local — sin conexión con la base de datos.', synced ? 'success' : 'error');
}

async function deletePart(id){
  if(!confirm('¿Eliminar este colaborador?'))return;
  var synced = true;
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    await window.supabaseRestRequest('partners?id=eq.'+id, {method:'DELETE'});
  } catch(e) {
    synced = false;
    var parts=JSON.parse(localStorage.getItem('partners')||'[]');
    localStorage.setItem('partners',JSON.stringify(parts.filter(function(p){return p.id!==id;})));
  }
  renderColaboradores();
  adminToast(synced ? 'Colaborador eliminado.' : 'Eliminado local — sin conexión con la base de datos.', synced ? 'success' : 'error');
}

// ========== GASTOS ==========
var _gastosCache = [];
async function renderGastos(){
  var summary=document.getElementById('gastosSummary');
  var list=document.getElementById('gastosList');
  if(!summary||!list) return;
  summary.innerHTML='<div class="card-sm"><p class="text-xs text-slate-500 mb-1">Total gastos</p><p class="text-2xl font-bold text-white">Cargando...</p></div>';
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    var rows = await window.supabaseRestRequest('expenses?select=*&order=spent_on.desc,id.desc') || [];
    _gastosCache = rows.map(function(r){ return {id:r.id,descripcion:r.description,monto:r.amount,categoria:r.category,fecha:r.spent_on}; });
  } catch(e) {
    _gastosCache = JSON.parse(localStorage.getItem('gastos')||'[]').slice().reverse();
  }
  var total=_gastosCache.reduce(function(s,g){return s+parseFloat(g.monto||0);},0);
  var catTotals={};
  _gastosCache.forEach(function(g){catTotals[g.categoria]=(catTotals[g.categoria]||0)+parseFloat(g.monto||0);});
  var cats=Object.keys(catTotals);
  summary.innerHTML='<div class="card-sm"><p class="text-xs text-slate-500 mb-1">Total gastos</p><p class="text-2xl font-bold text-white">$'+total.toFixed(2)+'</p></div><div class="card-sm col-span-1 lg:col-span-2"><p class="text-xs text-slate-500 mb-3">Por categoría</p>'+cats.map(function(c){var pct=total>0?Math.round((catTotals[c]/total)*100):0;return '<div class="flex items-center gap-3 mb-2"><span class="text-xs text-slate-400 w-24 truncate">'+c+'</span><div class="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div class="h-full rounded-full bg-red-500" style="width:'+pct+'%"></div></div><span class="text-xs text-slate-400 w-8 text-right">'+pct+'%</span></div>';}).join('')+'</div>';
  if(!_gastosCache.length){list.innerHTML='<div class="card text-center py-12 text-slate-500 text-sm">Sin gastos registrados.</div>';return;}
  list.innerHTML=_gastosCache.map(function(g){
    var d=g.fecha?new Date(g.fecha).toLocaleDateString('es-PR',{day:'numeric',month:'short',year:'numeric'}):'—';
    return '<div class="card-sm"><div class="flex items-center gap-4"><div class="flex-1 min-w-0"><p class="text-sm font-medium text-white">'+g.descripcion+'</p><p class="text-xs text-slate-500">'+g.categoria+' · '+d+'</p></div><div class="flex items-center gap-3 flex-shrink-0"><span class="text-base font-bold text-red-400">-$'+parseFloat(g.monto||0).toFixed(2)+'</span><button onclick="deleteGasto('+g.id+')" class="btn btn-ghost btn-sm" style="color:#475569"><span class="iconify" data-icon="lucide:trash-2" data-width="12"></span></button></div></div></div>';
  }).join('');
  if(window.Iconify) Iconify.scan(list);
}

function openGastoModal(){ document.getElementById('modalGastoTitle').textContent='Registrar gasto'; ['gastoId','gastoDesc','gastoMonto'].forEach(function(id){document.getElementById(id).value='';}); document.getElementById('gastoCat').value='Hosting'; document.getElementById('gastoFecha').value=new Date().toISOString().slice(0,10); document.getElementById('modalGasto').classList.add('open'); }
function closeGastoModal(){ document.getElementById('modalGasto').classList.remove('open'); }

async function saveGasto(){
  var desc=document.getElementById('gastoDesc').value.trim(); var monto=parseFloat(document.getElementById('gastoMonto').value);
  if(!desc||isNaN(monto)||monto<=0){adminToast('Completa descripción y monto.', 'error');return;}
  var synced = true;
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    await window.supabaseRestRequest('expenses', {method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify([{description:desc,amount:monto,category:document.getElementById('gastoCat').value,spent_on:document.getElementById('gastoFecha').value}])});
  } catch(e) {
    synced = false;
    var gastos=JSON.parse(localStorage.getItem('gastos')||'[]');
    gastos.push({descripcion:desc,monto:monto,categoria:document.getElementById('gastoCat').value,fecha:document.getElementById('gastoFecha').value});
    localStorage.setItem('gastos',JSON.stringify(gastos));
  }
  closeGastoModal();
  renderGastos();
  renderKPIs();
  adminToast(synced ? 'Gasto registrado correctamente.' : 'Guardado local — sin conexión con la base de datos.', synced ? 'success' : 'error');
}

async function deleteGasto(id){
  if(!confirm('¿Eliminar este gasto?'))return;
  var synced = true;
  try {
    if(!window.supabaseRestRequest) throw new Error('no supabase');
    await window.supabaseRestRequest('expenses?id=eq.'+id, {method:'DELETE'});
  } catch(e) {
    synced = false;
    var gastos=JSON.parse(localStorage.getItem('gastos')||'[]');
    localStorage.setItem('gastos',JSON.stringify(gastos.filter(function(g){return g.id!==id;})));
  }
  renderGastos();
  renderKPIs();
  adminToast(synced ? 'Gasto eliminado.' : 'Eliminado local — sin conexión con la base de datos.', synced ? 'success' : 'error');
}

// ========== CONFIGURACIÓN ==========
var configDefs=[
  {id:'hero',label:'Hero',fields:[{key:'hero_h1_es',label:'Título línea 1 (ES)',def:'Diseñador &'},{key:'hero_h1_accent_es',label:'Título línea 2 (ES)',def:'Desarrollador Web'},{key:'hero_desc_es',label:'Descripción (ES)',def:'Creo experiencias digitales...'}]},
  {id:'servicios',label:'Servicios',fields:[{key:'svc_title_es',label:'Título sección (ES)',def:'Lo que puedo hacer por ti'},{key:'svc_subtitle_es',label:'Subtítulo (ES)',def:'Soluciones digitales completas...'}]},
  {id:'sobremi',label:'Sobre mí',fields:[{key:'about_title_es',label:'Título (ES)',def:'Construyo el futuro digital'},{key:'about_p1_es',label:'Párrafo 1 (ES)',def:''},{key:'about_p2_es',label:'Párrafo 2 (ES)',def:''}]},
  {id:'proyectos',label:'Proyectos',fields:[{key:'proj_title_es',label:'Título sección (ES)',def:'Proyectos realizados'},{key:'proj_subtitle_es',label:'Subtítulo (ES)',def:'Trabajos reales. Resultados concretos.'}]},
  {id:'contacto',label:'Contacto',fields:[{key:'contact_title_es',label:'Título (ES)',def:'Hablemos de tu proyecto'},{key:'contact_desc_es',label:'Descripción (ES)',def:'Cuéntame tu idea...'}]},
  {id:'footer',label:'Footer',fields:[{key:'footer_desc',label:'Descripción del footer',def:'Diseñador y Desarrollador Web...'},{key:'copyright',label:'Texto copyright',def:'© 2026 AngelDev. Todos los derechos reservados.'}]}
];

function renderConfig(){
  var saved=JSON.parse(localStorage.getItem('siteConfig')||'{}');
  var el=document.getElementById('configSections');
  if(!el) return;
  el.innerHTML=configDefs.map(function(sec){
    return '<div class="config-section"><div class="config-header" onclick="toggleConfigSection(\'cfg-'+sec.id+'\')"><p class="text-sm font-semibold text-white flex items-center gap-2"><span class="iconify text-red-500" data-icon="lucide:layout" data-width="14"></span>'+sec.label+'</p><span class="iconify text-slate-500" data-icon="lucide:chevron-down" data-width="14"></span></div><div class="config-body" id="cfg-'+sec.id+'"><div class="space-y-3">'+sec.fields.map(function(f){var v=saved[f.key]!==undefined?saved[f.key]:f.def;return '<div><label class="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">'+f.label+'</label><textarea class="input" id="cfg-field-'+f.key+'" rows="2">'+v+'</textarea></div>';}).join('')+'</div></div></div>';
  }).join('');
  if(window.Iconify) Iconify.scan(el);
}

function toggleConfigSection(id){ var el=document.getElementById(id); if(el) el.classList.toggle('open'); }

function saveConfig(){
  var saved={};
  configDefs.forEach(function(sec){ sec.fields.forEach(function(f){ var el=document.getElementById('cfg-field-'+f.key); if(el) saved[f.key]=el.value; }); });
  localStorage.setItem('siteConfig',JSON.stringify(saved));
  var ok=document.getElementById('configSaved');
  ok.classList.remove('hidden');
  setTimeout(function(){ok.classList.add('hidden');},3000);
  adminToast('Configuración guardada correctamente.', 'success');
}

// ========== USUARIOS ==========
function renderUsuarios(){
  var users=getUsers();
  var el=document.getElementById('usuariosList');
  if(!el) return;
  var adminName = currentUser ? (currentUser.name||currentUser.username||'Administrador') : 'Administrador';
  var adminUser = currentUser ? (currentUser.username||'Admintech') : 'Admintech';
  var adminCard='<div class="card-sm mb-3"><div class="flex items-center gap-4"><div class="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-red-400">'+adminName[0].toUpperCase()+'</div><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-white">'+adminName+'<span class="text-xs text-slate-500 ml-2">@'+adminUser+'</span></p><p class="text-xs text-slate-500">Administrador principal · Acceso total</p></div><span class="badge badge-red">Master</span></div></div>';
  if(!users.length){el.innerHTML=adminCard+'<div class="card text-center py-10 text-slate-500 text-sm">No hay usuarios adicionales.</div>';return;}
  var roleLabels={admin:'Admin',editor:'Editor',viewer:'Solo lectura'};
  el.innerHTML=adminCard+users.map(function(u,i){
    var perms=(u.perms||[]).join(', ')||'Sin permisos';
    return '<div class="card-sm"><div class="flex items-center gap-4"><div class="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 text-sm font-bold text-slate-300">'+((u.name||u.username||'?')[0].toUpperCase())+'</div><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-white">'+(u.name||u.username)+'<span class="text-xs text-slate-500 ml-2">@'+u.username+'</span></p><p class="text-xs text-slate-600 truncate">Acceso: '+perms+'</p></div><div class="flex items-center gap-2 flex-shrink-0"><span class="badge '+(u.role==='admin'?'badge-red':u.role==='editor'?'badge-blue':'badge-slate')+'">'+( roleLabels[u.role]||u.role)+'</span><button onclick="editUser('+i+')" class="btn btn-outline btn-sm"><span class="iconify" data-icon="lucide:pencil" data-width="12"></span></button><button onclick="deleteUser('+i+')" class="btn btn-ghost btn-sm" style="color:#f87171"><span class="iconify" data-icon="lucide:trash-2" data-width="12"></span></button></div></div></div>';
  }).join('');
  if(window.Iconify) Iconify.scan(el);
}

var _editUserIdx=-1;
function openUserModal(){ _editUserIdx=-1; document.getElementById('modalUserTitle').textContent='Nuevo usuario'; ['userId','userUsername','userPass','userFullname'].forEach(function(id){document.getElementById(id).value='';}); document.getElementById('userRole').value='editor'; document.querySelectorAll('#permsGrid input').forEach(function(cb){cb.checked=['dashboard','solicitudes','resenas','productos','colaboradores','gastos'].includes(cb.value);}); document.getElementById('modalUsuario').classList.add('open'); }
function closeUserModal(){ document.getElementById('modalUsuario').classList.remove('open'); }

function editUser(i){
  var users=getUsers(); var u=users[i]; if(!u) return;
  _editUserIdx=i;
  document.getElementById('modalUserTitle').textContent='Editar usuario';
  document.getElementById('userId').value=i;
  document.getElementById('userUsername').value=u.username||'';
  document.getElementById('userPass').value='';
  document.getElementById('userPass').placeholder='Escribe una nueva contraseña';
  document.getElementById('userFullname').value=u.name||'';
  document.getElementById('userRole').value=u.role||'editor';
  document.querySelectorAll('#permsGrid input').forEach(function(cb){ cb.checked=(u.perms||[]).includes(cb.value); });
  document.getElementById('modalUsuario').classList.add('open');
}

function saveUser(){
  var username=document.getElementById('userUsername').value.trim();
  var pass=document.getElementById('userPass').value;
  if(!username||!pass){adminToast('Usuario y contraseña son obligatorios.', 'error');return;}
  if(['admin','admintech'].includes(username.toLowerCase())){adminToast('Ese nombre de usuario está reservado.', 'error');return;}
  var perms=Array.from(document.querySelectorAll('#permsGrid input:checked')).map(function(cb){return cb.value;});
  var fullname=document.getElementById('userFullname').value.trim()||username;
  var role=document.getElementById('userRole').value;
  var obj={username:username,pass:pass,name:fullname,role:role,perms:perms};
  var users=getUsers();
  var isEdit=_editUserIdx>=0&&_editUserIdx<users.length;
  if(isEdit){ users[_editUserIdx]=obj; }
  else { if(users.find(function(u){return u.username===username;})){ adminToast('Ese nombre de usuario ya existe.', 'error'); return; } users.push(obj); }
  saveUsers(users);
  // Sync to Supabase admin_users table via upsert_admin_user RPC
  if (window.supabaseRestRequest) {
    window.supabaseRestRequest('rpc/upsert_admin_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_username: username, p_plain_password: pass, p_full_name: fullname, p_role: role, p_permissions: perms })
    }).then(function(){ adminToast('Usuario guardado correctamente.', 'success'); })
    .catch(function(e){ console.warn('[admin_users sync]', e); adminToast('Guardado local — no se pudo sincronizar con Supabase.', 'error'); });
  } else {
    adminToast('Usuario guardado localmente.', 'success');
  }
  closeUserModal();
  renderUsuarios();
}

function deleteUser(i){
  if(!confirm('¿Eliminar este usuario?'))return;
  var users=getUsers();
  var target=users[i];
  users.splice(i,1);
  saveUsers(users);
  // Remove from Supabase admin_users table
  if (target && target.username && window.supabaseRestRequest) {
    window.supabaseRestRequest('admin_users?username=eq.'+encodeURIComponent(target.username), { method: 'DELETE' })
      .then(function(){ adminToast('Usuario eliminado.', 'success'); })
      .catch(function(e){ console.warn('[admin_users delete]', e); adminToast('Eliminado local — no se pudo sincronizar con Supabase.', 'error'); });
  } else {
    adminToast('Usuario eliminado.', 'success');
  }
  renderUsuarios();
}

// ========== INIT ==========
Object.assign(window, {
  doLogin: doLogin,
  doLogout: doLogout,
  goTo: goTo,
  setSolicitudStatus: setSolicitudStatus,
  deleteSolicitud: deleteSolicitud,
  clearMessages: clearMessages,
  setReviewStatus: setReviewStatus,
  deleteReview: deleteReview,
  openProdModal: openProdModal,
  closeProdModal: closeProdModal,
  editProd: editProd,
  saveProd: saveProd,
  deleteProd: deleteProd,
  openPartModal: openPartModal,
  closePartModal: closePartModal,
  editPart: editPart,
  savePart: savePart,
  deletePart: deletePart,
  openGastoModal: openGastoModal,
  closeGastoModal: closeGastoModal,
  saveGasto: saveGasto,
  deleteGasto: deleteGasto,
  toggleConfigSection: toggleConfigSection,
  saveConfig: saveConfig,
  openUserModal: openUserModal,
  closeUserModal: closeUserModal,
  editUser: editUser,
  saveUser: saveUser,
  deleteUser: deleteUser,
  editPageViews: editPageViews,
  gscConnect: gscConnect,
  gscDisconnect: gscDisconnect,
  gscLoad: gscLoad,
  openEditReview: openEditReview,
  closeReviewModal: closeReviewModal,
  saveReview: saveReview,
  updateDisp: updateDisp,
  deleteDisp: deleteDisp,
  renderDispositivosBadge: renderDispositivosBadge,
  renderResenas: renderResenas,
  renderSolicitudes: renderSolicitudes,
  renderDispositivos: renderDispositivos,
  paintDispositivos: paintDispositivos,
  copyReviewLink: copyReviewLink,
  testSupabaseConnection: testSupabaseConnection,
  forceSyncNow: forceSyncNow,
  renderKPIs: renderKPIs,
  initCharts: initCharts
});

// ========== GOOGLE SEARCH CONSOLE ==========
var GSC_CLIENT_ID = '512357324858-407so0uqojomm65n6doqi6usn703rri6.apps.googleusercontent.com';
var GSC_SITE = 'sc-domain:angeltechsolutions.dev';
var GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
var _gscTokenClient = null;
var _gscChart = null;
var gscConnectFromDash = false;

function gscGetToken(){ return sessionStorage.getItem('gsc_token'); }
function gscTokenValid(){
  var exp = parseInt(sessionStorage.getItem('gsc_token_exp')||'0');
  return gscGetToken() && Date.now() < exp - 60000;
}

function gscConnect(){
  if(!window.google || !window.google.accounts){
    alert('La librería de Google aún no cargó. Espera unos segundos e intenta de nuevo.');
    return;
  }
  if(!_gscTokenClient){
    _gscTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GSC_CLIENT_ID,
      scope: GSC_SCOPE,
      callback: function(resp){
        if(resp.error){ gscShowError('Error de autenticación: ' + resp.error); return; }
        sessionStorage.setItem('gsc_token', resp.access_token);
        sessionStorage.setItem('gsc_token_exp', Date.now() + (resp.expires_in * 1000));
        gscLoadDash();
        if(!gscConnectFromDash) gscLoad();
        gscConnectFromDash = false;
      }
    });
  }
  _gscTokenClient.requestAccessToken({prompt: gscTokenValid() ? '' : 'consent'});
}

async function gscLoadDash(){
  var nc = document.getElementById('gscDashNotConnected');
  var ld = document.getElementById('gscDashLoading');
  var dt = document.getElementById('gscDashData');
  if(!nc||!ld||!dt) return;
  if(!gscTokenValid() && !gscGetToken()){ nc.classList.remove('hidden'); ld.classList.add('hidden'); dt.classList.add('hidden'); return; }
  nc.classList.add('hidden'); dt.classList.add('hidden'); ld.classList.remove('hidden');
  try {
    var range = gscDateRange(28);
    var res = await gscQuery(Object.assign({}, range, {dimensions:[], rowLimit:1}));
    var t = res.rows && res.rows[0] ? res.rows[0] : {clicks:0,impressions:0,ctr:0,position:0};
    var items = [
      {label:'Clicks',          value: t.clicks||0,                          color:'#3b82f6'},
      {label:'Impresiones',     value: (t.impressions||0).toLocaleString(),  color:'#10b981'},
      {label:'CTR',             value: ((t.ctr||0)*100).toFixed(1)+'%',      color:'#fbbf24'},
      {label:'Posición prom.',  value: (t.position||0).toFixed(1),           color:'#a78bfa'}
    ];
    document.getElementById('gscDashKpis').innerHTML = items.map(function(k){
      return '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:.75rem;padding:.875rem"><p class="text-xs text-slate-500 mb-1">'+k.label+'</p><p class="text-lg font-bold" style="color:'+k.color+'">'+k.value+'</p></div>';
    }).join('');
    ld.classList.add('hidden'); dt.classList.remove('hidden');
  } catch(e){
    ld.classList.add('hidden'); nc.classList.remove('hidden');
  }
}

function gscDisconnect(){
  var token = gscGetToken();
  if(token && window.google && window.google.accounts){
    google.accounts.oauth2.revoke(token, function(){});
  }
  sessionStorage.removeItem('gsc_token');
  sessionStorage.removeItem('gsc_token_exp');
  document.getElementById('gscNotConnected').classList.remove('hidden');
  document.getElementById('gscContent').classList.add('hidden');
  document.getElementById('gscError').classList.add('hidden');
  document.getElementById('gscConnectBtn').classList.remove('hidden');
  document.getElementById('gscRefreshBtn').classList.add('hidden');
  document.getElementById('gscDisconnectBtn').classList.add('hidden');
}

async function gscQuery(body){
  var token = gscGetToken();
  if(!token) throw new Error('No autenticado');
  var url = 'https://searchconsole.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(GSC_SITE) + '/searchAnalytics/query';
  var res = await fetch(url, {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  if(!res.ok){
    var txt = await res.text();
    if(res.status===401) throw new Error('Token expirado');
    throw new Error('Error ' + res.status + ': ' + txt);
  }
  return res.json();
}

function gscDateRange(days){
  var end = new Date(); end.setDate(end.getDate()-1);
  var start = new Date(end); start.setDate(start.getDate()-(days-1));
  var fmt = function(d){ return d.toISOString().slice(0,10); };
  return {startDate: fmt(start), endDate: fmt(end)};
}

async function gscLoad(){
  if(!gscTokenValid() && !gscGetToken()){ gscConnect(); return; }
  document.getElementById('gscNotConnected').classList.add('hidden');
  document.getElementById('gscContent').classList.add('hidden');
  document.getElementById('gscError').classList.add('hidden');
  document.getElementById('gscLoading').classList.remove('hidden');
  document.getElementById('gscConnectBtn').classList.add('hidden');
  document.getElementById('gscRefreshBtn').classList.add('hidden');
  document.getElementById('gscDisconnectBtn').classList.add('hidden');
  try {
    var range = gscDateRange(28);
    var results = await Promise.all([
      gscQuery(Object.assign({}, range, {dimensions:[], rowLimit:1})),
      gscQuery(Object.assign({}, range, {dimensions:['date'], rowLimit:28, orderBy:{fieldName:'date',sortOrder:'ASCENDING'}})),
      gscQuery(Object.assign({}, range, {dimensions:['query'], rowLimit:10, orderBy:{fieldName:'clicks',sortOrder:'DESCENDING'}})),
      gscQuery(Object.assign({}, range, {dimensions:['page'], rowLimit:10, orderBy:{fieldName:'clicks',sortOrder:'DESCENDING'}}))
    ]);
    var totals = results[0].rows && results[0].rows[0] ? results[0].rows[0] : {clicks:0,impressions:0,ctr:0,position:0};
    var daily = results[1].rows || [];
    var queries = results[2].rows || [];
    var pages = results[3].rows || [];

    // KPIs
    var kpiData = [
      {label:'Clicks totales', value:totals.clicks||0, icon:'lucide:mouse-pointer-click', color:'#3b82f6', bg:'rgba(59,130,246,.1)'},
      {label:'Impresiones', value:(totals.impressions||0).toLocaleString(), icon:'lucide:eye', color:'#10b981', bg:'rgba(16,185,129,.1)'},
      {label:'CTR promedio', value:((totals.ctr||0)*100).toFixed(1)+'%', icon:'lucide:percent', color:'#fbbf24', bg:'rgba(245,158,11,.1)'},
      {label:'Posición promedio', value:(totals.position||0).toFixed(1), icon:'lucide:trophy', color:'#a78bfa', bg:'rgba(139,92,246,.1)'}
    ];
    document.getElementById('gscKpis').innerHTML = kpiData.map(function(k){
      return '<div class="stat-card"><div class="flex items-start justify-between mb-4"><div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:'+k.bg+'"><span class="iconify" data-icon="'+k.icon+'" data-width="18" style="color:'+k.color+'"></span></div></div><p class="text-2xl font-bold text-white mb-1">'+k.value+'</p><p class="text-xs text-slate-500">'+k.label+'</p></div>';
    }).join('');

    // Gráfica
    if(_gscChart) _gscChart.destroy();
    var ctx = document.getElementById('gscChart');
    if(ctx){
      _gscChart = new Chart(ctx, {
        type:'line',
        data:{
          labels: daily.map(function(r){ var d=new Date(r.keys[0]); return d.toLocaleDateString('es-PR',{day:'numeric',month:'short'}); }),
          datasets:[
            {label:'Clicks', data:daily.map(function(r){return r.clicks;}), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.08)', tension:.4, fill:true, pointRadius:3},
            {label:'Impresiones', data:daily.map(function(r){return r.impressions;}), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.08)', tension:.4, fill:true, pointRadius:3}
          ]
        },
        options:{plugins:{legend:{labels:{color:'#64748b',font:{size:11}}}},scales:{x:{grid:{display:false},ticks:{color:'#475569',font:{size:10}}},y:{beginAtZero:true,ticks:{color:'#475569',font:{size:10}}}}}
      });
    }

    // Búsquedas
    document.getElementById('gscQueries').innerHTML = queries.length ? queries.map(function(r,i){
      var pct = totals.clicks ? Math.round((r.clicks/totals.clicks)*100) : 0;
      return '<div class="flex items-center gap-3 mb-3"><span class="text-xs text-slate-600 w-5 text-right flex-shrink-0">'+(i+1)+'</span><div class="flex-1 min-w-0"><p class="text-xs text-slate-300 truncate">'+r.keys[0]+'</p><div class="flex items-center gap-2 mt-1"><div class="flex-1 h-1 bg-white/[0.06] rounded-full"><div class="h-full rounded-full bg-blue-500" style="width:'+pct+'%"></div></div><span class="text-xs text-slate-500 flex-shrink-0">'+r.clicks+' clicks</span></div></div></div>';
    }).join('') : '<p class="text-xs text-slate-500">No hay datos aún</p>';

    // Páginas
    document.getElementById('gscPages').innerHTML = pages.length ? pages.map(function(r,i){
      var page = r.keys[0].replace('https://angeltechsolutions.dev','') || '/';
      var pct = totals.clicks ? Math.round((r.clicks/totals.clicks)*100) : 0;
      return '<div class="flex items-center gap-3 mb-3"><span class="text-xs text-slate-600 w-5 text-right flex-shrink-0">'+(i+1)+'</span><div class="flex-1 min-w-0"><p class="text-xs text-slate-300 truncate">'+page+'</p><div class="flex items-center gap-2 mt-1"><div class="flex-1 h-1 bg-white/[0.06] rounded-full"><div class="h-full rounded-full bg-emerald-500" style="width:'+pct+'%"></div></div><span class="text-xs text-slate-500 flex-shrink-0">'+r.clicks+' clicks</span></div></div></div>';
    }).join('') : '<p class="text-xs text-slate-500">No hay datos aún</p>';

    document.getElementById('gscLoading').classList.add('hidden');
    document.getElementById('gscContent').classList.remove('hidden');
    document.getElementById('gscRefreshBtn').classList.remove('hidden');
    document.getElementById('gscDisconnectBtn').classList.remove('hidden');
    if(window.Iconify) Iconify.scan(document.getElementById('page-searchconsole'));
  } catch(e){
    document.getElementById('gscLoading').classList.add('hidden');
    if(e.message === 'Token expirado'){ gscConnect(); return; }
    gscShowError(e.message);
  }
}

function gscShowError(msg){
  document.getElementById('gscErrorMsg').textContent = msg;
  document.getElementById('gscError').classList.remove('hidden');
  document.getElementById('gscConnectBtn').classList.remove('hidden');
}

function gscAutoLoad(){
  if(gscTokenValid()) gscLoad();
}

function initAdminAuth(){
  if(sessionStorage.getItem('adminAuth')==='1'){
    currentUser = restoreAdminSession();
    if(currentUser && currentUser.username) startApp();
    else {
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      window.location.replace('admin-login.html');
    }
  } else {
    window.location.replace('admin-login.html');
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initAdminAuth);
} else {
  initAdminAuth();
}
});
