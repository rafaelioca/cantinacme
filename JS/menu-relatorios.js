// Script para buscar clientes do Firebase e popular o campo de busca na aba "Vendas em Aberto"
// Usando Firebase CDN (compatível com browser)

// Certifique-se que estes scripts estão no seu index.html antes dos scripts customizados:
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>



if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyCUW87ZznZ8MotN5iYwRatI90QfW5kCfSQ",
    authDomain: "quitandas-cme.firebaseapp.com",
    projectId: "quitandas-cme",
    storageBucket: "quitandas-cme.firebasestorage.app",
    messagingSenderId: "247363809064",
    appId: "1:247363809064:web:377dec56b8348f0ea36a1d",
    measurementId: "G-EE0ZT2MG1M"
  });
}
var db = firebase.firestore();

window.carregarClientesRelatorio = async function() {
  const clientesSnap = await db.collection("clientes").get();
  const lista = [];
  clientesSnap.forEach(doc => {
    const cliente = doc.data();
    if (cliente.nome) lista.push(cliente.nome);
  });
  return lista;
};

// Exemplo de uso:
// window.carregarClientesRelatorio().then(clientes => { ... });
