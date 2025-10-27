// Lógica para exibir vendas em aberto de um cliente e fluxo de pagamento
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from './firebase-init.js';

// Função para abrir aba/modal de vendas em aberto do cliente
window.abrirVendasCliente = async function(clienteNome, options = {}) {
  // Garante autenticação ativa (regras seguras exigem login)
  if (!auth || !auth.currentUser) {
    alert('Você precisa estar autenticado para visualizar o relatório deste cliente.');
    return;
  }
  // Adiciona script html2pdf se não estiver presente
  if (!window.html2pdf) {
    const script = document.createElement('script');
    script.src = 'JS/html2pdf.bundle.min.js';
    document.head.appendChild(script);
  }
  // Busca cliente no Firebase
  const clientesSnap = await getDocs(query(collection(db, "clientes"), where("nome", "==", clienteNome)));
  let cliente = null;
  clientesSnap.forEach(doc => cliente = doc.data());
  if (!cliente) return alert("Cliente não encontrado!");

  // Busca vendas em aberto
  const vendasSnap = await getDocs(query(collection(db, "vendas"), where("cliente", "==", clienteNome)));
  let vendas = [];
  let valorTotal = 0;
  vendasSnap.forEach(doc => {
    const venda = doc.data();
    venda.id = doc.id;
    vendas.push(venda);
    valorTotal += venda.valorTotal || 0;
  });
  // Ordena vendas por data/hora (do mais antigo para o mais novo)
  vendas.sort((a, b) => {
    // Considera data no formato dd/mm/yyyy e hora hh:mm:ss
    let dA = a.data.split('/').reverse().join('-') + ' ' + (a.hora || '00:00:00');
    let dB = b.data.split('/').reverse().join('-') + ' ' + (b.hora || '00:00:00');
    return new Date(dA) - new Date(dB);
  });

  // Abrir diretamente o modal de pagamento, se solicitado
  if (options && options.abrirPagamento) {
    // Busca formas de pagamento
    const formasSnap = await getDocs(collection(db, "formasPagamento"));
    const formas = [];
    formasSnap.forEach(d => { const fp = d.data(); if (fp && fp.nome) formas.push(fp.nome); });

    // Monta modal de pagamento com linhas (forma + valor)
    const pagBg = document.createElement('div');
    pagBg.className = 'modal-pagamento-bg';
    pagBg.style = 'position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:2147483647;';
    const pagBox = document.createElement('div');
    pagBox.className = 'modal-pagamento';
    pagBox.style = 'background:#ffffff;color:#111;border-radius:14px;max-width:560px;width:92vw;padding:18px 20px;box-shadow:0 12px 40px rgba(0,0,0,.35);border:1px solid #e0e0e0;';
    pagBox.innerHTML = `
      <h3 style='margin:0 0 12px 0'>Pagamento</h3>
      <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;'>
        <div>
          <div style='color:#666'>Cliente</div>
          <div style='font-weight:bold'>${cliente.nome}</div>
        </div>
        <div style='text-align:right'>
          <div style='color:#666'>Total a pagar</div>
          <div style='font-weight:bold;font-size:1.2em;color:#e53935'>R$ ${valorTotal.toFixed(2)}</div>
        </div>
      </div>
      <div id='linhas-pagamento'></div>
      <div style='display:flex;gap:8px;margin:10px 0;'>
        <button id='btn-add-linha' style='background:#1976d2;color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer'>Adicionar forma</button>
        <button id='btn-remover-linha' style='background:#9e9e9e;color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer'>Remover última</button>
      </div>
      <div style='display:flex;justify-content:space-between;margin-top:6px'>
        <div>Pago: <strong id='soma-pago'>R$ 0,00</strong></div>
        <div>Restante: <strong id='restante'>R$ ${valorTotal.toFixed(2)}</strong></div>
      </div>
      <div style='display:flex;gap:10px;justify-content:center;margin-top:16px;'>
        <button id='btn-confirmar-pag' disabled style='opacity:.6;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:10px 18px;cursor:not-allowed'>Confirmar</button>
        <button id='btn-cancelar-pag' style='background:#e91e63;color:#fff;border:none;border-radius:8px;padding:10px 18px;cursor:pointer'>Cancelar</button>
      </div>
    `;
    pagBg.appendChild(pagBox);
    document.body.appendChild(pagBg);

    // Helpers e lógica iguais ao fluxo normal
    const fmt = (n)=> 'R$ ' + n.toFixed(2).replace('.', ',');
    const parseValor = (v)=> { if (typeof v !== 'string') return Number(v)||0; return Number(v.replace(/\./g,'').replace(',', '.')) || 0; };
    function novaLinha(valorSug = null) {
      const linha = document.createElement('div');
      linha.className = 'linha-pagamento';
      linha.style = 'display:flex;gap:8px;align-items:center;margin:6px 0;';
      const sel = document.createElement('select'); sel.className = 'sel-forma'; sel.style = 'flex:1;padding:6px;border:1px solid #ccc;border-radius:6px;';
      sel.innerHTML = `<option value='' disabled selected>Forma</option>` + formas.map(f => `<option value='${f}'>${f}</option>`).join('');
      const inp = document.createElement('input'); inp.className = 'valor-forma'; inp.type = 'text'; inp.placeholder = 'Valor'; inp.style = 'width:120px;padding:6px;border:1px solid #ccc;border-radius:6px;text-align:right;';
      if (valorSug != null) inp.value = valorSug.toFixed(2).replace('.', ',');
      linha.appendChild(sel); linha.appendChild(inp);
      document.getElementById('linhas-pagamento').appendChild(linha);
      inp.addEventListener('input', recalcular); sel.addEventListener('change', recalcular);
      setTimeout(()=> inp.focus(), 0);
    }
    function recalcular() {
      const valores = Array.from(document.querySelectorAll('.valor-forma')).map(i => parseValor(i.value));
      const soma = valores.reduce((a,b)=>a+b,0);
      const restante = Math.max(0, valorTotal - soma);
      document.getElementById('soma-pago').textContent = fmt(soma);
      document.getElementById('restante').textContent = fmt(restante);
      const todasFormasValidas = Array.from(document.querySelectorAll('.sel-forma')).every(s => s.value);
      const todosValoresValidos = valores.every(v => v > 0);
      const botao = document.getElementById('btn-confirmar-pag');
      const ok = Math.abs(soma - valorTotal) < 0.01 && todasFormasValidas && todosValoresValidos;
      botao.disabled = !ok; botao.style.opacity = ok ? '1' : '.6'; botao.style.cursor = ok ? 'pointer' : 'not-allowed';
    }
    novaLinha(valorTotal);
    document.getElementById('btn-add-linha').onclick = () => { novaLinha(0); recalcular(); };
    document.getElementById('btn-remover-linha').onclick = () => { const cont = document.getElementById('linhas-pagamento'); if (cont.lastElementChild) cont.removeChild(cont.lastElementChild); if (!cont.children.length) novaLinha(0); recalcular(); };
    document.getElementById('btn-cancelar-pag').onclick = () => pagBg.remove();
    document.getElementById('btn-confirmar-pag').onclick = async () => {
      const linhas = Array.from(document.querySelectorAll('.linha-pagamento'));
      const pagamentos = linhas.map(l => ({ forma: l.querySelector('.sel-forma').value, valor: parseValor(l.querySelector('.valor-forma').value) }));
      const soma = pagamentos.reduce((a,b)=> a + (b.valor||0), 0);
      if (Math.abs(soma - valorTotal) >= 0.01) { alert('A soma dos pagamentos deve ser igual ao total.'); return; }
      try {
        const fechamento = { cliente: { nome: cliente.nome, telefone: cliente.telefone || '' }, vendas: vendas.map(v => ({ id: v.id, data: v.data, hora: v.hora || '', produtos: v.produtos || [], valorTotal: v.valorTotal || 0, observacao: v.observacao || '' })), total: valorTotal, pagamentos, usuarioId: auth.currentUser ? auth.currentUser.uid : null, criadoEm: new Date().toISOString() };
        await addDoc(collection(db, 'vendasFechadas'), fechamento);
        for (const v of vendas) { await deleteDoc(doc(collection(db, 'vendas'), v.id)); }
        alert('Pagamento confirmado!');
        document.querySelectorAll('.modal-pagamento-bg').forEach(e => e.remove());
        document.querySelectorAll('.modal-vendas-cliente-bg').forEach(e => e.remove());
      } catch (e) { console.error('Erro ao confirmar pagamento:', e); alert('Não foi possível confirmar o pagamento.'); }
    };
    recalcular();
    return; // Não exibir o relatório
  }

  // Monta layout do relatório
  let html = `<div class='modal-vendas-cliente-bg' style="position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:2147483647;">
    <div class='modal-vendas-cliente' style='max-width:520px;width:92vw;max-height:90vh;overflow:auto;background:#ffffff;color:#111;border-radius:14px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.35);border:1px solid #e0e0e0;'>
      <div style='display:flex;justify-content:space-between;align-items:center;'>
        <div>
          <div style='font-weight:bold;font-size:1.3em;margin-bottom:2px;'>${cliente.nome}</div>
          <div style='font-size:1em;color:#222;margin-bottom:12px;'>${cliente.telefone || '-'}</div>
          <div style='font-weight:bold;font-size:1em;margin-bottom:2px;'>VALOR TOTAL</div>
          <div style='font-weight:bold;font-size:1.7em;color:#e53935;margin-bottom:18px;'>R$ ${valorTotal.toFixed(2)}</div>
        </div>
        <div>
          <img src='img/LOGO CME.png' style='width:70px;margin-bottom:8px;'><br>
          <button class='btn-exportar-pdf' style='background:#888;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;'>EXPORTAR PDF</button>
        </div>
      </div>
      <div style='margin-top:12px;'>
        ${vendas.map(v => `
          <div style='margin-bottom:18px;'>
            <div style='font-weight:bold;'>${v.data} - ${v.hora || ''} <span style='color:#e53935;float:right;font-weight:bold;'>${v.valorTotal ? v.valorTotal.toFixed(2) : ''}</span></div>
            <div style='margin-left:8px;'>
              ${(v.produtos || []).map(p => `
                <div style='display:flex;justify-content:space-between;'><span>${p.nome}</span><span>${p.qtd.toString().padStart(2,'0')}</span><span>${p.valor.toFixed(2)}</span></div>
              `).join('')}
              ${v.observacao ? `<div style='margin-top:6px;font-size:0.95em;color:#555;'><strong>Obs:</strong> ${v.observacao}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <button class='btn-pagar-vendas-cliente' style='display:block;margin:32px auto 0 auto;background:#4caf50;color:#fff;font-size:1.2em;font-weight:bold;border:none;border-radius:16px;padding:16px 32px;cursor:pointer;'>PAGAR CONTA</button>
      <button class='btn-fechar-modal-vendas-cliente' style='background:#e91e63;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;margin-top:12px;'>Fechar</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  // Exportar PDF
  document.querySelector('.btn-exportar-pdf').onclick = function() {
    // Aguarda o carregamento do html2pdf
    function exportar() {
      if (window.html2pdf) {
        const relatorio = document.querySelector('.modal-vendas-cliente');
        html2pdf().set({
          margin: 10,
          filename: `Relatorio_${cliente.nome.replace(/\s+/g,'_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(relatorio).save();
      } else {
        setTimeout(exportar, 300);
      }
    }
    exportar();
  };

  // Evento fechar
  document.querySelector('.btn-fechar-modal-vendas-cliente').onclick = () => {
    document.querySelector('.modal-vendas-cliente-bg').remove();
  };

  // Evento pagar (suporta pagamentos fracionados com múltiplas formas)
  document.querySelector('.btn-pagar-vendas-cliente').onclick = async () => {
    if (!vendas || vendas.length === 0) { alert('Não há vendas para pagar.'); return; }
    // Busca formas de pagamento
    const formasSnap = await getDocs(collection(db, "formasPagamento"));
    const formas = [];
    formasSnap.forEach(d => { const fp = d.data(); if (fp && fp.nome) formas.push(fp.nome); });

    // Monta modal de pagamento com linhas (forma + valor)
  const pagBg = document.createElement('div');
    pagBg.className = 'modal-pagamento-bg';
  pagBg.style = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:2147483647;';
    const pagBox = document.createElement('div');
    pagBox.className = 'modal-pagamento';
    pagBox.style = 'background:#fff;border-radius:12px;max-width:520px;width:92vw;padding:16px 18px;box-shadow:0 8px 30px rgba(0,0,0,.2);';
    pagBox.innerHTML = `
      <h3 style='margin:0 0 12px 0'>Pagamento</h3>
      <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;'>
        <div>
          <div style='color:#666'>Cliente</div>
          <div style='font-weight:bold'>${cliente.nome}</div>
        </div>
        <div style='text-align:right'>
          <div style='color:#666'>Total a pagar</div>
          <div style='font-weight:bold;font-size:1.2em;color:#e53935'>R$ ${valorTotal.toFixed(2)}</div>
        </div>
      </div>
      <div id='linhas-pagamento'></div>
      <div style='display:flex;gap:8px;margin:10px 0;'>
        <button id='btn-add-linha' style='background:#1976d2;color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer'>Adicionar forma</button>
        <button id='btn-remover-linha' style='background:#9e9e9e;color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer'>Remover última</button>
      </div>
      <div style='display:flex;justify-content:space-between;margin-top:6px'>
        <div>Pago: <strong id='soma-pago'>R$ 0,00</strong></div>
        <div>Restante: <strong id='restante'>R$ ${valorTotal.toFixed(2)}</strong></div>
      </div>
      <div style='display:flex;gap:10px;justify-content:center;margin-top:16px;'>
        <button id='btn-confirmar-pag' disabled style='opacity:.6;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:10px 18px;cursor:not-allowed'>Confirmar</button>
        <button id='btn-cancelar-pag' style='background:#e91e63;color:#fff;border:none;border-radius:8px;padding:10px 18px;cursor:pointer'>Cancelar</button>
      </div>
    `;
    pagBg.appendChild(pagBox);
    document.body.appendChild(pagBg);

    // Funções helpers
    const fmt = (n)=> 'R$ ' + n.toFixed(2).replace('.', ',');
    const parseValor = (v)=> {
      if (typeof v !== 'string') return Number(v)||0;
      return Number(v.replace(/\./g,'').replace(',', '.')) || 0;
    };

    function novaLinha(valorSug = null) {
      const linha = document.createElement('div');
      linha.className = 'linha-pagamento';
      linha.style = 'display:flex;gap:8px;align-items:center;margin:6px 0;';
      const sel = document.createElement('select');
      sel.className = 'sel-forma';
      sel.style = 'flex:1;padding:6px;border:1px solid #ccc;border-radius:6px;';
      sel.innerHTML = `<option value='' disabled selected>Forma</option>` + formas.map(f => `<option value='${f}'>${f}</option>`).join('');
      const inp = document.createElement('input');
      inp.className = 'valor-forma';
      inp.type = 'text';
      inp.placeholder = 'Valor';
      inp.style = 'width:120px;padding:6px;border:1px solid #ccc;border-radius:6px;text-align:right;';
      if (valorSug != null) inp.value = valorSug.toFixed(2).replace('.', ',');
      linha.appendChild(sel);
      linha.appendChild(inp);
      document.getElementById('linhas-pagamento').appendChild(linha);
      inp.addEventListener('input', recalcular);
      sel.addEventListener('change', recalcular);
      setTimeout(()=> inp.focus(), 0);
    }

    function recalcular() {
      const valores = Array.from(document.querySelectorAll('.valor-forma')).map(i => parseValor(i.value));
      const soma = valores.reduce((a,b)=>a+b,0);
      const restante = Math.max(0, valorTotal - soma);
      document.getElementById('soma-pago').textContent = fmt(soma);
      document.getElementById('restante').textContent = fmt(restante);
      const todasFormasValidas = Array.from(document.querySelectorAll('.sel-forma')).every(s => s.value);
      const todosValoresValidos = valores.every(v => v > 0);
      const botao = document.getElementById('btn-confirmar-pag');
      const ok = Math.abs(soma - valorTotal) < 0.01 && todasFormasValidas && todosValoresValidos;
      botao.disabled = !ok;
      botao.style.opacity = ok ? '1' : '.6';
      botao.style.cursor = ok ? 'pointer' : 'not-allowed';
    }

    // Inicial: uma linha com valor total sugerido
    novaLinha(valorTotal);

    document.getElementById('btn-add-linha').onclick = () => { novaLinha(0); recalcular(); };
    document.getElementById('btn-remover-linha').onclick = () => {
      const cont = document.getElementById('linhas-pagamento');
      if (cont.lastElementChild) cont.removeChild(cont.lastElementChild);
      if (!cont.children.length) novaLinha(0);
      recalcular();
    };
    document.getElementById('btn-cancelar-pag').onclick = () => pagBg.remove();

    document.getElementById('btn-confirmar-pag').onclick = async () => {
      // Monta array de pagamentos
      const linhas = Array.from(document.querySelectorAll('.linha-pagamento'));
      const pagamentos = linhas.map(l => ({ forma: l.querySelector('.sel-forma').value, valor: parseValor(l.querySelector('.valor-forma').value) }));
      const soma = pagamentos.reduce((a,b)=> a + (b.valor||0), 0);
      if (Math.abs(soma - valorTotal) >= 0.01) { alert('A soma dos pagamentos deve ser igual ao total.'); return; }
      try {
        // Cria documento agregado em vendasFechadas
        const fechamento = {
          cliente: { nome: cliente.nome, telefone: cliente.telefone || '' },
          vendas: vendas.map(v => ({ id: v.id, data: v.data, hora: v.hora || '', produtos: v.produtos || [], valorTotal: v.valorTotal || 0, observacao: v.observacao || '' })),
          total: valorTotal,
          pagamentos,
          usuarioId: auth.currentUser ? auth.currentUser.uid : null,
          criadoEm: new Date().toISOString()
        };
        await addDoc(collection(db, 'vendasFechadas'), fechamento);
        // Remove vendas em aberto
        for (const v of vendas) {
          await deleteDoc(doc(collection(db, 'vendas'), v.id));
        }
        alert('Pagamento confirmado!');
        document.querySelectorAll('.modal-pagamento-bg').forEach(e => e.remove());
        document.querySelectorAll('.modal-vendas-cliente-bg').forEach(e => e.remove());
      } catch (e) {
        console.error('Erro ao confirmar pagamento:', e);
        alert('Não foi possível confirmar o pagamento.');
      }
    };
    // Primeiro cálculo
    recalcular();
  };
};

// Exemplo de como abrir: window.abrirVendasCliente('NOME DO CLIENTE');
