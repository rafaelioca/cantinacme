// Inicialização unica do Firebase (SDK modular v10)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyCUW87ZznZ8MotN5iYwRatI90QfW5kCfSQ",
  authDomain: "quitandas-cme.firebaseapp.com",
  projectId: "quitandas-cme",
  storageBucket: "quitandas-cme.firebasestorage.app",
  messagingSenderId: "247363809064",
  appId: "1:247363809064:web:377dec56b8348f0ea36a1d",
  measurementId: "G-EE0ZT2MG1M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
