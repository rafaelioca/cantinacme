function initRelatorioVendasFechadas() {
  try {
    var btnGerar = document.getElementById('btn-gerar-relatorio-fechadas');
    var btnExportarPdf = document.getElementById('btn-exportar-pdf-fechadas');

    if (btnGerar) {
      btnGerar.addEventListener('click', async function() {
        try {
          // Garante autenticação (regras exigem request.auth != null)
          if (window.firebase && firebase.auth && !firebase.auth().currentUser) {
            alert('Faça login para acessar os relatórios.');
            return;
          }
          const db = firebase.firestore();
          const vendasSnap = await db.collection('vendasFechadas').get();
          // Agrupa por cliente, suportando formatos antigo e novo
          let clientes = {};
          vendasSnap.forEach(doc => {
            const venda = doc.data();
            const nomeCliente = typeof venda.cliente === 'string'
              ? venda.cliente
              : (venda.cliente && venda.cliente.nome) ? venda.cliente.nome : null;
            if (!nomeCliente) return;
            const valor = (typeof venda.valorTotal === 'number' ? venda.valorTotal : 0) + (typeof venda.total === 'number' ? venda.total : 0);
            clientes[nomeCliente] = (clientes[nomeCliente] || 0) + (valor || 0);
          });

          // Monta tabela
          let totalGeral = 0;
          let html = `<h2 style='font-family:Orbitron,Arial,sans-serif;color:#a52a2a;'>Vendas fechadas</h2>`;
          html += `<table style='width:100%;border-collapse:collapse;font-size:1.1em;'>`;
          html += `<thead><tr><th style='text-align:left;padding:8px;border-bottom:2px solid #a52a2a;'>Cliente</th><th style='text-align:right;padding:8px;border-bottom:2px solid #a52a2a;'>Valor</th></tr></thead><tbody>`;
          Object.entries(clientes).forEach(([nome, valor]) => {
            totalGeral += valor;
            html += `<tr><td style='padding:8px;border-bottom:1px solid #eee;'>${nome}</td><td style='padding:8px;text-align:right;border-bottom:1px solid #eee;'>R$ ${valor.toFixed(2)}</td></tr>`;
          });
          html += `</tbody></table>`;
          html += `<div style='margin-top:18px;font-weight:bold;font-size:1.2em;text-align:right;'>Total: R$ ${totalGeral.toFixed(2)}</div>`;
          document.getElementById('relatorio-vendas-fechadas-resultado').innerHTML = html;
        } catch (err) {
          console.error('[relatorio-vendas-fechadas] Erro ao gerar:', err);
          const alvo = document.getElementById('relatorio-vendas-fechadas-resultado');
          if (alvo) alvo.innerHTML = `<div style="color:#b00020;">Falha ao carregar vendas fechadas. Verifique sua conexão e permissões.</div>`;
        }
      });
    }

    if (btnExportarPdf) {
      btnExportarPdf.addEventListener('click', function() {
        var resultadoDiv = document.getElementById('relatorio-vendas-fechadas-resultado');
        if (!resultadoDiv || !resultadoDiv.innerHTML.trim()) {
          alert('Primeiro gere o relatório!');
          return;
        }
        html2pdf().set({
          margin: 10,
          filename: 'Relatorio_Vendas_Fechadas.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(resultadoDiv).save();
      });
    }
  } catch (e) {
    console.error('[relatorio-vendas-fechadas] Erro ao inicializar:', e);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initRelatorioVendasFechadas);
} else {
  initRelatorioVendasFechadas();
}
