(function() {
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
    var closeBtn = document.getElementById('welcomeModalClose');

    if (esBtn) esBtn.addEventListener('click', function() { if (window.setLang) window.setLang('es'); closeWelcome(); });
    if (enBtn) enBtn.addEventListener('click', function() { if (window.setLang) window.setLang('en'); closeWelcome(); });
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

  var base64 = '';
  function clearPhoto() {
    base64 = '';
    var inp = document.getElementById('reviewPhotoFile');
    if (inp) inp.value = '';
    var ph = document.getElementById('reviewPhotoPlaceholder');
    var pv = document.getElementById('reviewPhotoPreview');
    if (ph) ph.classList.remove('hidden');
    if (pv) pv.classList.add('hidden');
  }
  var fileInp = document.getElementById('reviewPhotoFile');
  if (fileInp) {
    fileInp.addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var max = 320;
          var w = img.width, h = img.height;
          if (w > h) { if (w > max) { h = Math.round(h * max / w); w = max; } }
          else if (h > max) { w = Math.round(w * max / h); h = max; }
          canvas.width = w; canvas.height = h;
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
  }
  var rmBtn = document.getElementById('reviewPhotoRemoveBtn');
  if (rmBtn) rmBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    clearPhoto();
  });

  var textArea = document.getElementById('reviewText');
  var charCount = document.getElementById('reviewCharCount');
  if (textArea && charCount) {
    textArea.addEventListener('input', function() { charCount.textContent = this.value.length; });
  }

  window.onHcaptchaVerified = function() {
    var errEl = document.getElementById('hcaptchaError');
    if (errEl) errEl.classList.add('hidden');
  };

  var form = document.getElementById('resenaForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var hcToken = '';
    try { hcToken = window.hcaptcha ? window.hcaptcha.getResponse() : ''; } catch (x) {}
    var errEl = document.getElementById('reviewError');
    var okEl = document.getElementById('reviewSuccess');
    errEl.classList.add('hidden');
    okEl.classList.add('hidden');

    if (!hcToken) {
      var hcErr = document.getElementById('hcaptchaError');
      if (hcErr) hcErr.classList.remove('hidden');
      var container = document.getElementById('hcaptchaContainer');
      if (container) container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var name = (document.getElementById('reviewName').value || '').trim();
    var role = (document.getElementById('reviewRole').value || '').trim();
    var municipio = (document.getElementById('reviewMunicipio').value || '').trim();
    var servicio = (document.getElementById('reviewServicio').value || '').trim();
    var text = (document.getElementById('reviewText').value || '').trim();
    var rating = document.querySelector('input[name="rating"]:checked');
    var years = parseInt(document.getElementById('reviewYears').value || '0', 10) || 0;
    var website = (document.getElementById('reviewWebsite').value || '').trim();
    var instagram = (document.getElementById('reviewInstagram').value || '').trim();
    var linkedin = (document.getElementById('reviewLinkedin').value || '').trim();
    var autorizaEl = document.querySelector('input[name="reviewAutoriza"]:checked');

    var lang = (window.getLang ? window.getLang() : (localStorage.getItem('lang') || 'es'));

    if (!name || !municipio || !servicio || !text || !autorizaEl) {
      errEl.textContent = lang === 'en'
        ? 'Please fill in your name, municipality, service, testimonial and the publication authorization.'
        : 'Por favor completa tu nombre, municipio, servicio, testimonio y la autorización de publicación.';
      errEl.classList.remove('hidden');
      return;
    }

    if (!window.supabaseRestRequest) {
      errEl.textContent = lang === 'en'
        ? 'No connection to the database. Please try again in a few minutes.'
        : 'No hay conexión con la base de datos. Intenta de nuevo en unos minutos.';
      errEl.classList.remove('hidden');
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; }

    window.supabaseRestRequest('rpc/submit_review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_name: name,
        p_role: role,
        p_text: text,
        p_rating: parseInt(rating ? rating.value : '5', 10) || 5,
        p_photo: base64,
        p_years: years,
        p_website: website,
        p_instagram: instagram,
        p_linkedin: linkedin,
        p_municipio: municipio,
        p_servicio: servicio,
        p_autoriza: autorizaEl.value === 'si'
      })
    }).then(function() {
      form.reset();
      clearPhoto();
      if (charCount) charCount.textContent = '0';
      okEl.classList.remove('hidden');
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (window.hcaptcha) { try { window.hcaptcha.reset(); } catch (x) {} }
    }).catch(function(err) {
      errEl.textContent = (err && err.message) || (lang === 'en' ? 'Error submitting. Please try again.' : 'Error al enviar. Intenta de nuevo.');
      errEl.classList.remove('hidden');
    }).finally(function() {
      if (btn) { btn.disabled = false; }
    });
  });
})();
