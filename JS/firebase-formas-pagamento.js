// Integração Firebase para Formas de Pagamento
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
const db = getFirestore(app);

export async function buscarFormasPagamentoFirebase() {
  const querySnapshot = await getDocs(collection(db, "formasPagamento"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
