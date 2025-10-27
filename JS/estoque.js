import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// JS para funcionalidades do menu Entrada de Produtos
$(document).ready(function() {
  // Garante que só a tela de vendas aparece ao abrir o site
  $('.tela').hide();
  $('#tela-vendas').show();
  // Função para recalcular o estoque dos produtos
  async function recalcularEstoqueProdutos() {
    const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    let estoque = {};
    // Zera todos os produtos existentes na coleção produtos
    const produtosSnap = await getDocs(collection(db, 'produtos'));
    produtosSnap.forEach(docSnap => {
      const prod = docSnap.data();
      if (prod.nome) {
        estoque[prod.nome.trim().toLowerCase()] = 0;
      }
    });
    // Soma todas as entradas
    const entradasSnap = await getDocs(collection(db, 'entrada de estoque'));
    entradasSnap.forEach(docSnap => {
      const entrada = docSnap.data();
      (entrada.produtos || []).forEach(p => {
        const nome = p.nome.trim().toLowerCase();
        estoque[nome] = (estoque[nome] || 0) + (parseInt(p.qtd) || 0);
      });
    });
    // Subtrai todas as saídas (se existir a coleção)
    try {
      const saidasSnap = await getDocs(collection(db, 'saida de estoque'));
      saidasSnap.forEach(docSnap => {
        const saida = docSnap.data();
        (saida.produtos || []).forEach(p => {
          const nome = p.nome.trim().toLowerCase();
          estoque[nome] = (estoque[nome] || 0) - (parseInt(p.qtd) || 0);
        });
      });
    } catch {}
    // Subtrai todas as vendas em aberto
    const vendasAbertoSnap = await getDocs(collection(db, 'vendas'));
    vendasAbertoSnap.forEach(docSnap => {
      const venda = docSnap.data();
      (venda.produtos || []).forEach(p => {
        const nome = p.nome.trim().toLowerCase();
        estoque[nome] = (estoque[nome] || 0) - (parseInt(p.qtd) || 0);
      });
    });
    // Subtrai todas as vendas fechadas
    try {
      const vendasFechadasSnap = await getDocs(collection(db, 'vendasFechadas'));
      vendasFechadasSnap.forEach(docSnap => {
        const venda = docSnap.data();
        (venda.produtos || []).forEach(p => {
          const nome = p.nome.trim().toLowerCase();
          estoque[nome] = (estoque[nome] || 0) - (parseInt(p.qtd) || 0);
        });
      });
    } catch {}
    // Atualiza visual e variável global
    window.estoqueProdutos = estoque;
    // Atualiza o campo estoque dos produtos no Firebase
    const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    for (const docSnap of produtosSnap.docs) {
      const prod = docSnap.data();
      if (prod.nome) {
        const nome = prod.nome.trim().toLowerCase();
        const estoqueCalc = estoque[nome] !== undefined ? estoque[nome] : 0;
        await updateDoc(doc(db, 'produtos', docSnap.id), { estoque: estoqueCalc });
      }
    }
    atualizarVisualEstoqueProdutos();
  }
  // Carregar entradas de estoque do Firestore ao abrir o menu
  async function carregarEntradasEstoque() {
    const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    let entradas = [];
    try {
      const snapshot = await getDocs(collection(db, 'entrada de estoque'));
      snapshot.forEach(docSnap => {
        const entrada = docSnap.data();
        entrada.id = docSnap.id;
        entradas.push(entrada);
      });
      // Ordena por data decrescente (assume formato dd-mm-aaaa ou aaaa-mm-dd)
      entradas.sort((a, b) => {
        function parseData(d) {
          if (!d) return 0;
          if (d.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [dia, mes, ano] = d.split('-');
            return new Date(`${ano}-${mes}-${dia}`);
          }
          if (d.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return new Date(d);
          }
          return new Date(d);
        }
        return parseData(b.data) - parseData(a.data);
      });
      // Renderiza cards na tela
      $('.lista-estoque').empty();
      entradas.forEach(entrada => {
        const produtos = entrada.produtos || [];
        const valorTotal = entrada.valorTotal || '0.00';
        const card = `<div class="card-estoque" data-produtos='${JSON.stringify(produtos)}' data-data='${entrada.data}' data-local='${entrada.local}' data-valor='${valorTotal}' data-entrada-id='${entrada.id}'>
          <span class="data-compra">${entrada.data}</span>
          <span class="local-compra">${entrada.local}</span>
          <span class="valor-compra">R$ ${valorTotal.replace('.', ',')} <span style=\"color:#27ae60;font-weight:bold;margin-left:12px;\">Entrada</span></span>
        </div>`;
        $('.lista-estoque').append(card);
      });
      // Exibe cards de Saídas de Estoque
      try {
        const saidasSnap = await getDocs(collection(db, 'saida de estoque'));
        saidasSnap.forEach(docSnap => {
          const saida = docSnap.data();
          const produtos = saida.produtos || [];
          const card = `<div class="card-estoque" data-produtos='${JSON.stringify(produtos)}' data-data='${saida.data}' data-local='${saida.motivo}' data-valor='' data-tipo='saida'>
            <span class="data-compra">${saida.data}</span>
            <span class="local-compra">${saida.motivo}</span>
            <span class="valor-compra"><span style=\"color:#e91e63;font-weight:bold;margin-left:12px;\">Saída</span></span>
          </div>`;
          $('.lista-estoque').append(card);
        });
      } catch (err) {
        alert('Erro ao carregar saídas de estoque: ' + err.message);
      }
    } catch (err) {
      alert('Erro ao carregar entradas de estoque: ' + err.message);
    }
  }

  // Chama ao abrir o menu
  carregarEntradasEstoque();
  recalcularEstoqueProdutos();
  // Remover produto da lista ao clicar no botão 'X'
  $(document).on('click', '.btn-remover-produto-estoque', function() {
    $(this).closest('.produto-estoque-item').remove();
    // Atualiza o valor total após remoção
    let total = 0;
    $('.produtos-estoque-lista .produto-estoque-item').each(function() {
      const qtd = parseInt($(this).find('.qtd-produto-estoque').val()) || 0;
      const valor = parseFloat($(this).find('.valor-produto-estoque').val().replace(',', '.')) || 0;
      total += qtd * valor;
    });
    $('.valor-total-estoque').text('Valor Total: R$ ' + total.toFixed(2).replace('.', ','));
  });
  // Abrir modal ao clicar em Adicionar Entrada
  $('.btn-entrada').on('click', function() {
    // Ao clicar em Adicionar Entrada, limpa todos os campos do modal
    $('#formEstoque')[0].reset();
    $('#formEstoque').removeData('cardEditando');
    $('.produtos-estoque-lista').empty();
    $('#modalEstoqueBg').fadeIn(200);
  });

  // Ao clicar em Adicionar Saída, abre o modal de saída e limpa campos
  $('.btn-saida').on('click', function() {
    $('#formSaidaEstoque')[0].reset();
    $('.produtos-saida-estoque-lista').empty();
    $('#modalSaidaEstoqueBg').fadeIn(200);
  });

  // Fechar modal ao clicar no botão de fechar
  $('#btnFecharModalEstoque').on('click', function() {
    $('#modalEstoqueBg').fadeOut(200);
  });

  // Fechar modal ao clicar fora do modal
  $('#modalEstoqueBg').on('click', function(e) {
    if (e.target === this) {
      $(this).fadeOut(200);
    }
  });

      // Exibe cards de Saídas de Estoque
      (async () => {
        const saidasSnap = await getDocs(collection(db, 'saida de estoque'));
        saidasSnap.forEach(docSnap => {
          const saida = docSnap.data();
          const produtos = saida.produtos || [];
          const card = `<div class="card-estoque" data-produtos='${JSON.stringify(produtos)}' data-data='${saida.data}' data-local='${saida.motivo}' data-valor='' data-tipo='saida'>
            <span class="data-compra">${saida.data}</span>
            <span class="local-compra">${saida.motivo}</span>
            <span class="valor-compra"><span style=\"color:#e91e63;font-weight:bold;margin-left:12px;\">Saída</span></span>
          </div>`;
          $('.lista-estoque').append(card);
        });
      })();
  // Função para formatar data para dd-mm-aaaa
  function formatarDataBR(data) {
    if (data && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
      let partes = data.split('-');
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    if (data && data.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return data;
    }
    return data || '';
  }

  // Controle de estoque global
  window.estoqueProdutos = window.estoqueProdutos || {};

  // Função para atualizar estoque ao salvar entrada
  function atualizarEstoque(produtos, produtosAntigos) {
    // Função mantida apenas para compatibilidade, não altera mais o estoque local
  }

  // Submissão do formulário do modal de entrada
  $('#formEstoque').on('submit', function(e) {
    e.preventDefault();
    const data = $('#dataEstoque').val();
    const local = $('#localEstoque').val();
    let produtos = [];
    $('.produtos-estoque-lista .produto-estoque-item').each(function() {
      const nome = $(this).find('.nome-produto-estoque').val() || $(this).find('.nome-produto-estoque-label').text();
      const qtd = $(this).find('.qtd-produto-estoque').val();
      const valor = $(this).find('.valor-produto-estoque').val();
      // Só adiciona se todos os campos estiverem preenchidos
      if (nome && qtd && valor) {
        produtos.push({ nome, qtd, valor });
      }
    });
    // Se não houver produtos válidos, aborta
    if (produtos.length === 0) {
      alert('Preencha todos os campos dos produtos antes de salvar!');
      return;
    }
    const valorTotal = produtos.reduce((acc, p) => acc + (parseFloat(p.valor.replace(',', '.')) || 0) * (parseInt(p.qtd) || 0), 0).toFixed(2);
    // Formata data para dd-mm-aaaa
    function formatarDataBR(data) {
      if (data && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        let partes = data.split('-');
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
      if (data && data.match(/^\d{2}-\d{2}-\d{4}$/)) {
        return data;
      }
      return data || '';
    }
    const dataFormatada = formatarDataBR(data);
    const cardEditando = $(this).data('cardEditando');
    if (cardEditando) {
      // Atualização de edição (mantém local)
      const produtosAntigos = JSON.parse(cardEditando.attr('data-produtos'));
      atualizarEstoque(produtos, produtosAntigos);
      cardEditando.attr('data-produtos', JSON.stringify(produtos));
      cardEditando.attr('data-data', dataFormatada);
      cardEditando.attr('data-local', local);
      cardEditando.attr('data-valor', valorTotal);
      cardEditando.find('.data-compra').text(dataFormatada);
      cardEditando.find('.local-compra').text(local);
      cardEditando.find('.valor-compra').html(`R$ ${valorTotal.replace('.', ',')} <span style=\"color:#27ae60;font-weight:bold;margin-left:12px;\">Entrada</span>`);
      $(this).removeData('cardEditando');
      // Atualiza o documento da entrada no Firestore com os novos dados
      (async () => {
        try {
          const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
          // Busca o id do documento pelo card
          const entradaId = cardEditando.data('entradaId');
          if (entradaId) {
            await updateDoc(doc(db, 'entrada de estoque', entradaId), {
              data: dataFormatada,
              local,
              produtos,
              valorTotal
            });
          }
        } catch (err) {
          alert('Erro ao atualizar entrada no Firebase: ' + err.message);
        }
      })();
    } else {
      // Nova entrada
      atualizarEstoque(produtos);
      const novoCard = `<div class=\"card-estoque\" data-produtos='${JSON.stringify(produtos)}' data-data='${dataFormatada}' data-local='${local}' data-valor='${valorTotal}'>\n      <span class=\"data-compra\">${dataFormatada}</span>\n      <span class=\"local-compra\">${local}</span>\n      <span class=\"valor-compra\">R$ ${valorTotal.replace('.', ',')} <span style=\"color:#27ae60;font-weight:bold;margin-left:12px;\">Entrada</span></span>\n    </div>`;
      $('.lista-estoque').append(novoCard);
      // Salva entrada no Firestore
      (async () => {
        try {
          const { addDoc, collection, getDocs, updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
          await addDoc(collection(db, 'entrada de estoque'), {
            data: dataFormatada,
            local,
            produtos,
            valorTotal
          });
          // Atualiza estoque dos produtos no Firestore
          const produtosSnapshot = await getDocs(collection(db, 'produtos'));
          for (const p of produtos) {
            const nomePadrao = p.nome.trim().toLowerCase();
            produtosSnapshot.forEach(async docSnap => {
              const prodData = docSnap.data();
              if (prodData.nome && prodData.nome.trim().toLowerCase() === nomePadrao) {
                const novoEstoque = (parseInt(prodData.estoque) || 0) + (parseInt(p.qtd) || 0);
                await updateDoc(doc(db, 'produtos', docSnap.id), { estoque: novoEstoque });
              }
            });
          }
        } catch (err) {
          alert('Erro ao salvar entrada ou atualizar estoque no Firebase: ' + err.message);
        }
      })();
    }
  $('#modalEstoqueBg').fadeOut(200);
  this.reset();
  recalcularEstoqueProdutos();
  });

  // Função para abrir modal de edição preenchido
  function abrirModalEdicao(card) {
    const produtos = JSON.parse(card.attr('data-produtos'));
    let data = card.attr('data-data');
    const local = card.attr('data-local');
    // Converte dd-mm-aaaa para aaaa-mm-dd para o input type=date
    if (data && data.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const partes = data.split('-');
      data = `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    $('#dataEstoque').val(data);
    $('#localEstoque').val(local);
    $('.produtos-estoque-lista').empty();
    produtos.forEach(function(p) {
      const itemHtml = `<div class=\"produto-estoque-item\" style=\"display:flex;gap:8px;align-items:center;margin-bottom:8px;\">\n  <input type=\"text\" class=\"nome-produto-estoque\" value=\"${p.nome}\" readonly style=\"width:120px;\">\n  <input type=\"number\" class=\"qtd-produto-estoque\" value=\"${p.qtd}\" style=\"width:60px;\">\n  <input type=\"text\" class=\"valor-produto-estoque\" value=\"${parseFloat(p.valor).toFixed(2).replace('.', ',')}\" style=\"width:80px;\">\n  <button type=\"button\" class=\"remover-produto-estoque\" style=\"background:#a52a2a;color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:16px;cursor:pointer;\">×</button>\n</div>`;
      $('.produtos-estoque-lista').append(itemHtml);
    });
    $('#modalEstoqueBg').fadeIn(200);
    $('.modal-detalhe-estoque-bg').remove();
    $('#formEstoque').data('cardEditando', card);
    // Copia o id da entrada para o handler de submit
    const entradaId = card.attr('data-entrada-id');
    if (entradaId) {
      $('#formEstoque').data('entradaId', entradaId);
    }
  }

  // Botão Editar
  $(document).on('click', '.btn-editar-modal-detalhe', function() {
    const card = $(this).closest('.modal-detalhe-estoque-bg').data('cardRef');
    abrirModalEdicao(card);
  });

  // Função para remover produtos do estoque ao excluir entrada
  function removerEstoqueProdutos(produtos) {
    produtos.forEach(function(p) {
      window.estoqueProdutos[p.nome] = (window.estoqueProdutos[p.nome] || 0) - (parseInt(p.qtd) || 0);
      if (window.estoqueProdutos[p.nome] < 0) window.estoqueProdutos[p.nome] = 0;
    });
  }

  // Botão Excluir
  $(document).on('click', '.btn-excluir-modal-detalhe', function() {
    const card = $(this).closest('.modal-detalhe-estoque-bg').data('cardRef');
    const produtos = JSON.parse(card.attr('data-produtos'));
    removerEstoqueProdutos(produtos);
    // Exclui do Firestore
    const entradaId = card.attr('data-entrada-id');
    if (entradaId) {
      (async () => {
        try {
          const { deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
          await deleteDoc(doc(db, 'entrada de estoque', entradaId));
        } catch (err) {
          alert('Erro ao excluir entrada do Firebase: ' + err.message);
        }
      })();
    }
  card.remove();
  $('.modal-detalhe-estoque-bg').remove();
  recalcularEstoqueProdutos();
  });

  // Ao abrir modal de detalhe, salva referência do card
  $(document).on('click', '.card-estoque', function() {
    const produtos = JSON.parse($(this).attr('data-produtos'));
    const data = formatarDataBR($(this).attr('data-data'));
    const local = $(this).attr('data-local');
    const valorTotal = $(this).attr('data-valor');
    let html = `<div class=\"modal-detalhe-estoque-bg\" style=\"position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;z-index:99999;\">`;
    html += `<div class=\"modal-detalhe-estoque\" style=\"background:#fff;border-radius:12px;box-shadow:0 2px 24px rgba(0,0,0,0.12);padding:32px 24px;width:400px;max-width:95vw;\">`;
    html += `<h2 style=\"margin-top:0;color:#27ae60;font-family:'Orbitron',Arial,sans-serif;\">Produtos da Compra</h2>`;
    html += `<div style=\"margin-bottom:12px;\"><strong>Data:</strong> ${data}<br><strong>Local:</strong> ${local}<br><strong>Valor Total:</strong> R$ ${valorTotal.replace('.', ',')}</div>`;
    html += `<ul style=\"padding-left:0;list-style:none;\">`;
    produtos.forEach(function(p) {
      html += `<li style=\"margin-bottom:8px;\">${p.nome} - QTD: ${p.qtd} - Valor: R$ ${(parseFloat(p.valor)||0).toFixed(2).replace('.', ',')}</li>`;
    });
    html += `</ul>`;
    html += `<button type=\"button\" class=\"btn-editar-modal-detalhe\" style=\"margin-top:16px;background:#27ae60;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;margin-right:8px;\">Editar</button>`;
    html += `<button type=\"button\" class=\"btn-excluir-modal-detalhe\" style=\"margin-top:16px;background:#a52a2a;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;margin-right:8px;\">Excluir</button>`;
    html += `<button type=\"button\" class=\"btn-fechar-modal-detalhe\" style=\"position:absolute;top:16px;right:18px;background:#111;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;font-family:'Orbitron',Arial,sans-serif;font-size:1em;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:background 0.2s;\">Fechar</button>`;
    html += `</div></div>`;
    const modal = $(html);
    modal.data('cardRef', $(this));
    $('body').append(modal);
  });

  // Fecha modal de detalhes
  $(document).on('click', '.btn-fechar-modal-detalhe, .modal-detalhe-estoque-bg', function(e) {
    if (e.target === this || $(e.target).hasClass('btn-fechar-modal-detalhe')) {
      $('.modal-detalhe-estoque-bg').remove();
    }
  });

  // Editar card de estoque
  $(document).on('click', '.btn-editar-estoque', function() {
    const $card = $(this).closest('.card-estoque');
    $('#modalEstoqueBg').fadeIn(200);
    $('#dataEstoque').val($card.find('.data-compra').text());
    $('#localEstoque').val($card.find('.local-compra').text());
    $('#valorEstoque').val($card.find('.valor-compra').text());
    $('#formEstoque').data('editando', $card);
    $('#formEstoque').data('tipo', $card.find('.tipo-estoque').text().toLowerCase());
  });

  // Salvar edição
  $('#formEstoque').on('submit', function(e) {
    const cardEditando = $(this).data('editando');
    if (cardEditando) {
      cardEditando.find('.data-compra').text($('#dataEstoque').val());
      cardEditando.find('.local-compra').text($('#localEstoque').val());
      cardEditando.find('.valor-compra').html(`R$ ${$('#valorEstoque').val()} <span style=\"color:#27ae60;font-weight:bold;margin-left:12px;\">Entrada</span>`);
      cardEditando.find('.tipo-estoque').text($(this).data('tipo')==='entrada'?'Entrada':'Saída').css('color', $(this).data('tipo')==='entrada'?'#1cb5e0':'#a52a2a');
      $(this).removeData('editando');
      $('#modalEstoqueBg').fadeOut(200);
      this.reset();
      return false;
    }
  });

  // Busca dinâmica de produtos cadastrados para adicionar na entrada (Firebase)
  $('.busca-produto-estoque').on('input', async function() {
    const termo = $(this).val().toLowerCase();
    const $sugestoes = $(this).siblings('.sugestoes-produto-estoque');
    $sugestoes.empty().hide();
    if (!termo) return;
    // Pega nomes já adicionados
    const produtosAdicionados = [];
    $('.produtos-estoque-lista .produto-estoque-item .nome-produto-estoque-label').each(function() {
      produtosAdicionados.push($(this).text().trim().toLowerCase());
    });
        const querySnapshot = await getDocs(collection(db, "produtos"));
        let html = '';
        querySnapshot.forEach(docSnap => {
          const prod = docSnap.data();
          if (
            prod.nome &&
            prod.nome.toLowerCase().includes(termo) &&
            !produtosAdicionados.includes(prod.nome.toLowerCase())
          ) {
            html += `<div class=\"item-sugestao-produto-estoque\" style=\"padding:8px 16px;cursor:pointer;border-bottom:1px solid #eee;\" data-nome=\"${prod.nome}\" data-preco=\"${parseFloat(prod.preco).toFixed(2).replace('.', ',')}\">${prod.nome} <span style=\"color:#888;font-size:0.9em;\">R$ ${parseFloat(prod.preco).toFixed(2).replace('.', ',')}</span></div>`;
          }
    });
    if (html) {
      $sugestoes.html(html).show();
    }
  });

  // Seleciona produto da sugestão e adiciona à lista
  $(document).on('click', '.item-sugestao-produto-estoque', function() {
    const nome = $(this).data('nome');
    const preco = $(this).data('preco');
    // Antes de adicionar, remove qualquer linha duplicada do mesmo produto
    $('.produtos-estoque-lista .produto-estoque-item').each(function() {
      if ($(this).find('.nome-produto-estoque-label').text().trim().toLowerCase() === nome.trim().toLowerCase()) {
        $(this).remove();
      }
    });
    var html = `<div class=\"produto-estoque-item\" style=\"display:flex;align-items:center;gap:12px;margin-bottom:8px;\">
      <span class=\"nome-produto-estoque-label\" style=\"min-width:120px;font-weight:bold;\">${nome}</span>
      <input type=\"number\" class=\"qtd-produto-estoque\" min=\"1\" placeholder=\"QTD\" style=\"width:70px;border-radius:8px;padding:4px;\">
      <input type=\"number\" class=\"valor-produto-estoque\" min=\"0\" step=\"0.01\" value=\"\" placeholder=\"Valor pago\" style=\"width:90px;border-radius:8px;padding:4px;\">
      <button type=\"button\" class=\"btn-remover-produto-estoque\" style=\"background:#a52a2a;color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;\">×</button>
    </div>`;
    $('.produtos-estoque-lista').append(html);
    // Limpa sugestão e campo de busca para permitir adicionar outro produto
    $(this).parent().hide();
    $('.busca-produto-estoque').val('').focus();
  });

  // Atualiza o valor total ao alterar quantidade ou valor de compra
  $(document).on('input', '.qtd-produto-estoque, .valor-produto-estoque', function() {
    let total = 0;
    $('.produtos-estoque-lista .produto-estoque-item').each(function() {
      const qtd = parseInt($(this).find('.qtd-produto-estoque').val()) || 0;
      const valor = parseFloat($(this).find('.valor-produto-estoque').val().replace(',', '.')) || 0;
      total += qtd * valor;
    });
    $('.valor-total-estoque').text('Valor Total: R$ ' + total.toFixed(2).replace('.', ','));
  });

  // Botão '+' ao lado do título abre o modal de adicionar produto
  $('#btnAddProdutoDireto').on('click', function() {
    $('#modalProdutosBg').fadeIn(200);
  });

  // Função utilitária para padronizar nome de produto
  window.nomeProdutoPadrao = function(nome) {
    return (nome || '').trim().toLowerCase();
  };

  // Atualiza o visual do estoque nos cards de produtos
  window.atualizarVisualEstoqueProdutos = function() {
    $('.card-produto-geral').each(function() {
      const nome = window.nomeProdutoPadrao($(this).find('.nome').text());
      // Exibe apenas o resultado do cálculo, ignorando o campo estoque da coleção produtos
      const estoqueAtual = window.estoqueProdutos[nome] !== undefined ? window.estoqueProdutos[nome] : 0;
      $(this).find('.estoque').text('Estoque: ' + estoqueAtual);
    });
  }

  // Chama atualização visual após salvar ou editar entrada
  $('#formEstoque').on('submit', function(e) {
    atualizarVisualEstoqueProdutos();
  });

  // Remove o evento global para .card-estoque e adiciona apenas para entradas
  $(document).off('click', '.card-estoque');
  $(document).on('click', '.card-estoque:not([data-tipo="saida"])', function() {
    const produtos = JSON.parse($(this).attr('data-produtos'));
    const data = formatarDataBR($(this).attr('data-data'));
    const local = $(this).attr('data-local');
    const valorTotal = $(this).attr('data-valor');
    let html = `<div class=\"modal-detalhe-estoque-bg\" style=\"position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;z-index:99999;\">`;
    html += `<div class=\"modal-detalhe-estoque\" style=\"background:#fff;border-radius:12px;box-shadow:0 2px 24px rgba(0,0,0,0.12);padding:32px 24px;width:400px;max-width:95vw;\">`;
    html += `<h2 style=\"margin-top:0;color:#27ae60;font-family:'Orbitron',Arial,sans-serif;\">Produtos da Compra</h2>`;
    html += `<div style=\"margin-bottom:12px;\"><strong>Data:</strong> ${data}<br><strong>Local:</strong> ${local}<br><strong>Valor Total:</strong> R$ ${valorTotal.replace('.', ',')}</div>`;
    html += `<ul style=\"padding-left:0;list-style:none;\">`;
    produtos.forEach(function(p) {
      html += `<li style=\"margin-bottom:8px;\">${p.nome} - QTD: ${p.qtd} - Valor: R$ ${(parseFloat(p.valor)||0).toFixed(2).replace('.', ',')}</li>`;
    });
    html += `</ul>`;
    html += `<button type=\"button\" class=\"btn-editar-modal-detalhe\" style=\"margin-top:16px;background:#27ae60;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;margin-right:8px;\">Editar</button>`;
    html += `<button type=\"button\" class=\"btn-excluir-modal-detalhe\" style=\"margin-top:16px;background:#a52a2a;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;margin-right:8px;\">Excluir</button>`;
    html += `<button type=\"button\" class=\"btn-fechar-modal-detalhe\" style=\"position:absolute;top:16px;right:18px;background:#111;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;font-family:'Orbitron',Arial,sans-serif;font-size:1em;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:background 0.2s;\">Fechar</button>`;
    html += `</div></div>`;
    const modal = $(html);
    modal.data('cardRef', $(this));
    $('body').append(modal);
  });

  // Fecha modal de detalhes
  $(document).on('click', '.btn-fechar-modal-detalhe, .modal-detalhe-estoque-bg', function(e) {
    if (e.target === this || $(e.target).hasClass('btn-fechar-modal-detalhe')) {
      $('.modal-detalhe-estoque-bg').remove();
    }
  });

  // Editar card de estoque
  $(document).on('click', '.btn-editar-estoque', function() {
    const $card = $(this).closest('.card-estoque');
    $('#modalEstoqueBg').fadeIn(200);
    $('#dataEstoque').val($card.find('.data-compra').text());
    $('#localEstoque').val($card.find('.local-compra').text());
    $('#valorEstoque').val($card.find('.valor-compra').text());
    $('#formEstoque').data('editando', $card);
    $('#formEstoque').data('tipo', $card.find('.tipo-estoque').text().toLowerCase());
  });

  // Salvar edição
  $('#formEstoque').on('submit', function(e) {
    const cardEditando = $(this).data('editando');
    if (cardEditando) {
      cardEditando.find('.data-compra').text($('#dataEstoque').val());
      cardEditando.find('.local-compra').text($('#localEstoque').val());
      cardEditando.find('.valor-compra').html(`R$ ${$('#valorEstoque').val()} <span style=\"color:#27ae60;font-weight:bold;margin-left:12px;\">Entrada</span>`);
      cardEditando.find('.tipo-estoque').text($(this).data('tipo')==='entrada'?'Entrada':'Saída').css('color', $(this).data('tipo')==='entrada'?'#1cb5e0':'#a52a2a');
      $(this).removeData('editando');
      $('#modalEstoqueBg').fadeOut(200);
      this.reset();
      return false;
    }
  });

  // Busca dinâmica de produtos para entrada de estoque
  // Remove duplicidade: não permitir adicionar o mesmo produto mais de uma vez
  $('#busca-produto-estoque').on('input', async function() {
    const termo = $(this).val().toLowerCase();
    const $sugestoes = $(this).siblings('.sugestoes-produto-estoque');
    $sugestoes.empty().hide();
    if (!termo) return;
    // Pega nomes já adicionados
    const produtosAdicionados = [];
    $('.produtos-estoque-lista .produto-estoque-item .nome-produto-estoque-label').each(function() {
      produtosAdicionados.push($(this).text().trim().toLowerCase());
    });
    const querySnapshot = await getDocs(collection(db, "produtos"));
    let html = '';
    querySnapshot.forEach(docSnap => {
      const prod = docSnap.data();
      if (
        prod.nome &&
        prod.nome.toLowerCase().includes(termo) &&
        !produtosAdicionados.includes(prod.nome.toLowerCase())
      ) {
        html += `<div class=\"item-sugestao-produto-estoque\" style=\"padding:8px 16px;cursor:pointer;border-bottom:1px solid #eee;\" data-nome=\"${prod.nome}\" data-preco=\"${parseFloat(prod.preco).toFixed(2).replace('.', ',')}\">${prod.nome} <span style=\"color:#888;font-size:0.9em;\">R$ ${parseFloat(prod.preco).toFixed(2).replace('.', ',')}</span></div>`;
      }
    });
    if (html) {
      $sugestoes.html(html).show();
    }
  });
});