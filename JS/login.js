// JS simples de login usando Firebase v8 (global)
(function() {
  // Reuse the firebaseConfig from other files in the project
  const firebaseConfig = {
    apiKey: "AIzaSyCUW87ZznZ8MotN5iYwRatI90QfW5kCfSQ",
    authDomain: "quitandas-cme.firebaseapp.com",
    projectId: "quitandas-cme",
    storageBucket: "quitandas-cme.firebasestorage.app",
    messagingSenderId: "247363809064",
    appId: "1:247363809064:web:377dec56b8348f0ea36a1d",
    measurementId: "G-EE0ZT2MG1M"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();

  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  const btnLogin = document.getElementById('btn-login');
  // msg element may be removed from the DOM; fall back to alert
  const msg = document.getElementById('msg');
  function showMessage(text, isError) {
    if (msg) {
      msg.textContent = text || '';
      msg.style.color = isError ? '#e53935' : '#27ae60';
    } else if (text) {
      // breve fallback visual
      if (isError) alert(text);
      else console.log(text);
    }
  }

  btnLogin.addEventListener('click', async function() {
    const email = emailEl.value.trim();
    const password = passEl.value;
    showMessage('');
    if (!email || !password) { showMessage('Preencha e-mail e senha', true); return; }
    try {
      await auth.signInWithEmailAndPassword(email, password);
      showMessage('Login efetuado. Redirecionando...');
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } catch (err) {
      showMessage(err.message || 'Erro ao autenticar', true);
    }
  });

  // registro removido — botão Registrar foi retirado do HTML

  // Se já estiver logado, redireciona automaticamente
  auth.onAuthStateChanged(function(user) {
    if (user) {
      // já logado
      // opcional: redireciona automaticamente
      // window.location.href = 'index.html';
    }
  });
})();
