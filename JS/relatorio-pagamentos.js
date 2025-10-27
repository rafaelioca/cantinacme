function initRelatorioPagamentos() {
  try {
    var btnGerar = document.getElementById('btn-gerar-relatorio-pagamentos');
    var btnExportarPdf = document.getElementById('btn-exportar-pdf-pagamentos');

    if (btnGerar) {
      btnGerar.addEventListener('click', async function() {
        try {
          if (window.firebase && firebase.auth && !firebase.auth().currentUser) {
            alert('Faça login para acessar os relatórios.');
            return;
          }
          const db = firebase.firestore();
          const vendasSnap = await db.collection('vendasFechadas').get();
          // Agrupa valores por forma de pagamento
          let mapa = {};
          vendasSnap.forEach(doc => {
            const venda = doc.data();
            // Formato novo: pagamentos é um array de { forma, valor }
            if (Array.isArray(venda.pagamentos)) {
              venda.pagamentos.forEach(p => {
                const forma = (p && p.forma) ? p.forma : 'Não informado';
                const valor = (p && typeof p.valor === 'number') ? p.valor : 0;
                mapa[forma] = (mapa[forma] || 0) + valor;
              });
            } else {
              // Formato antigo: um campo formaPagamento e valorTotal/total
              const forma = venda.formaPagamento || 'Não informado';
              const valor = (typeof venda.valorTotal === 'number' ? venda.valorTotal : 0) + (typeof venda.total === 'number' ? venda.total : 0);
              mapa[forma] = (mapa[forma] || 0) + valor;
            }
          });

          let totalGeral = 0;
          let html = `<h2 style='font-family:Orbitron,Arial,sans-serif;color:#a52a2a;'>Relatório de Pagamentos</h2>`;
          html += `<table style='width:100%;border-collapse:collapse;font-size:1.1em;'>`;
          html += `<thead><tr><th style='text-align:left;padding:8px;border-bottom:2px solid #a52a2a;'>Forma de pagamento</th><th style='text-align:right;padding:8px;border-bottom:2px solid #a52a2a;'>Valor</th></tr></thead><tbody>`;
          Object.entries(mapa).forEach(([forma, valor]) => {
            totalGeral += valor;
            html += `<tr><td style='padding:8px;border-bottom:1px solid #eee;'>${forma}</td><td style='padding:8px;text-align:right;border-bottom:1px solid #eee;'>R$ ${valor.toFixed(2)}</td></tr>`;
          });
          html += `</tbody></table>`;
          html += `<div style='margin-top:18px;font-weight:bold;font-size:1.2em;text-align:right;'>Total: R$ ${totalGeral.toFixed(2)}</div>`;
          document.getElementById('relatorio-pagamentos-resultado').innerHTML = html;
        } catch (err) {
          console.error('[relatorio-pagamentos] Erro ao gerar:', err);
          const alvo = document.getElementById('relatorio-pagamentos-resultado');
          if (alvo) alvo.innerHTML = `<div style="color:#b00020;">Falha ao carregar relatório de pagamentos. Verifique sua conexão e permissões.</div>`;
        }
      });
    }

    if (btnExportarPdf) {
      btnExportarPdf.addEventListener('click', function() {
        var resultadoDiv = document.getElementById('relatorio-pagamentos-resultado');
        if (!resultadoDiv || !resultadoDiv.innerHTML.trim()) {
          alert('Primeiro gere o relatório!');
          return;
        }
        html2pdf().set({
          margin: 10,
          filename: 'Relatorio_Pagamentos.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(resultadoDiv).save();
      });
    }
  } catch (e) {
    console.error('[relatorio-pagamentos] Erro ao inicializar:', e);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initRelatorioPagamentos);
} else {
  initRelatorioPagamentos();
}
