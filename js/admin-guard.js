(function() {
  var loginUrl = 'admin-login.html';
  try {
    var isAuthed = sessionStorage.getItem('adminAuth') === '1';
    var rawUser = sessionStorage.getItem('adminSessionUser');
    var user = rawUser ? JSON.parse(rawUser) : null;
    if (!isAuthed || !user || !user.username) {
      window.location.replace(loginUrl + '?redirect=' + encodeURIComponent('admin.html'));
      return;
    }
    document.documentElement.classList.add('admin-auth-ready');
  } catch (e) {
    window.location.replace(loginUrl);
  }
})();
