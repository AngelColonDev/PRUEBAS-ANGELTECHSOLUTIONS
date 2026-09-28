(function() {
  var wrap = document.getElementById('serviceSelectWrap');
  if (!wrap) return;
  var btn = document.getElementById('serviceSelectBtn');
  var list = document.getElementById('serviceSelectList');
  var icon = document.getElementById('serviceSelectIcon');
  var label = document.getElementById('serviceSelectLabel');
  var select = document.getElementById('serviceInput');
  var options = Array.prototype.slice.call(list.querySelectorAll('[role="option"]'));

  function currentLang() {
    return localStorage.getItem('lang') === 'en' ? 'en' : 'es';
  }

  function closeList() {
    list.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  }
  function openList() {
    list.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
  }

  function selectOption(opt) {
    select.value = opt.getAttribute('data-value');
    icon.setAttribute('data-icon', opt.getAttribute('data-icon'));
    label.setAttribute('data-es', opt.getAttribute('data-es'));
    label.setAttribute('data-en', opt.getAttribute('data-en'));
    label.textContent = currentLang() === 'es' ? opt.getAttribute('data-es') : opt.getAttribute('data-en');
    options.forEach(function(o) { o.setAttribute('aria-selected', o === opt ? 'true' : 'false'); });
    if (window.Iconify) Iconify.scan(wrap);
    select.dispatchEvent(new Event('change'));
  }

  btn.addEventListener('click', function() {
    if (list.classList.contains('hidden')) openList(); else closeList();
  });

  options.forEach(function(opt) {
    opt.addEventListener('click', function() {
      selectOption(opt);
      closeList();
      btn.focus();
    });
  });

  document.addEventListener('click', function(e) {
    if (!wrap.contains(e.target)) closeList();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !list.classList.contains('hidden')) {
      closeList();
      btn.focus();
    }
  });

  window.__setServiceSelectValue = function(value) {
    var opt = options.filter(function(o) { return o.getAttribute('data-value') === value; })[0];
    if (opt) selectOption(opt);
  };
})();

(function(){
  var _hcLoaded = false;

  function loadHC() {
    if (_hcLoaded) return;
    _hcLoaded = true;
    var s = document.createElement('script');
    s.src = 'https://js.hcaptcha.com/1/api.js';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  function preconnectHC() {
    if (document.querySelector('link[href*="hcaptcha"]')) return;
    ['https://js.hcaptcha.com', 'https://newassets.hcaptcha.com'].forEach(function(u) {
      var l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = u;
      document.head.appendChild(l);
    });
  }

  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('focusin', loadHC, { once: true });
    form.addEventListener('click', loadHC, { once: true });
  }

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) {
        preconnectHC();
        obs.disconnect();
      }
    }, { rootMargin: '200px' });
    var container = document.getElementById('hcaptchaContainer');
    if (container) obs.observe(container);
  }
})();

window.onHcaptchaVerified = function() {
  var errEl = document.getElementById('hcaptchaError');
  if (errEl) errEl.classList.add('hidden');
};

window._submitContact = function(e) {
  e.preventDefault();
  var hcToken = '';
  try { hcToken = window.hcaptcha ? window.hcaptcha.getResponse() : ''; } catch (x) {}

  if (!hcToken) {
    var errEl = document.getElementById('hcaptchaError');
    if (errEl) errEl.classList.remove('hidden');
    var container = document.getElementById('hcaptchaContainer');
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  var form = document.getElementById('contactForm');
  var svc = (document.getElementById('serviceInput') || {}).value || '';
  var msg = {
    name: (document.getElementById('nameInput') || {}).value || '',
    email: (document.getElementById('emailInput') || {}).value || '',
    phone: (document.getElementById('phoneInput') || {}).value || '',
    service: svc,
    otro_service: (document.getElementById('otroServiceInput') || {}).value || '',
    device_type: (document.getElementById('deviceType') || {}).value || '',
    device_model: (document.getElementById('deviceModel') || {}).value || '',
    message: (document.getElementById('messageInput') || {}).value || '',
    date: new Date().toISOString()
  };

  var msgs = JSON.parse(localStorage.getItem('messages') || '[]');
  msgs.push(msg);
  localStorage.setItem('messages', JSON.stringify(msgs));

  if (window.SUPABASE_REST_URL && window.SUPABASE_ANON_KEY) {
    try {
      fetch(window.SUPABASE_REST_URL + '/contact_requests', {
        method: 'POST',
        keepalive: true,
        headers: {
          'apikey': window.SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + window.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify([{
          name: msg.name,
          email: msg.email || '',
          phone: msg.phone,
          service: msg.service,
          other_service: msg.otro_service || '',
          message: msg.message || '',
          status: 'pendiente',
          source_page: 'index',
          created_at: msg.date
        }])
      }).catch(function() {});
    } catch (x) {}
  }

  function syncDeviceListing(listing) {
    var listings = JSON.parse(localStorage.getItem('device_listings') || '[]');
    listings.push(listing);
    localStorage.setItem('device_listings', JSON.stringify(listings));

    if (window.SUPABASE_REST_URL && window.SUPABASE_ANON_KEY) {
      try {
        fetch(window.SUPABASE_REST_URL + '/device_listings', {
          method: 'POST',
          keepalive: true,
          headers: {
            'apikey': window.SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + window.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify([{
            id: listing.id,
            name: listing.name,
            phone: listing.phone,
            contact_method: listing.contact_method,
            device_type: listing.device_type,
            device_model: listing.device_model,
            message: listing.message || '',
            photos: listing.photos || [],
            status: 'pending',
            created_at: listing.date
          }])
        }).catch(function() {});
      } catch (x) {}
    }
  }

  if (svc === 'vender') {
    var sellerPhone = (document.getElementById('sellerContactPhone') || {}).value || msg.phone;
    var contactMethod = (document.getElementById('sellerContactMethod') || {}).value || 'whatsapp';
    var listing = {
      id: Date.now(),
      name: msg.name,
      phone: sellerPhone || msg.phone,
      contact_method: contactMethod,
      device_type: msg.device_type,
      device_model: msg.device_model,
      message: msg.message,
      date: msg.date,
      status: 'pending',
      photos: []
    };

    if (window._devicePhotoFiles && window._devicePhotoFiles.length) {
      var total = Math.min(window._devicePhotoFiles.length, 5);
      var loaded = 0;
      var photoData = [];
      for (var i = 0; i < total; i++) {
        (function(file, idx) {
          var r = new FileReader();
          r.onload = function(ev) {
            photoData[idx] = ev.target.result;
            loaded++;
            if (loaded === total) {
              listing.photos = photoData.filter(Boolean);
              syncDeviceListing(listing);
            }
          };
          r.readAsDataURL(file);
        })(window._devicePhotoFiles[i], i);
      }
    } else {
      syncDeviceListing(listing);
    }
  }

  var photoEl = document.getElementById('devicePhotoInput');
  if (photoEl) photoEl.disabled = true;

  var redir = document.createElement('input');
  redir.type = 'hidden';
  redir.name = '_redirect';
  redir.value = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'thank-you.html';
  form.appendChild(redir);

  form.submit();
  return false;
};
