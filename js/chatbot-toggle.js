var _chatOpen = false;

function toggleChatbot() {
  var win = document.getElementById('chatbotWindow');
  if (!win) return;
  _chatOpen = !_chatOpen;
  if (_chatOpen) {
    win.classList.add('open');
    var ic = document.getElementById('chatBtnIcon');
    if (ic) ic.textContent = '✕';
    var chatBtnEl = document.getElementById('chatbotBtn');
    if (chatBtnEl) chatBtnEl.setAttribute('aria-label', 'Cerrar chat');
    var msgs = document.getElementById('chatMessages');
    if (msgs && msgs.children.length === 0) {
      var d = document.createElement('div');
      d.className = 'msg-bot';
      d.textContent = '¡Hola! 👋 Soy AngelBot de AngelTech Solutions. ¿En qué puedo ayudarte?';
      msgs.appendChild(d);
    }
    var inp = document.getElementById('chatInput');
    if (inp) setTimeout(function() { inp.focus(); }, 80);
  } else {
    win.classList.remove('open');
    var icon = document.getElementById('chatBtnIcon');
    if (icon) icon.textContent = '🤖';
    var btn = document.getElementById('chatbotBtn');
    if (btn) btn.setAttribute('aria-label', 'Abrir chat de soporte');
  }
}
