(function() {
  try {
    var isAuthed = sessionStorage.getItem('adminAuth') === '1';
    var rawUser = sessionStorage.getItem('adminSessionUser');
    var user = rawUser ? JSON.parse(rawUser) : null;
    if (isAuthed && user && user.username) {
      window.location.replace('admin.html');
      return;
    }
  } catch (e) {}
  document.documentElement.classList.add('admin-login-ready');
})();
