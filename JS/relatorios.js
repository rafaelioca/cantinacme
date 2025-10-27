// JS dedicado para relatorios.html
// Inicialização do Firebase
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
const db = firebase.firestore();

// Exemplo: buscar vendas em aberto
// Buscar clientes do Firebase e preencher sugestões
function buscarClientesFirebase(inputElement, listaElement) {
  db.collection('clientes').get().then(snapshot => {
    const clientes = [];
    snapshot.forEach(doc => {
      const cliente = doc.data();
      clientes.push(cliente.nome);
    });
    inputElement.addEventListener('input', function() {
      const val = inputElement.value.toLowerCase();
      if(val.length > 0) {
        const filtrados = clientes.filter(c => c.toLowerCase().includes(val));
        const html = filtrados.map(c => `<div class='item-cliente-relatorio'>${c}</div>`).join('');
        listaElement.innerHTML = html;
        listaElement.style.display = 'block';
      } else {
        listaElement.style.display = 'none';
      }
    });
    listaElement.addEventListener('click', function(e) {
      if(e.target.classList.contains('item-cliente-relatorio')) {
        inputElement.value = e.target.textContent;
        listaElement.style.display = 'none';
        document.querySelector('#relatorio-vendas-aberto .cliente-selecionado-aberto').textContent = 'Selecionado: ' + e.target.textContent;
        document.querySelector('#relatorio-vendas-aberto .cliente-selecionado-aberto').style.display = 'block';
      }
    });
  });
}
function buscarVendasEmAberto() {
  // Bloqueia consulta se não houver login (regras exigem autenticação)
  try {
    if (firebase && firebase.auth && !firebase.auth().currentUser) {
      alert('Faça login para acessar os relatórios.');
      return;
    }
  } catch(_) {}
  console.log('Buscando todas as vendas em aberto...');
  db.collection('vendas').get().then(snapshot => {
    const vendasPorCliente = {};
    snapshot.forEach(doc => {
      const venda = doc.data();
      if (!venda || !venda.cliente) return;
      if (!vendasPorCliente[venda.cliente]) vendasPorCliente[venda.cliente] = [];
      vendasPorCliente[venda.cliente].push(venda);
    });
    // Preenche também a área de resultado com uma tabela agregada
    let tabela = `<table style='width:100%;border-collapse:collapse;'>`+
      `<thead><tr><th style='text-align:left;padding:8px;border-bottom:2px solid #a52a2a;'>Cliente</th>`+
      `<th style='text-align:right;padding:8px;border-bottom:2px solid #a52a2a;'>Valor em aberto</th></tr></thead><tbody>`;
    Object.entries(vendasPorCliente).forEach(([nome, vendas]) => {
      const valor = vendas.reduce((acc,v) => acc + (v.valorTotal || 0), 0);
      tabela += `<tr><td style='padding:8px;border-bottom:1px solid #eee;'>${nome}</td>`+
                `<td style='padding:8px;text-align:right;border-bottom:1px solid #eee;'>R$ ${valor.toFixed(2)}</td></tr>`;
    });
    tabela += `</tbody></table>`;
    document.getElementById('relatorio-vendas-em-aberto-resultado').innerHTML = tabela;
  });
}

// Função para gerar PDF usando html2pdf.js
function gerarPDF(html, filename) {
  console.log('Gerando PDF:', filename);
  const element = document.createElement('div');
  element.innerHTML = html;
  html2pdf().set({
    margin: 10,
    filename: filename,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(element).save();
}
// Chame buscarVendasEmAberto() ao clicar no botão correspondente
// Inicializar busca de clientes ao carregar página de relatório
document.addEventListener('DOMContentLoaded', function() {
  // Mantém apenas o bind do botão Gerar Relatório
  // (busca e checkbox removidos por solicitação)
});
// Adicione outros métodos conforme necessidade
