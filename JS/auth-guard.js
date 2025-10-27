import { auth } from './firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Chama em páginas protegidas para redirecionar usuários não autenticados para login
export function requireAuth(redirectTo = 'login.html') {
  // Se já houver user sincronizado, redireciona imediatamente
  if (auth && auth.currentUser) return;
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // evita redirecionar quando já estamos na página de login
      if (!location.pathname.toLowerCase().endsWith('/login.html')) {
        window.location.href = redirectTo;
      }
    }
  });
}

// Chama na página de login para prevenir que usuário autenticado volte ao login
export function redirectIfAuthenticated(redirectTo = 'index.html') {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = redirectTo;
    }
  });
}
