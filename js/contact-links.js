(function() {
  var modal = document.getElementById('contactActionModal');
  if (!modal) return;
  var title = document.getElementById('contactActionTitle');
  var description = document.getElementById('contactActionDescription');
  var targetLabel = document.getElementById('contactActionTarget');
  var confirmBtn = document.getElementById('contactActionConfirm');
  var closeButtons = modal.querySelectorAll('[data-contact-close]');
  var pendingLink = null;

  function getContent(link) {
    var lang = (window.getLang ? window.getLang() : (localStorage.getItem('lang') || 'es'));
    var kind = link.getAttribute('data-contact-kind') || 'email';
    var label = link.getAttribute('data-contact-label') || link.textContent.trim();
    if (kind === 'location') {
      return lang === 'en' ? {
        title: 'Open location',
        description: 'The AngelTech Solutions location will open so you can see the route and get there easily.',
        button: 'View location',
        label: label,
        icon: 'lucide:map-pinned'
      } : {
        title: 'Abrir ubicaci\u00f3n',
        description: 'Se abrir\u00e1 la ubicaci\u00f3n de AngelTech Solutions para que puedas ver la ruta y llegar f\u00e1cilmente.',
        button: 'Ver ubicaci\u00f3n',
        label: label,
        icon: 'lucide:map-pinned'
      };
    }
    return lang === 'en' ? {
      title: 'Contact by email',
      description: 'Your email application will open so you can write directly to AngelTech Solutions in a quick, professional way.',
      button: 'Continue to email',
      label: label,
      icon: 'lucide:mail'
    } : {
      title: 'Contactar por correo',
      description: 'Se abrir\u00e1 tu aplicaci\u00f3n de correo para escribirle directamente a AngelTech Solutions de forma profesional y r\u00e1pida.',
      button: 'Continuar al correo',
      label: label,
      icon: 'lucide:mail'
    };
  }

  function openModal(link) {
    pendingLink = link;
    var content = getContent(link);
    title.textContent = content.title;
    description.textContent = content.description;
    targetLabel.textContent = content.label;
    confirmBtn.querySelector('span').textContent = content.button;
    var icon = document.getElementById('contactActionIcon');
    if (icon) icon.setAttribute('data-icon', content.icon);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window.Iconify) Iconify.scan(modal);
    confirmBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    pendingLink = null;
  }

  document.addEventListener('click', function(event) {
    var link = event.target.closest('[data-contact-trigger]');
    if (!link) return;
    event.preventDefault();
    openModal(link);
  });

  confirmBtn.addEventListener('click', function() {
    if (!pendingLink) return;
    var href = pendingLink.getAttribute('href');
    closeModal();
    window.location.href = href;
  });

  closeButtons.forEach(function(btn) {
    btn.addEventListener('click', closeModal);
  });

  modal.addEventListener('click', function(event) {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();
