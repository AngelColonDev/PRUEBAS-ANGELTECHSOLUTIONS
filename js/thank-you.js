(function() {
  if (localStorage.getItem('lang') === 'en') {
    document.documentElement.lang = 'en';
    document.title = 'Thank You - AngelDev';
    document.querySelector('h1').textContent = 'Thank You - Message received';
    document.querySelector('p.mt-4').textContent = 'Your message has been sent successfully. I\'ll review the details and get back to you shortly.';
    document.getElementById('homeBtn').textContent = 'Back to home';
    document.getElementById('sendAnother').textContent = 'Send another message';
    document.getElementById('footerCopy').textContent = '(c) 2026 AngelDev. All rights reserved.';
  }
})();
