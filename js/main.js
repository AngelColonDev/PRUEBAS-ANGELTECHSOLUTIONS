(window.__supabaseReady || Promise.resolve()).finally(function() {
(function() {
  if (!sessionStorage.getItem('pv_s')) {
    sessionStorage.setItem('pv_s', '1');
    if (window.supabaseRestRequest) {
      window.supabaseRestRequest('rpc/increment_page_view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      }).catch(function() {
        localStorage.setItem('pageViews', (parseInt(localStorage.getItem('pageViews') || '0', 10) + 1));
      });
    } else {
      localStorage.setItem('pageViews', (parseInt(localStorage.getItem('pageViews') || '0', 10) + 1));
    }
  }

  var defaultProducts = [
    { id: 1, name: 'iPhone 17 Pro Max', price: '$1,299', condition: 'Nuevo', category: 'Apple', icon: 'lucide:smartphone', color: 'text-slate-300', desc: '256GB, Titanio Negro. Desbloqueado para todas las redes.', images: ['https://placehold.co/600x450/111827/e2e8f0?text=iPhone+17+Pro+Max', 'https://placehold.co/600x450/111827/e2e8f0?text=Vista+Lateral', 'https://placehold.co/600x450/111827/e2e8f0?text=Vista+Trasera'] },
    { id: 2, name: 'iPhone 17 Pro', price: '$1,099', condition: 'Nuevo', category: 'Apple', icon: 'lucide:smartphone', color: 'text-slate-300', desc: '128GB, Titanio Natural. Cámara 48MP ProRAW.', images: ['https://placehold.co/600x450/111827/e2e8f0?text=iPhone+17+Pro', 'https://placehold.co/600x450/111827/e2e8f0?text=Vista+Lateral', 'https://placehold.co/600x450/111827/e2e8f0?text=C%C3%A1mara+ProRAW'] },
    { id: 3, name: 'iPhone 16', price: '$500', condition: 'Nuevo', category: 'Apple', icon: 'lucide:smartphone', color: 'text-blue-400', desc: '128GB, varios colores. Chip A18, USB-C.', images: ['https://res.cloudinary.com/dtw3qx4qq/image/upload/q_auto/f_auto/v1781464535/1._iPhone_16_m%C3%ADo_xhguko.jpg', 'https://res.cloudinary.com/dtw3qx4qq/image/upload/q_auto/f_auto/v1781464535/6._iPhone_16_m%C3%ADo_ky2kpb.jpg', 'https://res.cloudinary.com/dtw3qx4qq/image/upload/q_auto/f_auto/v1781464536/4._iPhone_16_m%C3%ADo_tu2f0n.jpg', 'https://res.cloudinary.com/dtw3qx4qq/image/upload/q_auto/f_auto/v1781464536/5._iPhone_16_m%C3%ADo_uxfvqw.jpg', 'https://res.cloudinary.com/dtw3qx4qq/image/upload/q_auto/f_auto/v1781464537/3._iPhone_16_m%C3%ADo_ngakck.jpg', 'https://res.cloudinary.com/dtw3qx4qq/image/upload/q_auto/f_auto/v1781464538/2._iPhone_16_m%C3%ADo_qnt91g.jpg'] },
    { id: 4, name: 'Samsung Galaxy S25 Ultra', price: '$1,199', condition: 'Nuevo', category: 'Samsung', icon: 'lucide:smartphone', color: 'text-violet-400', desc: '512GB, S-Pen incluido. Snapdragon 8 Elite.', images: ['https://placehold.co/600x450/1a0f2e/a78bfa?text=Galaxy+S25+Ultra', 'https://placehold.co/600x450/1a0f2e/a78bfa?text=S-Pen+Incluido', 'https://placehold.co/600x450/1a0f2e/a78bfa?text=Vista+Trasera'] },
    { id: 5, name: 'MacBook Pro M4', price: '$1,999', condition: 'Nuevo', category: 'Apple', icon: 'lucide:laptop', color: 'text-slate-300', desc: '14 pulgadas, 16GB RAM, 512GB SSD. Chip M4 Pro.', images: ['https://placehold.co/600x450/111827/e2e8f0?text=MacBook+Pro+M4', 'https://placehold.co/600x450/111827/e2e8f0?text=Pantalla+14+pulgadas', 'https://placehold.co/600x450/111827/e2e8f0?text=Chip+M4+Pro'] },
    { id: 6, name: 'iPad Pro M4', price: '$1,099', condition: 'Nuevo', category: 'Apple', icon: 'lucide:tablet', color: 'text-slate-300', desc: '11 pulgadas, 256GB, Wi-Fi. Pantalla OLED Ultra Retina.', images: ['https://placehold.co/600x450/111827/e2e8f0?text=iPad+Pro+M4', 'https://placehold.co/600x450/111827/e2e8f0?text=Pantalla+OLED', 'https://placehold.co/600x450/111827/e2e8f0?text=Vista+Lateral'] }
  ];
  var defaultPartners = [
    { id: 1, name: 'Cloudflare', role: 'CDN y Seguridad', icon: 'lucide:shield', color: 'text-orange-400', desc: 'Protección DDoS y aceleración web de nivel empresarial.', url: 'https://cloudflare.com' },
    { id: 2, name: 'Vercel', role: 'Hosting y Deploy', icon: 'lucide:triangle', color: 'text-white', desc: 'Despliegue continuo con edge network global y cero configuración.', url: 'https://vercel.com' },
    { id: 3, name: 'Supabase', role: 'Base de datos', icon: 'lucide:database', color: 'text-emerald-400', desc: 'Backend como servicio con PostgreSQL y APIs en tiempo real.', url: 'https://supabase.com' },
    { id: 4, name: 'GitHub', role: 'Control de versiones', icon: 'lucide:github', color: 'text-white', desc: 'Repositorios y colaboración en código.', url: 'https://github.com' }
  ];

  if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(defaultProducts));
  } else {
    var prods = JSON.parse(localStorage.getItem('products'));
    var changed = false;
    prods.forEach(function(p) {
      if (p.id === 3 && p.price === '$799') {
        p.price = '$500';
        changed = true;
      }
    });
    var imgMap = {};
    defaultProducts.forEach(function(dp) { imgMap[dp.id] = dp.images; });
    prods.forEach(function(p) {
      if (!p.images || !p.images.length) {
        p.images = imgMap[p.id] || [];
        changed = true;
      }
    });
    if (changed) localStorage.setItem('products', JSON.stringify(prods));
  }
  if (!localStorage.getItem('partners')) localStorage.setItem('partners', JSON.stringify(defaultPartners));

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function(el) { io.observe(el); });

  var currentLang = localStorage.getItem('lang') || 'es';
  var prodDescEN = {
    '256GB, Titanio Negro. Desbloqueado para todas las redes.': '256GB, Black Titanium. Unlocked for all networks.',
    '128GB, Titanio Natural. Cámara 48MP ProRAW.': '128GB, Natural Titanium. 48MP ProRAW camera.',
    '128GB, varios colores. Chip A18, USB-C.': '128GB, multiple colors. A18 chip, USB-C.',
    '512GB, S-Pen incluido. Snapdragon 8 Elite.': '512GB, S-Pen included. Snapdragon 8 Elite.',
    '14 pulgadas, 16GB RAM, 512GB SSD. Chip M4 Pro.': '14 inches, 16GB RAM, 512GB SSD. M4 Pro chip.',
    '11 pulgadas, 256GB, Wi-Fi. Pantalla OLED Ultra Retina.': '11 inches, 256GB, Wi-Fi. Ultra Retina OLED display.'
  };

  function escProd(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderProducts() {
    var lang = currentLang || 'es';
    var products = JSON.parse(localStorage.getItem('products') || '[]');
    var grid = document.getElementById('productsGrid');
    if (!grid) return;
    if (!products.length) {
      grid.innerHTML = '<p class="text-slate-500 text-sm col-span-3 text-center py-10">' + (lang === 'en' ? 'No products available.' : 'No hay productos disponibles.') + '</p>';
      return;
    }

    grid.innerHTML = products.map(function(x) {
      var badge = (x.condition || 'Nuevo') === 'Nuevo' ? 'badge-new' : 'badge-used';
      var condLabel = (x.condition || 'Nuevo') === 'Nuevo' ? (lang === 'en' ? 'New' : 'Nuevo') : (lang === 'en' ? 'Used' : 'Usado');
      var btnLabel = lang === 'en' ? 'Check availability' : 'Consultar disponibilidad';
      var descText = lang === 'en' ? (prodDescEN[x.desc] || x.desc) : x.desc;
      var imgs = x.images || [];
      var firstImg = imgs[0] || '';
      var photoCount = imgs.length;
      var photoLabel = photoCount === 1 ? '1 foto' : (photoCount + ' fotos');
      var imgHtml = firstImg ? '<div class="relative overflow-hidden cursor-pointer" style="height:190px;background:#0a0a0a" onclick="openGallery(' + x.id + ',0)" title="Ver fotos de ' + x.name + '"><img src="' + firstImg + '" alt="Foto principal del producto ' + x.name + '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;opacity:.88"><div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div><div class="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between"><span class="flex items-center gap-1.5 text-[11px] font-medium text-white/90"><span class="iconify" data-icon="lucide:images" data-width="13" aria-hidden="true"></span>' + photoLabel + '</span><span class="text-[10px] text-white/60 flex items-center gap-1">Ver galería <span class="iconify" data-icon="lucide:zoom-in" data-width="11" aria-hidden="true"></span></span></div></div>' : '';
      var galBtn = photoCount > 0 ? '<button onclick="openGallery(' + x.id + ',0)" class="flex items-center gap-1.5 py-2.5 px-3 rounded-xl border border-red-500/30 bg-red-500/[0.07] text-xs font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all flex-shrink-0" title="Ver fotos del producto"><span class="iconify" data-icon="lucide:camera" data-width="13" aria-hidden="true"></span> Ver fotos</button>' : '';
      return '<article class="product-card">' + imgHtml + '<div class="p-5"><div class="flex items-start justify-between mb-3"><div class="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center"><span class="iconify ' + x.color + '" data-icon="' + x.icon + '" data-width="20" aria-hidden="true"></span></div><span class="' + badge + '">' + condLabel + '</span></div><p class="text-[10px] text-red-500 font-mono uppercase tracking-wider mb-1">' + x.category + '</p><h3 class="text-sm font-semibold text-white mb-1.5">' + x.name + '</h3><p class="text-xs text-slate-400 leading-relaxed mb-3">' + descText + '</p><p class="text-xl font-bold text-white mb-3">' + x.price + '</p><div class="flex gap-2">' + galBtn + '<button onclick="inquireProduct(\'' + x.name.replace(/'/g, "\\'") + '\',\'' + x.id + '\')" class="flex-1 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-white hover:bg-red-600 hover:border-red-500 transition-all">' + btnLabel + '</button></div></div></article>';
    }).join('');

    var deviceListings = JSON.parse(localStorage.getItem('device_listings') || '[]').filter(function(l) { return l.status === 'approved'; });
    if (deviceListings.length) {
      var deviceLabels = { iphone: 'iPhone', android: 'Android', ipad: 'iPad / Tablet', macbook: 'MacBook / Laptop', nintendo: 'Nintendo', playstation: 'PlayStation', xbox: 'Xbox', smartwatch: 'Smartwatch', otro_dispositivo: 'Dispositivo' };
      var contactMethodIcons = { whatsapp: 'lucide:message-circle', llamada: 'lucide:phone', mensaje: 'lucide:message-square' };
      var contactMethodLabels = { whatsapp: 'WhatsApp', llamada: 'Llamada', mensaje: 'Mensaje' };
      grid.innerHTML += deviceListings.map(function(l) {
        var catLabel = deviceLabels[l.device_type] || 'Dispositivo';
        var firstPhoto = (l.photos && l.photos.length) ? l.photos[0] : '';
        var photoHtml = firstPhoto ? '<div class="relative overflow-hidden" style="height:190px;background:#0a0a0a"><img src="' + firstPhoto + '" alt="Foto del dispositivo en venta: ' + escProd(l.device_model) + '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;opacity:.88"><div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div><div class="absolute bottom-0 left-0 right-0 p-3"><span class="text-[10px] text-white/70 font-medium">Venta de particular</span></div></div>' : '';
        var cleanPhone = String(l.phone || '').replace(/[^+0-9]/g, '');
        var contactIcon = contactMethodIcons[l.contact_method] || 'lucide:phone';
        var contactLabel = contactMethodLabels[l.contact_method] || 'Contactar';
        var contactHref = l.contact_method === 'whatsapp' ? 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent('Hola! Vi tu ' + escProd(l.device_model) + ' en AngelTech Solutions y me interesa.') : 'tel:' + cleanPhone;
        return '<article class="product-card">' + photoHtml + '<div class="p-5"><div class="flex items-start justify-between mb-3"><div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><span class="iconify text-amber-400" data-icon="lucide:smartphone" data-width="20" aria-hidden="true"></span></div><span class="badge-used text-amber-400 bg-amber-500/10 border border-amber-500/25 text-[10px] font-semibold px-2 py-0.5 rounded-full">Particular</span></div><p class="text-[10px] text-amber-500 font-mono uppercase tracking-wider mb-1">' + catLabel + '</p><h3 class="text-sm font-semibold text-white mb-1.5">' + escProd(l.device_model || 'Dispositivo') + '</h3>' + (l.message ? '<p class="text-xs text-slate-400 leading-relaxed mb-3">' + escProd(l.message) + '</p>' : '<p class="text-xs text-slate-500 leading-relaxed mb-3">Dispositivo en venta por particular. Contáctanos para más detalles.</p>') + '<div class="mt-3"><a href="' + contactHref + '" target="_self" rel="noopener" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all"><span class="iconify" data-icon="' + contactIcon + '" data-width="14" aria-hidden="true"></span>Contactar propietario · ' + contactLabel + '</a></div></div></article>';
      }).join('');
    }

    if (window.Iconify) Iconify.scan(grid);
    grid.querySelectorAll('.reveal').forEach(function(el) { io.observe(el); });
  }

  var partnerRoleEN = {
    'CDN y Seguridad': 'CDN & Security',
    'Hosting y Deploy': 'Hosting & Deploy',
    'Base de datos': 'Database',
    'Control de versiones': 'Version control'
  };
  var partnerDescEN = {
    'Protección DDoS y aceleración web de nivel empresarial.': 'Enterprise-grade DDoS protection and web acceleration.',
    'Despliegue continuo con edge network global y cero configuración.': 'Continuous deployment with global edge network and zero configuration.',
    'Backend como servicio con PostgreSQL y APIs en tiempo real.': 'Backend-as-a-service with PostgreSQL and real-time APIs.',
    'Repositorios y colaboración en código.': 'Code repositories and collaboration.'
  };

  function renderPartners() {
    var lang = currentLang || 'es';
    var partners = JSON.parse(localStorage.getItem('partners') || '[]');
    var grid = document.getElementById('partnersGrid');
    if (!grid) return;
    grid.innerHTML = partners.map(function(x) {
      var visitLabel = lang === 'en' ? 'Visit site' : 'Visitar sitio';
      var roleText = lang === 'en' ? (partnerRoleEN[x.role] || x.role) : x.role;
      var descText = lang === 'en' ? (partnerDescEN[x.desc] || x.desc) : x.desc;
      return '<a href="' + x.url + '" target="_self" rel="noopener" class="partner-card p-5 flex flex-col gap-3 group"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center"><span class="iconify ' + x.color + '" data-icon="' + x.icon + '" data-width="18" aria-hidden="true"></span></div><div><p class="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">' + x.name + '</p><p class="text-[10px] text-red-500 font-mono">' + roleText + '</p></div></div><p class="text-xs text-slate-400 leading-relaxed">' + descText + '</p><div class="flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-white transition-colors mt-auto"><span>' + visitLabel + '</span><span class="iconify" data-icon="lucide:arrow-up-right" data-width="11" aria-hidden="true"></span></div></a>';
    }).join('');
    if (window.Iconify) Iconify.scan(grid);
  }

  function applySiteConfig() {
    var cfg = JSON.parse(localStorage.getItem('siteConfig') || '{}');
    var heroTitle = document.querySelector('#hero h1');
    var heroDesc = heroTitle ? heroTitle.nextElementSibling : null;
    var heroParts = heroTitle ? heroTitle.querySelectorAll('span') : [];
    if (heroParts[0] && cfg.hero_h1_es) heroParts[0].textContent = cfg.hero_h1_es;
    if (heroParts[1] && cfg.hero_h1_accent_es) heroParts[1].textContent = cfg.hero_h1_accent_es;
    if (heroDesc && cfg.hero_desc_es) heroDesc.innerHTML = cfg.hero_desc_es;

    var serviciosTitle = document.getElementById('servicios-title');
    if (serviciosTitle && cfg.svc_title_es) serviciosTitle.textContent = cfg.svc_title_es;
    if (serviciosTitle && serviciosTitle.nextElementSibling && cfg.svc_subtitle_es) serviciosTitle.nextElementSibling.textContent = cfg.svc_subtitle_es;

    var aboutTitle = document.getElementById('sobremi-title');
    if (aboutTitle && cfg.about_title_es) aboutTitle.textContent = cfg.about_title_es;
    if (aboutTitle && aboutTitle.nextElementSibling && cfg.about_p1_es) aboutTitle.nextElementSibling.innerHTML = cfg.about_p1_es;
    if (aboutTitle && aboutTitle.nextElementSibling && aboutTitle.nextElementSibling.nextElementSibling && cfg.about_p2_es) aboutTitle.nextElementSibling.nextElementSibling.innerHTML = cfg.about_p2_es;

    var proyectosTitle = document.getElementById('proyectos-title');
    if (proyectosTitle && cfg.proj_title_es) proyectosTitle.textContent = cfg.proj_title_es;
    if (proyectosTitle && proyectosTitle.nextElementSibling && cfg.proj_subtitle_es) proyectosTitle.nextElementSibling.textContent = cfg.proj_subtitle_es;

    var contactoTitle = document.getElementById('contacto-title');
    if (contactoTitle && cfg.contact_title_es) contactoTitle.textContent = cfg.contact_title_es;
    if (contactoTitle && contactoTitle.nextElementSibling && cfg.contact_desc_es) contactoTitle.nextElementSibling.innerHTML = cfg.contact_desc_es;

    var footerDesc = document.querySelector('footer .grid p.text-sm.text-slate-500');
    if (footerDesc && cfg.footer_desc) footerDesc.innerHTML = cfg.footer_desc;

    var footerCopyright = document.querySelector('footer .pt-7 p');
    if (footerCopyright && cfg.copyright) footerCopyright.textContent = cfg.copyright;
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    var icon = t === 'dark' ? 'lucide:moon' : 'lucide:sun';
    ['themeIconDesktop', 'themeIconMobile', 'themeIconMenu'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute('data-icon', icon);
    });
    var lbl = document.getElementById('themeLabelMenu');
    if (lbl) lbl.textContent = t === 'dark' ? (typeof currentLang !== 'undefined' && currentLang === 'en' ? 'Dark' : 'Oscuro') : (typeof currentLang !== 'undefined' && currentLang === 'en' ? 'Light' : 'Claro');
  }
  window.toggleTheme = function() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  };
  applyTheme(localStorage.getItem('theme') || 'dark');

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-es]').forEach(function(el) {
      el.innerHTML = lang === 'es' ? el.getAttribute('data-es') : el.getAttribute('data-en');
    });
    document.querySelectorAll('[data-ph-es]').forEach(function(el) {
      el.placeholder = lang === 'es' ? el.getAttribute('data-ph-es') : el.getAttribute('data-ph-en');
    });
    document.querySelectorAll('[data-aria-es]').forEach(function(el) {
      el.setAttribute('aria-label', lang === 'es' ? el.getAttribute('data-aria-es') : el.getAttribute('data-aria-en'));
    });
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
    document.documentElement.lang = lang;
    document.title = lang === 'es'
      ? 'Diseñador & Desarrollador Web | Páginas Web y Chatbots IA | AngelTech Solutions'
      : 'Web Designer & Developer | Websites and AI Chatbots | AngelTech Solutions';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', lang === 'es'
        ? 'AngelTech Solutions diseña y desarrolla páginas web profesionales en Puerto Rico, con automatización y chatbots con IA para negocios que quieren verse mejor y conseguir más clientes.'
        : 'AngelTech Solutions designs and develops professional websites in Puerto Rico, with automation and AI chatbots for businesses that want to look better and get more clients.');
    }
    renderProducts();
    renderPartners();
    renderUserReviews();
    refreshThemeLabel();
  }
  window.toggleLang = function() {
    applyLang(currentLang === 'es' ? 'en' : 'es');
  };
  function refreshThemeLabel() {
    var t = document.documentElement.getAttribute('data-theme') || 'dark';
    var lbl = document.getElementById('themeLabelMenu');
    if (lbl) lbl.textContent = t === 'dark' ? (currentLang === 'en' ? 'Dark' : 'Oscuro') : (currentLang === 'en' ? 'Light' : 'Claro');
  }
  applyLang(currentLang);
  if (typeof refreshThemeLabel === 'function') refreshThemeLabel();

  (function welcomePopup() {
    var modal = document.getElementById('welcomeModal');
    if (!modal) return;
    var SEEN_KEY = 'welcomePopupSeen';

    function closeWelcome() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
    }

    var esBtn = document.getElementById('welcomeLangEs');
    var enBtn = document.getElementById('welcomeLangEn');
    var quoteBtn = document.getElementById('welcomeQuoteBtn');
    var closeBtn = document.getElementById('welcomeModalClose');

    if (esBtn) esBtn.addEventListener('click', function() { applyLang('es'); closeWelcome(); });
    if (enBtn) enBtn.addEventListener('click', function() { applyLang('en'); closeWelcome(); });
    if (quoteBtn) quoteBtn.addEventListener('click', function() {
      closeWelcome();
      setTimeout(function() {
        var contacto = document.getElementById('contacto');
        if (contacto) contacto.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    });
    if (closeBtn) closeBtn.addEventListener('click', closeWelcome);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeWelcome(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeWelcome();
    });

    var alreadySeen = false;
    try { alreadySeen = !!sessionStorage.getItem(SEEN_KEY); } catch (e) {}
    if (!alreadySeen) {
      setTimeout(function() {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (window.Iconify) Iconify.scan(modal);
      }, 400);
    }
  })();

  var mobileMenu = document.getElementById('mobileMenu');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuBtn = document.getElementById('menuBtn');
  function openMenu() {
    mobileMenu.classList.add('open');
    menuOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    mobileMenu.classList.remove('open');
    menuOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  var closeMenuBtn = document.getElementById('closeMenu');
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
  document.querySelectorAll('.mobile-link').forEach(function(l) { l.addEventListener('click', closeMenu); });

  window.addEventListener('scroll', function() {
    document.getElementById('mainNav').style.borderBottomColor = window.scrollY > 40 ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)';
  }, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      var href = this.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var heading = target.querySelector('h1,h2,h3');
        var focusEl = heading || target;
        if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
        focusEl.focus({ preventScroll: true });
      }
    });
  });

  var toast = document.getElementById('toast');
  var toastClose = document.getElementById('toastClose');
  if (toastClose && toast) {
    toastClose.addEventListener('click', function() { toast.classList.remove('show'); });
  }

  window.toggleServiceFields = function(val) {
    var otroWrap = document.getElementById('otroServiceWrap');
    var otroInp = document.getElementById('otroServiceInput');
    var venderWrap = document.getElementById('venderDeviceWrap');
    if (val === 'otro') {
      otroWrap.classList.remove('hidden');
      otroInp.required = true;
    } else {
      otroWrap.classList.add('hidden');
      otroInp.required = false;
      otroInp.value = '';
    }
    if (val === 'vender') {
      venderWrap.classList.remove('hidden');
    } else {
      venderWrap.classList.add('hidden');
    }
  };
  window.toggleOtroService = window.toggleServiceFields;

  (function() {
    var inp = document.getElementById('devicePhotoInput');
    var preview = document.getElementById('devicePhotoPreview');
    if (!inp || !preview) return;
    var files = [];
    inp.addEventListener('change', function() {
      var added = Array.from(this.files).slice(0, 5 - files.length);
      added.forEach(function(f) {
        if (files.length >= 5) return;
        files.push(f);
        var reader = new FileReader();
        reader.onload = function(ev) {
          var idx = files.length - 1;
          var item = document.createElement('div');
          item.className = 'photo-preview-item';
          item.innerHTML = '<img src="' + ev.target.result + '" alt="Vista previa de la foto ' + (idx + 1) + ' del dispositivo" loading="lazy" decoding="async"><button class="remove-photo" onclick="removeDevicePhoto(' + idx + ',this.parentNode)" title="Quitar foto">✕</button>';
          preview.appendChild(item);
        };
        reader.readAsDataURL(f);
      });
      this.value = '';
    });
    window._devicePhotoFiles = files;
  })();
  window.removeDevicePhoto = function(idx, el) {
    if (window._devicePhotoFiles) window._devicePhotoFiles.splice(idx, 1);
    if (el) el.remove();
  };

  (function() {
    var base64 = '';
    window._getReviewPhoto = function() { return base64; };
    window._clearReviewPhoto = function() {
      base64 = '';
      var inp = document.getElementById('reviewPhotoFile');
      if (inp) inp.value = '';
      var ph = document.getElementById('reviewPhotoPlaceholder');
      var pv = document.getElementById('reviewPhotoPreview');
      if (ph) ph.classList.remove('hidden');
      if (pv) pv.classList.add('hidden');
    };
    var fileInp = document.getElementById('reviewPhotoFile');
    if (!fileInp) return;
    fileInp.addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var max = 320;
          var w = img.width;
          var h = img.height;
          if (w > h) {
            if (w > max) {
              h = Math.round(h * max / w);
              w = max;
            }
          } else if (h > max) {
            w = Math.round(w * max / h);
            h = max;
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          base64 = canvas.toDataURL('image/jpeg', 0.82);
          document.getElementById('reviewPhotoImg').src = base64;
          document.getElementById('reviewPhotoPlaceholder').classList.add('hidden');
          document.getElementById('reviewPhotoPreview').classList.remove('hidden');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    var rmBtn = document.getElementById('reviewPhotoRemoveBtn');
    if (rmBtn) rmBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window._clearReviewPhoto();
    });
  })();

  window.requestService = function(svc, customLabel) {
    if (window.__setServiceSelectValue) {
      window.__setServiceSelectValue(svc);
    } else {
      document.getElementById('serviceInput').value = svc;
    }
    if (typeof window.toggleServiceFields === 'function') window.toggleServiceFields(svc);
    if (svc === 'otro' && customLabel && document.getElementById('otroServiceInput')) {
      document.getElementById('otroServiceInput').value = customLabel;
    }
    document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
  };

  function showServicesSection() {
    var catalog = document.getElementById('servicesCatalog');
    var extra = document.getElementById('servicios-completos');
    var reveal = document.getElementById('servicesRevealWrap');
    if (catalog) catalog.classList.remove('hidden');
    if (extra) extra.classList.remove('hidden');
    if (reveal) reveal.classList.add('hidden');
  }

  window.goToServices = function(focusCatalog) {
    var section = document.getElementById('servicios');
    var catalog = document.getElementById('servicesCatalog');
    var menu = document.getElementById('mobileMenu');
    var overlay = document.getElementById('menuOverlay');
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
    showServicesSection();
    if (section) section.scrollIntoView({ behavior: 'smooth' });
    if (focusCatalog && catalog) {
      setTimeout(function() { catalog.focus(); }, 450);
    }
  };

  (function initServicesDoneCounter() {
    var counter = document.getElementById('servicesDoneCounter');
    var section = document.getElementById('sobre-mi');
    if (!counter || !section) return;
    var started = false;
    function animateCounter() {
      if (started) return;
      started = true;
      var target = parseInt(counter.getAttribute('data-counter-target') || '120', 10);
      var suffix = counter.getAttribute('data-counter-suffix') || '';
      var duration = 1200;
      var startTime = null;
      function step(timestamp) {
        if (startTime === null) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.floor(target * eased);
        counter.textContent = value + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          counter.textContent = target + suffix;
        }
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            animateCounter();
            observer.disconnect();
          }
        });
      }, { threshold: 0.35 });
      observer.observe(section);
    } else {
      animateCounter();
    }
  })();

  window.toggleServiceInfo = function(service, trigger) {
    var panel = document.getElementById('service-info-' + service);
    if (!panel) return;
    var isOpen = panel.classList.contains('open');
    document.querySelectorAll('.service-details.open').forEach(function(el) {
      el.classList.remove('open');
      el.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('[data-service-toggle]').forEach(function(btn) {
      btn.setAttribute('aria-expanded', 'false');
    });
    if (isOpen) return;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  };

  (function() {
    try {
      var params = new URLSearchParams(window.location.search);
      var service = params.get('service');
      var product = params.get('product');
      var openContact = params.get('openContact') === '1';
      if (window.location.hash === '#servicios') showServicesSection();
      if (service && document.getElementById('serviceInput')) {
        if (window.__setServiceSelectValue) {
          window.__setServiceSelectValue(service);
        } else {
          var svcEl = document.getElementById('serviceInput');
          svcEl.value = service;
          svcEl.dispatchEvent(new Event('change'));
        }
      }
      if (product && document.getElementById('messageInput')) {
        document.getElementById('messageInput').value = currentLang === 'en'
          ? 'Hello, I am interested in the product: ' + product + '. Could you give me more information?'
          : 'Hola, me interesa el producto: ' + product + '. ¿Podría darme más información?';
      }
      if (service && openContact) {
        setTimeout(function() {
          document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } catch (e) {}
  })();

  window.inquireProduct = function(name) {
    document.getElementById('serviceInput').value = 'producto';
    var msg = currentLang === 'en' ? 'Hello, I am interested in the product: ' + name + '. Could you give me more information?' : 'Hola, me interesa el producto: ' + name + '. ¿Podría darme más información?';
    document.getElementById('messageInput').value = msg;
    document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
  };

  var galleryProds = [];
  var galleryIdx = 0;
  var galleryImgIdx = 0;
  var galleryTrigger = null;
  var profileTrigger = null;

  function setGalleryImg(n) {
    var prod = galleryProds[galleryIdx];
    if (!prod) return;
    var imgs = prod.images || [];
    if (!imgs.length) return;
    galleryImgIdx = (n + imgs.length) % imgs.length;
    var el = document.getElementById('galleryMainImg');
    if (el) {
      el.src = imgs[galleryImgIdx];
      el.alt = prod.name + ' — foto ' + (galleryImgIdx + 1);
    }
    var counter = document.getElementById('galleryCounter');
    if (counter) counter.textContent = (galleryImgIdx + 1) + ' / ' + imgs.length;
    document.querySelectorAll('.gallery-dot').forEach(function(d, i) { d.classList.toggle('active', i === galleryImgIdx); });
    document.querySelectorAll('.gallery-thumb').forEach(function(t, i) { t.classList.toggle('active', i === galleryImgIdx); });
  }

  window.openGallery = function(prodId, startIdx) {
    var prods = JSON.parse(localStorage.getItem('products') || '[]');
    galleryProds = prods;
    galleryIdx = prods.findIndex(function(p) { return p.id === prodId || p.id === parseInt(prodId, 10); });
    if (galleryIdx < 0) galleryIdx = 0;
    var prod = prods[galleryIdx];
    if (!prod) return;
    var imgs = prod.images || [];
    var nameEl = document.getElementById('galleryProductName');
    if (nameEl) nameEl.textContent = prod.name + ' — ' + prod.price;
    var thumbs = document.getElementById('galleryThumbs');
    var dots = document.getElementById('galleryDots');
    if (thumbs) thumbs.innerHTML = imgs.map(function(src, i) { return '<button onclick="galSetImg(' + i + ')" aria-label="Ver foto ' + (i + 1) + ' de ' + imgs.length + '" class="gallery-thumb' + (i === 0 ? ' active' : '') + '" type="button"><img src="' + src + '" alt="Miniatura ' + (i + 1) + ' del producto ' + prod.name + '" loading="lazy" decoding="async"></button>'; }).join('');
    if (dots) dots.innerHTML = imgs.map(function(_, i) { return '<button type="button" class="gallery-dot' + (i === 0 ? ' active' : '') + '" onclick="galSetImg(' + i + ')" aria-label="Foto ' + (i + 1) + ' de ' + imgs.length + '"></button>'; }).join('');
    setGalleryImg(startIdx || 0);
    var modal = document.getElementById('galleryModal');
    if (modal) {
      modal.setAttribute('aria-label', 'Galería de fotos de ' + prod.name);
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      galleryTrigger = document.activeElement;
      var closeBtn = modal.querySelector('button[aria-label="Cerrar galería"]');
      if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 60);
    }
    if (window.Iconify) Iconify.scan(modal);
  };
  window.galSetImg = function(n) { setGalleryImg(n); };
  window.galleryStep = function(dir) { setGalleryImg(galleryImgIdx + dir); };
  window.closeGallery = function() {
    var modal = document.getElementById('galleryModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
    if (galleryTrigger) {
      galleryTrigger.focus();
      galleryTrigger = null;
    }
  };

  document.addEventListener('keydown', function(e) {
    var gm = document.getElementById('galleryModal');
    if (gm && gm.classList.contains('open')) {
      if (e.key === 'ArrowLeft') window.galleryStep(-1);
      else if (e.key === 'ArrowRight') window.galleryStep(1);
      else if (e.key === 'Escape') window.closeGallery();
    }
    var pm = document.getElementById('profileModal');
    if (pm && pm.classList.contains('open') && e.key === 'Escape') window.closeProfile();
    var mm = document.getElementById('mobileMenu');
    if (mm && mm.classList.contains('open') && e.key === 'Escape') closeMenu();
  });

  window.openProfile = function(data) {
    var photo = data.photo || '';
    var name = data.name || '';
    var role = data.role || '';
    var years = data.years || 0;
    var website = data.website || '';
    var instagram = data.instagram || '';
    var linkedin = data.linkedin || '';
    var photoEl = document.getElementById('profilePhoto');
    if (photoEl) {
      if (photo) {
        photoEl.src = photo;
        photoEl.onerror = function() { this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=EF4444&color=fff&size=80'; };
      } else {
        photoEl.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=EF4444&color=fff&size=80';
      }
    }
    var nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = name;
    var roleEl = document.getElementById('profileRole');
    if (roleEl) roleEl.textContent = role;
    var yearsWrap = document.getElementById('profileYearsWrap');
    var yearsEl = document.getElementById('profileYears');
    if (yearsWrap && yearsEl) {
      if (years > 0) {
        yearsWrap.classList.remove('hidden');
        yearsEl.textContent = currentLang === 'en'
          ? years + ' year' + (years === 1 ? '' : 's') + ' of professional experience'
          : years + ' año' + (years === 1 ? '' : 's') + ' de experiencia profesional';
      } else {
        yearsWrap.classList.add('hidden');
      }
    }
    var links = document.getElementById('profileLinks');
    if (links) {
      var html = '';
      if (website) html += '<a href="https://' + website.replace(/^https?:\/\//, '') + '" target="_self" rel="noopener" class="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs text-slate-300 hover:text-white hover:border-white/15 transition-all"><span class="iconify text-red-500 flex-shrink-0" data-icon="lucide:globe" data-width="14" aria-hidden="true"></span><span class="truncate">' + website.replace(/^https?:\/\//, '') + '</span><span class="iconify ml-auto text-slate-600" data-icon="lucide:arrow-up-right" data-width="11" aria-hidden="true"></span></a>';
      if (instagram) html += '<a href="https://instagram.com/' + instagram.replace(/^@/, '') + '" target="_self" rel="noopener" class="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs text-slate-300 hover:text-white hover:border-white/15 transition-all"><span class="iconify text-pink-500 flex-shrink-0" data-icon="lucide:instagram" data-width="14" aria-hidden="true"></span><span>@' + instagram.replace(/^@/, '') + '</span><span class="iconify ml-auto text-slate-600" data-icon="lucide:arrow-up-right" data-width="11" aria-hidden="true"></span></a>';
      if (linkedin) html += '<a href="https://' + linkedin.replace(/^https?:\/\//, '') + '" target="_self" rel="noopener" class="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs text-slate-300 hover:text-white hover:border-white/15 transition-all"><span class="iconify text-blue-500 flex-shrink-0" data-icon="lucide:linkedin" data-width="14" aria-hidden="true"></span><span class="truncate">LinkedIn</span><span class="iconify ml-auto text-slate-600" data-icon="lucide:arrow-up-right" data-width="11" aria-hidden="true"></span></a>';
      links.innerHTML = html || '<p class="text-xs text-slate-600">' + (currentLang === 'en' ? 'No social media available.' : 'No hay redes sociales disponibles.') + '</p>';
      if (window.Iconify) Iconify.scan(links);
    }
    var modal = document.getElementById('profileModal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      profileTrigger = document.activeElement;
      var closeBtn = document.getElementById('profileCloseBtn');
      if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 60);
    }
  };
  window.closeProfile = function() {
    var modal = document.getElementById('profileModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
    if (profileTrigger) {
      profileTrigger.focus();
      profileTrigger = null;
    }
  };

  var chatBusy = false;
  var chatHistory = [];
  function readGK() {
    try {
      var enc = localStorage.getItem('_gk');
      if (enc) return atob(enc);
    } catch (x) {}
    return localStorage.getItem('GEMINI_KEY') || null;
  }
  var GEMINI_KEY = readGK();
  var GEMINI_URL = GEMINI_KEY ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY : null;

  function buildSystemPrompt() {
    var info = localStorage.getItem('botInfo') || 'Empresa: AngelTech Solutions — Barranquitas, Puerto Rico 00794. Creador: Angel Colón. Servicios: Diseño Web desde $150 (sitio completo desde $400, 3-5 días / 1-3 semanas). Programación Frontend. Agentes IA/Chatbots con GPT, Claude, Gemini (1-2 semanas). Productos: iPhone 17 Pro Max $1299, iPhone 17 Pro $1099, iPhone 16 $500, Samsung S25 Ultra $1199, MacBook Pro M4 $1999, iPad Pro M4 $1099. Contacto: contacto@angeltechsolutions.dev y soporte-tecnico@angeltechsolutions.dev.';
    var faqs = JSON.parse(localStorage.getItem('botFaqs') || '[]');
    var faqText = faqs.filter(function(f) { return f.q && f.a; }).map(function(f) { return 'P: ' + f.q + '\nR: ' + f.a; }).join('\n');
    return 'Eres AngelBot, el asistente virtual de AngelTech Solutions.\n\n' +
      'INFORMACIÓN DE LA EMPRESA:\n' + info + '\n\n' +
      (faqText ? 'RESPUESTAS FIJAS (úsalas exactamente cuando apliquen):\n' + faqText + '\n\n' : '') +
      'REGLAS:\n' +
      '- Responde en el idioma del usuario (español o inglés).\n' +
      '- Eres un asistente general: puedes responder cualquier pregunta, no solo de tecnología.\n' +
      '- Cuando pregunten sobre la empresa, usa la información de arriba.\n' +
      '- Usa Google Search cuando necesites información actualizada o que no conozcas.\n' +
      '- Sé breve, claro y amigable.\n' +
      '- Nunca inventes datos de la empresa.';
  }
  var GEMINI_SYSTEM = buildSystemPrompt();

  window.setGeminiKey = function(key, persist) {
    GEMINI_KEY = key || null;
    if (persist) {
      try {
        localStorage.setItem('_gk', btoa(GEMINI_KEY));
      } catch (x) {
        localStorage.setItem('GEMINI_KEY', GEMINI_KEY);
      }
    }
    GEMINI_URL = GEMINI_KEY ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY : null;
  };

  function addMsg(text, cls, id) {
    var container = document.getElementById('chatMessages');
    if (!container) return null;
    var d = document.createElement('div');
    d.className = cls;
    if (id) d.id = id;
    d.textContent = text;
    container.appendChild(d);
    requestAnimationFrame(function() { container.scrollTop = container.scrollHeight; });
    return d;
  }

  window.sendChat = function() {
    var input = document.getElementById('chatInput');
    if (!input || chatBusy) return;
    var t = input.value.trim();
    if (!t) return;
    input.value = '';
    addMsg(t, 'msg-user');
    geminiReply(t);
  };

  window.sendQuickReply = function(t) {
    if (chatBusy) return;
    addMsg(t, 'msg-user');
    geminiReply(t);
  };

  window.connectToGemini = function() {
    try {
      addMsg('Conectando a Gemini...', 'msg-bot', 'chatConnecting');
      if (!GEMINI_KEY) {
        var k = prompt('Introduce tu API key de Gemini (Google Cloud). Se guardará en tu navegador para futuras sesiones.\nSi no quieres guardarla, vuelve a cargar y pega cuando se te pida.');
        if (!k) {
          addMsg('Conexión cancelada: se requiere API key para usar Gemini.', 'msg-bot');
          var c = document.getElementById('chatConnecting');
          if (c) c.remove();
          return;
        }
        window.setGeminiKey(k, true);
        addMsg('API key guardada localmente. Intentando conectar...', 'msg-bot');
      }
      if (window.sendQuickReply && typeof window.sendQuickReply === 'function') {
        window.sendQuickReply('Hola');
      }
    } catch (err) {
      console.error('connectToGemini error', err);
    }
  };

  var botRules = [
    { k: ['hola', 'hello', 'hi', 'buenas', 'saludos', 'hey'], r: '¡Hola! Soy AngelBot. ¿En qué puedo ayudarte hoy? Pregúntame sobre servicios, productos o contacto.' },
    { k: ['servicio', 'servicios', 'ofreces', 'haces', 'ayudas'], r: 'Ofrezco 3 servicios:\n• Diseño Web\n• Programación Frontend\n• Agentes IA / Chatbots\n\n¿Sobre cuál quieres saber más?' },
    { k: ['diseño', 'diseno', 'landing', 'web', 'pagina', 'página'], r: 'Diseño Web incluye:\n• Diseño responsivo mobile-first\n• UI/UX optimizado\n• Entrega en 3-5 días / 1-3 semanas' },
    { k: ['frontend', 'javascript', 'css', 'programacion', 'programación', 'código', 'codigo'], r: 'Programación Frontend:\n• JavaScript moderno\n• CSS avanzado y animaciones\n• Integración con APIs\n• Sitios rápidos y optimizados' },
    { k: ['chatbot', 'bot', 'ia', 'inteligencia', 'agente', 'gemini', 'gpt', 'claude'], r: 'Agentes IA / Chatbots:\n• Integración con GPT, Claude, Gemini\n• Personalización total\n• Responden 24/7\n• Entrega en 1-2 semanas' },
    { k: ['precio', 'precios', 'costo', 'cuanto', 'cuánto', 'cuesta', 'cobras', 'valor', 'cotizacion', 'cotización'], r: 'El precio depende del alcance de tu proyecto. Escríbeme y te envío un presupuesto gratis y sin compromiso.' },
    { k: ['tiempo', 'plazo', 'tarda', 'demora', 'rapido', 'rápido', 'cuando', 'cuándo'], r: 'Tiempos estimados:\n• Landing page: 3-5 días\n• Sitio completo: 1-3 semanas\n• Chatbot IA: 1-2 semanas' },
    { k: ['contacto', 'contactar', 'email', 'correo', 'escribir', 'mensaje'], r: 'Puedes escribirme a:\ncontacto@angeltechsolutions.dev\nsoporte-tecnico@angeltechsolutions.dev\n\nTambién puedes usar el formulario en la sección Contacto de este sitio.' },
    { k: ['iphone', 'samsung', 'mac', 'macbook', 'ipad', 'celular', 'telefono', 'teléfono', 'producto', 'productos', 'equipo'], r: 'Productos disponibles:\n• iPhone 17 Pro Max — $1,299\n• iPhone 17 Pro — $1,099\n• iPhone 16 — $500\n• Samsung Galaxy S25 Ultra — $1,199\n• MacBook Pro M4 — $1,999\n• iPad Pro M4 — $1,099' },
    { k: ['puerto rico', 'pr', 'isla', 'donde', 'dónde', 'ubicado'], r: 'Estoy ubicado en Puerto Rico 🇵🇷\nTrabajo con clientes locales y de todo el mundo de forma remota.' },
    { k: ['gracias', 'thanks', 'perfecto', 'genial', 'excelente', 'chevere', 'chévere'], r: '¡De nada! ¿Hay algo más en lo que pueda ayudarte? 😊' },
    { k: ['quien', 'quién', 'eres', 'angel', 'angeltech'], r: 'Soy AngelBot, el asistente virtual de AngelTech Solutions — empresa de desarrollo web y tecnología de Angel Colón, basada en Puerto Rico.' }
  ];

  function localReply(msg) {
    var l = (msg || '').toLowerCase();
    for (var i = 0; i < botRules.length; i++) {
      if (botRules[i].k.some(function(k) { return l.includes(k); })) return botRules[i].r;
    }
    return 'Buena pregunta. Para una respuesta detallada escríbeme a:\ncontacto@angeltechsolutions.dev\nsoporte-tecnico@angeltechsolutions.dev\n\n¿Hay algo más en lo que pueda ayudarte?';
  }

  function geminiReply(userText) {
    if (chatBusy) return;
    chatBusy = true;
    var key = readGK();
    var url = key ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key : null;
    var system = buildSystemPrompt();
    var sendBtn = document.querySelector('#chatbotWindow button[onclick="sendChat()"]');
    var inp = document.getElementById('chatInput');
    if (sendBtn) sendBtn.disabled = true;
    if (inp) inp.disabled = true;
    chatHistory.push({ role: 'user', parts: [{ text: userText }] });
    addMsg('● ● ●', 'msg-bot', 'chatTyping');

    function finish(reply) {
      var t = document.getElementById('chatTyping');
      if (t) t.remove();
      addMsg(reply, 'msg-bot');
      chatBusy = false;
      if (sendBtn) sendBtn.disabled = false;
      if (inp) {
        inp.disabled = false;
        inp.focus();
      }
    }

    if (!url) {
      finish(localReply(userText));
      return;
    }

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tools: [{ google_search: {} }],
        system_instruction: { parts: [{ text: system }] },
        contents: chatHistory
      })
    }).then(function(res) {
      return res.json();
    }).then(function(data) {
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        var reply = data.candidates[0].content.parts[0].text || '';
        chatHistory.push({ role: 'model', parts: [{ text: reply }] });
        finish(reply);
      } else {
        finish(localReply(userText));
      }
    }).catch(function() {
      finish(localReply(userText));
    });
  }

  var faqItems = document.querySelectorAll('details.faq-item');
  faqItems.forEach(function(det) {
    det.addEventListener('toggle', function() {
      if (!this.open) return;
      faqItems.forEach(function(other) {
        if (other !== det && other.open) other.removeAttribute('open');
      });
    });
  });

  var avatarColors = ['bg-red-500/10 text-red-400 border-red-500/20', 'bg-blue-500/10 text-blue-400 border-blue-500/20', 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 'bg-violet-500/10 text-violet-400 border-violet-500/20', 'bg-amber-500/10 text-amber-400 border-amber-500/20', 'bg-sky-500/10 text-sky-400 border-sky-500/20'];
  function starsHTML(n) {
    var s = '';
    for (var i = 0; i < 5; i++) s += i < n ? '★' : '☆';
    return s;
  }

  function renderUserReviews() {
    var grid = document.getElementById('userReviewsGrid');
    if (!grid) return;
    function reviewCardHTML(r, i) {
      var col = avatarColors[i % avatarColors.length];
      var initial = (r.name || '?')[0].toUpperCase();
      var stars = starsHTML(parseInt(r.rating, 10) || 5);
      var role = r.role ? '<p class="text-[10px] text-slate-500">' + r.role + '</p>' : '';
      var starsLabel = (parseInt(r.rating || 5, 10)) + ' de 5 estrellas';
      var hasProfile = r.photo || r.website || r.instagram || r.linkedin || r.years;
      var avatarHtml = r.photo ? '<button onclick="openProfile(window._userReviews[' + i + '])" class="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden ring-2 ring-red-500/30 hover:ring-red-500/60 transition-all" title="Ver perfil" aria-label="Ver perfil de ' + r.name + '"><img src="' + r.photo + '" alt="Foto de perfil de ' + r.name + '" class="w-full h-full object-cover" loading="lazy" decoding="async"></button>' : (hasProfile ? '<button onclick="openProfile(window._userReviews[' + i + '])" class="r-avatar border ' + col + ' hover:ring-2 hover:ring-red-500/40 transition-all" title="Ver perfil">' + initial + '</button>' : '<div class="r-avatar border ' + col + '">' + initial + '</div>');
      return '<article class="review-card testimonial-item"><div class="r-header">' + avatarHtml + '<div><p class="text-sm font-semibold text-white">' + r.name + '</p>' + role + '</div></div><div class="r-stars" aria-label="' + starsLabel + '">' + stars + '</div><blockquote>"' + (r.text || '') + '"</blockquote></article>';
    }
    function paintReviews(reviews) {
      if (!reviews.length) {
        grid.innerHTML = '<div class="text-center py-10 text-slate-500 text-sm">Aún no hay testimonios aprobados.</div>';
        return;
      }
      window._userReviews = reviews.slice();
      var firstPass = window._userReviews.map(function(r, i) { return reviewCardHTML(r, i); }).join('');
      var duplicatedPass = window._userReviews.map(function(r, i) {
        return reviewCardHTML(r, i).replace('<article class="review-card testimonial-item"', '<article class="review-card testimonial-item" aria-hidden="true"');
      }).join('');
      grid.innerHTML = '<div class="testimonials-marquee" aria-label="Testimonios de clientes en movimiento"><div class="testimonials-track">' + firstPass + duplicatedPass + '</div></div>';
    }
    if (window.supabaseRestRequest) {
      window.supabaseRestRequest('reviews?select=*&status=eq.aprobada&order=created_at.asc,id.asc')
        .then(function(rows) { paintReviews(rows || []); })
        .catch(function() { paintReviews([]); });
    }
  }

  var reviewTextArea = document.getElementById('reviewText');
  var reviewCharCount = document.getElementById('reviewCharCount');
  if (reviewTextArea && reviewCharCount) {
    reviewTextArea.addEventListener('input', function() {
      reviewCharCount.textContent = this.value.length;
    });
  }

  var reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = (document.getElementById('reviewName').value || '').trim();
      var role = (document.getElementById('reviewRole').value || '').trim();
      var text = (document.getElementById('reviewText').value || '').trim();
      var rating = document.querySelector('input[name="rating"]:checked');
      var photo = (window._getReviewPhoto && window._getReviewPhoto()) || '';
      var years = parseInt((document.getElementById('reviewYears') ? document.getElementById('reviewYears').value : '') || '0', 10) || 0;
      var website = (document.getElementById('reviewWebsite') ? document.getElementById('reviewWebsite').value : '').trim();
      var instagram = (document.getElementById('reviewInstagram') ? document.getElementById('reviewInstagram').value : '').trim();
      var linkedin = (document.getElementById('reviewLinkedin') ? document.getElementById('reviewLinkedin').value : '').trim();
      var municipio = (document.getElementById('reviewMunicipio') ? document.getElementById('reviewMunicipio').value : '').trim();
      var servicio = (document.getElementById('reviewServicio') ? document.getElementById('reviewServicio').value : '').trim();
      var autorizaEl = document.querySelector('input[name="reviewAutoriza"]:checked');
      var errEl = document.getElementById('reviewError');
      var okEl = document.getElementById('reviewSuccess');
      errEl.classList.add('hidden');
      okEl.classList.add('hidden');
      if (!name || !text || !municipio || !servicio || !autorizaEl) {
        errEl.textContent = currentLang === 'en'
          ? 'Please fill in your name, municipality, service, review and the publication authorization.'
          : 'Por favor completa tu nombre, municipio, servicio, reseña y la autorización de publicación.';
        errEl.classList.remove('hidden');
        return;
      }
      function onSuccess() {
        reviewForm.reset();
        if (window._clearReviewPhoto) window._clearReviewPhoto();
        reviewCharCount.textContent = '0';
        okEl.classList.remove('hidden');
        setTimeout(function() { okEl.classList.add('hidden'); }, 4000);
      }
      function onError(msg) {
        errEl.textContent = msg || 'Error al enviar. Intenta de nuevo.';
        errEl.classList.remove('hidden');
      }
      if (window.supabaseRestRequest) {
        window.supabaseRestRequest('rpc/submit_review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            p_name: name,
            p_role: role,
            p_text: text,
            p_rating: parseInt(rating ? rating.value : '5', 10) || 5,
            p_photo: photo,
            p_years: years,
            p_website: website,
            p_instagram: instagram,
            p_linkedin: linkedin,
            p_municipio: municipio,
            p_servicio: servicio,
            p_autoriza: autorizaEl.value === 'si'
          })
        }).then(function() {
          onSuccess();
        }).catch(function(err) {
          onError(err && err.message);
        });
      } else {
        onError('No hay conexión con la base de datos.');
      }
    });
  }

  var moreOpen = false;
  window.toggleMoreProjects = function() {
    moreOpen = !moreOpen;
    var panel = document.getElementById('moreProjects');
    var btn = document.getElementById('toggleMoreProjects');
    var lbl = document.getElementById('toggleMoreLabel');
    var icon = document.getElementById('toggleMoreIcon');
    if (moreOpen) {
      panel.style.maxHeight = '4000px';
      panel.style.opacity = '1';
      panel.removeAttribute('aria-hidden');
      btn.setAttribute('aria-expanded', 'true');
      lbl.textContent = 'Ocultar proyectos';
      icon.setAttribute('data-icon', 'lucide:chevron-up');
    } else {
      panel.style.maxHeight = '0';
      panel.style.opacity = '0';
      panel.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      lbl.textContent = 'Ver todos los proyectos';
      icon.setAttribute('data-icon', 'lucide:chevron-down');
    }
    if (window.Iconify) Iconify.scan();
  };

  function enforceExternalTargeting(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var links = scope.querySelectorAll('a[href]');
    links.forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href) return;
      try {
        var url = new URL(href, window.location.href);
        var host = url.hostname.toLowerCase();
        if (host === 'herramientasparaprogramadores.angeltechsolutions.dev' || host === 'portafolioprofesional.angeltechsolutions.dev') {
          link.setAttribute('target', '_self');
        }
      } catch (e) {}
    });
  }

  (function reorderMainSections() {
    var main = document.getElementById('main');
    if (!main) return;
    ['hero', 'video-presentacion', 'problemas', 'servicios', 'servicios-completos', 'proyectos', 'colaboradores', 'sobre-mi', 'estudios', 'skills', 'precios', 'blog-recursos', 'testimonios', 'faq', 'contacto'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) main.appendChild(el);
    });
  })();

  (function organizeSecondarySections() {
    var main = document.getElementById('main');
    var anchorSection = document.getElementById('sobre-mi');
    if (!main || !anchorSection || document.getElementById('extra-recursos')) return;

    var sectionDefs = [
      { id: 'sobre-mi', eyebrow: { es: 'Perfil', en: 'Profile' }, title: { es: 'Sobre AngelTech Solutions', en: 'About AngelTech Solutions' }, desc: { es: 'Conoce la experiencia, el enfoque y la forma de trabajo detrás de la marca.', en: 'Learn about the experience, approach and way of working behind the brand.' }, icon: 'lucide:user-round' },
      { id: 'estudios', eyebrow: { es: 'Formación', en: 'Education' }, title: { es: 'Estudios y certificaciones', en: 'Studies and certifications' }, desc: { es: 'Revisa la preparación técnica que respalda los proyectos y soluciones.', en: 'Review the technical background that supports the projects and solutions.' }, icon: 'lucide:graduation-cap' },
      { id: 'colaboradores', eyebrow: { es: 'Partners', en: 'Partners' }, title: { es: 'Colaboradores y hospedadores', en: 'Collaborators and hosts' }, desc: { es: 'Descubre las plataformas y aliados que forman parte del ecosistema de trabajo.', en: 'Discover the platforms and partners that are part of the work ecosystem.' }, icon: 'lucide:handshake' }
    ];
    var hubEyebrow = { es: 'Más información', en: 'More information' };
    var hubTitle = { es: 'Contenido adicional, mejor organizado', en: 'Additional content, better organized' };
    var hubDesc = {
      es: 'La parte principal del sitio queda enfocada en convertir. Aquí sigues teniendo acceso a productos, trayectoria, tecnología y aliados, pero en un formato más limpio y fácil de recorrer.',
      en: 'The main part of the site stays focused on converting. You still have access to products, background, technology and partners here, in a cleaner, easier-to-browse format.'
    };
    var initLang = currentLang || 'es';

    var hub = document.createElement('section');
    hub.id = 'extra-recursos';
    hub.className = 'py-24 px-5 border-t border-white/[0.05]';
    hub.setAttribute('aria-labelledby', 'extra-recursos-title');
    hub.innerHTML = '<div class="max-w-6xl mx-auto"><div class="secondary-hub-card"><div class="text-center max-w-3xl mx-auto mb-10"><span class="text-xs font-mono text-red-500 uppercase tracking-widest" data-es="' + hubEyebrow.es + '" data-en="' + hubEyebrow.en + '">' + hubEyebrow[initLang] + '</span><h2 id="extra-recursos-title" class="mt-3 text-3xl md:text-5xl font-semibold tracking-tight gradient-text" data-es="' + hubTitle.es + '" data-en="' + hubTitle.en + '">' + hubTitle[initLang] + '</h2><p class="mt-4 text-slate-400 font-light" data-es="' + hubDesc.es + '" data-en="' + hubDesc.en + '">' + hubDesc[initLang] + '</p></div><div class="secondary-stack" id="secondarySectionsStack"></div></div></div>';
    main.insertBefore(hub, anchorSection);

    var stack = document.getElementById('secondarySectionsStack');
    if (!stack) return;

    sectionDefs.forEach(function(def) {
      var section = document.getElementById(def.id);
      if (!section) return;
      section.classList.add('secondary-shell');
      var panel = document.createElement('details');
      panel.className = 'secondary-panel';
      panel.setAttribute('data-panel-for', def.id);
      panel.innerHTML = '<summary><div class="secondary-panel-copy"><div class="secondary-panel-icon" aria-hidden="true"><span class="iconify" data-icon="' + def.icon + '" data-width="18"></span></div><div class="secondary-panel-meta"><p class="text-[10px] uppercase tracking-[0.22em] text-red-400" data-es="' + def.eyebrow.es + '" data-en="' + def.eyebrow.en + '">' + def.eyebrow[initLang] + '</p><p class="text-base font-semibold text-white" data-es="' + def.title.es + '" data-en="' + def.title.en + '">' + def.title[initLang] + '</p><p data-es="' + def.desc.es + '" data-en="' + def.desc.en + '">' + def.desc[initLang] + '</p></div></div><span class="secondary-panel-chevron iconify" data-icon="lucide:chevron-down" data-width="18" aria-hidden="true"></span></summary><div class="secondary-panel-body"></div>';
      var body = panel.querySelector('.secondary-panel-body');
      if (body) body.appendChild(section);
      stack.appendChild(panel);
    });

    function openPanelForHash() {
      var hash = (location.hash || '').replace('#', '');
      if (!hash) return;
      var target = document.getElementById(hash);
      if (!target) return;
      var panel = target.closest('.secondary-panel');
      if (!panel) return;
      panel.open = true;
      setTimeout(function() {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }

    window.addEventListener('hashchange', openPanelForHash);
    if (window.Iconify) Iconify.scan();
    openPanelForHash();
  })();

  applySiteConfig();
  renderProducts();
  renderPartners();
  renderUserReviews();
  enforceExternalTargeting();

  var externalTargetObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches('a[href]')) enforceExternalTargeting(node.parentNode || document);
        else if (node.querySelectorAll) enforceExternalTargeting(node);
      });
    });
  });
  externalTargetObserver.observe(document.body, { childList: true, subtree: true });

  (function renderOfficeHours() {
    function fmt(t) {
      if (!t) return '';
      var p = t.split(':');
      var hh = parseInt(p[0], 10);
      var mm = p[1] || '00';
      var am = hh < 12;
      var h = hh % 12 || 12;
      return h + ':' + mm + ' ' + (am ? 'AM' : 'PM');
    }
    function toMins(t) {
      if (!t) return -1;
      var p = t.split(':');
      return parseInt(p[0], 10) * 60 + (parseInt(p[1], 10) || 0);
    }
    function getStatus(s) {
      var now = new Date();
      var dayOK = true;
      if (s.daysOfWeek && s.daysOfWeek.length) dayOK = s.daysOfWeek.includes(now.getDay());
      if (!dayOK) return 'closed';
      var curMins = now.getHours() * 60 + now.getMinutes();
      var startMins = toMins(s.start);
      var endMins = toMins(s.end);
      if (startMins < 0 || endMins < 0) return 'unknown';
      if (curMins < startMins || curMins >= endMins) return 'closed';
      var warnMins = parseInt(s.warnMin || 30, 10);
      if (curMins >= endMins - warnMins) return 'closing';
      return 'open';
    }
    function update() {
      try {
        var el = document.getElementById('officeHoursDisplay');
        if (!el) return;
        var raw = localStorage.getItem('SITE_SCHEDULE');
        if (!raw) {
          el.innerHTML = 'Horario: Lunes a Viernes, 8:00 AM — 5:00 PM';
          return;
        }
        var s = JSON.parse(raw);
        var hoursText = (s.days || '') + ', ' + fmt(s.start) + ' — ' + fmt(s.end);
        var st = getStatus(s);
        var badges = {
          open: '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.3);border-radius:999px;padding:2px 8px;font-size:10px;font-weight:600;margin-right:6px"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block"></span>Abierto</span>',
          closing: '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.3);border-radius:999px;padding:2px 8px;font-size:10px;font-weight:600;margin-right:6px"><span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block"></span>Cerrando pronto</span>',
          closed: '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.3);border-radius:999px;padding:2px 8px;font-size:10px;font-weight:600;margin-right:6px"><span style="width:6px;height:6px;border-radius:50%;background:#f87171;display:inline-block"></span>Cerrado</span>',
          unknown: ''
        };
        el.innerHTML = (badges[st] || '') + hoursText;
      } catch (ex) {
        var el2 = document.getElementById('officeHoursDisplay');
        if (el2) el2.textContent = 'Horario: Lunes a Viernes, 8:00 AM — 5:00 PM';
      }
    }
    update();
    setInterval(update, 60000);
  })();

  window.addEventListener('storage', function(e) {
    if (e.key === 'device_listings') renderProducts();
  });

  if (location.hash === '#contacto') {
    var sec = document.getElementById('contacto');
    if (sec) setTimeout(function() { sec.scrollIntoView({ behavior: 'smooth' }); }, 300);
  }

  window.addEventListener('storage', function(e) {
    if (e.key === 'reviews') renderUserReviews();
  });
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) renderUserReviews();
  });
})();
});
