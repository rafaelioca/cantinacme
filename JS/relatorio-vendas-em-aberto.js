window.addEventListener('DOMContentLoaded', function() {
  // Botão Exportar PDF (usa o conteúdo já renderizado na página)
  var btnExportarPdf = document.getElementById('btn-exportar-pdf-aberto');
  if (btnExportarPdf) {
    btnExportarPdf.addEventListener('click', function() {
      var resultadoDiv = document.getElementById('relatorio-vendas-em-aberto-resultado');
      if (!resultadoDiv || !resultadoDiv.innerHTML.trim()) {
        alert('Primeiro gere o relatório!');
        return;
      }
      html2pdf().set({
        margin: 10,
        filename: 'Relatorio_Vendas_Em_Aberto.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(resultadoDiv).save();
    });
  }

  // Botão Gerar Relatório: agrega vendas por cliente a partir da coleção 'vendas'
  var btnGerar = document.querySelector('#relatorio-vendas-aberto .btn-confirmar-relatorio');
  if (btnGerar) {
    btnGerar.addEventListener('click', async function() {
      try {
        const db = firebase.firestore();
        const vendasSnap = await db.collection('vendas').get();
        const clientes = {};
        vendasSnap.forEach(doc => {
          const venda = doc.data();
          if (!venda || !venda.cliente) return;
          clientes[venda.cliente] = (clientes[venda.cliente] || 0) + (venda.valorTotal || 0);
        });
        let totalGeral = 0;
        let html = `<h2 style='font-family:Orbitron,Arial,sans-serif;color:#a52a2a;'>Vendas em aberto</h2>`;
        html += `<table style='width:100%;border-collapse:collapse;font-size:1.1em;'>`;
        html += `<thead><tr><th style='text-align:left;padding:8px;border-bottom:2px solid #a52a2a;'>Cliente</th><th style='text-align:right;padding:8px;border-bottom:2px solid #a52a2a;'>Valor em aberto</th></tr></thead><tbody>`;
        Object.entries(clientes).forEach(([nome, valor]) => {
          totalGeral += valor;
          html += `<tr><td style='padding:8px;border-bottom:1px solid #eee;'>${nome}</td><td style='padding:8px;text-align:right;border-bottom:1px solid #eee;'>R$ ${valor.toFixed(2)}</td></tr>`;
        });
        html += `</tbody></table>`;
        html += `<div style='margin-top:18px;font-weight:bold;font-size:1.2em;text-align:right;'>Total em aberto: R$ ${totalGeral.toFixed(2)}</div>`;
        document.getElementById('relatorio-vendas-em-aberto-resultado').innerHTML = html;
      } catch (e) {
        console.error('[relatorio-vendas-em-aberto] Erro ao gerar:', e);
        const alvo = document.getElementById('relatorio-vendas-em-aberto-resultado');
        if (alvo) alvo.innerHTML = `<div style="color:#b00020;">Falha ao carregar. Verifique sua conexão e permissões.</div>`;
      }
    });
  }
});
