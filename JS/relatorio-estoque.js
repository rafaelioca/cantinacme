window.addEventListener('DOMContentLoaded', async function() {
  var btnGerar = document.getElementById('btn-gerar-relatorio-estoque');
  var btnExportarPdf = document.getElementById('btn-exportar-pdf-estoque');
  if (btnGerar) {
    btnGerar.addEventListener('click', async function() {
      const db = firebase.firestore();
      // Produtos
      const produtosSnap = await db.collection('produtos').get();
      // Entradas
      const entradasSnap = await db.collection('entrada de estoque').get();
      // Saídas
      const saidasSnap = await db.collection('saida de estoque').get();
      // Vendas em aberto
      const vendasAbertoSnap = await db.collection('vendas').get();
      // Vendas fechadas
      const vendasFechadasSnap = await db.collection('vendasFechadas').get();
      let relatorio = [];
      produtosSnap.forEach(docSnap => {
        const prod = docSnap.data();
        const nome = prod.nome;
        // Entradas
        let qtdEntrada = 0;
        entradasSnap.forEach(e => {
          (e.data().produtos || []).forEach(p => {
            if (p.nome === nome) qtdEntrada += parseInt(p.qtd) || 0;
          });
        });
        // Saídas
        let qtdSaida = 0;
        saidasSnap.forEach(s => {
          (s.data().produtos || []).forEach(p => {
            if (p.nome === nome) qtdSaida += parseInt(p.qtd) || 0;
          });
        });
        // Vendas em aberto
        let qtdVendaAberto = 0;
        vendasAbertoSnap.forEach(v => {
          (v.data().produtos || []).forEach(p => {
            if (p.nome === nome) qtdVendaAberto += parseInt(p.qtd) || 0;
          });
        });
        // Vendas fechadas
        let qtdVendaFechada = 0;
        vendasFechadasSnap.forEach(v => {
          (v.data().produtos || []).forEach(p => {
            if (p.nome === nome) qtdVendaFechada += parseInt(p.qtd) || 0;
          });
        });
        // Estoque atual
        let estoqueAtual = prod.estoque !== undefined ? prod.estoque : 0;
        relatorio.push({ nome, qtdEntrada, qtdSaida, qtdVenda: qtdVendaAberto + qtdVendaFechada, estoqueAtual });
      });
      let html = `<h2 style='font-family:Orbitron,Arial,sans-serif;color:#a52a2a;'>Relatório de Estoque</h2>`;
      html += `<table style='width:100%;border-collapse:collapse;font-size:1.1em;'>`;
      html += `<thead><tr>
        <th style='padding:8px;border-bottom:2px solid #a52a2a;'>Nome do Produto</th>
        <th style='padding:8px;border-bottom:2px solid #a52a2a;'>Quantidade de entrada</th>
        <th style='padding:8px;border-bottom:2px solid #a52a2a;'>Quantidade de saída</th>
        <th style='padding:8px;border-bottom:2px solid #a52a2a;'>Venda</th>
        <th style='padding:8px;border-bottom:2px solid #a52a2a;'>Estoque atual</th>
      </tr></thead><tbody>`;
      relatorio.forEach(linha => {
        html += `<tr>
          <td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>${linha.nome}</td>
          <td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>${linha.qtdEntrada}</td>
          <td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>${linha.qtdSaida}</td>
          <td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>${linha.qtdVenda}</td>
          <td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>${linha.estoqueAtual}</td>
        </tr>`;
      });
      html += `</tbody></table>`;
      document.getElementById('relatorio-estoque-resultado').innerHTML = html;
    });
  }
  if (btnExportarPdf) {
    btnExportarPdf.addEventListener('click', function() {
      var resultadoDiv = document.getElementById('relatorio-estoque-resultado');
      if (!resultadoDiv || !resultadoDiv.innerHTML.trim()) {
        alert('Primeiro gere o relatório!');
        return;
      }
      html2pdf().set({
        margin: 10,
        filename: 'Relatorio_Estoque.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(resultadoDiv).save();
    });
  }
});
