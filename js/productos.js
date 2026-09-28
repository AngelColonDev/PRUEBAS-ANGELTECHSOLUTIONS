(window.__supabaseReady || Promise.resolve()).finally(function() {
(function() {
  function escProd(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var prodDescEN = {
    '256GB, Titanio Negro. Desbloqueado para todas las redes.': '256GB, Black Titanium. Unlocked for all networks.',
    '128GB, Titanio Natural. Cámara 48MP ProRAW.': '128GB, Natural Titanium. 48MP ProRAW camera.',
    '128GB, varios colores. Chip A18, USB-C.': '128GB, multiple colors. A18 chip, USB-C.',
    '512GB, S-Pen incluido. Snapdragon 8 Elite.': '512GB, S-Pen included. Snapdragon 8 Elite.',
    '14 pulgadas, 16GB RAM, 512GB SSD. Chip M4 Pro.': '14 inches, 16GB RAM, 512GB SSD. M4 Pro chip.',
    '11 pulgadas, 256GB, Wi-Fi. Pantalla OLED Ultra Retina.': '11 inches, 256GB, Wi-Fi. Ultra Retina OLED display.'
  };

  function getLang() {
    return (window.getLang ? window.getLang() : (localStorage.getItem('lang') || 'es'));
  }

  function renderProducts() {
    var lang = getLang();
    var products = JSON.parse(localStorage.getItem('products') || '[]');
    var grid = document.getElementById('productsGrid');
    if (!grid) return;
    if (!products.length) {
      grid.innerHTML = '<p class="text-slate-500 text-sm col-span-3 text-center py-10">' + (lang === 'en' ? 'No products available right now.' : 'No hay productos disponibles en este momento.') + '</p>';
      return;
    }

    var galleryLabel = lang === 'en' ? 'View gallery' : 'Ver galería';
    var viewPhotosLabel = lang === 'en' ? 'View photos' : 'Ver fotos';

    grid.innerHTML = products.map(function(x) {
      var badge = (x.condition || 'Nuevo') === 'Nuevo' ? 'badge-new' : 'badge-used';
      var condLabel = (x.condition || 'Nuevo') === 'Nuevo' ? (lang === 'en' ? 'New' : 'Nuevo') : (lang === 'en' ? 'Used' : 'Usado');
      var btnLabel = lang === 'en' ? 'Check availability' : 'Consultar disponibilidad';
      var descText = lang === 'en' ? (prodDescEN[x.desc] || x.desc) : x.desc;
      var imgs = x.images || [];
      var firstImg = imgs[0] || '';
      var photoCount = imgs.length;
      var photoLabel = lang === 'en'
        ? (photoCount === 1 ? '1 photo' : (photoCount + ' photos'))
        : (photoCount === 1 ? '1 foto' : (photoCount + ' fotos'));
      var imgHtml = firstImg ? '<div class="relative overflow-hidden cursor-pointer" style="height:190px;background:#0a0a0a" onclick="openGallery(' + x.id + ',0)" title="' + viewPhotosLabel + ' de ' + escProd(x.name) + '"><img src="' + firstImg + '" alt="Foto principal del producto ' + escProd(x.name) + '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;opacity:.88"><div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div><div class="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between"><span class="flex items-center gap-1.5 text-[11px] font-medium text-white/90"><span class="iconify" data-icon="lucide:images" data-width="13" aria-hidden="true"></span>' + photoLabel + '</span><span class="text-[10px] text-white/60 flex items-center gap-1">' + galleryLabel + ' <span class="iconify" data-icon="lucide:zoom-in" data-width="11" aria-hidden="true"></span></span></div></div>' : '';
      var galBtn = photoCount > 0 ? '<button onclick="openGallery(' + x.id + ',0)" class="flex items-center gap-1.5 py-2.5 px-3 rounded-xl border border-red-500/30 bg-red-500/[0.07] text-xs font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all flex-shrink-0" title="' + viewPhotosLabel + '"><span class="iconify" data-icon="lucide:camera" data-width="13" aria-hidden="true"></span> ' + viewPhotosLabel + '</button>' : '';
      return '<article class="product-card">' + imgHtml + '<div class="p-5"><div class="flex items-start justify-between mb-3"><div class="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center"><span class="iconify ' + x.color + '" data-icon="' + x.icon + '" data-width="20" aria-hidden="true"></span></div><span class="' + badge + '">' + condLabel + '</span></div><p class="text-[10px] text-red-500 font-mono uppercase tracking-wider mb-1">' + escProd(x.category) + '</p><h3 class="text-sm font-semibold text-white mb-1.5">' + escProd(x.name) + '</h3><p class="text-xs text-slate-400 leading-relaxed mb-3">' + escProd(descText) + '</p><p class="text-xl font-bold text-white mb-3">' + escProd(x.price) + '</p><div class="flex gap-2">' + galBtn + '<button onclick="inquireProduct(\'' + String(x.name).replace(/'/g, "\\'") + '\')" class="flex-1 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-white hover:bg-red-600 hover:border-red-500 transition-all">' + btnLabel + '</button></div></div></article>';
    }).join('');

    var deviceListings = JSON.parse(localStorage.getItem('device_listings') || '[]').filter(function(l) { return l.status === 'approved'; });
    if (deviceListings.length) {
      var deviceLabels = lang === 'en'
        ? { iphone: 'iPhone', android: 'Android', ipad: 'iPad / Tablet', macbook: 'MacBook / Laptop', nintendo: 'Nintendo', playstation: 'PlayStation', xbox: 'Xbox', smartwatch: 'Smartwatch', otro_dispositivo: 'Device' }
        : { iphone: 'iPhone', android: 'Android', ipad: 'iPad / Tablet', macbook: 'MacBook / Laptop', nintendo: 'Nintendo', playstation: 'PlayStation', xbox: 'Xbox', smartwatch: 'Smartwatch', otro_dispositivo: 'Dispositivo' };
      var contactMethodIcons = { whatsapp: 'lucide:message-circle', llamada: 'lucide:phone', mensaje: 'lucide:message-square' };
      var contactMethodLabels = lang === 'en'
        ? { whatsapp: 'WhatsApp', llamada: 'Call', mensaje: 'Message' }
        : { whatsapp: 'WhatsApp', llamada: 'Llamada', mensaje: 'Mensaje' };
      var particularLabel = lang === 'en' ? 'Private seller' : 'Particular';
      var privateSaleLabel = lang === 'en' ? 'Private sale' : 'Venta de particular';
      var deviceFallback = lang === 'en' ? 'Device' : 'Dispositivo';
      var defaultMsg = lang === 'en' ? 'Device for sale by a private seller. Contact us for more details.' : 'Dispositivo en venta por particular. Contáctanos para más detalles.';
      var contactOwnerLabel = lang === 'en' ? 'Contact owner' : 'Contactar propietario';
      grid.innerHTML += deviceListings.map(function(l) {
        var catLabel = deviceLabels[l.device_type] || deviceFallback;
        var firstPhoto = (l.photos && l.photos.length) ? l.photos[0] : '';
        var photoHtml = firstPhoto ? '<div class="relative overflow-hidden" style="height:190px;background:#0a0a0a"><img src="' + firstPhoto + '" alt="Foto del dispositivo en venta: ' + escProd(l.device_model) + '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;opacity:.88"><div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div><div class="absolute bottom-0 left-0 right-0 p-3"><span class="text-[10px] text-white/70 font-medium">' + privateSaleLabel + '</span></div></div>' : '';
        var cleanPhone = String(l.phone || '').replace(/[^+0-9]/g, '');
        var contactIcon = contactMethodIcons[l.contact_method] || 'lucide:phone';
        var contactLabel = contactMethodLabels[l.contact_method] || (lang === 'en' ? 'Contact' : 'Contactar');
        var contactHref = l.contact_method === 'whatsapp' ? 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent('Hola! Vi tu ' + escProd(l.device_model) + ' en AngelTech Solutions y me interesa.') : 'tel:' + cleanPhone;
        return '<article class="product-card">' + photoHtml + '<div class="p-5"><div class="flex items-start justify-between mb-3"><div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><span class="iconify text-amber-400" data-icon="lucide:smartphone" data-width="20" aria-hidden="true"></span></div><span class="badge-used text-amber-400 bg-amber-500/10 border border-amber-500/25 text-[10px] font-semibold px-2 py-0.5 rounded-full">' + particularLabel + '</span></div><p class="text-[10px] text-amber-500 font-mono uppercase tracking-wider mb-1">' + catLabel + '</p><h3 class="text-sm font-semibold text-white mb-1.5">' + escProd(l.device_model || deviceFallback) + '</h3>' + (l.message ? '<p class="text-xs text-slate-400 leading-relaxed mb-3">' + escProd(l.message) + '</p>' : '<p class="text-xs text-slate-500 leading-relaxed mb-3">' + defaultMsg + '</p>') + '<div class="mt-3"><a href="' + contactHref + '" target="_self" rel="noopener" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all"><span class="iconify" data-icon="' + contactIcon + '" data-width="14" aria-hidden="true"></span>' + contactOwnerLabel + ' · ' + contactLabel + '</a></div></div></article>';
      }).join('');
    }

    if (window.Iconify) Iconify.scan(grid);
  }

  window.inquireProduct = function(name) {
    var url = 'index.html?service=producto&openContact=1&product=' + encodeURIComponent(name) + '#contacto';
    window.location.href = url;
  };

  var galleryProds = [];
  var galleryIdx = 0;
  var galleryImgIdx = 0;
  var galleryTrigger = null;

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
    var lang = getLang();
    var prods = JSON.parse(localStorage.getItem('products') || '[]');
    galleryProds = prods;
    galleryIdx = prods.findIndex(function(p) { return p.id === prodId || p.id === parseInt(prodId, 10); });
    if (galleryIdx < 0) galleryIdx = 0;
    var prod = prods[galleryIdx];
    if (!prod) return;
    var imgs = prod.images || [];
    var nameEl = document.getElementById('galleryProductName');
    if (nameEl) nameEl.textContent = prod.name + ' — ' + prod.price;
    var thumbLabel = lang === 'en' ? 'View photo' : 'Ver foto';
    var ofLabel = lang === 'en' ? 'of' : 'de';
    var thumbs = document.getElementById('galleryThumbs');
    var dots = document.getElementById('galleryDots');
    if (thumbs) thumbs.innerHTML = imgs.map(function(src, i) { return '<button onclick="galSetImg(' + i + ')" aria-label="' + thumbLabel + ' ' + (i + 1) + ' ' + ofLabel + ' ' + imgs.length + '" class="gallery-thumb' + (i === 0 ? ' active' : '') + '" type="button"><img src="' + src + '" alt="Miniatura ' + (i + 1) + ' del producto ' + escProd(prod.name) + '" loading="lazy" decoding="async"></button>'; }).join('');
    if (dots) dots.innerHTML = imgs.map(function(_, i) { return '<button type="button" class="gallery-dot' + (i === 0 ? ' active' : '') + '" onclick="galSetImg(' + i + ')" aria-label="' + (lang === 'en' ? 'Photo' : 'Foto') + ' ' + (i + 1) + ' ' + ofLabel + ' ' + imgs.length + '"></button>'; }).join('');
    setGalleryImg(startIdx || 0);
    var modal = document.getElementById('galleryModal');
    if (modal) {
      modal.setAttribute('aria-label', (lang === 'en' ? 'Photo gallery of ' : 'Galería de fotos de ') + prod.name);
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      galleryTrigger = document.activeElement;
      var closeBtn = modal.querySelector('button[data-aria-es]');
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
  });

  window.addEventListener('storage', function(e) {
    if (e.key === 'products' || e.key === 'device_listings') renderProducts();
  });
  document.addEventListener('langchange', renderProducts);

  renderProducts();
})();
});
